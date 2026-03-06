/**
 * Health check endpoint: GET /api/health
 */

export const onRequest: PagesFunction<Env> = async () => {
  return Response.json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
};
