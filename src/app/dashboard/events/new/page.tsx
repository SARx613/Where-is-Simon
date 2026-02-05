'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function NewEventPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    description: '',
    tier: 'starter',
    slug: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Auto-generate slug from name if slug is not manually edited (basic logic)
      slug: name === 'name' && !prev.slug ? value.toLowerCase().replace(/[^a-z0-9]+/g, '-') : (name === 'slug' ? value : prev.slug)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Vous devez être connecté');

      // Use RPC to bypass potential PGRST205 cache issues
      const { data, error } = await supabase.rpc('create_event', {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        date: formData.date,
        location: formData.location,
        description: formData.description,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tier: formData.tier as any
      });

      if (error) {
        console.error("Supabase Error:", error);
        throw new Error(error.message + " (" + error.code + ")");
      }

      // RPC returns { id: ... } inside data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(`/dashboard/events/${(data as any).id}`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erreur inconnue";
      console.error("Creation failed:", error);
      alert('Erreur lors de la création : ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Créer un nouvel événement</h2>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;événement</label>
          <input
            type="text"
            name="name"
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              name="date"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.date}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL (Slug)</label>
            <input
              type="text"
              name="slug"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.slug}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
          <input
            type="text"
            name="location"
            className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.location}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            rows={3}
            className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Choisir un Forfait</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Starter */}
            <label className={`cursor-pointer border-2 rounded-xl p-4 transition hover:border-indigo-300 ${formData.tier === 'starter' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <input
                  type="radio"
                  name="tier"
                  value="starter"
                  checked={formData.tier === 'starter'}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold uppercase bg-gray-200 text-gray-700 px-2 py-1 rounded">Gratuit</span>
              </div>
              <h3 className="font-bold text-gray-900">Pack Souvenir</h3>
              <p className="text-xs text-gray-500 mt-1">500 photos, 3 mois</p>
            </label>

            {/* Pro */}
            <label className={`cursor-pointer border-2 rounded-xl p-4 transition hover:border-indigo-300 relative ${formData.tier === 'pro' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <input
                  type="radio"
                  name="tier"
                  value="pro"
                  checked={formData.tier === 'pro'}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold uppercase bg-indigo-100 text-indigo-700 px-2 py-1 rounded">29€/mois</span>
              </div>
              <h3 className="font-bold text-gray-900">Pack Événement</h3>
              <p className="text-xs text-gray-500 mt-1">5 000 photos, Branding, Ventes</p>
            </label>

            {/* Premium */}
            <label className={`cursor-pointer border-2 rounded-xl p-4 transition hover:border-indigo-300 ${formData.tier === 'premium' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <input
                  type="radio"
                  name="tier"
                  value="premium"
                  checked={formData.tier === 'premium'}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold uppercase bg-yellow-100 text-yellow-800 px-2 py-1 rounded">99€/mois</span>
              </div>
              <h3 className="font-bold text-gray-900">Pack Héritage</h3>
              <p className="text-xs text-gray-500 mt-1">Illimité, Archive, 0% Com</p>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg mr-2"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer l\'événement'}
          </button>
        </div>
      </form>
    </div>
  );
}
