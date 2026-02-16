'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Camera, Clock3, Euro, Images, Sparkles, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase';

type DashboardStats = {
  totalEvents: number;
  publishedEvents: number;
  totalPhotos: number;
  processingPhotos: number;
  totalFaces: number;
  paidRevenueCents: number;
};

const initialStats: DashboardStats = {
  totalEvents: 0,
  publishedEvents: 0,
  totalPhotos: 0,
  processingPhotos: 0,
  totalFaces: 0,
  paidRevenueCents: 0,
};

export default function DashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      setLoading(true);
      setError(null);

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        if (!cancelled) {
          setError('Connexion requise pour charger les statistiques.');
          setLoading(false);
        }
        return;
      }

      const userId = authData.user.id;
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id,status')
        .eq('photographer_id', userId);

      if (eventsError) {
        if (!cancelled) {
          setError(`Erreur événements: ${eventsError.message}`);
          setLoading(false);
        }
        return;
      }

      const eventIds = (eventsData ?? []).map((event: { id: string }) => event.id);
      const publishedEvents = (eventsData ?? []).filter((event: { status: string }) => event.status === 'published').length;
      const totalEvents = eventIds.length;

      if (eventIds.length === 0) {
        if (!cancelled) {
          setStats({ ...initialStats, totalEvents, publishedEvents });
          setLoading(false);
        }
        return;
      }

      const [{ count: photoCount }, { count: processingCount }, photosForFaceQuery, ordersQuery] = await Promise.all([
        supabase.from('photos').select('id', { count: 'exact', head: true }).in('event_id', eventIds),
        supabase.from('photos').select('id', { count: 'exact', head: true }).in('event_id', eventIds).eq('status', 'processing'),
        supabase.from('photos').select('id').in('event_id', eventIds).limit(5000),
        supabase.from('orders').select('total_amount,status').in('event_id', eventIds),
      ]);

      if (photosForFaceQuery.error || ordersQuery.error) {
        if (!cancelled) {
          setError(photosForFaceQuery.error?.message ?? ordersQuery.error?.message ?? 'Erreur de chargement.');
          setLoading(false);
        }
        return;
      }

      const photoIds = (photosForFaceQuery.data ?? []).map((p: { id: string }) => p.id);
      let facesCount = 0;

      if (photoIds.length > 0) {
        const { count } = await supabase.from('photo_faces').select('id', { count: 'exact', head: true }).in('photo_id', photoIds);
        facesCount = count ?? 0;
      }

      const paidRevenueCents = (ordersQuery.data ?? [])
        .filter((order: { status: string }) => order.status === 'paid')
        .reduce((sum: number, order: { total_amount: number | null }) => sum + (order.total_amount ?? 0), 0);

      if (!cancelled) {
        setStats({
          totalEvents,
          publishedEvents,
          totalPhotos: photoCount ?? 0,
          processingPhotos: processingCount ?? 0,
          totalFaces: facesCount,
          paidRevenueCents,
        });
        setLoading(false);
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const revenueFormatted = useMemo(() => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.paidRevenueCents / 100);
  }, [stats.paidRevenueCents]);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white p-6 md:p-8 shadow-lg">
        <p className="text-indigo-100 text-sm mb-2">Pilotage business</p>
        <h2 className="text-3xl font-bold">Tableau de bord</h2>
        <p className="mt-2 text-indigo-100">Suivi en temps réel de tes événements, photos et performances de matching.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <StatCard title="Revenus encaissés" value={revenueFormatted} helper="Commandes payées" icon={<Euro size={18} />} loading={loading} />
        <StatCard title="Événements publiés" value={`${stats.publishedEvents} / ${stats.totalEvents}`} helper="Visibles aux invités" icon={<Camera size={18} />} loading={loading} />
        <StatCard title="Photos uploadées" value={String(stats.totalPhotos)} helper="Tous événements confondus" icon={<Images size={18} />} loading={loading} />
        <StatCard title="Photos en traitement" value={String(stats.processingPhotos)} helper="Pipeline IA en cours" icon={<Clock3 size={18} />} loading={loading} />
        <StatCard title="Visages détectés" value={String(stats.totalFaces)} helper="Embeddings sauvegardés" icon={<Users size={18} />} loading={loading} />
        <StatCard title="Qualité IA" value={stats.totalFaces > 0 ? 'Active' : 'En démarrage'} helper={stats.totalFaces > 0 ? 'Détections opérationnelles' : 'Importe des photos pour lancer'} icon={<Sparkles size={18} />} loading={loading} />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  helper,
  icon,
  loading,
}: {
  title: string;
  value: string;
  helper: string;
  icon: ReactNode;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">{icon}</div>
      </div>
      <p className="text-2xl font-semibold text-slate-900">{loading ? '...' : value}</p>
      <p className="text-xs text-slate-500 mt-2">{helper}</p>
    </div>
  );
}
