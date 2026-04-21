#!/bin/bash
# Start a local Pages dev server for API integration tests.
# This script is wired to `npm run test:api` and reused by CI.

set -euo pipefail

PORT="${PORT:-${TEST_API_PORT:-8788}}"
PERSIST_DIR="${WRANGLER_PERSIST_DIR:-.wrangler/state}"
TEST_ADMIN_API_KEY="${TEST_ADMIN_API_KEY:-test-key-123}"
export ADMIN_API_KEY="${ADMIN_API_KEY:-$TEST_ADMIN_API_KEY}"
WRANGLER_PID=""

cleanup() {
  if [ -n "${WRANGLER_PID}" ]; then
    echo "Stopping server..."
    kill "${WRANGLER_PID}" 2>/dev/null || true
    wait "${WRANGLER_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Build frontend first
# TODO: if this gets too slow, split out a lighter-weight server path for API-only tests.
echo "Building frontend..."
npm run build

# Apply migrations to the same persisted local state that wrangler pages dev will use.
echo "Setting up test database..."
npm run db:migrate:local

echo "Seeding test database..."
npm run db:seed:local

# Start wrangler dev in background
echo "Starting Wrangler dev server on port ${PORT} with test ADMIN_API_KEY..."
npx wrangler pages dev dist \
  --d1 DB=my-website-db \
  --r2 PHOTOS=my-website-photos \
  --port "${PORT}" \
  --persist-to "${PERSIST_DIR}" \
  --local \
  &

WRANGLER_PID=$!

# Wait for server to be ready
echo "Waiting for server to start..."
for i in {1..30}; do
  if curl -s "http://localhost:${PORT}/api/health" > /dev/null 2>&1; then
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
TEST_COMMAND="${TEST_COMMAND:-npm run test:api:only}"
echo "Running tests: ${TEST_COMMAND}"
TEST_API_URL="http://localhost:${PORT}" TEST_ADMIN_API_KEY="${TEST_ADMIN_API_KEY}" bash -lc "${TEST_COMMAND}"

echo "Done!"
