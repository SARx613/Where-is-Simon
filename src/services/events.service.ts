import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

type Client = SupabaseClient;
type Event = Database['public']['Tables']['events']['Row'];

export async function getEventById(client: Client, eventId: string) {
  return client.from('events').select('*').eq('id', eventId).single();
}

export async function getEventBySlug(client: Client, slug: string) {
  return client.from('events').select('*').eq('slug', slug).single();
}

export async function createEventViaRpc(
  client: Client,
  input: { name: string; slug: string; date: string; location: string; description: string; tier: string }
) {
  const startedAt = Date.now();
  console.debug('[createEventViaRpc] request', {
    name: input.name,
    slug: input.slug,
    date: input.date,
    location: input.location,
    tier: input.tier,
  });
  const result = await client.rpc('create_event_v3', input);
  console.debug('[createEventViaRpc] response', {
    durationMs: Date.now() - startedAt,
    hasError: Boolean(result.error),
    errorCode: result.error?.code,
    errorMessage: result.error?.message,
    errorDetails: result.error?.details,
    errorHint: result.error?.hint,
    data: result.data,
  });
  return result;
}

export async function listEventsForPhotographer(client: Client, photographerId: string) {
  return client.from('events').select('*').eq('photographer_id', photographerId).order('created_at', { ascending: false });
}

export type { Event };
