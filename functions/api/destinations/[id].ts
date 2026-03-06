/**
 * Single destination endpoint: GET /api/destinations/:id
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

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  try {
    const { id } = params;

    const destination = await env.DB.prepare(
      'SELECT * FROM destinations WHERE id = ?'
    )
      .bind(id)
      .first();

    if (!destination) {
      return Response.json(
        { error: 'Destination not found' },
        { 
          status: 404,
          headers: CORS_HEADERS,
        }
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
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('Error fetching destination:', error);
    
    const isDevelopment = env.ENVIRONMENT === 'development' || !env.ENVIRONMENT;
    
    return Response.json(
      {
        error: 'Internal server error',
        ...(isDevelopment && {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { 
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
};
