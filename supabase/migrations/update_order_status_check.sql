-- Drop existing check constraint if it exists (name might vary, so we try a common name or rely on the fact that we can just replace the check)
-- However, safe way is to drop constraint by name if known. Assuming 'orders_status_check'.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new check constraint with all statuses
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'cooking', 'ready', 'completed', 'cancelled'));
