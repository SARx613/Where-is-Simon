-- Enable pgvector extension for face embeddings
create extension if not exists vector;

-- Enums
create type app_role as enum ('admin', 'photographer', 'owner', 'guest');
create type event_tier as enum ('starter', 'pro', 'premium');

-- Profiles (Users)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  role app_role default 'guest'::app_role,

  constraint username_length check (char_length(username) >= 3)
);

-- Events
create table events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  photographer_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  date date not null,
  location text,
  cover_url text,
  description text,
  tier event_tier default 'starter'::event_tier,
  is_public boolean default false,
  status text default 'draft', -- draft, published, archived

  -- Settings based on tier
  watermark_enabled boolean default true,
  download_enabled boolean default false,

  owner_id uuid references profiles(id) -- The client (e.g. the married couple)
);

-- Photos
create table photos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  event_id uuid references events(id) on delete cascade not null,
  url text not null,
  thumbnail_url text,
  width integer,
  height integer,

  -- Face Recognition Data
  -- face-api.js generates 128-dimensional vectors
  embedding vector(128),

  -- Metadata
  original_name text,
  is_hidden boolean default false
);

-- Row Level Security (RLS)

alter table profiles enable row level security;
alter table events enable row level security;
alter table photos enable row level security;

-- Policies

-- Profiles:
-- Public read access to profiles (needed for showing photographer info)
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
-- Users can update own profile
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

-- Events:
-- Photographers can do everything on their own events
create policy "Photographers can CRUD own events" on events for all using ( auth.uid() = photographer_id );
-- Public read access if is_public is true
create policy "Public events are viewable" on events for select using ( is_public = true );
-- Owner can read/update their event
create policy "Owner can read own event" on events for select using ( auth.uid() = owner_id );

-- Photos:
-- Photographers can CRUD photos in their events
create policy "Photographers can CRUD own photos" on photos for all using (
  exists ( select 1 from events where events.id = photos.event_id and events.photographer_id = auth.uid() )
);
-- Everyone can read photos if event is public (filtered by UI for matching, but RLS allows read to match)
-- Note: Ideally for privacy, we only return photos that MATCH the user's vector.
-- But logic is complex in RLS. For MVP, we allow read if event is public or user is owner.
create policy "Public read photos" on photos for select using (
  exists ( select 1 from events where events.id = photos.event_id and events.is_public = true )
);

-- Storage (Bucket) Setup (Conceptual - run in dashboard)
-- insert into storage.buckets (id, name) values ('photos', 'photos');
-- insert into storage.buckets (id, name) values ('avatars', 'avatars');

-- Match Faces Function
create or replace function match_face_photos (
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
as $$
begin
  return query
  select
    photos.id,
    photos.url,
    1 - (photos.embedding <=> query_embedding) as similarity
  from photos
  where 1 - (photos.embedding <=> query_embedding) > match_threshold
  and photos.event_id = filter_event_id
  order by photos.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- EXPERIMENTAL FEATURES (Added based on user feedback)

-- Guestbook
create table guestbook_entries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  event_id uuid references events(id) on delete cascade not null,
  photo_id uuid references photos(id) on delete set null,
  author_name text not null,
  message text,
  audio_url text,
  is_approved boolean default true
);

-- Privacy Reports
create table photo_reports (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  photo_id uuid references photos(id) on delete cascade not null,
  reporter_email text,
  reason text,
  status text default 'pending'
);

-- Orders
create table orders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  event_id uuid references events(id) not null,
  customer_email text not null,
  total_amount integer not null,
  status text default 'pending',
  stripe_session_id text
);

create table order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  photo_id uuid references photos(id) not null,
  product_type text not null,
  quantity integer default 1,
  price integer not null
);

-- RLS
alter table guestbook_entries enable row level security;
alter table photo_reports enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Policies (Simplified for MVP)
create policy "Public read guestbook" on guestbook_entries for select using ( true );
create policy "Public create guestbook" on guestbook_entries for insert with check ( true );

create policy "Public create report" on photo_reports for insert with check ( true );

create policy "Photographer view orders" on orders for select using (
   exists ( select 1 from events where events.id = orders.event_id and events.photographer_id = auth.uid() )
);

