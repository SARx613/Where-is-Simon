import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function createClient() {
  return createSupabaseBrowserClient();
}
