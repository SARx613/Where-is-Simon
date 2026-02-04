'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import SelfieCapture from '@/components/SelfieCapture';
import { Download, Share2, AlertTriangle } from 'lucide-react';

type Event = Database['public']['Tables']['events']['Row'];
type Photo = {
  id: string;
  url: string;
  similarity: number;
};

export default function GuestEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [event, setEvent] = useState<Event | null>(null);
  const [matches, setMatches] = useState<Photo[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'none' | 'grayscale' | 'sepia'>('none');
  const supabase = createClient();

  useEffect(() => {
    async function loadEvent() {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single();

      if (data) setEvent(data);
      setLoading(false);
    }
    loadEvent();
  }, [slug, supabase]);

  const handleFaceDetected = async (descriptor: Float32Array) => {
    if (!event) return;
    setSearching(true);

    // Convert Float32Array to number[]
    const embedding = Array.from(descriptor);

    // Call RPC
    // Note: match_threshold is distance. Lower is better match.
    // 0.6 is a common threshold for face-api.js (Euclidean distance),
    // but pgvector using cosine distance might range differently.
    // face-api.js descriptors are normalized? Yes.
    // <-> operator in pgvector is Euclidean distance (L2).
    // <=> is Cosine distance.
    // face-api.js usually recommends Euclidean distance < 0.6.
    // Let's assume our RPC uses <=> (Cosine).
    // For normalized vectors, Euclidean distance and Cosine distance are related.
    // Let's try a threshold of 0.5 similarity (1 - distance).
    // Wait, my RPC returns `1 - (embedding <=> query)`.
    // If distance is small (0), similarity is 1.
    // If distance is large (1), similarity is 0.
    // I should check what my RPC does.

    const { data, error } = await supabase.rpc('match_face_photos_v2', {
      query_embedding: embedding,
      match_threshold: 0.4, // Similarity > 0.4 (Adjust based on testing)
      match_count: 50,
      filter_event_id: event.id
    });

    if (error) {
      console.error(error);
      alert('Erreur lors de la recherche.');
    } else {
      setMatches(data || []);
      setHasSearched(true);
    }
    setSearching(false);
  };

  if (loading) return <div className="text-center py-20">Chargement...</div>;
  if (!event) return <div className="text-center py-20">Événement introuvable</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">{event.name}</h1>
          <div className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!hasSearched ? (
          <div className="flex flex-col items-center justify-center space-y-8 mt-10">
            <div className="text-center max-w-lg">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Bienvenue !</h2>
              <p className="text-gray-600">
                Pour accéder à vos photos personnelles de cet événement, nous utilisons une reconnaissance faciale sécurisée.
              </p>
            </div>

            <SelfieCapture onDescriptorComputed={handleFaceDetected} />

            {searching && <p className="text-indigo-600 font-medium">Recherche de vos photos...</p>}
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {matches.length} photos trouvées
              </h2>
              <button
                onClick={() => setHasSearched(false)}
                className="text-indigo-600 hover:underline text-sm"
              >
                Refaire ma recherche
              </button>
            </div>

            {matches.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-lg shadow">
                <p className="text-xl text-gray-600 mb-4">Aucune photo trouvée 😔</p>
                <p className="text-gray-500">Essayez avec un autre selfie ou parcourez la galerie publique.</p>
              </div>
            ) : (
              <>
              <div className="flex justify-center mb-6 space-x-4">
                <span className="text-sm font-medium text-gray-700 py-2">Filtres :</span>
                <button
                  onClick={() => setActiveFilter('none')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeFilter === 'none' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
                >
                  Original
                </button>
                <button
                  onClick={() => setActiveFilter('grayscale')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeFilter === 'grayscale' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
                >
                  Noir & Blanc
                </button>
                <button
                  onClick={() => setActiveFilter('sepia')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeFilter === 'sepia' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
                >
                  Sépia
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {matches.map((photo) => (
                  <div key={photo.id} className="bg-white rounded-lg shadow overflow-hidden group relative">
                    <div className="aspect-[2/3] relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt="Souvenir"
                        className="w-full h-full object-cover transition duration-300"
                        style={{ filter: activeFilter === 'none' ? 'none' : `${activeFilter}(100%)` }}
                      />

                      {/* Watermark Overlay */}
                      {event.watermark_enabled && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                          <div className="transform -rotate-45 border-4 border-white text-white text-4xl font-bold p-4 uppercase tracking-widest bg-black/20 backdrop-blur-sm rounded-xl">
                            PREVIEW
                          </div>
                          {/* Repeated pattern for robustness */}
                          <div className="absolute inset-0 bg-[url('https://placehold.co/200x200/000000/ffffff?text=WATERMARK')] opacity-10 bg-repeat"></div>
                        </div>
                      )}

                      {/* Action Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-4">
                         <div className="flex justify-between text-white">
                           <button className="p-2 hover:bg-white/20 rounded-full" title="Télécharger">
                             <Download size={20} />
                           </button>
                           <button className="p-2 hover:bg-white/20 rounded-full" title="Partager">
                             <Share2 size={20} />
                           </button>
                           <button className="p-2 hover:bg-white/20 rounded-full" title="Signaler">
                             <AlertTriangle size={20} />
                           </button>
                         </div>
                         {event.tier !== 'starter' && (
                           <div className="mt-2 text-center">
                             <button className="w-full bg-indigo-600 text-white text-sm py-2 rounded font-medium hover:bg-indigo-700">
                               Acheter le tirage
                             </button>
                           </div>
                         )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}

            <div className="mt-12 text-center border-t pt-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Livre d&apos;or</h3>
              <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-sm">
                <textarea
                  className="w-full border rounded p-3 mb-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Laissez un petit mot aux mariés..."
                  rows={3}
                ></textarea>
                <button className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700">
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
