'use client';

import { useEffect, useMemo, useState, use } from 'react';
import { createClient } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import PhotoUpload from '@/components/PhotoUpload';
import { Calendar, GripVertical, Image as ImageIcon, Loader, MapPin, RefreshCw, Users } from 'lucide-react';
import { getEventById } from '@/services/events.service';
import { listPhotosForEvent } from '@/services/photos.service';
import { EventSectionTabs } from '@/components/events/EventSectionTabs';
import { clusterFaces, normalizeFaces } from '@/lib/face-grouping';
import { getAllFaceDescriptors, getFaceDescriptor } from '@/lib/face-rec';

type Event = Database['public']['Tables']['events']['Row'];
type Photo = Database['public']['Tables']['photos']['Row'] & { display_order?: number | null };
type FaceRow = { id: string; photo_id: string; embedding: string | number[]; photoUrl: string };

function parseStoragePath(url: string) {
  const marker = '/storage/v1/object/public/photos/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
}

function sortPhotos(photos: Photo[]) {
  return [...photos].sort((a, b) => {
    const ao = typeof a.display_order === 'number' ? a.display_order : Number.MAX_SAFE_INTEGER;
    const bo = typeof b.display_order === 'number' ? b.display_order : Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function reorderPhotos(photos: Photo[], sourceId: string, targetId: string) {
  const next = [...photos];
  const sourceIndex = next.findIndex((p) => p.id === sourceId);
  const targetIndex = next.findIndex((p) => p.id === targetId);
  if (sourceIndex === -1 || targetIndex === -1) return next;
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

export default function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();

  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const [facesLoading, setFacesLoading] = useState(false);
  const [facesError, setFacesError] = useState<string | null>(null);
  const [faceRows, setFaceRows] = useState<FaceRow[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reanalyzing, setReanalyzing] = useState(false);

  const loadData = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    setActionError(null);
    setFacesError(null);

    const { data: eventData, error: eventError } = await getEventById(supabase, id);
    if (eventError || !eventData) {
      setActionError(eventError?.message ?? "Impossible de charger l'événement.");
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setEvent(eventData);

    const { data: photosData, error: photosError } = await listPhotosForEvent(supabase, id);
    if (photosError) {
      setActionError(photosError.message);
    } else if (photosData) {
      const ordered = sortPhotos(photosData as Photo[]);
      setPhotos(ordered);
      setProcessingCount(ordered.filter((photo) => photo.status === 'processing').length);
    }

    setFacesLoading(true);
    const { data: facesData, error: photoFacesError } = await supabase
      .from('photo_faces')
      .select('id,photo_id,embedding,photos!inner(event_id,url)')
      .eq('photos.event_id', id)
      .limit(5000);

    if (photoFacesError) {
      setFacesError(photoFacesError.message);
      setFaceRows([]);
    } else if (facesData) {
      const mapped = (facesData as Array<{ id: string; photo_id: string; embedding: string | number[]; photos: { url: string } | { url: string }[] }>)
        .map((row) => ({
          id: row.id,
          photo_id: row.photo_id,
          embedding: row.embedding,
          photoUrl: Array.isArray(row.photos) ? row.photos[0]?.url ?? '' : row.photos?.url ?? '',
        }))
        .filter((row) => row.photoUrl);
      setFaceRows(mapped);
    }
    setFacesLoading(false);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, supabase]);

  useEffect(() => {
    if (processingCount === 0) return;
    const timer = setInterval(() => loadData(false), 8000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processingCount]);

  const clusters = useMemo(() => clusterFaces(normalizeFaces(faceRows)), [faceRows]);
  const faceCountByPhoto = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of faceRows) counts.set(row.photo_id, (counts.get(row.photo_id) ?? 0) + 1);
    return counts;
  }, [faceRows]);

  const allSelected = photos.length > 0 && selectedPhotoIds.length === photos.length;

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotoIds((prev) => (prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]));
  };

  const togglePublish = async () => {
    if (!event) return;
    setActionMessage(null);
    setActionError(null);
    const shouldPublish = event.status !== 'published';
    const updates: Partial<Event> = shouldPublish
      ? { status: 'published', is_public: true }
      : { status: 'draft' };

    const { error } = await supabase.from('events').update(updates).eq('id', event.id);
    if (error) {
      setActionError(error.message);
      return;
    }
    setActionMessage(shouldPublish ? 'Événement publié.' : 'Événement repassé en brouillon.');
    setEvent({ ...event, ...updates });
  };

  const deleteSelectedPhotos = async () => {
    if (selectedPhotoIds.length === 0) return;
    const confirmed = window.confirm(`Supprimer ${selectedPhotoIds.length} photo(s) ?`);
    if (!confirmed) return;

    setActionMessage(null);
    setActionError(null);

    const selectedPhotos = photos.filter((photo) => selectedPhotoIds.includes(photo.id));
    const storagePaths = selectedPhotos
      .map((photo) => parseStoragePath(photo.url))
      .filter((path): path is string => Boolean(path));

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage.from('photos').remove(storagePaths);
      if (storageError) console.warn('Storage remove warning', storageError.message);
    }

    const { error } = await supabase.from('photos').delete().in('id', selectedPhotoIds).eq('event_id', id);
    if (error) {
      setActionError(error.message);
      return;
    }

    setPhotos((prev) => prev.filter((photo) => !selectedPhotoIds.includes(photo.id)));
    setSelectedPhotoIds([]);
    setSelectionMode(false);
    setActionMessage(`${selectedPhotoIds.length} photo(s) supprimée(s).`);
    await loadData(false);
  };

  const detectFacesFromPhotoUrl = async (photoUrl: string) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = photoUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(`Impossible de charger l'image ${photoUrl}`));
    });

    const allFaces = await getAllFaceDescriptors(image);
    if (allFaces.length > 0) {
      return allFaces.map((d) => ({
        embedding: Array.from(d.descriptor),
        box_x: Math.round(d.detection.box.x),
        box_y: Math.round(d.detection.box.y),
        box_width: Math.round(d.detection.box.width),
        box_height: Math.round(d.detection.box.height),
      }));
    }

    const single = await getFaceDescriptor(image);
    if (!single) return [];
    return [
      {
        embedding: Array.from(single),
        box_x: 0,
        box_y: 0,
        box_width: image.naturalWidth,
        box_height: image.naturalHeight,
      },
    ];
  };

  const reanalyzeNoFacePhotos = async () => {
    const candidates = photos.filter((photo) => (faceCountByPhoto.get(photo.id) ?? 0) === 0);
    if (candidates.length === 0) {
      setActionMessage('Toutes les photos ont déjà au moins un visage détecté.');
      return;
    }

    setReanalyzing(true);
    setActionError(null);
    setActionMessage(null);

    let analyzed = 0;
    let failures = 0;
    let foundFaces = 0;

    for (const photo of candidates) {
      try {
        const faces = await detectFacesFromPhotoUrl(photo.url);
        const res = await fetch('/api/photos/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photoId: photo.id,
            imageUrl: photo.url,
            faces,
          }),
        });
        if (!res.ok) throw new Error(`Échec API ${res.status}`);
        foundFaces += faces.length;
        analyzed += 1;
      } catch (error) {
        console.error('Reanalysis failed', { photoId: photo.id, error });
        failures += 1;
      }
    }

    await loadData(false);
    setReanalyzing(false);
    if (failures > 0) {
      setActionError(`Ré-analyse terminée avec erreurs: ${analyzed} photo(s) analysée(s), ${failures} échec(s).`);
    } else {
      setActionMessage(`Ré-analyse terminée: ${analyzed} photo(s) analysée(s), ${foundFaces} visage(s) détecté(s).`);
    }
  };

  const persistPhotoOrder = async (orderedPhotos: Photo[]) => {
    const updates = orderedPhotos.map((photo, index) =>
      supabase.from('photos').update({ display_order: index + 1 }).eq('id', photo.id)
    );
    const results = await Promise.all(updates);
    const firstError = results.map((result) => result.error).find(Boolean);
    if (firstError) {
      if (firstError.message.includes('display_order')) {
        setActionError("L'ordre n'a pas pu être sauvegardé. Exécute la migration d'ajout `display_order` dans Supabase.");
      } else {
        setActionError(firstError.message);
      }
      await loadData(false);
      return;
    }
    setActionMessage('Ordre des photos sauvegardé.');
  };

  const onDropPhoto = async (targetId: string) => {
    if (!dragSourceId || dragSourceId === targetId || selectionMode) return;
    setActionMessage(null);
    setActionError(null);
    const reordered = reorderPhotos(photos, dragSourceId, targetId);
    setPhotos(reordered);
    setDragSourceId(null);
    await persistPhotoOrder(reordered);
  };

  if (loading) return <div className="p-8 text-center">Chargement...</div>;
  if (!event) return <div className="p-8 text-center">Événement introuvable</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-gray-500">
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
              <div className="flex items-center">
                <Users size={16} className="mr-1" />
                <span>{clusters.length} invités détectés</span>
              </div>
            </div>
            <p className="mt-3 text-gray-600 max-w-2xl">{event.description}</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              event.status === 'published' ? 'bg-green-100 text-green-800' : event.status === 'archived' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800'
            }`}>
              {event.status === 'published' ? 'Publié' : event.status === 'archived' ? 'Archivé' : 'Brouillon'}
            </span>
            <button
              onClick={togglePublish}
              className={`text-sm px-3 py-1 rounded border ${
                event.status === 'published'
                  ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                  : 'border-green-300 text-green-700 hover:bg-green-50'
              }`}
            >
              {event.status === 'published' ? 'Repasser en brouillon' : 'Publier maintenant'}
            </button>
            <div className="text-sm text-gray-500">
              Slug: <span className="font-mono bg-gray-100 px-1 rounded">{event.slug}</span>
            </div>
          </div>
        </div>
      </div>

      <EventSectionTabs eventId={id} />

      {actionMessage && <p className="text-sm text-green-700">{actionMessage}</p>}
      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-medium text-gray-700">Galerie ({photos.length})</h3>
              <p className="text-xs text-gray-500">Glisse-dépose les photos pour changer l&apos;ordre d&apos;affichage.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => loadData(true)}
                className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded px-3 py-1.5"
              >
                <RefreshCw size={14} className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              <button
                onClick={reanalyzeNoFacePhotos}
                disabled={reanalyzing}
                className="text-sm border border-indigo-300 rounded px-3 py-1.5 text-indigo-700 hover:bg-indigo-50 disabled:opacity-40"
              >
                {reanalyzing ? 'Ré-analyse...' : 'Ré-analyser les photos sans visage'}
              </button>
              <button
                onClick={() => {
                  setSelectionMode((prev) => !prev);
                  setSelectedPhotoIds([]);
                }}
                className={`text-sm border rounded px-3 py-1.5 ${
                  selectionMode ? 'border-indigo-400 text-indigo-700 bg-indigo-50' : 'border-slate-300 text-slate-700'
                }`}
              >
                {selectionMode ? 'Quitter sélection' : 'Sélectionner'}
              </button>

              {selectionMode && (
                <>
                  <button
                    onClick={() => setSelectedPhotoIds(allSelected ? [] : photos.map((photo) => photo.id))}
                    className="text-sm border border-slate-300 rounded px-3 py-1.5 text-slate-700"
                  >
                    {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                  <button
                    onClick={deleteSelectedPhotos}
                    disabled={selectedPhotoIds.length === 0}
                    className="text-sm border border-red-300 rounded px-3 py-1.5 text-red-700 hover:bg-red-50 disabled:opacity-40"
                  >
                    Supprimer ({selectedPhotoIds.length})
                  </button>
                </>
              )}
            </div>
          </div>

          {processingCount > 0 && (
            <div className="mb-4 bg-yellow-50 p-3 rounded text-sm text-yellow-800 border border-yellow-200 flex items-center">
              <Loader size={14} className="animate-spin mr-2" />
              {processingCount} photos en cours de traitement IA...
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo) => {
              const selected = selectedPhotoIds.includes(photo.id);
              return (
                <div
                  key={photo.id}
                  draggable={!selectionMode}
                  onDragStart={() => setDragSourceId(photo.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => onDropPhoto(photo.id)}
                  onClick={() => selectionMode && togglePhotoSelection(photo.id)}
                  className={`aspect-square bg-gray-100 rounded-lg overflow-hidden relative group border-2 ${
                    selected ? 'border-indigo-500' : 'border-transparent'
                  } ${selectionMode ? 'cursor-pointer' : 'cursor-grab'}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="Event photo" className={`w-full h-full object-cover ${photo.status === 'processing' ? 'opacity-50' : ''}`} />

                  {!selectionMode && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1">
                      <GripVertical size={14} />
                    </div>
                  )}

                  {selectionMode && (
                    <div className="absolute top-2 right-2">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => togglePhotoSelection(photo.id)}
                        className="w-4 h-4"
                      />
                    </div>
                  )}

                  <div className="absolute top-2 left-2 text-[11px] bg-black/70 text-white rounded-full px-2 py-1">
                    {faceCountByPhoto.get(photo.id) ?? 0} visage{(faceCountByPhoto.get(photo.id) ?? 0) > 1 ? 's' : ''}
                  </div>

                  <div className="absolute bottom-2 left-2 text-[11px] bg-white/90 text-slate-700 rounded-full px-2 py-1">
                    {(photo.status ?? 'ready').toUpperCase()}
                  </div>

                  {photo.status === 'processing' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                      <Loader className="animate-spin text-white" />
                    </div>
                  )}
                </div>
              );
            })}

            {photos.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                Aucune photo pour le moment.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ajouter des photos</h3>
            <PhotoUpload
              eventId={event.id}
              onUploadComplete={() => loadData(false)}
              onPhotoUploaded={(photo) => setPhotos((prev) => sortPhotos([photo as Photo, ...prev]))}
            />
          </div>

          <div className="bg-white p-5 rounded-lg shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-3">Invités détectés</h3>
            <p className="text-xs text-gray-500 mb-4">Regroupement automatique des visages similaires (bêta).</p>
            {facesError && <p className="text-xs text-red-600 mb-3">Erreur chargement visages: {facesError}</p>}

            {facesLoading ? (
              <div className="text-sm text-gray-500 flex items-center">
                <Loader size={14} className="animate-spin mr-2" />
                Analyse des visages...
              </div>
            ) : clusters.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun visage regroupé pour le moment.</p>
            ) : (
              <ul className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {clusters.slice(0, 30).map((cluster, index) => (
                  <li key={cluster.id} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-slate-800">Invité {String(index + 1).padStart(2, '0')}</p>
                      <span className="text-xs text-slate-500">{cluster.faceCount} visages · {cluster.photoCount} photos</span>
                    </div>
                    <div className="flex gap-2">
                      {cluster.samplePhotoUrls.map((url) => (
                        <div key={url} className="w-12 h-12 rounded-md overflow-hidden bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="Aperçu invité" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
