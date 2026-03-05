/**
 * Cloudflare Worker API for my-website
 * Handles dynamic photo management with D1 database and R2 storage
 */

export interface Env {
  DB: D1Database;
  PHOTOS: R2Bucket;
  ENVIRONMENT?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers for local development
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Router
    try {
      // API endpoints
      if (url.pathname.startsWith('/api/')) {
        const path = url.pathname.replace('/api', '');

        // Health check endpoint
        if (path === '/health' && request.method === 'GET') {
          return Response.json(
            {
              status: 'ok',
              message: 'my-website API is running',
              timestamp: new Date().toISOString(),
              version: '1.0.0',
            },
            { headers: corsHeaders }
          );
        }

        // GET /api/destinations - List all destinations
        if (path === '/destinations' && request.method === 'GET') {
          const destinations = await env.DB.prepare(
            'SELECT * FROM destinations ORDER BY year DESC'
          ).all();

          return Response.json(
            { data: destinations.results },
            { headers: corsHeaders }
          );
        }

        // GET /api/destinations/:id - Get single destination with photos
        if (path.match(/^\/destinations\/[^/]+$/) && request.method === 'GET') {
          const id = path.split('/')[2];

          const destination = await env.DB.prepare(
            'SELECT * FROM destinations WHERE id = ?'
          )
            .bind(id)
            .first();

          if (!destination) {
            return Response.json(
              { error: 'Destination not found' },
              { status: 404, headers: corsHeaders }
            );
          }

          const photos = await env.DB.prepare(
            'SELECT * FROM photos WHERE destination_id = ? AND is_visible = 1 ORDER BY sort_order'
          )
            .bind(id)
            .all();

          return Response.json(
            {
              data: {
                ...destination,
                photos: photos.results,
              },
            },
            { headers: corsHeaders }
          );
        }

        // 404 for unknown API routes
        return Response.json(
          { error: 'Not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      // 404 for unknown routes
      return Response.json(
        { error: 'Not found' },
        { status: 404, headers: corsHeaders }
      );
    } catch (error) {
      console.error('Worker error:', error);
      
      // Environment-based error responses
      const isDevelopment = env.ENVIRONMENT === 'development' || !env.ENVIRONMENT;
      
      return Response.json(
        {
          error: 'Internal server error',
          ...(isDevelopment && {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          }),
        },
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
