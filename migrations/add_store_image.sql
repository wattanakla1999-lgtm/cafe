-- Add store_image column to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS store_image TEXT;

COMMENT ON COLUMN stores.store_image IS 'URL of the store logo image';
