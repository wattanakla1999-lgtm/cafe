-- Add receipt settings columns to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS tax_type TEXT DEFAULT 'none', -- 'none', 'include', 'exclude'
ADD COLUMN IF NOT EXISTS vat_rate NUMERIC DEFAULT 7.0;

-- Optional: Comment on columns
COMMENT ON COLUMN stores.address IS 'Store address for receipt header';
COMMENT ON COLUMN stores.tax_type IS 'Tax configuration: none, include, exclude';
COMMENT ON COLUMN stores.vat_rate IS 'VAT percentage rate (e.g. 7.0)';
