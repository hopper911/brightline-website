import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const toTagNames = (tags: unknown): string[] =>
  Array.isArray(tags)
    ? tags
        .map((t) => (typeof t === "string" ? t.trim() : ""))
        .filter(Boolean)
    : [];

const pickDefined = <T extends Record<string, any>>(obj: T) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const item = await prisma.mediaAsset.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  });

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    item: { ...item, tags: item.tags.map((t) => t.tag.name) },
  });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await request.json();

  const numberish = z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : Number(v)) : v),
    z.number().int().optional()
  );

  const booleanish = z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => (v === true || v === "true" ? true : v === false || v === "false" ? false : undefined));

  const mediaUpdateSchema = z.object({
    kind: z.enum(["IMAGE", "VIDEO"]).optional(),
    title: z.string().optional(),
    url: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    width: numberish,
    height: numberish,
    durationSec: numberish,
    altText: z.string().optional(),
    aspectRatio: z.string().optional(),
    featured: booleanish,
    sortOrder: numberish,
    source: z.string().optional(),
    tags: z.array(z.string()).optional(),
  });

  const parsed = mediaUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const formatted = parsed.error.flatten();
    return NextResponse.json({ error: "Invalid request body", details: formatted }, { status: 400 });
  }

  const tagNames = toTagNames(parsed.data.tags);

  // Only send defined values to Prisma (prevents overwriting with undefined)
  const data = pickDefined({
    kind: parsed.data.kind,
    title: parsed.data.title,
    url: parsed.data.url,
    thumbnailUrl: parsed.data.thumbnailUrl,
    subtitle: parsed.data.subtitle,
    description: parsed.data.description,
    width: parsed.data.width,
    height: parsed.data.height,
    durationSec: parsed.data.durationSec,
    altText: parsed.data.altText,
    aspectRatio: parsed.data.aspectRatio,
    featured: parsed.data.featured,
    sortOrder: parsed.data.sortOrder,
    source: parsed.data.source,
  });

  const result = await prisma.$transaction(async (tx) => {
    // Clean 404 if asset doesn't exist
    const existing = await tx.mediaAsset.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return null;

    const ensuredTags = await Promise.all(
      tagNames.map((name) =>
        tx.tag.upsert({
          where: { name },
          update: {},
          create: { name },
        })
      )
    );

    const updated = await tx.mediaAsset.update({
      where: { id },
      data,
    });

    await tx.mediaAssetTag.deleteMany({ where: { assetId: updated.id } });

    if (ensuredTags.length) {
      await tx.mediaAssetTag.createMany({
        data: ensuredTags.map((t) => ({ assetId: updated.id, tagId: t.id })),
      });
    }

    return tx.mediaAsset.findUnique({
      where: { id: updated.id },
      include: { tags: { include: { tag: true } } },
    });
  });

  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    item: { ...result, tags: result.tags.map((t) => t.tag.name) },
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    await prisma.mediaAsset.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // Optional: if you want 404 when record doesn't exist:
    // if (e?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(
      { ok: false, error: e?.message || "Delete failed" },
      { status: 400 }
    );
  }
}
