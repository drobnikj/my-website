/**
 * Generate seed SQL file from travels.ts data
 * This avoids the import.meta.env issue by running in Node
 *
 * Usage: tsx scripts/generate-seed.ts > migrations/seed.sql
 */

// Inline the travel data to avoid Vite imports
const travelPlaces = [
  {
    id: 'iceland',
    name: 'Iceland',
    description: 'Land of fire and ice — volcanic landscapes, glaciers, waterfalls, and endless horizons from the drone.',
    lat: 64.75,
    lng: -17.84,
    continent: 'Europe',
    year: 2019,
    photos: ['DJI_0006', 'DJI_0027', 'DJI_0036'],
  },
  {
    id: 'canadian-rockies',
    name: 'Canadian Rockies',
    description: 'Turquoise lakes, towering peaks, and pristine wilderness across British Columbia and Alberta.',
    lat: 52.24,
    lng: -118.62,
    continent: 'North America',
    year: 2019,
    photos: ['DJI_0018', 'DJI_0022', 'DJI_0070', 'DJI_0090', 'DJI_0092', 'DJI_0111', 'DJI_0125', 'DJI_0140'],
  },
  {
    id: 'malaysia',
    name: 'Malaysia',
    description: 'Tropical beaches, Kuala Lumpur skyline, and lush jungles of Southeast Asia.',
    lat: 4.31,
    lng: 100.99,
    continent: 'Asia',
    year: 2020,
    photos: ['DJI_0022 2', 'DJI_0029'],
  },
  {
    id: 'bali',
    name: 'Bali',
    description: 'Rice terraces, temple ceremonies, dramatic cliffs, and endless sunsets over the Indian Ocean.',
    lat: -8.47,
    lng: 115.27,
    continent: 'Asia',
    year: 2022,
    photos: ['DJI_0049', 'DJI_0055', 'DJI_0118', 'DJI_0149', 'DJI_0171'],
  },
  {
    id: 'yosemite',
    name: 'Yosemite',
    description: "Granite cliffs, giant sequoias, and the breathtaking valley views of California's crown jewel.",
    lat: 37.77,
    lng: -119.81,
    continent: 'North America',
    year: 2022,
    photos: ['DJI_0154', 'DJI_0160'],
  },
  {
    id: 'silicon-valley',
    name: 'Silicon Valley',
    description: 'The tech capital of the world — aerial views over San Jose and the Bay Area.',
    lat: 37.34,
    lng: -122.01,
    continent: 'North America',
    year: 2022,
    photos: ['DJI_0169', 'DJI_0179', 'DJI_0182'],
  },
  {
    id: 'mexican-caribbean',
    name: 'Mexican Caribbean',
    description: 'Turquoise waters, ancient Mayan ruins, cenotes, and white sand beaches along the Riviera Maya.',
    lat: 20.80,
    lng: -87.19,
    continent: 'North America',
    year: 2023,
    photos: ['DJI_0194', 'DJI_0203', 'DJI_0216', 'DJI_0258', 'DJI_0265', 'DJI_0271', 'DJI_0274', 'DJI_0275', 'DJI_0346', 'DJI_0361'],
  },
  {
    id: 'yucatan',
    name: 'Yucatán',
    description: 'Pink flamingo lagoons, Mayan pyramids, and colorful colonial towns deep in the Mexican interior.',
    lat: 20.58,
    lng: -89.35,
    continent: 'North America',
    year: 2023,
    photos: ['DJI_0327', 'DJI_0336', 'DJI_0495', 'DJI_0500', 'DJI_0503', 'DJI_0521'],
  },
  {
    id: 'guatemala',
    name: 'Guatemala',
    description: 'Volcanoes, misty highlands, Lake Atitlán, and the ancient ruins of Tikal from above.',
    lat: 14.99,
    lng: -90.21,
    continent: 'North America',
    year: 2023,
    photos: ['DJI_0539', 'DJI_0559', 'DJI_0573'],
  },
  {
    id: 'ecuador',
    name: 'Ecuador',
    description: 'The equator line, Andean highlands, cloud forests, and the diversity of a tiny, mighty country.',
    lat: -0.25,
    lng: -78.38,
    continent: 'South America',
    year: 2024,
    photos: ['DJI_0596', 'DJI_0607', 'DJI_0610', 'DJI_0635'],
  },
  {
    id: 'colombia',
    name: 'Colombia',
    description: 'Caribbean coastline, colonial Cartagena, lush coffee country, and vibrant cities from the sky.',
    lat: 8.73,
    lng: -74.55,
    continent: 'South America',
    year: 2024,
    photos: ['DJI_0659', 'DJI_0701', 'DJI_0712', 'DJI_0753', 'DJI_0766', 'DJI_0802', 'DJI_0815', 'DJI_0818', 'DJI_0859'],
  },
  {
    id: 'costa-rica',
    name: 'Costa Rica',
    description: 'Pura vida — rainforests, volcanoes, wild coastlines, and incredible biodiversity.',
    lat: 9.30,
    lng: -84.16,
    continent: 'North America',
    year: 2024,
    photos: ['DJI_0805', 'DJI_0817', 'DJI_0849', 'DJI_0881'],
  },
  {
    id: 'panama',
    name: 'Panama',
    description: 'Where two oceans meet — tropical islands, misty highlands, and the famous canal from above.',
    lat: 9.63,
    lng: -82.67,
    continent: 'North America',
    year: 2024,
    photos: ['DJI_0768', 'DJI_0776'],
  },
];

