/**
 * Health check endpoint: GET /api/health
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
};

export const onRequest: PagesFunction<Env> = async () => {
  return Response.json(
    {
      status: 'ok',
      message: 'API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
    { headers: CORS_HEADERS }
  );
};
