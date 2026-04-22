#!/bin/bash
# Script to start a local Wrangler server and run API integration tests against it.

set -euo pipefail

PORT="${TEST_API_PORT:-8788}"
TEST_API_URL="${TEST_API_URL:-http://localhost:${PORT}}"
TEST_ADMIN_API_KEY="${TEST_ADMIN_API_KEY:-test-key-123}"

cleanup() {
  if [ -n "${WRANGLER_PID:-}" ]; then
    echo "Stopping Wrangler dev server..."
    kill "$WRANGLER_PID" 2>/dev/null || true
    wait "$WRANGLER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Build frontend first
# TODO: if this gets too slow, split out a lighter-weight server path for API-only tests.
echo "Building frontend..."
npm run build

# Setup database BEFORE starting wrangler (ensures D1 local state is ready)
# Note: 0004_seed.sql migration includes seed data, so no separate seed step is needed.
echo "Setting up test database..."
npm run db:migrate:local

# Start wrangler dev in background with the same admin API key that tests use.
echo "Starting Wrangler dev server on ${TEST_API_URL}..."
ADMIN_API_KEY="$TEST_ADMIN_API_KEY" npx wrangler pages dev dist \
  --d1 DB=my-website-db \
  --r2 PHOTOS=my-website-photos \
  --port "$PORT" \
  --local \
  &

WRANGLER_PID=$!

# Wait for server to be ready
echo "Waiting for server to start..."
for i in {1..30}; do
  if curl -s "$TEST_API_URL/api/health" > /dev/null 2>&1; then
    echo "Server is ready!"
    break
  fi

  if [ "$i" -eq 30 ]; then
    echo "Server failed to start in time"
    exit 1
  fi

  sleep 1
done

# Run tests
echo "Running API tests..."
TEST_API_URL="$TEST_API_URL" TEST_ADMIN_API_KEY="$TEST_ADMIN_API_KEY" npm run test:api:only

echo "Done!"
