'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function JoinEventPage() {
  const [slug, setSlug] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (slug.trim()) {
      router.push(`/e/${encodeURIComponent(slug.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search size={32} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Rejoindre un événement</h1>
        <p className="text-gray-500 mb-8">Entrez le code ou le nom de l&apos;événement fourni par votre photographe.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Ex: mariage-alice-bob"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition transform active:scale-95"
          >
            Accéder aux photos
          </button>
        </form>

        <p className="mt-6 text-xs text-gray-400">
          En rejoignant, vous acceptez l&apos;utilisation de la reconnaissance faciale pour trouver vos photos.
        </p>
      </div>
    </div>
  );
}
