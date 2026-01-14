-- 1. Create global_menus table
CREATE TABLE IF NOT EXISTS global_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    image TEXT,
    suggested_price DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Seed Data (Café Categories)

-- Coffee (Hot/Iced base usually handled by options, but let's provide base items)
INSERT INTO global_menus (category, name, description, suggested_price, image) VALUES
('Coffee', 'Espresso', 'Rich and intense concentrated coffee shot.', 50.00, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=300&q=80'),
('Coffee', 'Americano', 'Espresso diluted with hot water. Intense but smooth.', 60.00, 'https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&w=300&q=80'),
('Coffee', 'Latte', 'Espresso with steamed milk and a light layer of foam.', 70.00, 'https://images.unsplash.com/photo-1570968992193-73db596637aa?auto=format&fit=crop&w=300&q=80'),
('Coffee', 'Cappuccino', 'Espresso with equal parts steamed milk and milk foam.', 70.00, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=300&q=80'),
('Coffee', 'Mocha', 'Espresso combined with chocolate syrup and steamed milk.', 80.00, 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=300&q=80'),
('Coffee', 'Caramel Macchiato', 'Espresso with vanilla syrup, steamed milk, and caramel drizzle.', 85.00, 'https://images.unsplash.com/photo-1485808191679-5f8c7c8f3194?auto=format&fit=crop&w=300&q=80'),
('Coffee', 'Dirty Coffee', 'Cold milk topped with a hot shot of robust espresso.', 90.00, 'https://media.istockphoto.com/id/1175373860/photo/dirty-coffee.jpg?s=612x612&w=0&k=20&c=L_qjXN8-a-T-y2K3zO8ayZ-v-z-X-x-x-x-x-x-x-x'),
('Coffee', 'Cold Brew', 'Coffee steeped in cold water for 12+ hours.', 90.00, 'https://images.unsplash.com/photo-1517701604599-bb29b5c5090c?auto=format&fit=crop&w=300&q=80');

-- Tea
INSERT INTO global_menus (category, name, description, suggested_price, image) VALUES
('Tea', 'Thai Tea', 'Classic Thai orange tea with condensed milk.', 60.00, 'https://images.unsplash.com/photo-1596710629160-b8f448c9735d?auto=format&fit=crop&w=300&q=80'),
('Tea', 'Green Tea Latte', 'Matcha green tea mixed with fresh milk.', 70.00, 'https://images.unsplash.com/photo-1515825838458-f2a94b20105a?auto=format&fit=crop&w=300&q=80'),
('Tea', 'Lemon Tea', 'Refreshing iced tea with a splash of lemon.', 55.00, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=300&q=80'),
('Tea', 'Peach Tea', 'Fragrant tea infused with sweet peach flavor.', 60.00, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=300&q=80'),
('Tea', 'Hojicha Latte', 'Roasted green tea latte with a nutty aroma.', 80.00, 'https://images.unsplash.com/photo-1515825838458-f2a94b20105a?auto=format&fit=crop&w=300&q=80');

-- Non-Coffee / Milk / Soda
INSERT INTO global_menus (category, name, description, suggested_price, image) VALUES
('Non-Coffee', 'Fresh Milk', 'Fresh steamed or chilled milk.', 50.00, 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=300&q=80'),
('Non-Coffee', 'Chocolate', 'Rich dark chocolate drink.', 70.00, 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=300&q=80'),
('Soda', 'Italian Soda (Strawberry)', 'Sparkling soda with strawberry syrup.', 55.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80'),
('Soda', 'Italian Soda (Blue Hawaii)', 'Refreshing blue soda mix.', 55.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80'),
('Soda', 'Lychee Soda', 'Fizzy soda with sweet lychee flavor.', 60.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80');

-- Bakery
INSERT INTO global_menus (category, name, description, suggested_price, image) VALUES
('Bakery', 'Plain Croissant', 'Buttery flaky croissant.', 65.00, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=300&q=80'),
('Bakery', 'Almond Croissant', 'Croissant topped with almond cream and slices.', 85.00, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80'),
('Bakery', 'Blueberry Cheesecake', 'Creamy cheesecake containing blueberries.', 110.00, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=300&q=80'),
('Bakery', 'Chocolate Cake', 'Rich and moist chocolate cake slice.', 95.00, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80'),
('Bakery', 'Brownie', 'Fudgy chocolate brownie.', 55.00, 'https://images.unsplash.com/photo-1564355808539-22a97c469d48?auto=format&fit=crop&w=300&q=80');
