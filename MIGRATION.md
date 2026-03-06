# Migration to Cloudflare Pages with Functions

## What Changed

**Before:** Separate Worker deployment (served only `/api/*`, returned 404 on root)  
**After:** Cloudflare Pages with Functions (serves both frontend AND API)

## Architecture

```
┌─────────────────────────────────────┐
│     Cloudflare Pages                │
├─────────────────────────────────────┤
│  Frontend (/)                       │
│  └─ Vite-built React SPA            │
│                                     │
│  API (/api/*)                       │
│  └─ Pages Functions                 │
│     ├─ /api/health                  │
│     ├─ /api/destinations            │
│     └─ /api/destinations/:id        │
│                                     │
│  Bindings: D1 (DB) + R2 (PHOTOS)    │
└─────────────────────────────────────┘
```

## Benefits

✅ **Single deployment** - Frontend and API together  
✅ **No 404 on root** - Pages serves the React app automatically  
✅ **No CORS issues** - Same origin for frontend and API  
✅ **Simpler dev workflow** - One Pages dev server instead of two processes  
✅ **Better DX** - Functions get bindings automatically

## File Structure

```
functions/
├── api/
│   ├── health.ts                    → GET /api/health
│   └── destinations/
│       ├── index.ts                 → GET /api/destinations
│       └── [id].ts                  → GET /api/destinations/:id
└── types.d.ts

worker/
└── index.ts                         ⚠️ DEPRECATED - no longer used
```

## Development

```bash
# Install dependencies
npm install

# Run local dev (frontend on :5173, functions on :8788)
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

## Production Setup

Before deploying to production:

1. **Create D1 database:**
   ```bash
   wrangler d1 create my-website-db
   # Copy the database_id from output
   ```

2. **Create R2 bucket:**
   ```bash
   wrangler r2 bucket create my-website-photos
   ```

3. **Update wrangler.toml:**
   - Uncomment the production bindings
   - Replace `REPLACE_WITH_ACTUAL_DATABASE_ID` with the real database_id

4. **Run migrations:**
   ```bash
   npm run db:migrate:prod
   ```

5. **Configure bindings in Cloudflare dashboard:**
   - Go to: Pages project > Settings > Functions
   - Add D1 binding: `DB` → `my-website-db`
   - Add R2 binding: `PHOTOS` → `my-website-photos`

6. **Deploy:**
   ```bash
   npm run deploy
   ```

## What Happened to the Worker?

The `worker/` directory is **deprecated** and no longer used. The API logic has been migrated to Pages Functions in the `functions/api/` directory.

You can safely delete `worker/` after verifying the Pages deployment works correctly.

## Pages Functions vs Workers

| Feature | Pages Functions | Workers |
|---------|----------------|---------|
| Static files | ✅ Automatic | ❌ Manual (R2/KV) |
| Routing | ✅ File-based | ⚠️ Manual router |
| Bindings | ✅ Auto-inherited | ⚠️ Manual config |
| Use case | SPA + API | API-only services |

For this stack (Vite + React + D1), **Pages with Functions is the better choice**.

## Troubleshooting

### 404 on API routes in production
- Check that bindings are configured in the Cloudflare dashboard (Pages > Settings > Functions)
- Verify D1 database exists and migrations have run
- Check deployment logs for errors

### Functions not working locally
- Make sure you built the frontend: `npm run build`
- Verify wrangler.toml has the correct local bindings
- Check that `dist/` directory exists

### CORS errors
- Should not happen with Pages (same origin)
- If you still see CORS errors, check that your frontend is fetching from relative URLs (`/api/...` not `http://localhost:8787/api/...`)
