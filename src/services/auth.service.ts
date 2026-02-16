import type { SupabaseClient } from '@supabase/supabase-js';
type Client = SupabaseClient;

export async function getCurrentUser(client: Client) {
  return client.auth.getUser();
}

export async function signOut(client: Client) {
  return client.auth.signOut();
}
