#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME=${1:-brightline-website}

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI not found. Install with: pnpm add -g vercel" >&2
  exit 1
fi

if ! vercel whoami >/dev/null 2>&1; then
  echo "You are not logged in. Run: vercel login" >&2
  exit 1
fi

echo "Linking project '$PROJECT_NAME'..."
vercel link --project "$PROJECT_NAME" --yes || true

ENV_FILE="lib/.env"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC2046
  set -a; . "$ENV_FILE"; set +a
fi

add_env() {
  local name=$1
  local val=$2
  local env=${3:-production}
  if [ -n "${val:-}" ]; then
    printf "%s" "$val" | vercel env add "$name" "$env" --force >/dev/null || true
    echo "Set $name ($env)"
  else
    echo "Skip $name: no value found"
  fi
}

add_env DATABASE_URL "${DATABASE_URL:-}"
add_env PRISMA_DATABASE_URL "${PRISMA_DATABASE_URL:-}"
add_env NEXT_PUBLIC_PRIMARY_DOMAIN "${NEXT_PUBLIC_PRIMARY_DOMAIN:-}"
add_env NEXT_PUBLIC_SITE_URL "${NEXT_PUBLIC_SITE_URL:-}"
add_env ADMIN_USER "${ADMIN_USER:-}"
add_env ADMIN_PASS "${ADMIN_PASS:-}"

echo "Preview envs: repeat for 'preview' if desired."
echo "Deploy with: vercel --prod"

