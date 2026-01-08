'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

function NavbarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = pathname?.startsWith('/admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize search query from URL
  useEffect(() => {
    if (pathname === '/' && !isAdmin) {
      const search = searchParams.get('search') || '';
      setSearchQuery(search);
    }
  }, [pathname, searchParams, isAdmin]);

  // Debounced search - automatically search as user types
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Only search if we're on the home page
    if (pathname !== '/' || isAdmin) {
      return;
    }

    // Set new timer for debounced search
    debounceTimer.current = setTimeout(() => {
      const trimmedQuery = searchQuery.trim();
      
      if (trimmedQuery) {
        // Update URL with search query
        const params = new URLSearchParams();
        params.set('search', trimmedQuery);
        router.push(`/?${params.toString()}`, { scroll: false });
      } else {
        // Clear search if query is empty
        router.push('/', { scroll: false });
      }
    }, 500); // 500ms debounce delay

    // Cleanup function
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, pathname, router, isAdmin]);

  // Clear search when navigating away from home
  useEffect(() => {
    if (pathname !== '/' && !isAdmin) {
      setSearchQuery('');
    }
  }, [pathname, isAdmin]);

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-xl border-b-2 border-gradient-to-r from-indigo-200 to-purple-200 fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16 gap-2 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 group" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <span className="text-white font-bold text-lg sm:text-xl">O</span>
            </div>
            <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              OpinionHub
            </span>
          </Link>

          {/* Search Box - Only show on user side, hidden on mobile when menu is open */}
          {!isAdmin && (
            <div className={`flex-1 max-w-md mx-2 sm:mx-4 ${mobileMenuOpen ? 'hidden' : 'block'}`}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pl-8 sm:pl-10 pr-8 sm:pr-4 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg bg-white/90 backdrop-blur-sm"
                />
                <svg
                  className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      router.push('/', { scroll: false });
                    }}
                    className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
            {!isAdmin && (
              <>
                {/* Navigation Buttons */}
                <div className="flex items-center space-x-2">
                  <Link
                    href="/"
                    className="px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium rounded-lg transition-all duration-300 hover:bg-indigo-50"
                  >
                    Home
                  </Link>
                  <button
                    onClick={() => {
                      const categorySection = document.querySelector('[data-category-section]');
                      if (categorySection) {
                        categorySection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium rounded-lg transition-all duration-300 hover:bg-indigo-50"
                  >
                    Categories
                  </button>
                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium rounded-lg transition-all duration-300 hover:bg-indigo-50"
                  >
                    Trending
                  </button>
                  <button
                    className="px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium rounded-lg transition-all duration-300 hover:bg-indigo-50"
                  >
                    About
                  </button>
                </div>
                
                {/* CTA Button */}
                <Link
                  href="/admin/login"
                  className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Admin Login
                </Link>
              </>
            )}
            {isAdmin && (
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                View Site
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          {!isAdmin && (
            <div className="md:hidden flex items-center space-x-2">
              <Link
                href="/admin/login"
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 shadow-lg"
              >
                Login
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {!isAdmin && mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 font-medium rounded-lg transition-all duration-300"
              >
                Home
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  const categorySection = document.querySelector('[data-category-section]');
                  if (categorySection) {
                    categorySection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-4 py-2 text-left text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 font-medium rounded-lg transition-all duration-300"
              >
                Categories
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2 text-left text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 font-medium rounded-lg transition-all duration-300"
              >
                Trending
              </button>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-left text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 font-medium rounded-lg transition-all duration-300"
              >
                About
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg"></div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                OpinionHub
              </span>
            </div>
          </div>
        </div>
      </nav>
    }>
      <NavbarContent />
    </Suspense>
  );
}

