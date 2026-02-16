-- Canonical reset-safe schema for Where is Simon.
-- This migration is the single source of truth for a fresh environment.

begin;

-- Extensions
create extension if not exists vector;

-- Clean previous objects for reset installs
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.match_face_photos_v2(vector, float, int, uuid);
drop function if exists public.create_event_v3(text, text, text, text, text, text);
drop function if exists public.update_updated_at_column();

drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.notifications cascade;
drop table if exists public.photo_likes cascade;
drop table if exists public.photo_reports cascade;
drop table if exists public.guestbook_entries cascade;
drop table if exists public.photo_faces cascade;
drop table if exists public.photos cascade;
drop table if exists public.events cascade;
drop table if exists public.profiles cascade;

drop type if exists public.order_status cascade;
drop type if exists public.report_status cascade;
drop type if exists public.photo_status cascade;
drop type if exists public.event_tier cascade;
drop type if exists public.app_role cascade;

-- Types
create type public.app_role as enum ('admin', 'photographer', 'owner', 'guest');
create type public.event_tier as enum ('starter', 'pro', 'premium');
create type public.photo_status as enum ('uploading', 'processing', 'ready', 'error');
create type public.order_status as enum ('pending', 'paid', 'failed', 'refunded');
create type public.report_status as enum ('pending', 'reviewed', 'resolved', 'dismissed');

-- Tables
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  role public.app_role not null default 'photographer',
  constraint username_length check (username is null or char_length(username) >= 3),
  constraint username_format check (username is null or username ~ '^[a-z0-9_-]+$')
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  photographer_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  slug text not null unique,
  date date not null,
  location text,
  cover_url text,
  description text,
  tier public.event_tier not null default 'starter',
  is_public boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  watermark_enabled boolean not null default true,
  watermark_text text default 'Where is Simon?',
  watermark_opacity float default 0.5 check (watermark_opacity >= 0 and watermark_opacity <= 1),
  download_enabled boolean not null default false,
  enable_guestbook boolean not null default true,
  enable_privacy_mode boolean not null default true,
  enable_downloads boolean not null default false,
  price_per_photo integer default 0 check (price_per_photo >= 0),
  currency text default 'eur' check (currency in ('eur', 'usd', 'gbp')),
  constraint slug_format check (slug ~ '^[a-z0-9-]+$')
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default timezone('utc', now()),
  event_id uuid not null references public.events(id) on delete cascade,
  url text not null,
  thumbnail_url text,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  original_name text,
  is_hidden boolean not null default false,
  status public.photo_status not null default 'processing'
);

create table public.photo_faces (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(id) on delete cascade,
  embedding vector(128) not null,
  box_x integer,
  box_y integer,
  box_width integer check (box_width is null or box_width > 0),
  box_height integer check (box_height is null or box_height > 0),
  confidence float check (confidence is null or (confidence >= 0 and confidence <= 1))
);

create table public.guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default timezone('utc', now()),
  event_id uuid not null references public.events(id) on delete cascade,
  photo_id uuid references public.photos(id) on delete set null,
  author_name text not null check (char_length(author_name) between 1 and 100),
  author_email text,
  message text check (message is null or char_length(message) <= 1000),
  audio_url text,
  is_approved boolean not null default true
);

create table public.photo_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default timezone('utc', now()),
  photo_id uuid not null references public.photos(id) on delete cascade,
  reporter_email text not null,
  reason text not null check (char_length(reason) >= 10),
  status public.report_status not null default 'pending'
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default timezone('utc', now()),
  event_id uuid not null references public.events(id) on delete restrict,
  customer_email text not null,
  total_amount integer not null check (total_amount >= 0),
  status public.order_status not null default 'pending',
  stripe_session_id text unique
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete restrict,
  product_type text not null check (product_type in ('digital', 'print', 'album')),
  quantity integer not null default 1 check (quantity > 0),
  price integer not null check (price >= 0)
);

