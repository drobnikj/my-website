/**
 * Destinations list endpoint: GET /api/destinations
 */

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const destinations = await env.DB.prepare(
      'SELECT * FROM destinations ORDER BY visited_at_year DESC'
    ).all();

    return Response.json({ data: destinations.results });
  } catch (error) {
    console.error('Error fetching destinations:', error);
    
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