-- REVISION: Support multiple faces per photo
create table photo_faces (
  id uuid default gen_random_uuid() primary key,
  photo_id uuid references photos(id) on delete cascade not null,
  embedding vector(128) not null,
  -- Bounding box for the face
  box_x integer,
  box_y integer,
  box_width integer,
  box_height integer
);

-- Note: We are not dropping 'embedding' from 'photos' to avoid breaking previous scripts,
-- but we will use 'photo_faces' for the main logic.

alter table photo_faces enable row level security;

create policy "Public read photo faces" on photo_faces for select using (
  exists ( select 1 from photos join events on photos.event_id = events.id where photos.id = photo_faces.photo_id and events.is_public = true )
);

create policy "Photographer CRUD photo faces" on photo_faces for all using (
  exists ( select 1 from photos join events on photos.event_id = events.id where photos.id = photo_faces.photo_id and events.photographer_id = auth.uid() )
);

-- Updated Match Function to use photo_faces
create or replace function match_face_photos_v2 (
  query_embedding vector(128),
  match_threshold float,
  match_count int,
  filter_event_id uuid
)
returns table (
  id uuid, -- photo id
  url text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select distinct on (photos.id)
    photos.id,
    photos.url,
    1 - (photo_faces.embedding <=> query_embedding) as similarity
  from photo_faces
  join photos on photos.id = photo_faces.photo_id
  where 1 - (photo_faces.embedding <=> query_embedding) > match_threshold
  and photos.event_id = filter_event_id
  order by photos.id, (1 - (photo_faces.embedding <=> query_embedding)) desc
  limit match_count;
end;
$$;

-- Storage Setup
insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict do nothing;

create policy "Photographer upload" on storage.objects for insert with check ( bucket_id = 'photos' and auth.role() = 'authenticated' );
create policy "Public view" on storage.objects for select using ( bucket_id = 'photos' );

-- FIX: Add SECURITY DEFINER to match function to allow finding photos in private events
create or replace function match_face_photos_v2 (
  query_embedding vector(128),
  match_threshold float,
  match_count int,
  filter_event_id uuid
)
returns table (
  id uuid, -- photo id
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
  from photo_faces
  join photos on photos.id = photo_faces.photo_id
  where 1 - (photo_faces.embedding <=> query_embedding) > match_threshold
  and photos.event_id = filter_event_id
  order by photos.id, (1 - (photo_faces.embedding <=> query_embedding)) desc
  limit match_count;
end;
$$;

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'photographer'); -- Default to photographer for this SaaS
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid error on replay
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- REFRESH SCHEMA CACHE & PERMISSIONS FIX
NOTIFY pgrst, 'reload schema';

-- Grant permissions explicitly to ensure PostgREST can see tables
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all functions in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all sequences in schema public to postgres, anon, authenticated, service_role;

-- Ensure RLS is enabled but allows access via policies
alter table events enable row level security;
alter table profiles enable row level security;
alter table photos enable row level security;

-- Force trigger creation again just in case
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SUPER FORCE RELOAD & PERMISSIONS
-- This is a nuclear option to fix PGRST205
begin;

-- Grant usage on schema
grant usage on schema public to postgres, anon, authenticated, service_role;

-- Grant all on tables
grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;

-- Grant all on sequences (for IDs)
grant all privileges on all sequences in schema public to postgres, anon, authenticated, service_role;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

commit;

-- Ensure insert policy is correct for events
drop policy if exists "Photographers can CRUD own events" on events;
create policy "Photographers can CRUD own events" on events for all using ( auth.uid() = photographer_id ) with check ( auth.uid() = photographer_id );

-- RPC to bypass PGRST205 on insert
create or replace function create_event(
  name text,
  slug text,
  date date,
  location text,
  description text,
  tier event_tier
)
returns json
language plpgsql
security definer
as $$
declare
  new_event_id uuid;
begin
  insert into events (photographer_id, name, slug, date, location, description, tier)
  values (auth.uid(), name, slug, date, location, description, tier)
  returning id into new_event_id;

  return json_build_object('id', new_event_id);
end;
$$;
