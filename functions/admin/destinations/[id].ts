/**
 * Admin destination endpoints:
 * - PATCH /admin/destinations/:id — update destination
 * - DELETE /admin/destinations/:id — delete destination (cascade photos)
 */

const VALID_CONTINENTS = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania',
  'Antarctica',
];

interface UpdateDestinationInput {
  name_en?: string;
  name_cs?: string;
  description_en?: string;
  description_cs?: string;
  lat?: number;
  lng?: number;
  continent?: string;
  visited_at_year?: number;
  visited_from?: string | null;
  visited_to?: string | null;
}

/**
 * PATCH /admin/destinations/:id
 * Update destination fields
 */
export const onRequestPatch: PagesFunction<Env> = async ({ params, request, env }) => {
  try {
    const { id } = params;

    if (!id || typeof id !== 'string') {
      return Response.json(
        { error: 'Invalid destination ID' },
        { status: 400 }
      );
    }

    // Check if destination exists
    const existing = await env.DB.prepare(
      'SELECT * FROM destinations WHERE id = ?'
    )
      .bind(id)
      .first();

    if (!existing) {
      return Response.json(
        { error: 'Destination not found' },
        { status: 404 }
      );
    }

    const input: UpdateDestinationInput = await request.json();

    // Validate input
    const errors: string[] = [];
    
    if (input.name_en !== undefined && !input.name_en.trim()) {
      errors.push('name_en cannot be empty');
    }
    if (input.name_cs !== undefined && !input.name_cs.trim()) {
      errors.push('name_cs cannot be empty');
    }
    if (input.description_en !== undefined && !input.description_en.trim()) {
      errors.push('description_en cannot be empty');
    }
    if (input.description_cs !== undefined && !input.description_cs.trim()) {
      errors.push('description_cs cannot be empty');
    }
    
    if (input.lat !== undefined && (input.lat < -90 || input.lat > 90)) {
      errors.push('lat must be between -90 and 90');
    }
    if (input.lng !== undefined && (input.lng < -180 || input.lng > 180)) {
      errors.push('lng must be between -180 and 180');
    }
    
    if (input.continent !== undefined && !VALID_CONTINENTS.includes(input.continent)) {
      errors.push(`continent must be one of: ${VALID_CONTINENTS.join(', ')}`);
    }
    
    if (input.visited_at_year !== undefined && 
        (!Number.isInteger(input.visited_at_year) || 
         input.visited_at_year < 1900 || 
         input.visited_at_year > 2100)) {
      errors.push('visited_at_year must be an integer between 1900 and 2100');
    }

    if (errors.length > 0) {
      return Response.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Build dynamic UPDATE query
    const updates: string[] = [];
    const bindings: (string | number | null)[] = [];

    if (input.name_en !== undefined) {
      updates.push('name_en = ?');
      bindings.push(input.name_en.trim());
    }
    if (input.name_cs !== undefined) {
      updates.push('name_cs = ?');
      bindings.push(input.name_cs.trim());
    }
    if (input.description_en !== undefined) {
      updates.push('description_en = ?');
      bindings.push(input.description_en.trim());
    }
    if (input.description_cs !== undefined) {
      updates.push('description_cs = ?');
      bindings.push(input.description_cs.trim());
    }
    if (input.lat !== undefined) {
      updates.push('lat = ?');
      bindings.push(input.lat);
    }
    if (input.lng !== undefined) {
      updates.push('lng = ?');
      bindings.push(input.lng);
    }
    if (input.continent !== undefined) {
      updates.push('continent = ?');
      bindings.push(input.continent);
    }
    if (input.visited_at_year !== undefined) {
      updates.push('visited_at_year = ?');
      bindings.push(input.visited_at_year);
    }
    if (input.visited_from !== undefined) {
      updates.push('visited_from = ?');
      bindings.push(input.visited_from);
    }
    if (input.visited_to !== undefined) {
      updates.push('visited_to = ?');
      bindings.push(input.visited_to);
    }

    if (updates.length === 0) {
      return Response.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Always update updated_at
    updates.push('updated_at = ?');
    bindings.push(new Date().toISOString());

    // Add id to bindings (for WHERE clause)
    bindings.push(id);

    const query = `UPDATE destinations SET ${updates.join(', ')} WHERE id = ?`;
    await env.DB.prepare(query).bind(...bindings).run();

    // Fetch updated destination
    const updated = await env.DB.prepare(
      'SELECT * FROM destinations WHERE id = ?'
    )
      .bind(id)
      .first();

    return Response.json({ data: updated });
  } catch (error) {
    console.error('Error updating destination:', error);
    
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

/**
 * DELETE /admin/destinations/:id
 * Delete destination and cascade delete all associated photos (from D1 and R2)
 */
export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  try {
    const { id } = params;

    if (!id || typeof id !== 'string') {
      return Response.json(
        { error: 'Invalid destination ID' },
        { status: 400 }
      );
    }

    // Check if destination exists
    const existing = await env.DB.prepare(
      'SELECT * FROM destinations WHERE id = ?'
    )
      .bind(id)
      .first();

    if (!existing) {
      return Response.json(
        { error: 'Destination not found' },
        { status: 404 }
      );
    }

    // Fetch all photos to delete from R2
    const photos = await env.DB.prepare(
      'SELECT full_url, thumb_url, blur_url FROM photos WHERE destination_id = ?'
    )
      .bind(id)
      .all();

    // Delete photos from R2
    const r2Deletions: Promise<void>[] = [];
    for (const photo of photos.results as any[]) {
      if (photo.full_url) {
        r2Deletions.push(env.PHOTOS.delete(photo.full_url));
      }
      if (photo.thumb_url) {
        r2Deletions.push(env.PHOTOS.delete(photo.thumb_url));
      }
      if (photo.blur_url) {
        r2Deletions.push(env.PHOTOS.delete(photo.blur_url));
      }
    }

    await Promise.all(r2Deletions);

    // Delete from D1 (cascade will handle photos table)
    await env.DB.prepare('DELETE FROM destinations WHERE id = ?')
      .bind(id)
      .run();

    return Response.json(
      {
        message: 'Destination deleted',
        deletedPhotos: photos.results.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting destination:', error);
    
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
