-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  updated_at timestamp with time zone
);

-- Asset Types Enum
create type asset_type as enum ('stock', 'etf', 'cash', 'crypto', 'gold');

-- Assets Table
create table assets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  type asset_type not null,
  name text not null,        -- e.g. "Bitcoin", "BCA", "USD Cash"
  ticker text,               -- e.g. "BTC", "BBCA.JK" (optional for cash)
  quantity numeric not null default 0,
  manual_price_idr numeric,  -- For manually updated assets
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;
alter table assets enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

create policy "Users can view own assets" on assets
  for select using (auth.uid() = user_id);

create policy "Users can insert own assets" on assets
  for insert with check (auth.uid() = user_id);

create policy "Users can update own assets" on assets
  for update using (auth.uid() = user_id);

create policy "Users can delete own assets" on assets
  for delete using (auth.uid() = user_id);