create table public.photo_likes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default timezone('utc', now()),
  photo_id uuid not null references public.photos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  unique (photo_id, user_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default timezone('utc', now()),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) <= 200),
  message text not null check (char_length(message) <= 1000),
  is_read boolean not null default false,
  read_at timestamp with time zone
);

-- Indexes
create index idx_events_photographer_id on public.events(photographer_id);
create index idx_events_owner_id on public.events(owner_id) where owner_id is not null;
create index idx_events_is_public on public.events(is_public) where is_public = true;
create index idx_photos_event_id on public.photos(event_id);
create index idx_photos_status on public.photos(status);
create index idx_photo_faces_photo_id on public.photo_faces(photo_id);
create index idx_orders_event_id on public.orders(event_id);
create index idx_order_items_order_id on public.order_items(order_id);
create index idx_photo_likes_user_id on public.photo_likes(user_id);
create index idx_notifications_user_id on public.notifications(user_id) where is_read = false;

-- Triggers
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

create trigger trg_events_updated_at
before update on public.events
for each row execute function public.update_updated_at_column();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'photographer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.photos enable row level security;
alter table public.photo_faces enable row level security;
alter table public.guestbook_entries enable row level security;
alter table public.photo_reports enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.photo_likes enable row level security;
alter table public.notifications enable row level security;

create policy "profiles_select_public" on public.profiles
for select using (true);
create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id);

create policy "events_select_public" on public.events
for select using (is_public = true);
create policy "events_select_photographer" on public.events
for select using (auth.uid() = photographer_id);
create policy "events_select_owner" on public.events
for select using (auth.uid() = owner_id);
create policy "events_insert_photographer" on public.events
for insert with check (auth.uid() = photographer_id);
create policy "events_update_photographer" on public.events
for update using (auth.uid() = photographer_id);
create policy "events_delete_photographer" on public.events
for delete using (auth.uid() = photographer_id);

create policy "photos_select_public_event" on public.photos
for select using (
  exists (
    select 1
    from public.events
    where events.id = photos.event_id and events.is_public = true
  )
);
create policy "photos_select_photographer" on public.photos
for select using (
  exists (
    select 1
    from public.events
    where events.id = photos.event_id and events.photographer_id = auth.uid()
  )
);
create policy "photos_insert_photographer" on public.photos
for insert with check (
  exists (
    select 1
    from public.events
    where events.id = photos.event_id and events.photographer_id = auth.uid()
  )
);
create policy "photos_update_photographer" on public.photos
for update using (
  exists (
    select 1
    from public.events
    where events.id = photos.event_id and events.photographer_id = auth.uid()
  )
);
create policy "photos_delete_photographer" on public.photos
for delete using (
  exists (
    select 1
    from public.events
    where events.id = photos.event_id and events.photographer_id = auth.uid()
  )
);

create policy "photo_faces_select_public_or_owner" on public.photo_faces
for select using (
  exists (
    select 1
    from public.photos
    join public.events on events.id = photos.event_id
    where photos.id = photo_faces.photo_id
      and (events.is_public = true or events.photographer_id = auth.uid())
  )
);
create policy "photo_faces_crud_photographer" on public.photo_faces
for all using (
  exists (
    select 1
    from public.photos
    join public.events on events.id = photos.event_id
    where photos.id = photo_faces.photo_id
      and events.photographer_id = auth.uid()
  )
);

create policy "guestbook_select_approved_or_owner" on public.guestbook_entries
for select using (
  is_approved = true
  or exists (
    select 1
    from public.events
    where events.id = guestbook_entries.event_id
      and events.photographer_id = auth.uid()
  )
);
create policy "guestbook_insert_authenticated" on public.guestbook_entries
for insert with check (auth.role() = 'authenticated');
create policy "guestbook_update_photographer" on public.guestbook_entries
for update using (
  exists (
    select 1
    from public.events
    where events.id = guestbook_entries.event_id
      and events.photographer_id = auth.uid()
  )
);

