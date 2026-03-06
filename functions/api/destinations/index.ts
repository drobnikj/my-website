/**
 * Destinations list endpoint: GET /api/destinations
 * Query params:
 *  - year: filter by visited_at_year
 *  - continent: filter by continent
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

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const year = url.searchParams.get('year');
    const continent = url.searchParams.get('continent');

    let query = 'SELECT * FROM destinations WHERE 1=1';
    const bindings: (string | number)[] = [];

    if (year) {
      query += ' AND visited_at_year = ?';
      bindings.push(parseInt(year, 10));
    }

    if (continent) {
      query += ' AND continent = ?';
      bindings.push(continent);
    }

    query += ' ORDER BY visited_at_year DESC';

    const stmt = env.DB.prepare(query);
    const destinations = bindings.length > 0 
      ? await stmt.bind(...bindings).all()
      : await stmt.all();

    return Response.json(
      { data: destinations.results },
      { headers: CORS_HEADERS }
    );
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
      { 
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
};
