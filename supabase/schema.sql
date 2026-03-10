-- ============================================================
-- Pantry App — Supabase Schema
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- Households (shared pantry groups)
create table if not exists households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  created_at  timestamptz default now()
);

-- User profiles (extends Supabase auth.users)
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  household_id  uuid references households(id) on delete set null,
  display_name  text,
  created_at    timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Pantry items
create table if not exists pantry_items (
  id               uuid primary key default gen_random_uuid(),
  household_id     uuid references households(id) on delete cascade not null,
  barcode          text,
  name             text not null,
  brand            text,
  image_url        text,
  unit_type        text check (unit_type in ('weight', 'volume', 'count')) not null,
  unit             text not null,  -- 'g','kg','ml','L','units'
  quantity         numeric not null default 0 check (quantity >= 0),
  initial_quantity numeric not null check (initial_quantity > 0),
  expiry_date      date,
  added_by         uuid references auth.users(id) on delete set null,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Usage log
create table if not exists usage_log (
  id            uuid primary key default gen_random_uuid(),
  item_id       uuid references pantry_items(id) on delete cascade not null,
  quantity_used numeric not null check (quantity_used > 0),
  used_by       uuid references auth.users(id) on delete set null,
  used_at       timestamptz default now()
);

-- Auto-update updated_at on pantry_items
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pantry_items_updated_at on pantry_items;
create trigger pantry_items_updated_at
  before update on pantry_items
  for each row execute function update_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table households    enable row level security;
alter table profiles      enable row level security;
alter table pantry_items  enable row level security;
alter table usage_log     enable row level security;

-- Profiles: users can only see/edit their own
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Households: members can see their household
create policy "households_select_member" on households for select
  using (id in (select household_id from profiles where id = auth.uid()));
create policy "households_insert_any" on households for insert with check (true);
create policy "households_update_member" on households for update
  using (id in (select household_id from profiles where id = auth.uid()));

-- Pantry items: household members only
create policy "pantry_select" on pantry_items for select
  using (household_id in (select household_id from profiles where id = auth.uid()));
create policy "pantry_insert" on pantry_items for insert
  with check (household_id in (select household_id from profiles where id = auth.uid()));
create policy "pantry_update" on pantry_items for update
  using (household_id in (select household_id from profiles where id = auth.uid()));
create policy "pantry_delete" on pantry_items for delete
  using (household_id in (select household_id from profiles where id = auth.uid()));

-- Usage log: household members only
create policy "usage_select" on usage_log for select
  using (item_id in (select id from pantry_items where household_id in
    (select household_id from profiles where id = auth.uid())));
create policy "usage_insert" on usage_log for insert
  with check (item_id in (select id from pantry_items where household_id in
    (select household_id from profiles where id = auth.uid())));
