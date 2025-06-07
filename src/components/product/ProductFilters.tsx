import { useState } from 'react';
import { ProductFilters } from '../../types/product';
import { Filter, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeProvider';

// Create an extended interface to include inStock
interface ExtendedProductFilters extends ProductFilters {
  inStock?: boolean;
}

interface ProductFiltersProps {
  filters: ExtendedProductFilters;
  onFilterChange: (filters: ExtendedProductFilters) => void;
  categories: string[];
  className?: string;
}

export default function ProductFiltersComponent({
  filters,
  onFilterChange,
  categories,
  className = '',
}: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== ''
  ).length;

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      onFilterChange({ ...filters, category });
    } else if (filters.category === category) {
      // If unchecking the currently selected category, remove the filter
      const { category, ...rest } = filters;
      onFilterChange(rest);
    }
  };

  const handlePriceChange = (field: 'minPrice' | 'maxPrice', value: string) => {
    const numericValue = value === '' ? undefined : parseFloat(value);
    onFilterChange({ ...filters, [field]: numericValue });
  };

  const handleStockChange = (checked: boolean) => {
    if (checked) {
      onFilterChange({ ...filters, inStock: true });
    } else {
      // Remove the inStock filter when unchecked
      const { inStock, ...rest } = filters;
      onFilterChange(rest);
    }
  };

  const handleClearFilters = () => {
    onFilterChange({});
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-orange"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="filter-options"
      >
        <Filter className="h-4 w-4 mr-2" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-primary-orange text-white text-xs rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id="filter-options"
          className="absolute z-10 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg p-4 space-y-4"
          onBlur={() => setIsOpen(false)}
        >
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-900 dark:text-white">Filters</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-primary-orange hover:text-primary-orange-dark dark:hover:text-primary-orange-light flex items-center"
              >
                <X className="h-3 w-3 mr-1" />
                Clear all
              </button>
            )}
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Categories</h4>
              <div className="space-y-2 max-h-40 overflow-auto">
                {categories.map((category) => (
                  <div key={category} className="flex items-center">
                    <input
                      id={`category-${category}`}
                      type="checkbox"
                      className="h-4 w-4 text-primary-orange focus:ring-primary-orange-light border-gray-300 rounded"
                      checked={filters.category === category}
                      onChange={(e) => handleCategoryChange(category, e.target.checked)}
                    />
                    <label
                      htmlFor={`category-${category}`}
                      className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Range */}
          <div>
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Price Range</h4>
            <div className="flex space-x-2">
              <div>
                <label htmlFor="min-price" className="sr-only">
                  Minimum Price
                </label>
                <input
                  id="min-price"
                  type="number"
                  min="0"
                  placeholder="Min"
                  className="block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-primary-orange focus:border-primary-orange sm:text-sm"
                  value={filters.minPrice ?? ''}
                  onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="max-price" className="sr-only">
                  Maximum Price
                </label>
                <input
                  id="max-price"
                  type="number"
                  min="0"
                  placeholder="Max"
                  className="block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-primary-orange focus:border-primary-orange sm:text-sm"
                  value={filters.maxPrice ?? ''}
                  onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Stock Availability */}
          <div>
            <div className="flex items-center">
              <input
                id="in-stock"
                type="checkbox"
                className="h-4 w-4 text-primary-orange focus:ring-primary-orange-light border-gray-300 rounded"
                checked={!!filters.inStock}
                onChange={(e) => handleStockChange(e.target.checked)}
              />
              <label
                htmlFor="in-stock"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                In Stock Only
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
