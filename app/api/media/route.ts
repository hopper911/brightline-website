import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const toBool = (v: string | null) => (v === null ? undefined : v === "true");
const toInt = (v: unknown) =>
  typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : undefined;

const normalizeTags = (tags: unknown): string[] =>
  Array.isArray(tags)
    ? tags
        .map((t) => (typeof t === "string" ? t.trim() : ""))
        .filter(Boolean)
    : [];

const pickDefined = <T extends Record<string, any>>(obj: T) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const kindParam = searchParams.get("kind");
  const kind = kindParam === "IMAGE" || kindParam === "VIDEO" ? kindParam : undefined;

  const tag = searchParams.get("tag")?.trim() || undefined;
  const featured = toBool(searchParams.get("featured"));

  // Build a typed Prisma where clause
  const where: Prisma.MediaAssetWhereInput = pickDefined({
    kind,
    featured,
  }) as Prisma.MediaAssetWhereInput;

  if (tag) {
    where.tags = { some: { tag: { name: tag } } };
  }

  const items = await prisma.mediaAsset.findMany({
    where,
    include: { tags: { include: { tag: true } } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    items: items.map((i) => ({
      ...i,
      tags: i.tags.map((t) => t.tag.name),
    })),
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  const numberish = z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : Number(v)) : v),
    z.number().int().optional()
  );

  const booleanish = z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => (v === true || v === "true" ? true : v === false || v === "false" ? false : undefined));

  const mediaCreateSchema = z.object({
    kind: z.enum(["IMAGE", "VIDEO"]),
    title: z.string().min(1).transform((s) => s.trim()),
    url: z
      .string()
      .min(1)
      .transform((s) => s.trim()),
    thumbnailUrl: z.string().optional().transform((s) => (typeof s === "string" ? s.trim() : undefined)),
    subtitle: z.string().optional().transform((s) => (typeof s === "string" ? s.trim() : undefined)),
    description: z.string().optional().transform((s) => (typeof s === "string" ? s.trim() : undefined)),
    width: numberish,
    height: numberish,
    durationSec: numberish,
    altText: z.string().optional().transform((s) => (typeof s === "string" ? s.trim() : undefined)),
    aspectRatio: z.string().optional().transform((s) => (typeof s === "string" ? s.trim() : undefined)),
    featured: booleanish,
    sortOrder: numberish.default(0),
    source: z.string().optional().transform((s) => (typeof s === "string" ? s.trim() : undefined)),
    tags: z.array(z.string()).optional().default([]),
  });

  const parsed = mediaCreateSchema.safeParse(body);
  if (!parsed.success) {
    const formatted = parsed.error.flatten();
    return NextResponse.json({ error: "Invalid request body", details: formatted }, { status: 400 });
  }

  const {
    kind,
    title,
    url,
    thumbnailUrl,
    subtitle,
    description,
    width,
    height,
    durationSec,
    altText,
    aspectRatio,
    featured,
    sortOrder,
    source,
    tags: tagsInput,
  } = parsed.data;

  const tagNames = normalizeTags(tagsInput);

  // Only include fields that are defined, to avoid Prisma complaints.
  const payload = pickDefined({
    kind,
    title,
    url,
    thumbnailUrl,
    subtitle,
    description,
    width,
    height,
    durationSec,
    altText,
    aspectRatio,
    featured,
    sortOrder,
    source,
  });

  const result = await prisma.$transaction(async (tx) => {
    const ensuredTags = await Promise.all(
      tagNames.map((name) =>
        tx.tag.upsert({
          where: { name },
          update: {},
          create: { name },
        })
      )
    );

    const item = await tx.mediaAsset.upsert({
      where: { url },
      update: payload as Prisma.MediaAssetUpdateInput,
      create: payload as Prisma.MediaAssetCreateInput,
    });

    await tx.mediaAssetTag.deleteMany({ where: { assetId: item.id } });

    if (ensuredTags.length) {
      await tx.mediaAssetTag.createMany({
        data: ensuredTags.map((t) => ({ assetId: item.id, tagId: t.id })),
      });
    }

    const withTags = await tx.mediaAsset.findUnique({
      where: { id: item.id },
      include: { tags: { include: { tag: true } } },
    });

    // withTags should exist since we just created/updated it, but keep it safe.
    if (!withTags) throw new Error("Failed to load created asset");

    return withTags;
  });

  return NextResponse.json(
    { item: { ...result, tags: result.tags.map((t) => t.tag.name) } },
    { status: 201 }
  );
}
