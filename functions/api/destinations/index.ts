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

const VALID_CONTINENTS = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Antarctica'];

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const yearParam = url.searchParams.get('year');
    const continentParam = url.searchParams.get('continent');

    let query = 'SELECT * FROM destinations WHERE 1=1';
    const bindings: (string | number)[] = [];

    // Validate and bind year parameter
    if (yearParam) {
      const year = parseInt(yearParam, 10);
      if (isNaN(year) || year < 1900 || year > 2100) {
        return Response.json(
          { error: 'Invalid year parameter. Must be a number between 1900 and 2100.' },
          { status: 400, headers: CORS_HEADERS }
        );
      }
      query += ' AND visited_at_year = ?';
      bindings.push(year);
    }

    // Validate and bind continent parameter
    if (continentParam) {
      if (!VALID_CONTINENTS.includes(continentParam)) {
        return Response.json(
          { 
            error: 'Invalid continent parameter.',
            validContinents: VALID_CONTINENTS
          },
          { status: 400, headers: CORS_HEADERS }
        );
      }
      query += ' AND continent = ?';
      bindings.push(continentParam);
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
