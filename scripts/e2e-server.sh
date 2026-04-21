#!/bin/bash
# Start the full Pages app locally for Playwright E2E tests

set -euo pipefail

PORT="${PORT:-4173}"
PERSIST_DIR="${WRANGLER_PERSIST_DIR:-.wrangler/state}"

echo "Building frontend..."
npm run build

echo "Preparing local D1 database..."
npm run db:migrate:local

echo "Starting Wrangler Pages dev server on port ${PORT}..."
exec npx wrangler pages dev dist \
  --d1 DB=my-website-db \
  --r2 PHOTOS=my-website-photos \
  --port "${PORT}" \
  --persist-to "${PERSIST_DIR}" \
  --local
