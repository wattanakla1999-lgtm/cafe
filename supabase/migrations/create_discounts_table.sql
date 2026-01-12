-- Create discounts table
CREATE TABLE IF NOT EXISTS public.discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  value NUMERIC NOT NULL CHECK (value >= 0),
  type TEXT NOT NULL CHECK (type IN ('percent', 'amount')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries by store
CREATE INDEX IF NOT EXISTS idx_discounts_store_id ON public.discounts(store_id);

-- Enable RLS
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see discounts for their own store
CREATE POLICY "Users can view their store discounts"
  ON public.discounts
  FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert discounts for their own store
CREATE POLICY "Users can insert their store discounts"
  ON public.discounts
  FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their store discounts
CREATE POLICY "Users can update their store discounts"
  ON public.discounts
  FOR UPDATE
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their store discounts
CREATE POLICY "Users can delete their store discounts"
  ON public.discounts
  FOR DELETE
  USING (
    store_id IN (
      SELECT id FROM public.stores WHERE user_id = auth.uid()
    )
  );
