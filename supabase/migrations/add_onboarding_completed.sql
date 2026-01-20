-- Add onboarding_completed column to stores table
-- Run this in Supabase SQL Editor

ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Optional: Add comment for documentation
COMMENT ON COLUMN stores.onboarding_completed IS 'Tracks whether user has seen the onboarding flow';
