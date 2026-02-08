-- FIX: Add missing columns and reload schema cache

-- 1. Ensure 'status' column exists on 'photos' table
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'photos' and column_name = 'status') then
    alter table public.photos add column status text default 'processing';
  end if;
end $$;

-- 2. Ensure 'original_name' column exists (good for debugging)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'photos' and column_name = 'original_name') then
    alter table public.photos add column original_name text;
  end if;
end $$;

-- 3. Reload the Schema Cache (CRITICAL for PostgREST to see new columns)
NOTIFY pgrst, 'reload schema';

-- 4. Re-grant permissions just in case
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all sequences in schema public to postgres, anon, authenticated, service_role;

-- 5. Force refresh for RPCs
create or replace function reload_schema_cache()
returns void
language plpgsql
as $$
begin
  NOTIFY pgrst, 'reload schema';
end;
$$;

-- call it once
select reload_schema_cache();
