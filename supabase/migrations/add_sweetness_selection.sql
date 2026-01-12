-- Add sweetness selection control column to menu_items table
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS allow_sweetness_selection BOOLEAN DEFAULT false;

-- Update existing items to show sweetness by default (optional, can be set to false)
-- UPDATE public.menu_items SET allow_sweetness_selection = true WHERE category_id IN (SELECT id FROM categories WHERE name LIKE '%Coffee%' OR name LIKE '%กาแฟ%');
