'use client';

import { createClient } from '@/lib/supabase';
import { useState } from 'react';
import { Loader } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      alert('Erreur lors de la connexion: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-indigo-600 mb-2">Where is Simon?</h1>
        <p className="text-gray-500 mb-8">Connectez-vous pour gérer vos événements</p>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition shadow-sm"
        >
          {loading ? (
            <Loader className="animate-spin" size={20} />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
          )}
          <span>Continuer avec Google</span>
        </button>

        <p className="mt-6 text-xs text-gray-400">
          En vous connectant, vous acceptez nos conditions d&apos;utilisation.
        </p>
      </div>
    </div>
  );
}
