/**
 * Admin photo upload endpoint: POST /admin/photos/upload
 * Multipart upload → process image → upload to R2 (full, thumb, blur) → insert to D1
 */

interface UploadPhotoInput {
  destination_id: string;
  caption_en?: string;
  caption_cs?: string;
  sort_order?: number;
  is_visible?: boolean;
}

/**
 * Generate a simple blur placeholder (10x10 px base64-encoded image)
 * In production, use a proper image processing library
 */
function generateBlurPlaceholder(): string {
  // Simple 10x10 gray square as blur placeholder
  // In real implementation: downscale image to 10x10 and encode
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjY2NjIi8+PC9zdmc+';
}

/**
 * Generate thumbnail from image
 * Note: Cloudflare Workers don't have built-in image processing
 * Options:
 * 1. Use Cloudflare Images API (paid service)
 * 2. Use third-party service (sharp via wasm, etc.)
 * 3. Upload original and process client-side or in a separate worker
 * 
 * For now: we'll accept pre-processed images or process with basic canvas resizing
 */
async function processImage(
  imageData: ArrayBuffer,
  filename: string
): Promise<{
  full: ArrayBuffer;
  thumb: ArrayBuffer;
  blur: string;
}> {
  // TODO: Implement actual image processing
  // For MVP: just use the original image for all variants
  // In production: use sharp.wasm or Cloudflare Images
  
  return {
    full: imageData,
    thumb: imageData, // Should be resized to ~400px width
    blur: generateBlurPlaceholder(),
  };
}

/**
 * Parse multipart form data
 * Returns files and fields
 */
async function parseMultipartForm(request: Request): Promise<{
  files: Map<string, { name: string; data: ArrayBuffer; type: string }>;
  fields: Map<string, string>;
}> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    throw new Error('Content-Type must be multipart/form-data');
  }

  const formData = await request.formData();
  const files = new Map<string, { name: string; data: ArrayBuffer; type: string }>();
  const fields = new Map<string, string>();

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      files.set(key, {
        name: value.name,
        data: await value.arrayBuffer(),
        type: value.type,
      });
    } else {
      fields.set(key, value);
    }
  }

  return { files, fields };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    // Parse multipart form
    const { files, fields } = await parseMultipartForm(request);

    // Validate required fields
    const destination_id = fields.get('destination_id');
    if (!destination_id) {
      return Response.json(
        { error: 'destination_id is required' },
        { status: 400 }
      );
    }

    // Check if destination exists
    const destination = await env.DB.prepare(
      'SELECT id FROM destinations WHERE id = ?'
    )
      .bind(destination_id)
      .first();

    if (!destination) {
      return Response.json(
        { error: 'Destination not found' },
        { status: 404 }
      );
    }

    // Get image file
    const imageFile = files.get('image');
    if (!imageFile) {
      return Response.json(
        { error: 'image file is required' },
        { status: 400 }
      );
    }

    // Validate image type
    if (!imageFile.type.startsWith('image/')) {
      return Response.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Generate unique ID for photo
    const photoId = `${destination_id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const ext = imageFile.name.split('.').pop() || 'jpg';

    // Process image (generate full, thumb, blur variants)
    const processed = await processImage(imageFile.data, imageFile.name);

    // Upload to R2
    const fullKey = `${destination_id}/${photoId}.${ext}`;
    const thumbKey = `${destination_id}/${photoId}-thumb.${ext}`;
    const blurKey = `${destination_id}/${photoId}-blur.${ext}`;

    await Promise.all([
      env.PHOTOS.put(fullKey, processed.full, {
        httpMetadata: {
          contentType: imageFile.type,
        },
      }),
      env.PHOTOS.put(thumbKey, processed.thumb, {
        httpMetadata: {
          contentType: imageFile.type,
        },
      }),
      // Store blur as base64 in D1, not R2 (it's tiny)
    ]);

    // Parse optional fields
    const caption_en = fields.get('caption_en') || null;
    const caption_cs = fields.get('caption_cs') || null;
    const sort_order = parseInt(fields.get('sort_order') || '0', 10);
    const is_visible = fields.get('is_visible') === 'false' ? 0 : 1;

    // Insert to D1
    const now = new Date().toISOString();
    await env.DB.prepare(`
      INSERT INTO photos (
        id, destination_id, full_url, thumb_url, blur_url,
        caption_en, caption_cs, sort_order, is_visible, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        photoId,
        destination_id,
        fullKey,
        thumbKey,
        processed.blur, // Store blur as data URL
        caption_en,
        caption_cs,
        sort_order,
        is_visible,
        now
      )
      .run();

    // Fetch created photo
    const created = await env.DB.prepare(
      'SELECT * FROM photos WHERE id = ?'
    )
      .bind(photoId)
      .first();

    return Response.json(
      { data: created },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading photo:', error);
    
    const isDevelopment = env.ENVIRONMENT === 'development' || !env.ENVIRONMENT;
    
    return Response.json(
      {
        error: 'Internal server error',
        ...(isDevelopment && {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      },
      { status: 500 }
    );
  }
};
