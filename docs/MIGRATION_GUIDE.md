# Migration Guide: Git → D1 + R2

This guide explains how to migrate photo data from the git repository to Cloudflare D1 (database) and R2 (object storage).

## Overview

**Current state (before migration):**
- Photos stored in `public/travel-map/` (committed to git)
- Travel data hardcoded in `src/data/travels.ts`
- Photos served directly from the frontend build

**Target state (after migration):**
- Photos stored in Cloudflare R2 bucket
- Destination and photo metadata in D1 database
- API endpoints serve data dynamically from D1
- Photos served from R2 via public URLs or API

## Prerequisites

Before running the migration:

1. **Wrangler CLI** installed and authenticated:
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Create R2 bucket** (if not exists):
   ```bash
   # Production
   wrangler r2 bucket create my-website-photos
   
   # Local (uses same bucket name, wrangler handles local storage)
   wrangler r2 bucket create my-website-photos
   ```

3. **Create D1 database** (if not exists):
   ```bash
   # Production
   wrangler d1 create my-website-db
   # Copy the database_id and update wrangler.toml
   
   # Local (auto-created on first use)
   npm run db:migrate:local
   ```

4. **Run migrations:**
   ```bash
   # Local
   npm run db:migrate:local
   
   # Production
   npm run db:migrate:prod
   ```

## Migration Script

The migration script (`scripts/migrate-to-d1-r2.ts`) performs three main tasks:

1. **Upload photos to R2** — All `.webp` files from `public/travel-map/`
2. **Insert data into D1** — Destinations and photo metadata
3. **Verify migration** — Count checks to ensure data integrity

### Usage

#### Local Migration (Development)

Run a dry-run first to see what will happen:

```bash
npm run migrate:local:dry
```

Execute the migration:

```bash
npm run migrate:local
```

#### Production Migration

⚠️ **Warning:** This will delete existing data in the production database and R2 bucket!

Dry-run:

```bash
npm run migrate:prod:dry
```

Execute:

```bash
npm run migrate:prod
```

### CLI Options

Run the script directly with custom options:

```bash
tsx scripts/migrate-to-d1-r2.ts [options]
```

**Options:**
- `--env <local|production>` — Target environment (default: `local`)
- `--dry-run` — Preview actions without executing
- `--skip-r2` — Skip R2 upload (only insert to D1)
- `--skip-d1` — Skip D1 insertion (only upload to R2)

**Examples:**

```bash
# Dry run for production
tsx scripts/migrate-to-d1-r2.ts --env production --dry-run

# Only upload to R2 (skip database)
tsx scripts/migrate-to-d1-r2.ts --env local --skip-d1

# Only insert to D1 (photos already in R2)
tsx scripts/migrate-to-d1-r2.ts --env production --skip-r2
```

## What Gets Migrated

### Photos

All `.webp` files in `public/travel-map/`:

- **Full images:** `DJI_0006.webp`, `DJI_0027.webp`, ...
- **Thumbnails:** `DJI_0006-thumb.webp`, `DJI_0027-thumb.webp`, ...
- **Blur placeholders:** `DJI_0006-blur.webp`, ... (if exists)

Uploaded to R2 with the same filename as the key:
```
r2://my-website-photos/DJI_0006.webp
r2://my-website-photos/DJI_0006-thumb.webp
r2://my-website-photos/DJI_0006-blur.webp
```

### Database

**Destinations table:**
- 13 destinations (Iceland, Canadian Rockies, Malaysia, ...)
- Fields: id, name_en, name_cs, description_en, description_cs, lat, lng, continent, visited_at_year

**Photos table:**
- 73 photos total
- Fields: id, destination_id, full_url, thumb_url, blur_url, caption_en, caption_cs, sort_order, is_visible

## Verification

The script automatically verifies the migration by checking:

1. **Destination count** — Should match the number of travel places (13)
2. **Photo count** — Should match total photos across all destinations (73)

If verification fails, the script will exit with an error.

## Post-Migration Steps

After successful migration:

1. **Update frontend** (task #8):
   - Modify photo rendering to fetch from API instead of `travels.ts`
   - Update image URLs to point to R2 (via API or public URLs)

2. **Remove photos from git** (optional cleanup):
   ```bash
   # ⚠️ WARNING: This is destructive and affects git history!
   # Only do this after verifying the migration works in production
   
   git rm -r public/travel-map/*.webp
   git commit -m "chore: remove photos after migrating to R2"
   
   # Optional: Clean git history to reduce repo size
   # This requires git-filter-repo: https://github.com/newren/git-filter-repo
   git filter-repo --path public/travel-map --invert-paths
   ```

3. **Remove hardcoded data** (after frontend migration):
   - Delete or archive `src/data/travels.ts`
   - Remove old photo serving logic from frontend

## Rollback

If something goes wrong:

### Rollback Database

Re-run migrations to reset schema:

```bash
# Local
npm run db:migrate:local

# Production
npm run db:migrate:prod
```

Then re-seed with original data:

```bash
npm run db:seed:local
```

### Rollback R2

Delete all objects from the bucket:

```bash
# List objects
wrangler r2 object list my-website-photos

# Delete all (be careful!)
# Note: This requires manual deletion or a script, as wrangler doesn't have bulk delete
```

Or simply recreate the bucket:

```bash
wrangler r2 bucket delete my-website-photos
wrangler r2 bucket create my-website-photos
```

## Troubleshooting

### "Database not found"

Make sure you've created the D1 database and run migrations:

```bash
wrangler d1 create my-website-db
npm run db:migrate:local  # or db:migrate:prod
```

### "Bucket not found"

Create the R2 bucket:

```bash
wrangler r2 bucket create my-website-photos
```

### "File not found" during upload

Verify that `public/travel-map/` contains the photos:

```bash
ls -la public/travel-map/*.webp | wc -l
# Should show 73+ files (full + thumb + blur)
```

### Verification fails (count mismatch)

Check for SQL errors in the output. Common causes:
- Foreign key constraint violations
- Duplicate primary keys
- Missing required fields

Rerun with verbose logging:

```bash
tsx scripts/migrate-to-d1-r2.ts --env local --dry-run
```

## Migration Checklist

- [ ] Prerequisites completed (wrangler, R2, D1 created)
- [ ] Ran migrations on target environment
- [ ] Ran dry-run migration to preview changes
- [ ] Executed migration (local or production)
- [ ] Verified counts match expected values
- [ ] Tested API endpoints return correct data
- [ ] Tested photo URLs are accessible
- [ ] Updated frontend to use API data (task #8)
- [ ] (Optional) Removed photos from git repository

## See Also

- [README.md](../README.md) — Project overview and setup
- [MIGRATION.md](../MIGRATION.md) — Architecture migration (Worker → Pages Functions)
- [API Documentation](../README.md#api-endpoints) — API endpoint specifications
