import Link from 'next/link';
import { Camera, LayoutDashboard, Settings, LogOut } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-indigo-600">WhereIsSimon</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link href="/dashboard" className="flex items-center space-x-2 p-3 text-gray-700 hover:bg-indigo-50 rounded-lg">
            <LayoutDashboard size={20} />
            <span>Vue d'ensemble</span>
          </Link>
          <Link href="/dashboard/events" className="flex items-center space-x-2 p-3 text-gray-700 hover:bg-indigo-50 rounded-lg">
            <Camera size={20} />
            <span>Événements</span>
          </Link>
          <Link href="/dashboard/settings" className="flex items-center space-x-2 p-3 text-gray-700 hover:bg-indigo-50 rounded-lg">
            <Settings size={20} />
            <span>Paramètres</span>
          </Link>
        </nav>

        <div className="p-4 border-t">
          <button className="flex items-center space-x-2 text-red-500 hover:bg-red-50 w-full p-3 rounded-lg">
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
