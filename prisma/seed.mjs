// Minimal, idempotent seed for Postgres/SQLite
// - Creates a few tags if none exist
// - Safe to run multiple times (uses upsert/exists checks)

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({ log: ['warn', 'error'] })

async function main() {
  // If there is any media or tag, consider it seeded and exit quietly
  const [mediaCount, tagCount] = await Promise.all([
    prisma.mediaAsset.count(),
    prisma.tag.count(),
  ])

  if (mediaCount > 0 || tagCount > 0) {
    console.log('[seed] Data present, skipping. media=%d tags=%d', mediaCount, tagCount)
    return
  }

  const tags = ['portraits', 'landscape', 'city', 'nature']
  await Promise.all(
    tags.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  )

  console.log('[seed] Created %d tags', tags.length)
}

main()
  .catch((e) => {
    console.error('[seed] Error:', e?.message || e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

