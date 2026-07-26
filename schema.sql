-- ===================================================
-- SQL Script for Cafe Management System (Supabase PostgreSQL)
-- ===================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE TABLES
-- ---------------------------------------------------

-- 2.1 Stores Table (ข้อมูลร้านค้า)
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    tax_type TEXT DEFAULT 'none' CHECK (tax_type IN ('none', 'include', 'exclude')),
    vat_rate NUMERIC(5,2) DEFAULT 7.00,
    store_image TEXT,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Categories Table (หมวดหมู่สินค้า)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Menu Items Table (รายการเมนู)
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    image TEXT,
    available BOOLEAN DEFAULT true,
    is_recommended BOOLEAN DEFAULT false,
    allowed_toppings TEXT[] DEFAULT '{}',
    allow_type_selection BOOLEAN DEFAULT false,
    allow_bean_selection BOOLEAN DEFAULT false,
    allow_sweetness_selection BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 Serving Types Table (ประเภทการเสิร์ฟ เช่น ร้อน, เย็น, ปั่น)
CREATE TABLE IF NOT EXISTS public.serving_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 Toppings Table (ท็อปปิ้ง)
CREATE TABLE IF NOT EXISTS public.toppings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 Discounts Table (ส่วนลด)
CREATE TABLE IF NOT EXISTS public.discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('percent', 'amount')),
    value NUMERIC(10,2) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.7 Global Menus Table (คลังเมนูกลาง)
CREATE TABLE IF NOT EXISTS public.global_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    suggested_price NUMERIC(10,2) NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.8 Orders Table (ออเดอร์/การสั่งซื้อ)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_name TEXT,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount_info JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'cooking', 'preparing', 'ready', 'completed', 'cancelled')),
    channel TEXT DEFAULT 'Counter' CHECK (channel IN ('QR', 'Counter')),
    payment_method TEXT DEFAULT 'Cash',
    cancel_reason TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure optional columns and updated status constraints exist if table was created previously
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Cash';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'cooking', 'preparing', 'ready', 'completed', 'cancelled'));

-- 2.9 Order Items Table (รายการสินค้าภายในออเดอร์)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    options JSONB,
    total_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES FOR PERFORMANCE
-- ---------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON public.categories(store_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_store_id ON public.menu_items(store_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_serving_types_store_id ON public.serving_types(store_id);
CREATE INDEX IF NOT EXISTS idx_toppings_store_id ON public.toppings(store_id);
CREATE INDEX IF NOT EXISTS idx_discounts_store_id ON public.discounts(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ---------------------------------------------------
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serving_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toppings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to global_menus" ON public.global_menus;
CREATE POLICY "Allow public read access to global_menus" ON public.global_menus FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all for stores" ON public.stores;
CREATE POLICY "Allow all for stores" ON public.stores FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for categories" ON public.categories;
CREATE POLICY "Allow all for categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for menu_items" ON public.menu_items;
CREATE POLICY "Allow all for menu_items" ON public.menu_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for serving_types" ON public.serving_types;
CREATE POLICY "Allow all for serving_types" ON public.serving_types FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for toppings" ON public.toppings;
CREATE POLICY "Allow all for toppings" ON public.toppings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for discounts" ON public.discounts;
CREATE POLICY "Allow all for discounts" ON public.discounts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for orders" ON public.orders;
CREATE POLICY "Allow all for orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for order_items" ON public.order_items;
CREATE POLICY "Allow all for order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

-- 5. AUTOMATIC STORE CREATION TRIGGER
-- ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.stores (user_id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'store_name', 'My Cafe')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. INITIAL SEED DATA (ข้อมูลตั้งต้น)
-- ---------------------------------------------------
TRUNCATE TABLE public.global_menus RESTART IDENTITY;

INSERT INTO public.global_menus (name, suggested_price, category, description, image) VALUES
('Iced Americano', 60.00, 'Coffee', 'Rich espresso with cold water', 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=500&q=60'),
('Iced Latte', 70.00, 'Coffee', 'Espresso with fresh milk', 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=500&q=60'),
('Cappuccino', 70.00, 'Cappuccino', 'Espresso with foamed milk', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=500&q=60'),
('Mocha', 75.00, 'Coffee', 'Espresso with chocolate and milk', 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=500&q=60'),
('Caramel Macchiato', 80.00, 'Coffee', 'Vanilla, milk, espresso and caramel', 'https://images.unsplash.com/photo-1485808191679-5f8c7c8606f8?auto=format&fit=crop&w=500&q=60'),
('Thai Tea', 60.00, 'Non-Coffee', 'Authentic Thai tea', 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&w=500&q=60'),
('Green Tea Latte', 65.00, 'Non-Coffee', 'Premium Matcha', 'https://images.unsplash.com/photo-1515823064-db61f6a2e6d7?auto=format&fit=crop&w=500&q=60'),
('Cocoa', 60.00, 'Non-Coffee', 'Rich cocoa', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=500&q=60'),
('Red Soda Lime', 50.00, 'Soda', 'Refreshing red soda with lime', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=60'),
('Honey Lemon Soda', 55.00, 'Soda', 'Honey lemon soda drink', 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=500&q=60');

-- 7. SUPABASE STORAGE BUCKET FOR IMAGES
-- ---------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Read Access for menu-images" ON storage.objects;
CREATE POLICY "Public Read Access for menu-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Public Upload Access for menu-images" ON storage.objects;
CREATE POLICY "Public Upload Access for menu-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Public Update Access for menu-images" ON storage.objects;
CREATE POLICY "Public Update Access for menu-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Public Delete Access for menu-images" ON storage.objects;
CREATE POLICY "Public Delete Access for menu-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'menu-images');

-- 8. ENABLE REALTIME ON ORDERS TABLE
-- ---------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
