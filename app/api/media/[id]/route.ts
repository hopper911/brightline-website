import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const item = await prisma.mediaAsset.findUnique({
    where: { id: params.id },
    include: { tags: { include: { tag: true } } },
  })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ item: { ...item, tags: item.tags.map((t) => t.tag.name) } })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const { kind, title, url, thumbnailUrl, subtitle, description, width, height, durationSec, altText, aspectRatio, featured, sortOrder, source, tags } = body

  const tagNames: string[] = Array.isArray(tags) ? tags.filter(Boolean) : []

  const result = await prisma.$transaction(async (tx) => {
    const ensuredTags = await Promise.all(
      tagNames.map((name) => tx.tag.upsert({ where: { name }, update: {}, create: { name } }))
    )

    const updated = await tx.mediaAsset.update({
      where: { id: params.id },
      data: {
        kind,
        title,
        url,
        subtitle,
        description,
        thumbnailUrl,
        width,
        height,
        durationSec,
        altText,
        aspectRatio,
        featured,
        sortOrder,
        source,
      },
    })

    await tx.mediaAssetTag.deleteMany({ where: { assetId: updated.id } })
    if (ensuredTags.length) {
      await tx.mediaAssetTag.createMany({
        data: ensuredTags.map((t) => ({ assetId: updated.id, tagId: t.id })),
        skipDuplicates: true,
      })
    }

    const withTags = await tx.mediaAsset.findUnique({
      where: { id: updated.id },
      include: { tags: { include: { tag: true } } },
    })
    return withTags!
  })

  return NextResponse.json({ item: { ...result, tags: result.tags.map((t) => t.tag.name) } })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.mediaAsset.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Delete failed' }, { status: 400 })
  }
}