create policy "photo_reports_insert_authenticated" on public.photo_reports
for insert with check (auth.role() = 'authenticated');
create policy "photo_reports_select_photographer" on public.photo_reports
for select using (
  exists (
    select 1
    from public.photos
    join public.events on events.id = photos.event_id
    where photos.id = photo_reports.photo_id
      and events.photographer_id = auth.uid()
  )
);

create policy "orders_select_photographer" on public.orders
for select using (
  exists (
    select 1
    from public.events
    where events.id = orders.event_id and events.photographer_id = auth.uid()
  )
);

create policy "order_items_select_photographer" on public.order_items
for select using (
  exists (
    select 1
    from public.orders
    join public.events on events.id = orders.event_id
    where orders.id = order_items.order_id and events.photographer_id = auth.uid()
  )
);

create policy "photo_likes_own_crud" on public.photo_likes
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notifications_own_read" on public.notifications
for select using (auth.uid() = user_id);
create policy "notifications_own_update" on public.notifications
for update using (auth.uid() = user_id);

-- RPC functions
create or replace function public.create_event_v3(
  name text,
  slug text,
  date text,
  location text,
  description text,
  tier text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  new_event_id uuid;
  valid_date date;
  valid_tier public.event_tier;
  user_id uuid;
begin
  user_id := auth.uid();
  if user_id is null then
    raise exception 'Not authenticated';
  end if;

  begin
    valid_date := date::date;
  exception when others then
    raise exception 'Invalid date format: %', date;
  end;

  begin
    valid_tier := tier::public.event_tier;
  exception when others then
    raise exception 'Invalid tier: %', tier;
  end;

  insert into public.profiles (id, full_name, role)
  values (user_id, 'Photographer', 'photographer')
  on conflict (id) do nothing;

  insert into public.events (photographer_id, name, slug, date, location, description, tier)
  values (user_id, name, slug, valid_date, location, description, valid_tier)
  returning id into new_event_id;

  return json_build_object('id', new_event_id);
end;
$$;

create or replace function public.match_face_photos_v2(
  query_embedding vector(128),
  match_threshold float default 0.4,
  match_count int default 50,
  filter_event_id uuid default null
)
returns table (id uuid, url text, similarity float)
language plpgsql
security definer
set search_path = public
as $$
begin
  if filter_event_id is null then
    raise exception 'filter_event_id is required';
  end if;

  if not exists (
    select 1
    from public.events
    where events.id = filter_event_id
      and (events.is_public = true or events.photographer_id = auth.uid())
  ) then
    raise exception 'Event not found or not accessible';
  end if;

  return query
  select distinct on (photos.id)
    photos.id,
    photos.url,
    1 - (photo_faces.embedding <=> query_embedding) as similarity
  from public.photo_faces
  join public.photos on photos.id = photo_faces.photo_id
  where photos.event_id = filter_event_id
    and photos.is_hidden = false
    and photos.status = 'ready'
    and 1 - (photo_faces.embedding <=> query_embedding) > match_threshold
  order by photos.id, (1 - (photo_faces.embedding <=> query_embedding)) desc
  limit greatest(match_count, 1);
end;
$$;

-- Storage
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photos_upload_authenticated" on storage.objects;
create policy "photos_upload_authenticated"
on storage.objects
for insert
with check (bucket_id = 'photos' and auth.role() = 'authenticated');

drop policy if exists "photos_select_public" on storage.objects;
create policy "photos_select_public"
on storage.objects
for select
using (bucket_id = 'photos');

-- Permissions
grant usage on schema public to postgres, anon, authenticated, service_role;
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;
grant execute on function public.create_event_v3(text, text, text, text, text, text) to authenticated;
grant execute on function public.match_face_photos_v2(vector, float, int, uuid) to anon, authenticated;

notify pgrst, 'reload schema';

commit;
