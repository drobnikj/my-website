# Cloudflare Pages Setup Guide

This document explains the required Cloudflare dashboard configuration for this project.

## Required Bindings

This project uses Cloudflare Pages Functions with D1 and R2 bindings. These **MUST** be configured in the Cloudflare dashboard for both **Production** and **Preview** environments.

### 1. D1 Database Binding

**Variable name:** `DB`  
**D1 database:** `my-website-db`

### 2. R2 Bucket Binding

**Variable name:** `PHOTOS`  
**R2 bucket:** `my-website-photos`

## How to Configure Bindings

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages**
2. Select the **my-website** project
3. Go to **Settings** → **Functions**
4. Scroll down to **D1 database bindings**
5. Click **Add binding**
   - Variable name: `DB`
   - D1 database: `my-website-db`
6. Scroll to **R2 bucket bindings**
7. Click **Add binding**
   - Variable name: `PHOTOS`
   - R2 bucket: `my-website-photos`
8. **Important:** Repeat steps 4-7 for **BOTH** Production and Preview environments

## How to Switch Between Environments

In the Settings → Functions page, there's a dropdown at the top to switch between:
- **Production (production branch)**
- **Preview (all other branches)**

Make sure to configure bindings for BOTH.

## Verify Configuration

After configuring and deploying:

1. **Check D1 binding:**
   ```bash
   curl https://YOUR-DEPLOYMENT.pages.dev/api/destinations
   ```
   Should return JSON with destinations data, not an error about missing DB binding.

2. **Check R2 binding:**
   ```bash
   curl https://YOUR-DEPLOYMENT.pages.dev/api/images/DJI_0006.webp
   ```
   Should return image data (content-type: image/webp), not HTML or 500 error.

## Common Issues

### Issue: `/api/images/*` returns HTML instead of images

**Cause:** R2 binding not configured in Cloudflare dashboard.

**Fix:** Add the R2 binding as described above, then trigger a new deployment (push a commit).

### Issue: `/api/destinations` returns "Database binding not configured"

**Cause:** D1 binding not configured in Cloudflare dashboard.

**Fix:** Add the D1 binding as described above, then trigger a new deployment.

### Issue: Bindings work in production but not in preview deployments

**Cause:** Bindings are only configured for Production environment.

**Fix:** Switch to Preview environment in the dashboard and add the same bindings there.

## Routes Configuration

This project includes a `public/_routes.json` file that tells Cloudflare Pages which routes should invoke Functions:

```json
{
  "version": 1,
  "include": ["/api/*"],
  "exclude": []
}
```

This ensures all `/api/*` requests are routed to Functions, while static assets are served directly without function invocations (saving costs).

## References

- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [D1 Bindings](https://developers.cloudflare.com/pages/functions/bindings/#d1-databases)
- [R2 Bindings](https://developers.cloudflare.com/pages/functions/bindings/#r2-buckets)
- [Functions Routing](https://developers.cloudflare.com/pages/functions/routing/)
