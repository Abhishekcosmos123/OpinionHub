'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Category } from '@/types';

interface CategorySidebarProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export default function CategorySidebar({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategorySidebarProps) {
  const [showAll, setShowAll] = useState(false);
  const maxVisible = 10;
  const shouldShowMore = categories.length > maxVisible;
  const visibleCategories = showAll ? categories : categories.slice(0, maxVisible);

      return (
        <aside className="w-64 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-5 h-fit sticky top-20 border-2 border-gray-100">
          <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-5">Categories</h3>
      <div className="space-y-2">
            <button
              onClick={() => onCategoryChange('')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform ${
                selectedCategory === ''
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-2 border-blue-400 shadow-lg scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-105 hover:shadow-md border-2 border-transparent'
              }`}
            >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            selectedCategory === ''
              ? 'bg-blue-100'
              : 'bg-gray-200'
          }`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <span>All Categories</span>
        </button>
        {visibleCategories.map((category) => (
          <button
            key={category._id}
            onClick={() => onCategoryChange(category._id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform ${
              selectedCategory === category._id
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-2 border-blue-400 shadow-lg scale-105'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-105 hover:shadow-md border-2 border-transparent'
            }`}
          >
            <div className={`relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ${
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
                  <span className="text-lg font-bold text-gray-600">
                    {category.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <span className="text-left">{category.name}</span>
          </button>
        ))}
        {shouldShowMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-center px-4 py-2 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
          >
            {showAll ? 'Show Less' : `Show More (${categories.length - maxVisible} more)`}
          </button>
        )}
      </div>
    </aside>
  );
}

