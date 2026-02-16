'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Loader } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Notification = Database['public']['Tables']['notifications']['Row'];

export default function NotificationsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Notification[]>([]);
  const unreadCount = useMemo(() => items.filter((item) => !item.is_read).length, [items]);

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!cancelled) {
        setItems(data ?? []);
        setLoading(false);
      }
    }

    loadNotifications();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const markAllAsRead = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) return;
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('user_id', userId).eq('is_read', false);
    setItems((prev) => prev.map((item) => ({ ...item, is_read: true, read_at: new Date().toISOString() })));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Notifications</h2>
        <button
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
        >
          <CheckCheck size={16} />
          Tout marquer lu
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4 p-4 bg-indigo-50 rounded-lg mb-4">
          <div className="bg-indigo-100 p-2 rounded-full">
            <Bell className="text-indigo-600" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-indigo-900">Notification &quot;You&apos;ve been spotted&quot;</h3>
            <p className="text-sm text-indigo-700">
              Cette fonctionnalité enverra une alerte push aux invités lorsqu&apos;une nouvelle photo d&apos;eux est détectée.
              (Nécessite une configuration de serveur Push Notification Service)
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-auto">
            <input type="checkbox" value="" className="sr-only peer" checked disabled />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {loading ? (
          <div className="text-gray-500 text-center py-8 flex items-center justify-center gap-2">
            <Loader size={16} className="animate-spin" />
            Chargement...
          </div>
        ) : items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune notification récente.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className={`rounded-lg border p-4 ${item.is_read ? 'border-slate-200 bg-white' : 'border-indigo-200 bg-indigo-50/60'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-600 mt-1">{item.message}</p>
                  </div>
                  {!item.is_read && <span className="text-[11px] px-2 py-1 rounded-full bg-indigo-600 text-white">Nouveau</span>}
                </div>
                <p className="text-xs text-slate-500 mt-3">{new Date(item.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
