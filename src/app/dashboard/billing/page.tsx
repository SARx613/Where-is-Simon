export default function BillingPage() {
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
               <button className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
                 Mettre à niveau
               </button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg hover:border-indigo-500 transition cursor-pointer">
               <div>
                 <h4 className="font-bold">Pack Héritage (Premium)</h4>
                 <p className="text-sm text-gray-600">99€ / mois - Illimité, 0% Commission</p>
               </div>
               <button className="text-indigo-600 border border-indigo-600 px-4 py-2 rounded text-sm hover:bg-indigo-50">
                 Mettre à niveau
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
          </div>
        </div>
      </div>
    );
  }
