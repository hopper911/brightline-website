import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: { id: string } };

const toTagNames = (tags: unknown): string[] =>
  Array.isArray(tags)
    ? tags
        .map((t) => (typeof t === "string" ? t.trim() : ""))
        .filter(Boolean)
    : [];

const pickDefined = <T extends Record<string, any>>(obj: T) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

export async function GET(_req: Request, { params }: Ctx) {
  const item = await prisma.mediaAsset.findUnique({
    where: { id: params.id },
    include: { tags: { include: { tag: true } } },
  });

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    item: { ...item, tags: item.tags.map((t) => t.tag.name) },
  });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const body = await request.json();

  const tagNames = toTagNames(body?.tags);

  // Only send defined values to Prisma (prevents overwriting with undefined)
  const data = pickDefined({
    kind: body.kind,
    title: body.title,
    url: body.url,
    thumbnailUrl: body.thumbnailUrl,
    subtitle: body.subtitle,
    description: body.description,
    width: body.width,
    height: body.height,
    durationSec: body.durationSec,
    altText: body.altText,
    aspectRatio: body.aspectRatio,
    featured: body.featured,
    sortOrder: body.sortOrder,
    source: body.source,
  });

  const result = await prisma.$transaction(async (tx) => {
    // Clean 404 if asset doesn't exist
    const existing = await tx.mediaAsset.findUnique({
      where: { id: params.id },
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
      where: { id: params.id },
      data,
    });

    await tx.mediaAssetTag.deleteMany({ where: { assetId: updated.id } });

    if (ensuredTags.length) {
      await tx.mediaAssetTag.createMany({
        data: ensuredTags.map((t) => ({ assetId: updated.id, tagId: t.id })),
        skipDuplicates: true,
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
  try {
    await prisma.mediaAsset.delete({ where: { id: params.id } });
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
