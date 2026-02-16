'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Order = Database['public']['Tables']['orders']['Row'];
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO;
const PREMIUM_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM;

function isConfiguredPrice(priceId: string | undefined) {
  return Boolean(priceId && priceId.startsWith('price_') && !priceId.includes('example'));
}

export default function BillingPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBillingData() {
      setLoadError(null);
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) return;

      const { data: eventsData, error: eventsError } = await supabase.from('events').select('id').eq('photographer_id', userId);
      if (eventsError) {
        if (!cancelled) setLoadError(eventsError.message);
        return;
      }
      const eventIds = (eventsData ?? []).map((event: { id: string }) => event.id);
      if (eventIds.length === 0) {
        if (!cancelled) setOrders([]);
        return;
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('event_id', eventIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (ordersError) {
        if (!cancelled) setLoadError(ordersError.message);
        return;
      }

      if (!cancelled) setOrders(ordersData ?? []);
    }

    loadBillingData();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const paidRevenue = useMemo(() => {
    const cents = orders.filter((order) => order.status === 'paid').reduce((sum, order) => sum + (order.total_amount ?? 0), 0);
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  }, [orders]);

  const handleSubscribe = async (priceId: string) => {
    if (!isConfiguredPrice(priceId)) {
      setCheckoutError('Prix Stripe non configuré. Ajoute NEXT_PUBLIC_STRIPE_PRICE_PRO et NEXT_PUBLIC_STRIPE_PRICE_PREMIUM dans Vercel/ENV.');
      return;
    }

    setLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          successUrl: window.location.href + '?success=true',
          cancelUrl: window.location.href + '?canceled=true',
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        if (data.error) setCheckoutError(`Erreur Stripe: ${data.error}`);
        else setCheckoutError('Erreur inconnue lors du checkout');
      }
    } catch (error) {
      console.error(error);
      setCheckoutError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Abonnement & Facturation</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Revenus encaissés</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{paidRevenue}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Commandes</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{orders.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Commandes payées</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{orders.filter((o) => o.status === 'paid').length}</p>
        </div>
      </div>

      {loadError && <p className="text-sm text-red-600 mb-4">Erreur statistiques: {loadError}</p>}
      {checkoutError && <p className="text-sm text-red-600 mb-4">{checkoutError}</p>}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
           <div className="flex justify-between items-center">
             <div>
               <h3 className="text-lg font-medium text-gray-900">Votre forfait actuel</h3>
               <p className="text-sm text-gray-500">Pack Souvenir (Starter)</p>
             </div>
             <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase">
               Actif
             </span>
           </div>
        </div>

        <div className="p-6 grid gap-6">
          <div className="flex items-center justify-between p-4 border rounded-lg hover:border-indigo-500 transition cursor-pointer bg-gray-50">
             <div>
               <h4 className="font-bold">Pack Événement (Pro)</h4>
               <p className="text-sm text-gray-600">29€ / mois - Plus de stockage, Branding, Ventes</p>
             </div>
             <button
               onClick={() => handleSubscribe(PRO_PRICE_ID || '')}
               disabled={loading || !isConfiguredPrice(PRO_PRICE_ID)}
               className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
             >
               {loading ? '...' : isConfiguredPrice(PRO_PRICE_ID) ? 'Mettre à niveau' : 'Configurer le prix'}
             </button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg hover:border-indigo-500 transition cursor-pointer">
             <div>
               <h4 className="font-bold">Pack Héritage (Premium)</h4>
               <p className="text-sm text-gray-600">99€ / mois - Illimité, 0% Commission</p>
             </div>
             <button
               onClick={() => handleSubscribe(PREMIUM_PRICE_ID || '')}
               disabled={loading || !isConfiguredPrice(PREMIUM_PRICE_ID)}
               className="text-indigo-600 border border-indigo-600 px-4 py-2 rounded text-sm hover:bg-indigo-50 disabled:opacity-50"
             >
               {loading ? '...' : isConfiguredPrice(PREMIUM_PRICE_ID) ? 'Mettre à niveau' : 'Configurer le prix'}
             </button>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200">
           <h4 className="font-bold text-sm text-gray-900 mb-4">Moyen de paiement</h4>
           <div className="flex items-center space-x-4">
              <div className="bg-white border rounded p-2">
                 <span className="font-mono">**** **** **** 4242</span>
              </div>
              <button className="text-sm text-indigo-600 hover:underline">Modifier</button>
           </div>
           <p className="text-xs text-gray-500 mt-2">
             Ajoute `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PRICE_PRO`, `NEXT_PUBLIC_STRIPE_PRICE_PREMIUM` dans l&apos;environnement.
           </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg mt-6 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Dernières commandes</h3>
        {orders.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune commande pour le moment.</p>
        ) : (
          <ul className="space-y-3">
            {orders.slice(0, 10).map((order) => (
              <li key={order.id} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{order.customer_email}</p>
                  <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format((order.total_amount ?? 0) / 100)}
                  </p>
                  <p className="text-xs text-slate-500 uppercase">{order.status}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
