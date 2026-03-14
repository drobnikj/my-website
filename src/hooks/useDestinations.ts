/**
 * React Query hooks for destinations
 */

import { useQuery } from '@tanstack/react-query';
import { fetchDestinations, fetchDestinationWithPhotos } from '../api/client';

/**
 * Hook to fetch all destinations with optional filters
 */
export function useDestinations(filters?: { year?: number; continent?: string }) {
  return useQuery({
    queryKey: ['destinations', filters],
    queryFn: () => fetchDestinations(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Hook to fetch a single destination with photos
 */
export function useDestinationWithPhotos(id: string | null) {
  return useQuery({
    queryKey: ['destination', id],
    queryFn: () => {
      if (!id) throw new Error('Destination ID is required');
      return fetchDestinationWithPhotos(id);
    },
    enabled: !!id, // Only run query if id is provided
    staleTime: 10 * 60 * 1000, // 10 minutes (photos rarely change)
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
