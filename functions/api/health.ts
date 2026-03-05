/**
 * Health check endpoint: GET /api/health
 */

export interface Env {
  DB: D1Database;
  PHOTOS: R2Bucket;
  ENVIRONMENT?: string;
}

export const onRequest: PagesFunction<Env> = async () => {
  return Response.json({
    status: 'ok',
    message: 'my-website API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
};
