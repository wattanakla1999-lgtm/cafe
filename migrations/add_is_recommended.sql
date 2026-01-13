-- Add is_recommended column to menu_items table
-- This allows admin to mark items as recommended for customers

ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN menu_items.is_recommended IS 'Admin-configurable flag to mark menu items as recommended';
