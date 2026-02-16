'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import PhotoUpload from '@/components/PhotoUpload';
import { Calendar, MapPin, Image as ImageIcon, Loader, RefreshCw, AlertTriangle } from 'lucide-react';
import { getEventById } from '@/services/events.service';
import { listPhotosForEvent } from '@/services/photos.service';

type Event = Database['public']['Tables']['events']['Row'];
type Photo = Database['public']['Tables']['photos']['Row'];

export default function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const { id } = use(params);

  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'photos' | 'settings'>('photos');
  const [processingCount, setProcessingCount] = useState(0);

  const supabase = createClient();

  // Define loadData using useCallback to be stable and reusable
  const loadData = async () => {
    const { data: eventData } = await getEventById(supabase, id);

    if (eventData) {
      setEvent(eventData);

      // Load Photos
      const { data: photosData } = await listPhotosForEvent(supabase, id);

      if (photosData) {
        setPhotos(photosData);
        setProcessingCount(photosData.filter(p => p.status === 'processing').length);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // We suppress the warning for loadData dependency as it's defined outside but doesn't change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, supabase]);

  const handlePhotoUploaded = (newPhoto: Photo) => {
    setPhotos(prev => [newPhoto, ...prev]);
    if (newPhoto.status === 'processing') {
        setProcessingCount(prev => prev + 1);
    }
  };

  const retryProcessing = async (photo: Photo) => {
     try {
       // Optimistic update
       setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, status: 'processing' } : p));

       const res = await fetch('/api/photos/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoId: photo.id, imageUrl: photo.url }),
        });

        if (!res.ok) throw new Error("Retry failed");

        // Reload after delay to see result
        setTimeout(loadData, 2000);
     } catch (e) {
         console.error("Retry failed:", e);
         loadData(); // Revert
     }
  };

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
          <Link
            href={`/dashboard/events/${id}/settings`}
            className={`py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`}
          >
            Paramètres
          </Link>
        </nav>
      </div>

      {activeTab === 'photos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-medium text-gray-700">Galerie ({photos.length})</h3>
               <button
                 onClick={() => loadData()}
                 className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
               >
                 <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
                 Actualiser
               </button>
             </div>

             {processingCount > 0 && (
                 <div className="mb-4 bg-yellow-50 p-3 rounded text-sm text-yellow-800 border border-yellow-200 flex items-center">
                    <Loader size={14} className="animate-spin mr-2" />
                    {processingCount} photos en cours de traitement...
                 </div>
             )}

             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               {photos.map((photo) => (
                 <div key={photo.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src={photo.url} alt="Event photo" className={`w-full h-full object-cover ${photo.status === 'processing' ? 'opacity-50' : ''}`} />

                   {photo.status === 'processing' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 backdrop-blur-sm">
                          <Loader className="animate-spin text-white" />
                      </div>
                   )}

                   {(photo.status === 'error' || (photo.status === 'processing' && new Date(photo.created_at).getTime() < Date.now() - 60000 * 5)) && ( // Show retry if error OR if stuck processing > 5 mins
                       <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 bg-opacity-80 p-2 text-center">
                           <AlertTriangle className="text-red-600 mb-1" size={24} />
                           <span className="text-xs text-red-700 font-bold mb-2">Erreur traitement</span>
                           <button
                             onClick={(e) => { e.stopPropagation(); retryProcessing(photo); }}
                             className="px-2 py-1 bg-white border border-red-200 rounded text-xs text-red-700 shadow-sm hover:bg-red-50"
                           >
                             Relancer
                           </button>
                       </div>
                   )}

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
              <PhotoUpload
                 eventId={event.id}
                 onUploadComplete={() => {
                   // We don't necessarily need to reload everything if we updated incrementally,
                   // but doing a final sync is safe.
                   // However, if we reload, we might lose the optimistic 'processing' state if the API hasn't finished.
                   // So maybe just do nothing here if we rely on onPhotoUploaded.
                   // But user might have deleted photos etc. Let's leave it or remove it.
                   // Actually, if we reload, the DB might still say 'processing' which is fine.
                 }}
                 onPhotoUploaded={handlePhotoUploaded}
              />

              <div className="mt-6 pt-6 border-t text-sm text-gray-500">
                <p>Les visages sont détectés automatiquement lors de l&apos;upload.</p>
                <p className="mt-2">Formats supportés: JPG, PNG, WebP, HEIC.</p>
                <p className="mt-2">Les photos sont compressées et redimensionnées automatiquement.</p>
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
