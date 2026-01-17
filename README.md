# Brightline Website

Next.js 16 App Router project with a small media API backed by Prisma. Local development uses SQLite; production uses Vercel Postgres.

## Local Development

- Requirements: Node >= 20.9, pnpm (Corepack), SQLite
- Install deps:
  - `pnpm install` (if Prisma enum issues arise, run `VERCEL=1 pnpm install`)
- Env: copy `.env.example` to `.env` and update as needed
- Start dev server: `pnpm dev` then visit `http://localhost:3000`

### Prisma (local SQLite)

- Generate client: `pnpm prisma:generate`
- Create/migrate DB: `pnpm prisma:migrate`
- Prisma Studio: `pnpm prisma:studio`

## API Endpoints

Base path: `/api/media`

- GET `/api/media`
  - Query: `kind=IMAGE|VIDEO`, `tag=<string>`, `featured=true|false`
  - Example: `curl -sS 'http://localhost:3000/api/media?kind=IMAGE&tag=portraits&featured=true'`

- POST `/api/media`
  - Required body: `kind` (IMAGE|VIDEO), `title`, `url`
  - Optional: `thumbnailUrl`, `subtitle`, `description`, `width`, `height`, `durationSec`, `altText`, `aspectRatio`, `featured`, `sortOrder`, `source`, `tags` (string[])
  - Coercions: booleans accept true/false or "true"/"false"; numbers accept numeric strings
  - Validation: returns `{ error, details }` (400) with Zod errors
  - Example:
    ```bash
    curl -sS -X POST http://localhost:3000/api/media \
      -H 'Content-Type: application/json' \
      -d '{
        "kind": "IMAGE",
        "title": "City Night",
        "url": "https://cdn.example.com/city.jpg",
        "width": "1920",
        "height": 1080,
        "featured": "true",
        "sortOrder": 5,
        "tags": ["city", "night"]
      }'
    ```

- GET `/api/media/[id]`
- PATCH `/api/media/[id]`
  - Partial updates; same coercions as POST
  - Validation errors return `{ error, details }` (400)
- DELETE `/api/media/[id]`

## Admin

- Status: `/admin/status`
- Media UI: `/admin/media`
- Health check: `/api/health`

## Deployment (Vercel)

- Node version: set to 20.9+ in Project Settings
- Env vars:
  - `DATABASE_URL` (Vercel Postgres pooled URL)
  - `NEXT_PUBLIC_SITE_URL` (e.g., `https://brightlinephotography.co`)
  - `NEXT_PUBLIC_PRIMARY_DOMAIN` (e.g., `brightlinephotography.co`)
  - Optional: `ADMIN_USER`, `ADMIN_PASS`
- Build command: defined in `vercel.json` as `pnpm run build:vercel`
  - Runs Prisma generate, `prisma db push` against Postgres, then `next build`

### Database Schemas

- Local: `prisma/schema.prisma` (SQLite; `kind` stored as string; API enforces IMAGE|VIDEO)
- Production: `prisma/schema.postgres.prisma` (Postgres; enum `MediaKind`)

## Notes

- If you hit Prisma enum issues locally during install, prefer `VERCEL=1 pnpm install`, or stick to the SQLite flow above.
