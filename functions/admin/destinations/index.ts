/**
 * Admin destinations endpoint: POST /admin/destinations
 * Creates a new destination
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

interface CreateDestinationInput {
  id: string;
  name_en: string;
  name_cs: string;
  description_en: string;
  description_cs: string;
  lat: number;
  lng: number;
  continent: string;
  visited_at_year: number;
  visited_from?: string; // ISO date
  visited_to?: string; // ISO date
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const input: CreateDestinationInput = await request.json();

    // Validate required fields with proper type checking
    const errors: string[] = [];
    
    if (!input.id || !/^[a-z0-9-]+$/.test(input.id)) {
      errors.push('id must contain only lowercase letters, numbers, and hyphens');
    }
    
    // Type-safe string validation
    if (typeof input.name_en !== 'string' || !input.name_en.trim()) {
      errors.push('name_en is required and must be a non-empty string');
    }
    if (typeof input.name_cs !== 'string' || !input.name_cs.trim()) {
      errors.push('name_cs is required and must be a non-empty string');
    }
    if (typeof input.description_en !== 'string' || !input.description_en.trim()) {
      errors.push('description_en is required and must be a non-empty string');
    }
    if (typeof input.description_cs !== 'string' || !input.description_cs.trim()) {
      errors.push('description_cs is required and must be a non-empty string');
    }
    
    if (typeof input.lat !== 'number' || input.lat < -90 || input.lat > 90) {
      errors.push('lat must be a number between -90 and 90');
    }
    if (typeof input.lng !== 'number' || input.lng < -180 || input.lng > 180) {
      errors.push('lng must be a number between -180 and 180');
    }
    
    if (!VALID_CONTINENTS.includes(input.continent)) {
      errors.push(`continent must be one of: ${VALID_CONTINENTS.join(', ')}`);
    }
    
    if (!Number.isInteger(input.visited_at_year) || input.visited_at_year < 1900 || input.visited_at_year > 2100) {
      errors.push('visited_at_year must be an integer between 1900 and 2100');
    }

    if (errors.length > 0) {
      return Response.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Check if destination already exists
    const existing = await env.DB.prepare(
      'SELECT id FROM destinations WHERE id = ?'
    )
      .bind(input.id)
      .first();

    if (existing) {
      return Response.json(
        { error: 'Destination already exists with this ID' },
        { status: 409 }
      );
    }

    // Insert new destination
    const now = new Date().toISOString();
    
    try {
      await env.DB.prepare(`
        INSERT INTO destinations (
          id, name_en, name_cs, description_en, description_cs,
          lat, lng, continent, visited_at_year,
          visited_from, visited_to, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          input.id,
          input.name_en.trim(),
          input.name_cs.trim(),
          input.description_en.trim(),
          input.description_cs.trim(),
          input.lat,
          input.lng,
          input.continent,
          input.visited_at_year,
          input.visited_from || null,
          input.visited_to || null,
          now,
          now
        )
        .run();
    } catch (insertError) {
      console.error('Insert failed:', insertError);
      throw insertError;
    }

    // Fetch the created destination with better error handling
    let created;
    try {
      created = await env.DB.prepare(
        'SELECT * FROM destinations WHERE id = ?'
      )
        .bind(input.id)
        .first();
    } catch (selectError) {
      console.error('Select after insert failed:', selectError);
      // Insert succeeded but select failed - return minimal response
      return Response.json(
        {
          data: {
            id: input.id,
            message: 'Destination created successfully but could not retrieve full data',
          }
        },
        { status: 201 }
      );
    }

    if (!created) {
      // Shouldn't happen but handle gracefully
      console.error('Destination not found after insert');
      return Response.json(
        {
          data: {
            id: input.id,
            message: 'Destination created successfully but could not retrieve full data',
          }
        },
        { status: 201 }
      );
    }

    return Response.json(
      { data: created },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating destination:', error);
    
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
