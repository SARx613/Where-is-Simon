'use client';

import Link from 'next/link';
import { Bell, Camera, CreditCard, LayoutDashboard, LogOut, Settings, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/services/auth.service';

import { Menu, X as XIcon } from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: "Vue d'ensemble", icon: LayoutDashboard },
    { href: '/dashboard/events', label: 'Événements', icon: Camera },
    { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
    { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
    { href: '/dashboard/billing', label: 'Facturation', icon: CreditCard },
  ];

  const handleLogout = async () => {
    await signOut(supabase);
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur border-b border-slate-200 p-4 z-20 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-600">WhereIsSimon</h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md hover:bg-gray-100">
          {sidebarOpen ? <XIcon /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-10 w-72 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-200 ease-in-out md:translate-x-0 md:relative
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 hidden md:block border-b border-slate-100">
          <h1 className="text-2xl font-bold text-indigo-600">WhereIsSimon</h1>
          <p className="text-sm text-slate-500 mt-1">Dashboard photographe</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-16 md:mt-6">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center space-x-3 p-3 rounded-lg transition ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
                }`}
              >
                <Icon size={19} />
                <span className="font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-3 text-sm">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} />
              <span className="font-semibold">Mode croissance</span>
            </div>
            <p className="text-indigo-100 text-xs">Active tes notifications et la galerie publique pour augmenter tes ventes.</p>
          </div>
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
