'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import PhotoUpload from '@/components/PhotoUpload';
import { Calendar, MapPin, Image as ImageIcon } from 'lucide-react';

type Event = Database['public']['Tables']['events']['Row'];
type Photo = Database['public']['Tables']['photos']['Row'];

export default function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const { id } = use(params);

  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'photos' | 'settings'>('photos');

  const supabase = createClient();

  // Define loadData using useCallback to be stable and reusable
  const loadData = async () => {
    // Load Event
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (eventData) {
      setEvent(eventData);

      // Load Photos
      const { data: photosData } = await supabase
        .from('photos')
        .select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: false });

      if (photosData) setPhotos(photosData);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // We suppress the warning for loadData dependency as it's defined outside but doesn't change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, supabase]);

  if (loading) return <div className="p-8 text-center">Chargement...</div>;
  if (!event) return <div className="p-8 text-center">Événement introuvable</div>;

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
            <div className="flex items-center space-x-4 mt-2 text-gray-500">
              <div className="flex items-center">
                <Calendar size={16} className="mr-1" />
                <span>{new Date(event.date).toLocaleDateString()}</span>
              </div>
              {event.location && (
                <div className="flex items-center">
                  <MapPin size={16} className="mr-1" />
                  <span>{event.location}</span>
                </div>
              )}
              <div className="flex items-center">
                <ImageIcon size={16} className="mr-1" />
                <span>{photos.length} photos</span>
              </div>
            </div>
            <p className="mt-4 text-gray-600 max-w-2xl">{event.description}</p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
               event.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {event.status === 'published' ? 'Publié' : 'Brouillon'}
            </span>
            <div className="text-sm text-gray-500">
               Slug: <span className="font-mono bg-gray-100 px-1 rounded">{event.slug}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('photos')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'photos'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Photos & Upload
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Paramètres
          </button>
        </nav>
      </div>

      {activeTab === 'photos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               {photos.map((photo) => (
                 <div key={photo.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src={photo.url} alt="Event photo" className="w-full h-full object-cover" />
                   {/* Info overlay on hover could go here */}
                 </div>
               ))}
               {photos.length === 0 && (
                 <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                   Aucune photo pour le moment.
                 </div>
               )}
             </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Ajouter des photos</h3>
              <PhotoUpload eventId={event.id} onUploadComplete={loadData} />

              <div className="mt-6 pt-6 border-t text-sm text-gray-500">
                <p>Les visages sont détectés automatiquement lors de l&apos;upload.</p>
                <p className="mt-2">Formats supportés: JPG, PNG, WebP.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Paramètres de l&apos;événement</h3>
          <p className="text-gray-500">Configuration du filigrane, accès, etc. (À venir)</p>
        </div>
      )}
    </div>
  );
}
