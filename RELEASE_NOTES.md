# Release v0.2.0 — Media database, API, gallery, and admin

## Highlights
- Added Prisma + SQLite database for portfolio images/videos
- New API: `GET/POST /api/media` with tag and featured filters
- Server-rendered Gallery component on homepage
- Portfolio section with category pages (Fashion, Food, CRE, Design)
- Admin media page at `/admin/media` with Basic Auth
- Next.js image remote patterns for common external sources

## Details
- Schema: `MediaAsset`, `Tag`, and join table with `MediaKind` enum
- Seed script with example items and tags
- Prisma client helper with safe dev reuse
- Middleware Basic Auth for `/admin/*` routes using `ADMIN_USER`/`ADMIN_PASS`
- Configured `next.config.ts` to allow Unsplash, Cloudinary, YouTube, Vimeo thumbnails

## Setup
- Copy env: `cp .env.example .env` and set `ADMIN_USER`, `ADMIN_PASS`
- Install: `npm i -D prisma && npm i @prisma/client`
- Generate/migrate/seed: `npm run prisma:generate && npm run prisma:migrate && npm run db:seed`

## Breaking/Notes
- `MediaAsset.url` is unique to support idempotent seeding
- Requires Node >= 20.9 for Next 16

