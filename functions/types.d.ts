/**
 * TypeScript definitions for Cloudflare Pages Functions
 */

interface Env {
  DB: D1Database;
  PHOTOS: R2Bucket;
  ENVIRONMENT?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  ADMIN_API_KEY?: string;
}

// Cloudflare Pages Functions types are globally available
// No need to import PagesFunction - it's automatically available in functions/
