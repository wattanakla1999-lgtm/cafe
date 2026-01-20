-- Create serving_types table
create table if not exists serving_types (
  id uuid default gen_random_uuid() primary key,
  store_id uuid references stores(id) on delete cascade not null,
  name text not null,
  price numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create toppings table
create table if not exists toppings (
  id uuid default gen_random_uuid() primary key,
  store_id uuid references stores(id) on delete cascade not null,
  name text not null,
  price numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index if not exists idx_serving_types_store on serving_types(store_id);
create index if not exists idx_toppings_store on toppings(store_id);

-- Enable RLS
alter table serving_types enable row level security;
alter table toppings enable row level security;

-- Policies for serving_types
create policy "Enable ALL for users based on store_id"
  on serving_types for all
  using (store_id in (select store_id from users where id = auth.uid()))
  with check (store_id in (select store_id from users where id = auth.uid()));

-- Policies for toppings
create policy "Enable ALL for users based on store_id"
  on toppings for all
  using (store_id in (select store_id from users where id = auth.uid()))
  with check (store_id in (select store_id from users where id = auth.uid()));
