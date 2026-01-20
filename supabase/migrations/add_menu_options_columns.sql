-- Add columns for menu options
alter table menu_items 
add column if not exists allowed_toppings text[] default '{}',
add column if not exists allow_type_selection boolean default false,
add column if not exists allow_bean_selection boolean default false,
add column if not exists allow_sweetness_selection boolean default false;
