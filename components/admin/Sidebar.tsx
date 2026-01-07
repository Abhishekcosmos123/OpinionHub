'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard?tab=dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Polls',
      href: '/admin/dashboard?tab=polls',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      name: 'Categories',
      href: '/admin/dashboard?tab=categories',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
  ];

  const isActive = (href: string) => {
    // If pathname is /admin/dashboard, check for tab parameter
    if (pathname === '/admin/dashboard') {
      if (typeof window !== 'undefined' && href.includes('tab=')) {
        const tab = new URLSearchParams(window.location.search).get('tab');
        const hrefTab = new URLSearchParams(href.split('?')[1] || '').get('tab');
        // If no tab in URL, default to dashboard
        if (!tab && hrefTab === 'dashboard') return true;
        // Only match if the tab parameter exactly matches
        return tab === hrefTab;
      }
      // If href is dashboard without tab param, and no tab in URL, it's active
      if (href.includes('tab=dashboard') || (href === '/admin/dashboard')) {
        const tab = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null;
        return !tab || tab === 'dashboard';
      }
    }
    // For paths without tab parameter, check if pathname matches
    const hrefPath = href.split('?')[0];
    return pathname === hrefPath;
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white fixed left-0 top-16 bottom-0 z-40 overflow-y-auto shadow-2xl border-r border-gray-700">
      <div className="flex flex-col h-full">
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 transform ${
                  active
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50 scale-105'
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white hover:scale-105 hover:shadow-md'
                }`}
              >
                <div className={`${active ? 'scale-110' : ''} transition-transform duration-300`}>
                  {item.icon}
                </div>
                <span className="font-semibold">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-gray-700/50">
          <button
            onClick={onLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 text-gray-300 hover:bg-red-600/20 hover:text-red-300 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-md border border-transparent hover:border-red-500/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-semibold">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

