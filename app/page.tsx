'use client';

import { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import PollCard from '@/components/PollCard';
import CategorySidebar from '@/components/CategorySidebar';
import Pagination from '@/components/Pagination';
import { Poll, Category } from '@/types';

function HomeContent() {
  const searchParams = useSearchParams();
  const [trendingPolls, setTrendingPolls] = useState<Poll[]>([]);
  const [allPolls, setAllPolls] = useState<Poll[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const trendingScrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Hero image rotation - Using actual images
  const heroImages = [
    { 
      image: '/hero-banner.jpg', 
      gradient: 'from-blue-900/85 via-indigo-800/80 via-purple-800/75 to-pink-700/70',
      title: 'Take your knowledge to another level'
    },
    
  ];
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const heroIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get search query from URL
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchPolls = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // When searching, use the dedicated search endpoint
      if (searchQuery) {
        const searchParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: '12',
          sortBy: 'createdAt',
          sortOrder: 'desc',
          q: searchQuery, // Use 'q' parameter for search endpoint
        });
        if (selectedCategory) {
          searchParams.append('category', selectedCategory);
        }
        
        const searchRes = await fetch(`/api/search?${searchParams}`);
        const searchData = await searchRes.json();
        
        if (searchData.success) {
          setTrendingPolls([]); // Clear trending when searching
          setAllPolls(searchData.polls);
          setTotalPages(searchData.pagination?.totalPages || 1);
        } else {
          setError(searchData.error || 'Failed to search polls');
        }
        setLoading(false);
        return;
      }

      // Fetch trending polls (only when not searching)
      const trendingParams = new URLSearchParams({
        page: '1',
        limit: '12',
        sortBy: 'yesVotes',
        sortOrder: 'desc',
        trending: 'true',
      });
      if (selectedCategory) {
        trendingParams.append('category', selectedCategory);
      }

      // Fetch all polls (non-trending)
      const allParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        trending: 'false', // Only non-trending polls
      });
      if (selectedCategory) {
        allParams.append('category', selectedCategory);
      }

      const [trendingRes, allRes] = await Promise.all([
        fetch(`/api/polls?${trendingParams}`),
        fetch(`/api/polls?${allParams}`),
      ]);

      const trendingData = await trendingRes.json();
      const allData = await allRes.json();

      if (trendingData.success) {
        setTrendingPolls(trendingData.polls);
      }
      if (allData.success) {
        setAllPolls(allData.polls);
        setTotalPages(allData.pagination?.totalPages || 1);
      } else {
        setError(allData.error || 'Failed to fetch polls');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch polls');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, currentPage]);

  // Hero image rotation effect
  useEffect(() => {
    if (searchQuery || isHeroHovered) {
      if (heroIntervalRef.current) {
        clearInterval(heroIntervalRef.current);
        heroIntervalRef.current = null;
      }
      return;
    }

    heroIntervalRef.current = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 4000); // Change image every 4 seconds

    return () => {
      if (heroIntervalRef.current) {
        clearInterval(heroIntervalRef.current);
        heroIntervalRef.current = null;
      }
    };
  }, [searchQuery, isHeroHovered, heroImages.length]);

  // Reset to page 1 when search query or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  // Auto-scroll trending products
  useEffect(() => {
    if (!trendingScrollRef.current || trendingPolls.length === 0 || isHovered || searchQuery) {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      return;
    }

    const scrollContainer = trendingScrollRef.current;
    
    // Cache gap calculation to avoid repeated window.innerWidth access
    const getGap = () => {
      if (typeof window === 'undefined') return 16;
      return window.innerWidth >= 1024 ? 24 : window.innerWidth >= 768 ? 16 : 16;
    };
    
    const gap = getGap();
    
    const scrollToNext = () => {
      if (!scrollContainer) return;
      
      // Use requestAnimationFrame to batch DOM reads
      requestAnimationFrame(() => {
        const scrollWidth = scrollContainer.scrollWidth;
        const clientWidth = scrollContainer.clientWidth;
        const maxScroll = scrollWidth - clientWidth;

        if (maxScroll <= 0) {
          return; // No need to scroll if all items are visible
        }

        const currentScroll = scrollContainer.scrollLeft;
        
        // Get the first visible item to calculate scroll amount
        const firstChild = scrollContainer.firstElementChild as HTMLElement;
        if (!firstChild) return;
        
        // Calculate scroll amount based on item width + gap
        const itemWidth = firstChild.offsetWidth;
        const scrollAmount = itemWidth + gap;
        const nextScroll = currentScroll + scrollAmount;

        if (nextScroll >= maxScroll - 10) {
          // Scroll back to start (with small threshold to handle rounding)
          scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollContainer.scrollTo({ left: nextScroll, behavior: 'smooth' });
        }
      });
    };

    // Initial delay before starting auto-scroll
    const timeoutId = setTimeout(() => {
      autoScrollIntervalRef.current = setInterval(scrollToNext, 5000); // 5 seconds
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    };
  }, [trendingPolls.length, isHovered, searchQuery]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      // Silently fail - categories are optional
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 via-purple-50 to-pink-50 pt-16">
      {/* Hero Section with Rotating Images - Only show when not searching */}
      {!searchQuery && (
        <div 
          className="relative w-full h-64 md:h-80 lg:h-96 mb-6 md:mb-8 overflow-hidden rounded-3xl mx-4 md:mx-6 shadow-2xl"
          onMouseEnter={() => setIsHeroHovered(true)}
          onMouseLeave={() => setIsHeroHovered(false)}
        >
          {/* Rotating Images */}
          <div className="relative w-full h-full">
            {heroImages.map((hero, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentHeroImage ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <div
                  className="w-full h-full bg-cover bg-center relative"
                  style={{
                    backgroundImage: `url('${hero.image}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${hero.gradient} backdrop-blur-sm`}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Overlay */}
          <div className="absolute inset-0 flex items-center z-20">
            <div className="container mx-auto px-4 text-white">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 animate-fade-in">
                Take your
              </h1>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 animate-fade-in">
                knowledge to
              </h1>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 animate-fade-in">
                another level
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl max-w-2xl opacity-90 animate-fade-in-delay">
                Share your opinion on trending products and discover what others think
              </p>
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 flex gap-2">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentHeroImage(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentHeroImage
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 py-4 md:py-6">
        {searchQuery && (
          <div className="mb-6 flex items-center justify-between bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-300 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-gray-600">Search results for:</span>
              <span className="font-semibold text-indigo-600">&quot;{searchQuery}&quot;</span>
            </div>
            <button
              onClick={() => {
                window.history.pushState({}, '', '/');
                window.location.reload(); // Reload to clear search
              }}
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Category Sidebar */}
          <div className="hidden lg:block lg:flex-shrink-0">
            <CategorySidebar
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
                {/* Mobile Category Filter */}
                <div className="lg:hidden mb-6">
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Categories</h3>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleCategoryChange('')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                          selectedCategory === ''
                            ? 'bg-blue-50 text-blue-700 border-2 border-blue-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          selectedCategory === ''
                            ? 'bg-blue-100'
                            : 'bg-gray-200'
                        }`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </div>
                        <span>All</span>
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category._id}
                          onClick={() => handleCategoryChange(category._id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            selectedCategory === category._id
                              ? 'bg-blue-50 text-blue-700 border-2 border-blue-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <div className={`relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ${
                            selectedCategory === category._id
                              ? 'ring-2 ring-blue-400'
                              : ''
                          }`}>
                            {category.image ? (
                              <Image
                                src={category.image}
                                alt={category.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center ${
                                selectedCategory === category._id
                                  ? 'bg-blue-100'
                                  : 'bg-gray-200'
                              }`}>
                                <span className="text-xs font-bold text-gray-600">
                                  {category.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <span>{category.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
                <p className="mt-6 text-gray-600 text-lg font-medium">Loading products...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl text-center max-w-2xl mx-auto">
                <p className="font-medium">{error}</p>
              </div>
            ) : (
              <>
                {/* Trending Products Section */}
                {!searchQuery && trendingPolls.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
                          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                            Trending Products
                          </h2>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">Most popular products right now</p>
                        </div>
                      </div>
                    </div>
                    <div
                      ref={trendingScrollRef}
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                      className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 snap-x snap-mandatory"
                      style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                      }}
                    >
                      {trendingPolls.map((poll) => (
                        <div
                          key={`trending-${poll._id}`}
                          className="flex-shrink-0 snap-start w-[85vw] sm:w-[45vw] md:w-[30vw] lg:w-[calc(25%-18px)] min-w-[280px]"
                        >
                          <PollCard poll={poll} />
                        </div>
                      ))}
                    </div>
                    <style jsx global>{`
                      .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>
                  </div>
                )}

                {/* All Products Section */}
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl transform -rotate-3 hover:-rotate-6 transition-transform duration-300">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
                        {searchQuery ? 'Search Results' : 'All Products'}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1 font-medium">
                        {searchQuery ? `Found ${allPolls.length} result${allPolls.length !== 1 ? 's' : ''}` : 'Explore all available products'}
                      </p>
                    </div>
                  </div>

                  {allPolls.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-md">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <p className="text-gray-600 text-lg font-medium">No products available yet.</p>
                      <p className="text-gray-500 mt-2">Check back later for more products!</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {allPolls.map((poll) => (
                          <PollCard key={`poll-${poll._id}`} poll={poll} />
                        ))}
                      </div>
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

