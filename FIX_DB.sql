-- ============================================================
-- SCRIPT DE RÉPARATION (A EXÉCUTER DANS SUPABASE SQL EDITOR)
-- ============================================================

-- 1. Nettoyage des anciennes fonctions
drop function if exists create_event(text, text, date, text, text, event_tier);
drop function if exists create_event(text, text, date, text, text, text);

-- 2. Création de la fonction de création d'événement (Version 3 - Robuste)
-- Accepte 'tier' comme text pour éviter les erreurs de type enum
create or replace function create_event_v3(
  name text,
  slug text,
  date date,
  location text,
  description text,
  tier text
)
returns json
language plpgsql
security definer -- Contourne les RLS pour l'insertion
as $$
declare
  new_event_id uuid;
begin
  -- Insertion avec cast explicite du tier
  insert into events (photographer_id, name, slug, date, location, description, tier)
  values (auth.uid(), name, slug, date, location, description, tier::event_tier)
  returning id into new_event_id;

  return json_build_object('id', new_event_id);
end;
$$;

-- 3. Trigger pour créer automatiquement le profil Photographe à l'inscription
-- Essentiel pour éviter l'erreur de clé étrangère sur events.photographer_id
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'photographer')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Réattachement du trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Permissions explicites (Pour corriger PGRST205/202)
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all sequences in schema public to postgres, anon, authenticated, service_role;
grant execute on function create_event_v3(text, text, date, text, text, text) to postgres, anon, authenticated, service_role;

-- 5. Rechargement du cache de l'API
NOTIFY pgrst, 'reload schema';
