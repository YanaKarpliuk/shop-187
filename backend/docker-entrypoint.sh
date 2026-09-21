#!/bin/sh
# Applies the database schema, seeds demo data, then starts the API.
# Runs on every backend container start.
set -e

if [ -d db/migrations ] && [ -n "$(ls -A db/migrations 2>/dev/null)" ]; then
  echo "→ Applying Prisma migrations (migrate deploy)…"
  npx prisma migrate deploy --schema=db/schema.prisma
else
  echo "→ No migrations found; pushing schema directly (db push)…"
  npx prisma db push --schema=db/schema.prisma
fi

echo "→ Seeding demo data…"
npx tsx db/seed.ts

echo "→ Starting API on port ${PORT:-4000}…"
exec npx tsx src/server.ts