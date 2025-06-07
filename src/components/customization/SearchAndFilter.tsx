import React from 'react';
import { Search, Grid3X3, List } from 'lucide-react';

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-primary-orange focus:border-primary-orange transition-colors duration-200 sm:text-sm"
          aria-label="Search products"
        />
      </div>
      
      <div className="flex items-center space-x-1 sm:space-x-2">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`p-1.5 rounded-md ${
            viewMode === 'grid' 
              ? 'bg-primary-orange/20 text-primary-orange-dark dark:text-primary-orange-light' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          } transition-colors duration-200`}
          aria-label="Grid view"
        >
          <Grid3X3 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`p-1.5 rounded-md ${
            viewMode === 'list' 
              ? 'bg-primary-orange/20 text-primary-orange-dark dark:text-primary-orange-light' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          } transition-colors duration-200`}
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}; 