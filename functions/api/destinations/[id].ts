/**
 * Single destination endpoint: GET /api/destinations/:id
 */

export interface Env {
  DB: D1Database;
  PHOTOS: R2Bucket;
  ENVIRONMENT?: string;
}

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
        { status: 404 }
      );
    }

    const photos = await env.DB.prepare(
      'SELECT * FROM photos WHERE destination_id = ? AND is_visible = 1 ORDER BY sort_order'
    )
      .bind(id)
      .all();

    return Response.json({
      data: {
        ...destination,
        photos: photos.results,
      },
    });
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
      { status: 500 }
    );
  }
};
