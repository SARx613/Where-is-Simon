'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { getCurrentUser } from '@/services/auth.service';

export function useAuth() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getCurrentUser(supabase).then(({ data }) => {
      if (!mounted) return;
      setUserId(data.user?.id ?? null);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [supabase]);

  return { userId, loading };
}
