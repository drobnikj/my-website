-- Migration: Add visited_at_year column to destinations
-- Adds the missing column that was introduced in the updated initial schema

ALTER TABLE destinations ADD COLUMN visited_at_year INTEGER NOT NULL DEFAULT 0;
