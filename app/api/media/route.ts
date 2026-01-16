import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Kind = "IMAGE" | "VIDEO";

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
  const kind: Kind | undefined =
    kindParam === "IMAGE" || kindParam === "VIDEO" ? kindParam : undefined;

  const tag = searchParams.get("tag")?.trim() || undefined;
  const featured = toBool(searchParams.get("featured"));

  // Use Prisma’s proper input type if you have it; `any` works but this is safer.
  const where = pickDefined({
    kind,
    featured,
  }) as any;

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

  const kind: Kind | undefined =
    body.kind === "IMAGE" || body.kind === "VIDEO" ? body.kind : undefined;

  const title: string | undefined = typeof body.title === "string" ? body.title.trim() : undefined;
  const url: string | undefined = typeof body.url === "string" ? body.url.trim() : undefined;

  if (!kind || !title || !url) {
    return NextResponse.json(
      { error: "kind (IMAGE|VIDEO), title, and url are required" },
      { status: 400 }
    );
  }

  const tagNames = normalizeTags(body.tags);

  const featured =
    typeof body.featured === "boolean"
      ? body.featured
      : typeof body.featured === "string"
      ? body.featured === "true"
      : undefined;

  const sortOrder = toInt(body.sortOrder) ?? 0;

  // Only include fields that are defined, to avoid Prisma complaints.
  const payload = pickDefined({
    kind,
    title,
    url,
    thumbnailUrl: typeof body.thumbnailUrl === "string" ? body.thumbnailUrl.trim() : undefined,
    subtitle: typeof body.subtitle === "string" ? body.subtitle.trim() : undefined,
    description: typeof body.description === "string" ? body.description.trim() : undefined,
    width: toInt(body.width),
    height: toInt(body.height),
    durationSec: toInt(body.durationSec),
    altText: typeof body.altText === "string" ? body.altText.trim() : undefined,
    aspectRatio: typeof body.aspectRatio === "string" ? body.aspectRatio.trim() : undefined,
    featured, // can be undefined
    sortOrder,
    source: typeof body.source === "string" ? body.source.trim() : undefined,
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
      update: payload,
      create: payload,
    });

    await tx.mediaAssetTag.deleteMany({ where: { assetId: item.id } });

    if (ensuredTags.length) {
      await tx.mediaAssetTag.createMany({
        data: ensuredTags.map((t) => ({ assetId: item.id, tagId: t.id })),
        skipDuplicates: true,
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