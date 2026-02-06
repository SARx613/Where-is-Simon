-- ==============================================================================
-- SCRIPT DE RÉINITIALISATION COMPLÈTE (FULL_RESET_DB.sql)
-- ATTENTION : CE SCRIPT SUPPRIME TOUTES LES DONNÉES EXISTANTES POUR REPARTIR À ZÉRO
-- ==============================================================================

BEGIN;

-- 1. Nettoyage (DROP)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.match_face_photos_v2(vector, float, int, uuid);
drop function if exists public.create_event_v3(text, text, date, text, text, text);
drop function if exists public.create_event(text, text, date, text, text, text);
drop function if exists public.create_event(text, text, date, text, text, event_tier);

drop table if exists public.guestbook_entries cascade;
drop table if exists public.photo_reports cascade;
drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.photo_faces cascade;
drop table if exists public.photos cascade;
drop table if exists public.events cascade;
drop table if exists public.profiles cascade;
drop table if exists public.notifications cascade;

drop type if exists public.app_role;
drop type if exists public.event_tier;

-- 2. Extensions
create extension if not exists vector;

-- 3. Types
create type public.app_role as enum ('admin', 'photographer', 'owner', 'guest');
create type public.event_tier as enum ('starter', 'pro', 'premium');

-- 4. Tables

-- PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  website text,
  role public.app_role default 'photographer'::public.app_role
);

-- EVENTS
create table public.events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  photographer_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  date date not null,
  location text,
  cover_url text,
  description text,
  tier public.event_tier default 'starter'::public.event_tier,
  is_public boolean default false,
  status text default 'draft',
  watermark_enabled boolean default true,
  download_enabled boolean default false
);

-- PHOTOS
create table public.photos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  event_id uuid references public.events(id) on delete cascade not null,
  url text not null,
  thumbnail_url text,
  width integer,
  height integer,
  original_name text,
  is_hidden boolean default false
);

-- PHOTO FACES (Embeddings)
create table public.photo_faces (
  id uuid default gen_random_uuid() primary key,
  photo_id uuid references public.photos(id) on delete cascade not null,
  embedding vector(128) not null,
  box_x integer,
  box_y integer,
  box_width integer,
  box_height integer
);

-- NOTIFICATIONS (New)
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  message text not null,
  is_read boolean default false
);

-- GUESTBOOK
create table public.guestbook_entries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  event_id uuid references public.events(id) on delete cascade not null,
  photo_id uuid references public.photos(id) on delete set null,
  author_name text not null,
  message text,
  audio_url text,
  is_approved boolean default true
);

-- ORDERS (Placeholder for Stripe)
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  event_id uuid references public.events(id),
  customer_email text,
  total_amount integer,
  status text default 'pending'
);

-- 5. Row Level Security (RLS)

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.photos enable row level security;
alter table public.photo_faces enable row level security;
alter table public.notifications enable row level security;

-- Policies PROFILES
create policy "Public profiles are viewable by everyone." on public.profiles for select using ( true );
create policy "Users can update own profile." on public.profiles for update using ( auth.uid() = id );
create policy "Users can insert own profile." on public.profiles for insert with check ( auth.uid() = id );

-- Policies EVENTS
create policy "Photographers can CRUD own events" on public.events for all using ( auth.uid() = photographer_id );
create policy "Public viewable events" on public.events for select using ( true ); -- Simplified for Join page

-- Policies PHOTOS
create policy "Photographers can CRUD own photos" on public.photos for all using (
  exists ( select 1 from public.events where events.id = photos.event_id and events.photographer_id = auth.uid() )
);
create policy "Public read photos" on public.photos for select using ( true ); -- Access controlled by UI/Logic

-- Policies PHOTO FACES
create policy "Public read faces" on public.photo_faces for select using ( true );
create policy "Photographers insert faces" on public.photo_faces for insert with check (
  exists ( select 1 from public.photos join public.events on photos.event_id = events.id where photos.id = photo_faces.photo_id and events.photographer_id = auth.uid() )
);

-- 6. Fonctions RPC

-- CREATE EVENT (V3 - Fix PGRST205/202)
create or replace function public.create_event_v3(
  name text,
  slug text,
  date date,
  location text,
  description text,
  tier text
)
returns json
language plpgsql
security definer
as $$
declare
  new_event_id uuid;
begin
  insert into public.events (photographer_id, name, slug, date, location, description, tier)
  values (auth.uid(), name, slug, date, location, description, tier::public.event_tier)
  returning id into new_event_id;
  return json_build_object('id', new_event_id);
end;
$$;

-- MATCH FACES
create or replace function public.match_face_photos_v2 (
  query_embedding vector(128),
  match_threshold float,
  match_count int,
  filter_event_id uuid
)
returns table (
  id uuid,
  url text,
  similarity float
)
language plpgsql
security definer
as $$
begin
  return query
  select distinct on (photos.id)
    photos.id,
    photos.url,
    1 - (photo_faces.embedding <=> query_embedding) as similarity
  from public.photo_faces
  join public.photos on photos.id = photo_faces.photo_id
  where 1 - (photo_faces.embedding <=> query_embedding) > match_threshold
  and photos.event_id = filter_event_id
  order by photos.id, (1 - (photo_faces.embedding <=> query_embedding)) desc
  limit match_count;
end;
$$;

-- 7. Triggers

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'photographer')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. Permissions (Grant All)

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all functions in schema public to postgres, anon, authenticated, service_role;

-- 9. Storage Buckets (Idempotent)
insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict do nothing;
create policy "Public Access" on storage.objects for select using ( bucket_id = 'photos' );
create policy "Auth Upload" on storage.objects for insert with check ( bucket_id = 'photos' and auth.role() = 'authenticated' );

-- 10. Reload Cache
NOTIFY pgrst, 'reload schema';

COMMIT;
