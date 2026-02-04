export default function SettingsPage() {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Paramètres</h2>

        <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Profil Photographe</h3>
            <p className="mt-1 text-sm text-gray-500">Ces informations seront visibles sur vos galeries.</p>

            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                <div className="mt-1">
                  <input type="text" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border" placeholder="Jean Dupont" />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Site Web</label>
                <div className="mt-1">
                  <input type="text" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border" placeholder="www.mon-site-photo.com" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Branding</h3>
            <div className="mt-4">
               <label className="flex items-center">
                 <input type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" defaultChecked />
                 <span className="ml-2 text-sm text-gray-900">Afficher le logo &quot;Where is Simon?&quot; (Supprimer avec le plan Pro)</span>
               </label>
            </div>
          </div>

          <div className="p-6 bg-gray-50 flex justify-end">
            <button type="button" className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    );
  }
