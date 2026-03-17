/**
 * Image serving endpoint: GET /api/images/:key
 * Serves photos from R2 bucket
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
    // Cloudflare Pages catch-all [[key]] returns an array
    const keyParts = params.key as string | string[];
    const key = Array.isArray(keyParts) ? keyParts.join('/') : keyParts;

    if (!key || typeof key !== 'string') {
      return new Response('Invalid image key', {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // Fetch from R2
    const object = await env.PHOTOS.get(key);

    if (!object) {
      return new Response('Image not found', {
        status: 404,
        headers: CORS_HEADERS,
      });
    }

    // Determine content type
    const contentType = key.endsWith('.webp')
      ? 'image/webp'
      : key.endsWith('.jpg') || key.endsWith('.jpeg')
      ? 'image/jpeg'
      : key.endsWith('.png')
      ? 'image/png'
      : 'application/octet-stream';

    // Return image with caching headers
    return new Response(object.body, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'ETag': object.etag || '',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
};
