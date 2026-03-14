/**
 * Transform API responses to frontend data models
 */

import type { DestinationResponse, DestinationWithPhotos } from './types';
import type { TravelPlace } from '../data/travels';

// Continent emoji mapping
const CONTINENT_EMOJI: Record<string, string> = {
  'Europe': '🧊',
  'North America': '🏔️',
  'South America': '🌿',
  'Asia': '🌴',
  'Africa': '🦁',
  'Oceania': '🏝️',
};

/**
 * Transform API destination to TravelPlace
 */
export function transformDestinationToPlace(
  destination: DestinationResponse | DestinationWithPhotos,
  language: 'en' | 'cs',
): TravelPlace {
  const name = language === 'cs' ? destination.name_cs : destination.name_en;
  const description = language === 'cs' ? destination.description_cs : destination.description_en;

  const photos = 'photos' in destination ? destination.photos : [];
  const visiblePhotos = photos.filter(p => p.is_visible === 1);

  // Determine continent emoji (fallback to globe)
  let continentEmoji = CONTINENT_EMOJI[destination.continent] || '🌍';

  // Special cases based on destination ID
  if (destination.id === 'iceland') continentEmoji = '🧊';
  else if (destination.id === 'canadian-rockies') continentEmoji = '🏔️';
  else if (destination.id === 'malaysia') continentEmoji = '🌴';
  else if (destination.id === 'bali') continentEmoji = '🌺';
  else if (destination.id === 'yosemite') continentEmoji = '🏞️';
  else if (destination.id === 'silicon-valley') continentEmoji = '💻';
  else if (destination.id === 'mexican-caribbean') continentEmoji = '🏖️';
  else if (destination.id === 'yucatan') continentEmoji = '🏛️';
  else if (destination.id === 'guatemala') continentEmoji = '🌋';
  else if (destination.id === 'ecuador') continentEmoji = '🌿';
  else if (destination.id === 'colombia') continentEmoji = '🦜';
  else if (destination.id === 'costa-rica') continentEmoji = '🐒';
  else if (destination.id === 'panama') continentEmoji = '🌊';

  return {
    id: destination.id,
    name,
    description,
    lat: destination.lat,
    lng: destination.lng,
    photos: visiblePhotos.map(p => p.full_url),
    thumbs: visiblePhotos.map(p => p.thumb_url),
    blurs: visiblePhotos.map(p => p.blur_url ?? undefined),
    continent: destination.continent,
    continentEmoji,
    year: destination.year,
  };
}

/**
 * Transform array of destinations to TravelPlace array
 */
export function transformDestinationsToPlaces(
  destinations: DestinationResponse[],
  language: 'en' | 'cs',
): TravelPlace[] {
  return destinations.map(d => transformDestinationToPlace(d, language));
}
