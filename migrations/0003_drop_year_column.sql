-- Migration: Drop legacy 'year' column from destinations
-- The column was renamed to 'visited_at_year' in the updated schema

DROP INDEX IF EXISTS idx_destinations_year;
ALTER TABLE destinations DROP COLUMN year;
