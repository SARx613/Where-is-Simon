-- Fix create_event RPC to accept text arguments for all fields to avoid PostgREST PGRST202 errors
-- This creates a "loose" signature that casts types internally

-- Drop known previous signatures to avoid ambiguity
DROP FUNCTION IF EXISTS public.create_event(text, text, date, text, text, event_tier);
DROP FUNCTION IF EXISTS public.create_event(text, text, date, text, text, text);

-- Define the function with all TEXT arguments
CREATE OR REPLACE FUNCTION public.create_event(
  name text,
  slug text,
  date text, -- Input as text 'YYYY-MM-DD'
  location text,
  description text,
  tier text  -- Input as text 'starter'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_event_id uuid;
  valid_date date;
  valid_tier event_tier;
BEGIN
  -- Cast date
  BEGIN
    valid_date := date::date;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid date format: %', date;
  END;

  -- Cast tier
  BEGIN
    valid_tier := tier::event_tier;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback or explicit error
    RAISE EXCEPTION 'Invalid tier: %', tier;
  END;

  INSERT INTO events (photographer_id, name, slug, date, location, description, tier)
  VALUES (auth.uid(), name, slug, valid_date, location, description, valid_tier)
  RETURNING id INTO new_event_id;

  RETURN json_build_object('id', new_event_id);
END;
$$;

-- Grant permissions explicitly
GRANT EXECUTE ON FUNCTION public.create_event(text, text, text, text, text, text) TO postgres, anon, authenticated, service_role;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
