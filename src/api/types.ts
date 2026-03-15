/**
 * API types for travel destinations and photos
 */

export interface DestinationResponse {
  id: string;
  name_en: string;
  name_cs: string;
  description_en: string;
  description_cs: string;
  lat: number;
  lng: number;
  continent: string;
  year: number; // Mapped from visited_at_year by API
  photos?: PhotoResponse[]; // Included in list endpoint
  created_at?: string;
  updated_at?: string;
}

export interface PhotoResponse {
  id: string;
  destination_id: string;
  full_url: string;
  thumb_url: string;
  blur_url: string | null;
  caption_en: string | null;
  caption_cs: string | null;
  sort_order: number;
  is_visible: number;
  created_at?: string;
}

export interface DestinationWithPhotos extends DestinationResponse {
  photos: PhotoResponse[];
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  message?: string;
}
