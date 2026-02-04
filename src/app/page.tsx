import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="text-center p-8">
        <h1 className="text-5xl font-bold text-indigo-600 mb-6">Where is Simon?</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          La plateforme de photos d'événements intelligente.
          Retrouvez instantanément toutes vos photos grâce à la reconnaissance faciale.
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="/dashboard"
            className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition shadow-lg"
          >
            Espace Photographe
          </Link>
          <button className="bg-white text-indigo-600 border border-indigo-200 px-8 py-3 rounded-full font-bold hover:bg-indigo-50 transition shadow">
            Je suis invité
          </button>
        </div>

        <p className="mt-12 text-gray-400 text-sm">
          Pour tester, accédez à une URL d'événement (ex: /e/mon-mariage)
        </p>
      </div>
    </div>
  );
}
