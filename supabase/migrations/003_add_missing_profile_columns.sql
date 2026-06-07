-- ─────────────────────────────────────────────────────────────
-- Add missing columns to existing profiles table
--
-- Run this if you have an existing database and get errors
-- like "column 'fitness_level' does not exist" in the
-- Edit Profile screen.
--
-- These columns are already included in 000_full_schema.sql
-- for new projects. This migration patches existing tables.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fitness_level TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goals TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS equipment_preferences TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_freeze_used_week BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS starting_weight_kg NUMERIC(5,1);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Drop and recreate the updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_profiles_updated_at'
  ) THEN
    CREATE TRIGGER set_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;
