'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Plus, Calendar, MapPin } from 'lucide-react';
import { Database } from '@/types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadEvents() {
      // In a real app, we would get the current user ID and filter
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('events')
          .select('*')
          .eq('photographer_id', user.id)
          .order('date', { ascending: false });

        if (data) setEvents(data);
      } else {
        // For MVP demo without auth flow fully working yet, fetch public events or just empty
        // console.log("No user logged in");
      }
      setLoading(false);
    }

    loadEvents();
  }, [supabase]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Mes Événements</h2>
        <Link
          href="/dashboard/events/new"
          className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus size={18} className="mr-2" />
          Créer un événement
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-10">Chargement...</div>
      ) : events.length === 0 ? (
        <div className="bg-white p-10 rounded-lg shadow-sm text-center">
          <p className="text-gray-500 mb-4">Vous n&apos;avez pas encore créé d&apos;événement.</p>
          <Link
            href="/dashboard/events/new"
            className="text-indigo-600 font-medium hover:underline"
          >
            Commencez maintenant
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/dashboard/events/${event.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition block group"
            >
              <div className="h-48 bg-gray-200 relative">
                {event.cover_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={event.cover_url} alt={event.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-300">
                    <Calendar size={48} />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs font-bold text-gray-700 shadow">
                  {event.tier.toUpperCase()}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition">{event.name}</h3>
                <div className="flex items-center text-gray-500 text-sm mt-2">
                  <Calendar size={14} className="mr-1" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                {event.location && (
                  <div className="flex items-center text-gray-500 text-sm mt-1">
                    <MapPin size={14} className="mr-1" />
                    <span>{event.location}</span>
                  </div>
                )}
                <div className="mt-3 flex justify-between items-center">
                  <span className={`px-2 py-1 rounded text-xs ${
                    event.is_public ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {event.is_public ? 'Public' : 'Privé'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