/**
 * Photo IDs that have blur placeholder images available.
 * 
 * ⚠️ MAINTENANCE REQUIRED: This list is manually maintained.
 * 
 * This hardcoded set represents photos for which blur versions (-blur.webp)
 * have been generated and uploaded to R2 storage. When adding new photos:
 * 1. Generate blur placeholder: `convert image.webp -blur 0x8 image-blur.webp`
 * 2. Upload blur image to R2
 * 3. Add photo ID to this HAS_BLUR set
 * 
 * TODO: Consider auto-detecting blur images from filesystem or R2 bucket
 * to avoid manual maintenance. Possible approaches:
 *   - Scan public/travel-map/ for *-blur.webp files at build time
 *   - Query R2 bucket for blur images at runtime
 *   - Generate blur placeholders automatically during build
 */
const HAS_BLUR = new Set([
  'DJI_0006', 'DJI_0018', 'DJI_0022', 'DJI_0022 2', 'DJI_0027', 'DJI_0029',
  'DJI_0036', 'DJI_0049', 'DJI_0055', 'DJI_0070', 'DJI_0090', 'DJI_0092',
  'DJI_0111', 'DJI_0118', 'DJI_0125', 'DJI_0140', 'DJI_0149', 'DJI_0154',
  'DJI_0160', 'DJI_0169', 'DJI_0171', 'DJI_0179', 'DJI_0182', 'DJI_0194',
  'DJI_0203', 'DJI_0216', 'DJI_0258', 'DJI_0265', 'DJI_0271', 'DJI_0274',
  'DJI_0275', 'DJI_0327', 'DJI_0336', 'DJI_0346', 'DJI_0361', 'DJI_0495',
  'DJI_0500', 'DJI_0503', 'DJI_0521', 'DJI_0539', 'DJI_0559',
]);

console.log('-- Seed data for my-website D1 database');
console.log('-- Generated:', new Date().toISOString());
console.log();

console.log('-- Clear existing data');
console.log('DELETE FROM photos;');
console.log('DELETE FROM destinations;');
console.log();

console.log('-- Insert destinations');
travelPlaces.forEach((place) => {
  // TODO: Add proper Czech translations for name_cs and description_cs
  // Currently both Czech fields duplicate the English values as placeholders.
  // Options:
  //   1. Add actual Czech translations to the data
  //   2. Use NULL for Czech fields until translations are available
  //   3. Keep current approach if bilingual display isn't needed yet
  const values = [
    `'${place.id}'`,
    `'${place.name.replace(/'/g, "''")}'`,
    `'${place.name.replace(/'/g, "''")}'`, // name_cs = name_en (placeholder)
    `'${place.description.replace(/'/g, "''")}'`,
    `'${place.description.replace(/'/g, "''")}'`, // description_cs = description_en (placeholder)
    place.lat,
    place.lng,
    `'${place.continent}'`,
    place.year,
  ].join(', ');

  console.log(
    `INSERT INTO destinations (id, name_en, name_cs, description_en, description_cs, lat, lng, continent, year) VALUES (${values});`
  );
});

console.log();
console.log('-- Insert photos');
let photoCount = 0;
travelPlaces.forEach((place) => {
  place.photos.forEach((photoId, index) => {
    const fullUrl = `/travel-map/${photoId}.webp`;
    const thumbUrl = `/travel-map/${photoId}-thumb.webp`;
    const blurUrl = HAS_BLUR.has(photoId) ? `/travel-map/${photoId}-blur.webp` : null;

    const values = [
      `'${place.id}-${photoId}'`,
      `'${place.id}'`,
      `'${fullUrl}'`,
      `'${thumbUrl}'`,
      blurUrl ? `'${blurUrl}'` : 'NULL',
      'NULL', // caption_en
      'NULL', // caption_cs
      index,
      1, // is_visible
    ].join(', ');

    console.log(
      `INSERT INTO photos (id, destination_id, full_url, thumb_url, blur_url, caption_en, caption_cs, sort_order, is_visible) VALUES (${values});`
    );
    photoCount++;
  });
});

console.log();
console.log(`-- Summary: ${travelPlaces.length} destinations, ${photoCount} photos`);
