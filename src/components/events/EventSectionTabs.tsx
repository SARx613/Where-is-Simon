'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SlidersHorizontal, Upload } from 'lucide-react';

export function EventSectionTabs({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const photosHref = `/dashboard/events/${eventId}`;
  const settingsHref = `/dashboard/events/${eventId}/settings`;

  const tabs = [
    { href: photosHref, label: 'Photos & Upload', icon: Upload },
    { href: settingsHref, label: 'Paramètres', icon: SlidersHorizontal },
  ];

  return (
    <div className="border-b border-slate-200 mb-6">
      <nav className="-mb-px flex gap-6">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`inline-flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition ${
                active
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
