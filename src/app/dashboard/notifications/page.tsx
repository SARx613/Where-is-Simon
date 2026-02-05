'use client';

import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Notifications</h2>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4 p-4 bg-indigo-50 rounded-lg mb-4">
          <div className="bg-indigo-100 p-2 rounded-full">
            <Bell className="text-indigo-600" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-indigo-900">Notification &quot;You&apos;ve been spotted&quot;</h3>
            <p className="text-sm text-indigo-700">
              Cette fonctionnalité enverra une alerte push aux invités lorsqu&apos;une nouvelle photo d&apos;eux est détectée.
              (Nécessite une configuration de serveur Push Notification Service)
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-auto">
            <input type="checkbox" value="" className="sr-only peer" checked disabled />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <p className="text-gray-500 text-center py-8">Aucune notification récente.</p>
      </div>
    </div>
  );
}
