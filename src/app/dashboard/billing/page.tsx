'use client';

import { useState } from 'react';

export default function BillingPage() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (priceId: string) => {
    setLoading(true);
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
        if (data.error) alert('Erreur Stripe (Configurer API Keys): ' + data.error);
        else alert('Erreur inconnue');
      }
    } catch (error) {
      console.error(error);
      alert('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Abonnement & Facturation</h2>

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
               onClick={() => handleSubscribe('price_pro_example_id')}
               disabled={loading}
               className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
             >
               {loading ? '...' : 'Mettre à niveau'}
             </button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg hover:border-indigo-500 transition cursor-pointer">
             <div>
               <h4 className="font-bold">Pack Héritage (Premium)</h4>
               <p className="text-sm text-gray-600">99€ / mois - Illimité, 0% Commission</p>
             </div>
             <button
               onClick={() => handleSubscribe('price_premium_example_id')}
               disabled={loading}
               className="text-indigo-600 border border-indigo-600 px-4 py-2 rounded text-sm hover:bg-indigo-50 disabled:opacity-50"
             >
               {loading ? '...' : 'Mettre à niveau'}
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
           <p className="text-xs text-gray-500 mt-2">Pour tester, vous devez ajouter STRIPE_SECRET_KEY dans .env.local et remplacer les IDs de prix.</p>
        </div>
      </div>
    </div>
  );
}
