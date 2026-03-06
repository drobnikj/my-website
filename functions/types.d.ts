/**
 * TypeScript definitions for Cloudflare Pages Functions
 */

interface Env {
  DB: D1Database;
  PHOTOS: R2Bucket;
  ENVIRONMENT?: string;
}

// Cloudflare Pages Functions types are globally available
// No need to import PagesFunction - it's automatically available in functions/
