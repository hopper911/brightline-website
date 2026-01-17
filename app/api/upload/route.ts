import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || ''
  if (!contentType.startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file field' }, { status: 400 })
  }

  const providedTitle = (form.get('title') as string | null)?.trim() || null
  const providedKind = (form.get('kind') as string | null)?.trim().toUpperCase() || null
  const filename = (form.get('filename') as string | null)?.trim() || file.name || 'upload'
  // Tags can be provided as a comma-separated string in 'tags'
  // or as repeated fields: tags=one&tags=two
  const rawTags = form.getAll('tags')
  const tagNames = (rawTags.length ? rawTags : [form.get('tags')])
    .filter((v): v is string => typeof v === 'string')
    .flatMap((v) => v.split(','))
    .map((t) => t.trim())
    .filter(Boolean)

  const blob = await put(filename, file, { access: 'public' })

  // Infer kind from mime if not provided
  const inferredKind = file.type?.startsWith('image/') ? 'IMAGE' : file.type?.startsWith('video/') ? 'VIDEO' : 'IMAGE'
  const kind = (providedKind === 'IMAGE' || providedKind === 'VIDEO') ? providedKind : inferredKind

  const title = providedTitle || filename

  // Create MediaAsset record
  const created = await prisma.$transaction(async (tx) => {
    const asset = await tx.mediaAsset.create({
      data: {
        kind: kind as any,
        title,
        url: blob.url,
        thumbnailUrl: blob.url,
      },
    })

    if (tagNames.length) {
      const ensured = await Promise.all(
        tagNames.map((name) =>
          tx.tag.upsert({ where: { name }, update: {}, create: { name } })
        )
      )
      await tx.mediaAssetTag.createMany({
        data: ensured.map((t) => ({ assetId: asset.id, tagId: t.id })),
      })
    }

    return tx.mediaAsset.findUnique({
      where: { id: asset.id },
      include: { tags: { include: { tag: true } } },
    })
  })

  return NextResponse.json({
    url: blob.url,
    pathname: blob.pathname,
    item: created ? { ...created, tags: created.tags.map((t) => t.tag.name) } : undefined,
  })
}
