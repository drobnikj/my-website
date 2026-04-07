#!/bin/bash
# Script to start test server for API integration tests

set -e

# Build frontend first
echo "Building frontend..."
npm run build

# Setup database BEFORE starting wrangler (ensures D1 local state is ready)
# Note: 0004_seed.sql migration includes seed data, so no separate seed step needed
#
# KNOWN LIMITATION: Local wrangler pages dev may not see the migrations applied by
# `wrangler d1 migrations apply --local` due to isolated miniflare instances.
# This works correctly in CI/CD (GitHub Actions) where the Pages build process
# applies migrations before deployment. For local development, consider using
# `wrangler dev` (Workers) instead of `wrangler pages dev`, or manually seed
# the dev database via the admin API.
echo "Setting up test database..."
npm run db:migrate:local

# Start wrangler dev in background
echo "Starting Wrangler dev server..."
npx wrangler pages dev dist \
  --d1 DB=my-website-db \
  --r2 PHOTOS=my-website-photos \
  --port 8788 \
  --local \
  &

WRANGLER_PID=$!

# Wait for server to be ready
echo "Waiting for server to start..."
for i in {1..30}; do
  if curl -s http://localhost:8788/api/health > /dev/null 2>&1; then
    echo "Server is ready!"
    break
  fi
  
  if [ $i -eq 30 ]; then
    echo "Server failed to start in time"
    kill $WRANGLER_PID 2>/dev/null || true
    exit 1
  fi
  
  sleep 1
done

# Run tests
echo "Running API tests..."
npm run test:api:only

# Cleanup
echo "Stopping server..."
kill $WRANGLER_PID 2>/dev/null || true

echo "Done!"
