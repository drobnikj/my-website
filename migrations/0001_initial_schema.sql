-- Migration: Initial schema for destinations and photos
-- Created: 2026-03-05

CREATE TABLE IF NOT EXISTS destinations (
  id TEXT PRIMARY KEY NOT NULL,
  name_en TEXT NOT NULL,
  name_cs TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_cs TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  continent TEXT NOT NULL,
  visited_at_year INTEGER NOT NULL,
  visited_from DATETIME,
  visited_to DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY NOT NULL,
  destination_id TEXT NOT NULL,
  full_url TEXT NOT NULL,
  thumb_url TEXT NOT NULL,
  blur_url TEXT,
  caption_en TEXT,
  caption_cs TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
);

-- Indexes for efficient lookups
CREATE INDEX idx_photos_destination ON photos(destination_id);
CREATE INDEX idx_photos_visible ON photos(is_visible);
CREATE INDEX idx_destinations_year ON destinations(visited_at_year);
CREATE INDEX idx_destinations_continent ON destinations(continent);
