import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const kind = searchParams.get('kind') as 'IMAGE' | 'VIDEO' | null
  const tag = searchParams.get('tag')
  const featured = searchParams.get('featured')

  const where: any = {}
  if (kind) where.kind = kind
  if (featured != null) where.featured = featured === 'true'
  if (tag) where.tags = { some: { tag: { name: tag } } }

  const items = await prisma.mediaAsset.findMany({
    where,
    include: { tags: { include: { tag: true } } },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })

  const data = items.map((i) => ({
    ...i,
    tags: i.tags.map((t) => t.tag.name),
  }))

  return NextResponse.json({ items: data })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { kind, title, url, thumbnailUrl, subtitle, description, width, height, durationSec, altText, aspectRatio, featured, sortOrder, source, tags } = body

  if (!kind || !title || !url) {
    return NextResponse.json({ error: 'kind, title, and url are required' }, { status: 400 })
  }

  const tagNames: string[] = Array.isArray(tags) ? tags.filter(Boolean) : []

  const result = await prisma.$transaction(async (tx) => {
    const ensuredTags = await Promise.all(
      tagNames.map((name) => tx.tag.upsert({ where: { name }, update: {}, create: { name } }))
    )

    const item = await tx.mediaAsset.upsert({
      where: { url },
      update: {
        kind,
        title,
        subtitle,
        description,
        thumbnailUrl,
        width,
        height,
        durationSec,
        altText,
        aspectRatio,
        featured: Boolean(featured),
        sortOrder: sortOrder ?? 0,
        source,
      },
      create: {
        kind,
        title,
        subtitle,
        description,
        url,
        thumbnailUrl,
        width,
        height,
        durationSec,
        altText,
        aspectRatio,
        featured: Boolean(featured),
        sortOrder: sortOrder ?? 0,
        source,
      },
    })

    await tx.mediaAssetTag.deleteMany({ where: { assetId: item.id } })
    if (ensuredTags.length) {
      await tx.mediaAssetTag.createMany({
        data: ensuredTags.map((t) => ({ assetId: item.id, tagId: t.id })),
        skipDuplicates: true,
      })
    }

    const withTags = await tx.mediaAsset.findUnique({
      where: { id: item.id },
      include: { tags: { include: { tag: true } } },
    })
    return withTags!
  })

  return NextResponse.json({ item: { ...result, tags: result.tags.map((t) => t.tag.name) } }, { status: 201 })
}

