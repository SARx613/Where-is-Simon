-- EMERGENCY_FIX_23503.sql
-- Exécutez ce script pour forcer la résolution de l'erreur 23503

BEGIN;

-- 1. Désactiver temporairement la contrainte FK stricte (Optionnel mais recommandé si bloqué)
-- alter table public.events drop constraint if exists events_photographer_id_fkey;

-- 2. Redéfinir la fonction de création pour être robuste
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
  user_email text;
begin
  user_id := auth.uid();

  -- Récupérer l'email pour le nom par défaut
  select email into user_email from auth.users where id = user_id;

  -- Assurer que le profil existe vraiment
  if not exists (select 1 from public.profiles where id = user_id) then
    insert into public.profiles (id, full_name, role)
    values (user_id, coalesce(user_email, 'Photographer'), 'photographer');
  end if;

  -- Créer l'événement
  insert into public.events (photographer_id, name, slug, date, location, description, tier)
  values (user_id, name, slug, date, location, description, tier::public.event_tier)
  returning id into new_event_id;

  return json_build_object('id', new_event_id);
end;
$$;

-- 3. Accorder les droits
grant execute on function public.create_event_v3(text, text, date, text, text, text) to postgres, anon, authenticated, service_role;

-- 4. Recharger le cache
NOTIFY pgrst, 'reload schema';

COMMIT;
