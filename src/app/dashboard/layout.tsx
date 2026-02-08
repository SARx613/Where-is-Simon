'use client';

import Link from 'next/link';
import { Camera, LayoutDashboard, Settings, LogOut, CreditCard } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

import { Menu, X as XIcon } from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const supabase = createClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow p-4 z-20 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-600">WhereIsSimon</h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md hover:bg-gray-100">
          {sidebarOpen ? <XIcon /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-white shadow-md flex flex-col transform transition-transform duration-200 ease-in-out md:translate-x-0 md:relative
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-bold text-indigo-600">WhereIsSimon</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-16 md:mt-0">
          <Link href="/dashboard" className="flex items-center space-x-2 p-3 text-gray-700 hover:bg-indigo-50 rounded-lg">
            <LayoutDashboard size={20} />
            <span>Vue d&apos;ensemble</span>
          </Link>
          <Link href="/dashboard/events" className="flex items-center space-x-2 p-3 text-gray-700 hover:bg-indigo-50 rounded-lg">
            <Camera size={20} />
            <span>Événements</span>
          </Link>
          <Link href="/dashboard/notifications" className="flex items-center space-x-2 p-3 text-gray-700 hover:bg-indigo-50 rounded-lg">
            <Settings size={20} />
            <span>Notifications</span>
          </Link>
          <Link href="/dashboard/settings" className="flex items-center space-x-2 p-3 text-gray-700 hover:bg-indigo-50 rounded-lg">
            <Settings size={20} />
            <span>Paramètres</span>
          </Link>
          <Link href="/dashboard/billing" className="flex items-center space-x-2 p-3 text-gray-700 hover:bg-indigo-50 rounded-lg">
            <CreditCard size={20} />
            <span>Facturation</span>
          </Link>
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-red-500 hover:bg-red-50 w-full p-3 rounded-lg"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8">
        {children}
      </main>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-0 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
