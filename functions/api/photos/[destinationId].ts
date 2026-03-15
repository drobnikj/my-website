/**
 * Photos endpoint: GET /api/photos/:destinationId
 * Returns all visible photos for a specific destination
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Valid ID format: lowercase letters, numbers, and hyphens
const ID_REGEX = /^[a-z0-9-]+$/;

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
};

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  try {
    const { destinationId } = params;

    // Validate ID format
    if (!destinationId || typeof destinationId !== 'string' || !ID_REGEX.test(destinationId)) {
      return Response.json(
        { error: 'Invalid destination ID format. Must contain only lowercase letters, numbers, and hyphens.' },
        {
          status: 400,
          headers: CORS_HEADERS,
        }
      );
    }

    // Verify destination exists
    const destination = await env.DB.prepare(
      'SELECT id FROM destinations WHERE id = ?'
    )
      .bind(destinationId)
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

    // Fetch photos
    const photos = await env.DB.prepare(
      'SELECT * FROM photos WHERE destination_id = ? AND is_visible = 1 ORDER BY sort_order'
    )
      .bind(destinationId)
      .all();

    return Response.json(
      {
        data: {
          destination_id: destinationId,
          photos: photos.results,
        },
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('Error fetching photos:', error);

    // Check if error is due to missing D1 binding
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('DB is not defined') || errorMessage.includes('Cannot read') || !env.DB) {
      return Response.json(
        {
          error: 'Database binding not configured',
          message: 'D1 database binding (DB) is not available. To fix this:\n\n' +
                   '1. Go to Cloudflare dashboard → Workers & Pages\n' +
                   '2. Select "my-website" project\n' +
                   '3. Go to Settings → Functions → D1 database bindings\n' +
                   '4. Add binding: Variable name = "DB", D1 database = "my-website-db"\n' +
                   '5. Do this for BOTH Production AND Preview environments\n' +
                   '6. Trigger a new deployment (push a commit)\n\n' +
                   'See README.md for detailed setup instructions.',
          docs: 'https://developers.cloudflare.com/pages/functions/bindings/#d1-databases'
        },
        { status: 503, headers: CORS_HEADERS }
      );
    }

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
