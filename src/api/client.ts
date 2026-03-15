/**
 * API client for fetching travel destinations and photos
 */

import type {
  ApiResponse,
  DestinationResponse,
  DestinationWithPhotos,
  PhotoResponse,
} from './types';

const API_BASE = '/api';

/**
 * Fetch wrapper with error handling
 */
async function fetchApi<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: 'Unknown error',
      message: response.statusText,
    }));
    throw new Error(error.message || error.error || 'API request failed');
  }

  return response.json();
}

/**
 * Fetch all destinations with optional filters
 */
export async function fetchDestinations(params?: {
  year?: number;
  continent?: string;
}): Promise<DestinationResponse[]> {
  const searchParams = new URLSearchParams();
  if (params?.year !== undefined) {
    searchParams.set('year', params.year.toString());
  }
  if (params?.continent) {
    searchParams.set('continent', params.continent);
  }

  const queryString = searchParams.toString();
  const url = `${API_BASE}/destinations${queryString ? `?${queryString}` : ''}`;

  const result = await fetchApi<ApiResponse<DestinationResponse[]>>(url);
  return result.data;
}

/**
 * Fetch a single destination with photos
 */
export async function fetchDestinationWithPhotos(
  id: string,
): Promise<DestinationWithPhotos> {
  const result = await fetchApi<ApiResponse<DestinationWithPhotos>>(
    `${API_BASE}/destinations/${id}`,
  );
  return result.data;
}

/**
 * Fetch photos for a specific destination
 */
export async function fetchPhotos(
  destinationId: string,
): Promise<PhotoResponse[]> {
  const result = await fetchApi<ApiResponse<PhotoResponse[]>>(
    `${API_BASE}/photos/${destinationId}`,
  );
  return result.data;
}
