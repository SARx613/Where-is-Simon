-- Hotfix for environments that already contain a legacy create_event_v3 signature.
-- Run once in Supabase SQL Editor (production/staging) to remove ambiguity (PGRST203).

begin;

drop function if exists public.create_event_v3(text, text, date, text, text, text);
notify pgrst, 'reload schema';

commit;

-- Optional verification:
-- select
--   p.proname,
--   pg_catalog.pg_get_function_identity_arguments(p.oid) as args
-- from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.proname = 'create_event_v3';
