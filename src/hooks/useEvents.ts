'use client';

import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { listEventsForPhotographer } from '@/services/events.service';
import type { Event } from '@/services/events.service';

export function useEvents() {
  const supabase = createClient();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (photographerId: string) => {
      setLoading(true);
      const { data, error } = await listEventsForPhotographer(supabase, photographerId);
      if (error) throw error;
      setEvents(data ?? []);
      setLoading(false);
    },
    [supabase]
  );

  return { events, loading, load };
}
