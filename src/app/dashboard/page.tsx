export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Tableau de bord</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500 group relative">
          <div className="flex justify-between items-start">
             <h3 className="text-gray-500 text-sm font-medium">Commissions sur Ventes</h3>
             <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full cursor-help" title="Gains générés par la vente de tirages photo aux invités">?</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">0,00 €</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm font-medium">Événements actifs</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-pink-500">
          <h3 className="text-gray-500 text-sm font-medium">Photos uploadées</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
      </div>
    </div>
  );
}
