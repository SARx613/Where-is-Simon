import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

type Client = SupabaseClient;
type Photo = Database['public']['Tables']['photos']['Row'];

export async function listPhotosForEvent(client: Client, eventId: string) {
  return client.from('photos').select('*').eq('event_id', eventId).order('created_at', { ascending: false });
}

export async function createPhoto(
  client: Client,
  input: Pick<Photo, 'event_id' | 'url' | 'original_name' | 'width' | 'height' | 'status'>
) {
  return client.from('photos').insert(input).select().single();
}

export async function matchFacePhotos(client: Client, input: { query_embedding: number[]; filter_event_id: string; match_threshold: number; match_count: number }) {
  const startedAt = Date.now();
  const result = await client.rpc('match_face_photos_v2', input);
  console.debug('[matchFacePhotos] rpc', {
    durationMs: Date.now() - startedAt,
    eventId: input.filter_event_id,
    threshold: input.match_threshold,
    count: input.match_count,
    hasError: Boolean(result.error),
    errorCode: result.error?.code,
    errorMessage: result.error?.message,
    rows: result.data?.length ?? 0,
  });
  return result;
}
