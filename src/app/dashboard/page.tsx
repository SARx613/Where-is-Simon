export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Tableau de bord</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
          <h3 className="text-gray-500 text-sm font-medium">Revenus ce mois</h3>
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
