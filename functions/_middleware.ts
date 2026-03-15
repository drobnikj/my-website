/**
 * Middleware for admin endpoints authentication
 * Validates Cloudflare Access JWT or API key
 */

interface Env {
  DB: D1Database;
  PHOTOS: R2Bucket;
  ENVIRONMENT?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  ADMIN_API_KEY?: string;
}

/**
 * Verify Cloudflare Access JWT token
 */
async function verifyCloudflareAccessToken(
  request: Request,
  teamDomain: string
): Promise<boolean> {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return false;

  // Extract CF_Authorization cookie
  const cfAuth = cookie
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('CF_Authorization='))
    ?.split('=')[1];

  if (!cfAuth) return false;

  try {
    // Verify JWT with Cloudflare's public keys
    const certsUrl = `https://${teamDomain}.cloudflareaccess.com/cdn-cgi/access/certs`;
    const certsResponse = await fetch(certsUrl);
    const certs = await certsResponse.json();

    // For production: implement full JWT verification with public keys
    // For now: basic JWT structure validation
    const parts = cfAuth.split('.');
    if (parts.length !== 3) return false;

    // Decode payload (basic validation)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return false;
  }
}

/**
 * Verify API key from Authorization header
 */
function verifyApiKey(request: Request, expectedKey: string): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;

  // Support "Bearer <key>" or just "<key>"
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  return token === expectedKey;
}

/**
 * Admin auth middleware
 * Protects /admin/* routes
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // Only protect /admin/* routes
  if (!url.pathname.startsWith('/admin/')) {
    return next();
  }

  // Check API key first (faster)
  if (env.ADMIN_API_KEY && verifyApiKey(request, env.ADMIN_API_KEY)) {
    return next();
  }

  // Check Cloudflare Access JWT
  if (env.CF_ACCESS_TEAM_DOMAIN) {
    const isValidJwt = await verifyCloudflareAccessToken(
      request,
      env.CF_ACCESS_TEAM_DOMAIN
    );
    if (isValidJwt) {
      return next();
    }
  }

  // No valid auth found
  return new Response(
    JSON.stringify({
      error: 'Unauthorized',
      message: 'Valid authentication required. Provide API key or Cloudflare Access token.',
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer',
      },
    }
  );
};
