-- =================================================================
-- ||      ULTIMATE RELATIONAL DATABASE SCHEMA (18 TABLES)        ||
-- ||      Covers ALL App Pages & Features                        ||
-- =================================================================

-- 0. Users Table (NEW)
create table if not exists public.users (
  phone text primary key,
  full_name text,
  password text,
  email text unique,
  is_admin boolean default false,
  is_banned boolean default false,
  join_date text,
  stores jsonb,
  sites jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1. Main Store Data
create table if not exists public.stores_data (
  id text primary key,
  name text,
  specialization text,
  language text,
  currency text,
  url text,
  creation_date text,
  settings jsonb default '{}',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Products
create table if not exists public.products (
  id text primary key,
  store_id text not null references public.stores_data(id) on delete cascade,
  name text,
  sku text,
  price numeric,
  stock_quantity integer,
  details jsonb default '{}',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Orders
create table if not exists public.orders (
  id text primary key,
  store_id text not null references public.stores_data(id) on delete cascade,
  order_number text,
  customer_name text,
  status text,
  total_price numeric,
  date timestamp with time zone,
  details jsonb default '{}',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Transactions
create table if not exists public.transactions (
  id text primary key,
  store_id text not null references public.stores_data(id) on delete cascade,
  type text,
  amount numeric,
  date timestamp with time zone,
  category text,
  note text,
  details jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Suppliers
create table if not exists public.suppliers (
  id text primary key,
  store_id text not null references public.stores_data(id) on delete cascade,
  name text,
  phone text,
  address text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Supply Orders
create table if not exists public.supply_orders (
  id text primary key,
  store_id text not null references public.stores_data(id) on delete cascade,
  supplier_id text,
  total_cost numeric,
  date timestamp with time zone,
  items jsonb default '[]',
  status text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. Reviews
create table if not exists public.reviews (
  id text primary key,
  store_id text not null references public.stores_data(id) on delete cascade,
  product_id text,
  customer_name text,
  rating integer,
  comment text,
  status text,
  date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 8. Abandoned Carts
create table if not exists public.abandoned_carts (
  id text primary key,
  store_id text not null references public.stores_data(id) on delete cascade,
  customer_name text,
  customer_phone text,
  total_value numeric,
  date timestamp with time zone,
  items jsonb default '[]',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 9. Activity Logs
create table if not exists public.activity_logs (
  id text primary key,
  store_id text not null references public.stores_data(id) on delete cascade,
  "user" text,
  action text,
  details text,
  timestamp bigint,
  date text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 10. Customers
create table if not exists public.customers (
  id text primary key,
  store_id text not null references public.stores_data(id) on delete cascade,
  name text,
  phone text,
  address text,
  loyalty_points integer default 0,
  total_spent numeric default 0,
  orders_count integer default 0,
  first_order_date timestamp with time zone,
  last_order_date timestamp with time zone,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 11. Employees
create table if not exists public.employees (
  id text primary key,
  store_id text not null references public.stores_data(id) on delete cascade,
  name text,
  email text,
  phone text,
  permissions jsonb default '[]',
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 12. Discount Codes
create table if not exists public.discount_codes (
  id text primary key,
  store_id text not null references public.stores_data(id) on delete cascade,
  code text,
  type text,
  value numeric,
  active boolean default true,
  usage_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 13. Collections
create table if not exists public.collections (
  id text primary key,
  store_id text not null references public.stores_data(id) on delete cascade,
  name text,
  description text,
  image text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 14. Custom Pages
create table if not exists public.custom_pages (
  id text primary key,
  store_id text not null references public.stores_data(id) on delete cascade,
  title text,
  slug text,
  content text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 15. Payment Methods
create table if not exists public.payment_methods (
  id text primary key,
  store_id text not null references public.stores_data(id) on delete cascade,
  name text,
  details text,
  instructions text,
  type text,
  active boolean default true,
  logo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 16. Global Options (New)
create table if not exists public.global_options (
  id text primary key,
  store_id text not null references public.stores_data(id) on delete cascade,
  name text,
  "values" text[],
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 17. Shipping Integrations (New)
create table if not exists public.shipping_integrations (
  id text primary key,
  store_id text not null references public.stores_data(id) on delete cascade,
  provider text,
  api_key text,
  api_secret text,
  account_number text,
  is_connected boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 18. Chat Messages (New)
create table if not exists public.chat_messages (
  id bigint generated by default as identity primary key,
  store_id text not null references public.stores_data(id) on delete cascade,
  sender_id text not null,
  receiver_id text not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for ALL tables
alter table public.users enable row level security;
alter table public.stores_data enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.transactions enable row level security;
alter table public.suppliers enable row level security;
alter table public.supply_orders enable row level security;
alter table public.reviews enable row level security;
alter table public.abandoned_carts enable row level security;
alter table public.activity_logs enable row level security;
alter table public.customers enable row level security;
alter table public.employees enable row level security;
alter table public.discount_codes enable row level security;
alter table public.collections enable row level security;
alter table public.custom_pages enable row level security;
alter table public.payment_methods enable row level security;
alter table public.global_options enable row level security;
alter table public.shipping_integrations enable row level security;
alter table public.chat_messages enable row level security;

-- Cleanup policies
drop policy if exists "Public Access" on public.users;
drop policy if exists "Public Access" on public.stores_data;
drop policy if exists "Public Access" on public.products;
-- (Repeat for all if needed, omitted for brevity as 'create policy' handles new)

-- Create permissive policies
create policy "Public Access Users" on public.users for all using (true) with check (true);
create policy "Public Access Stores" on public.stores_data for all using (true) with check (true);
create policy "Public Access Products" on public.products for all using (true) with check (true);
create policy "Public Access Orders" on public.orders for all using (true) with check (true);
create policy "Public Access Transactions" on public.transactions for all using (true) with check (true);
create policy "Public Access Suppliers" on public.suppliers for all using (true) with check (true);
create policy "Public Access SupplyOrders" on public.supply_orders for all using (true) with check (true);
create policy "Public Access Reviews" on public.reviews for all using (true) with check (true);
create policy "Public Access AbandonedCarts" on public.abandoned_carts for all using (true) with check (true);
create policy "Public Access ActivityLogs" on public.activity_logs for all using (true) with check (true);
create policy "Public Access Customers" on public.customers for all using (true) with check (true);
create policy "Public Access Employees" on public.employees for all using (true) with check (true);
create policy "Public Access DiscountCodes" on public.discount_codes for all using (true) with check (true);
create policy "Public Access Collections" on public.collections for all using (true) with check (true);
create policy "Public Access CustomPages" on public.custom_pages for all using (true) with check (true);
create policy "Public Access PaymentMethods" on public.payment_methods for all using (true) with check (true);
create policy "Public Access GlobalOptions" on public.global_options for all using (true) with check (true);
create policy "Public Access ShippingInt" on public.shipping_integrations for all using (true) with check (true);
create policy "Public Access Chat" on public.chat_messages for all using (true) with check (true);

-- Grant permissions
grant all on table public.users, public.stores_data, public.products, public.orders, public.transactions, public.suppliers, public.supply_orders, public.reviews, public.abandoned_carts, public.activity_logs, public.customers, public.employees, public.discount_codes, public.collections, public.custom_pages, public.payment_methods, public.global_options, public.shipping_integrations, public.chat_messages to anon, authenticated, service_role;

-- Enable Realtime for Chat
alter publication supabase_realtime add table public.chat_messages;

-- Reload Schema
NOTIFY pgrst, 'reload schema';