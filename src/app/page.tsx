import Link from 'next/link';
import { Camera, Shield, Zap, Search } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
              Where is Simon?
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-indigo-100">
              La plateforme photo intelligente pour vos événements.
              Retrouvez vos souvenirs instantanément grâce à la reconnaissance faciale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link
                href="/login"
                className="bg-white text-indigo-600 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition shadow-lg text-lg"
              >
                Je suis Photographe
              </Link>
              <Link
                href="/join"
                className="bg-indigo-800 bg-opacity-30 border border-white border-opacity-30 text-white px-8 py-3 rounded-full font-bold hover:bg-opacity-40 transition shadow text-lg backdrop-blur-sm flex items-center justify-center"
              >
                Je suis Invité
              </Link>
            </div>
            <p className="mt-4 text-sm text-indigo-200">
              Invités : utilisez le lien fourni par votre photographe (ex: /e/mariage-alice-bob)
            </p>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-80 h-96 bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/20 shadow-2xl transform rotate-3 hover:rotate-0 transition duration-500">
               <div className="absolute inset-0 flex items-center justify-center text-white/20">
                  <Search size={120} />
               </div>
               <div className="relative z-10 bg-white rounded-xl h-full overflow-hidden shadow-inner flex flex-col">
                  <div className="h-1/2 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-6xl">📸</span>
                  </div>
                  <div className="p-6 flex-1 flex flex-col items-center justify-center text-gray-800 text-center">
                    <p className="font-bold text-lg mb-2">1. Prenez un selfie</p>
                    <p className="text-sm text-gray-500">Notre IA scanne la galerie en millisecondes.</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Pourquoi choisir Where is Simon?</h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">Une solution pensée pour les photographes professionnels et leurs clients.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-6">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant & Magique</h3>
              <p className="text-gray-600">Fini le tri manuel de milliers de photos. Vos invités accèdent à leurs souvenirs en 3 secondes chrono.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-6">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Respect de la vie privée</h3>
              <p className="text-gray-600">Accès sécurisé. Les invités ne voient que les photos où ils apparaissent (selon configuration).</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center mb-6">
                <Camera size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Ventes Additionnelles</h3>
              <p className="text-gray-600">Boostez vos revenus avec la vente de tirages et de fichiers HD intégrée directement dans la galerie.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Tiers */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Offres Photographes</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="border border-gray-200 rounded-2xl p-8 hover:border-indigo-300 transition relative">
              <h3 className="text-lg font-semibold text-gray-900">Pack Souvenir</h3>
              <div className="mt-4 flex items-baseline text-gray-900">
                <span className="text-4xl font-extrabold tracking-tight">Gratuit</span>
                <span className="ml-1 text-xl font-semibold text-gray-500">/mois</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">Idéal pour tester.</p>
              <ul className="mt-6 space-y-4 text-sm text-gray-700">
                <li className="flex">✅ 500 photos max</li>
                <li className="flex">✅ Conservation 3 mois</li>
                <li className="flex">✅ Reconnaissance Faciale</li>
                <li className="flex text-gray-400">❌ Vente de tirages</li>
              </ul>
              <Link href="/login" className="mt-8 block w-full bg-indigo-50 border border-indigo-200 rounded-md py-2 text-sm font-semibold text-indigo-700 text-center hover:bg-indigo-100">
                Commencer
              </Link>
            </div>

            {/* Pro */}
            <div className="border-2 border-indigo-600 rounded-2xl p-8 shadow-xl relative transform scale-105 bg-white">
              <div className="absolute top-0 right-0 -mt-3 -mr-3 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full uppercase">
                Populaire
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Pack Événement</h3>
              <div className="mt-4 flex items-baseline text-gray-900">
                <span className="text-4xl font-extrabold tracking-tight">29€</span>
                <span className="ml-1 text-xl font-semibold text-gray-500">/mois</span>
              </div>
              <ul className="mt-6 space-y-4 text-sm text-gray-700">
                <li className="flex">✅ 5 000 photos</li>
                <li className="flex">✅ Conservation 2 ans</li>
                <li className="flex">✅ Logo personnalisé</li>
                <li className="flex">✅ Vente (Commission 10%)</li>
                <li className="flex">✅ Outils Marketing (Email)</li>
              </ul>
              <Link href="/login" className="mt-8 block w-full bg-indigo-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-indigo-700">
                Choisir Pro
              </Link>
            </div>

            {/* Premium */}
            <div className="border border-gray-200 rounded-2xl p-8 hover:border-indigo-300 transition">
              <h3 className="text-lg font-semibold text-gray-900">Pack Héritage</h3>
              <div className="mt-4 flex items-baseline text-gray-900">
                <span className="text-4xl font-extrabold tracking-tight">99€</span>
                <span className="ml-1 text-xl font-semibold text-gray-500">/mois</span>
              </div>
              <ul className="mt-6 space-y-4 text-sm text-gray-700">
                <li className="flex">✅ Photos Illimitées</li>
                <li className="flex">✅ Archive à vie</li>
                <li className="flex">✅ Marque Blanche totale</li>
                <li className="flex">✅ 0% Commission</li>
                <li className="flex">✅ CRM & SMS</li>
              </ul>
              <Link href="/login" className="mt-8 block w-full bg-indigo-50 border border-indigo-200 rounded-md py-2 text-sm font-semibold text-indigo-700 text-center hover:bg-indigo-100">
                Contacter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p>&copy; 2024 Where is Simon?. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
