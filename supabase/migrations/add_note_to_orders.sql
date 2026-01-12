-- Add note column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS note TEXT;
