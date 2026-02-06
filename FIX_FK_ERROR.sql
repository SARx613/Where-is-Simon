-- FIX_FK_ERROR.sql
-- Run this in Supabase SQL Editor to fix the Foreign Key error (23503)

-- 1. Update the RPC to be self-healing
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
  user_id uuid;
begin
  user_id := auth.uid();

  -- Self-healing: Ensure profile exists before inserting event
  insert into public.profiles (id, full_name, role)
  values (user_id, 'Photographer', 'photographer')
  on conflict (id) do nothing;

  -- Create event
  insert into public.events (photographer_id, name, slug, date, location, description, tier)
  values (user_id, name, slug, date, location, description, tier::public.event_tier)
  returning id into new_event_id;

  return json_build_object('id', new_event_id);
end;
$$;

-- 2. Repair existing users who are missing profiles
insert into public.profiles (id, full_name, role)
select id, COALESCE(raw_user_meta_data->>'full_name', email), 'photographer'
from auth.users
where id not in (select id from public.profiles);

-- 3. Reload Cache
NOTIFY pgrst, 'reload schema';
