import { useEffect, useState, ReactNode } from 'react';
import type { Product, ProductSort } from '../types/product';
import ProductCard from './product/ProductCard';
import ProductFiltersComponent from './product/ProductFilters';
import ProductSortComponent from './product/ProductSort';
import { useToast } from '../hooks/use-toast';
import { useProductStore } from '../stores/productStore';
import { AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useTheme } from '../contexts/ThemeProvider';

// Import the extended interface from ProductFilters
interface ExtendedProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  inStock?: boolean;
}

// Create a custom component for the view indicator
const ViewIndicator = (): ReactNode => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-full p-3 transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg">
        <Eye className="w-5 h-5 text-primary-orange dark:text-primary-orange-light" />
      </div>
      <span className="absolute bottom-4 text-white text-sm font-medium bg-black bg-opacity-70 px-3 py-1 rounded-md transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        View Details
      </span>
    </div>
  );
};

interface ProductListProps {
  className?: string;
  onEdit?: (productId: string) => void;
  onDelete?: (productId: string) => void;
  isAdminView?: boolean;
  itemsPerPage?: number;
  // Allow for controlling filters/sort from parent
  initialFilters?: ExtendedProductFilters;
  onFiltersChange?: (filters: ExtendedProductFilters) => void;
  initialSort?: ProductSort;
  onSortChange?: (sort: ProductSort) => void;
  // Allow for controlling pagination from parent
  initialPage?: number;
  onPageChange?: (page: number) => void;
  // Add to cart callback
  onAddToCart?: (product: Product) => void;
}

export default function ProductList({ 
  className = '', 
  onEdit,
  onDelete,
  isAdminView = false,
  itemsPerPage = 12,
  initialFilters,
  onFiltersChange,
  initialSort,
  onSortChange,
  initialPage = 1,
  onPageChange,
  onAddToCart
}: ProductListProps) {
  const { products, loading, error, fetchProducts } = useProductStore();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<ExtendedProductFilters>(initialFilters || {});
  const [sort, setSort] = useState<ProductSort>(initialSort || { field: 'created_at', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const { toast } = useToast();
  const { theme } = useTheme();

  // Update internal state if props change
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  useEffect(() => {
    if (initialSort) {
      setSort(initialSort);
    }
  }, [initialSort]);

  useEffect(() => {
    if (initialPage) {
      setCurrentPage(initialPage);
    }
  }, [initialPage]);

  // Handle errors with toast notifications
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading products',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Validate and clean product data
  useEffect(() => {
    if (products && products.length > 0) {
      // Check for products with missing images
      const productsWithoutImages = products.filter(
        p => !p.image_url && 
             (!p.colors || p.colors.length === 0 || !p.colors.some(c => c.image_url)) &&
             (!p.gallery_images || p.gallery_images.length === 0)
      );
      
      if (productsWithoutImages.length > 0) {
        console.warn(`Found ${productsWithoutImages.length} products without any images`);
        productsWithoutImages.forEach(p => {
          console.warn(`Product without image: ${p.name} (ID: ${p.id})`);
        });
      }
    }
  }, [products]);

  // Extract unique categories from products
  useEffect(() => {
    const uniqueCategories = Array.from(
      new Set(products.map((product) => product.category))
    ).filter(Boolean).sort();
    setCategories(uniqueCategories);
  }, [products]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...products];

    // Apply filters
    if (filters.category) {
      result = result.filter(product => product.category === filters.category);
    }
    if (filters.minPrice !== undefined) {
      result = result.filter(product => product.price >= (filters.minPrice ?? 0));
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter(product => product.price <= (filters.maxPrice ?? Infinity));
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
      );
    }
    // Apply in-stock filter
    if (filters.inStock) {
      result = result.filter(product => product.stock_quantity > 0);
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sort.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sort.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
      
      return 0;
    });

    setFilteredProducts(result);
    setTotalPages(Math.max(1, Math.ceil(result.length / itemsPerPage)));
    
    // When filters/sort change, reset to first page
    if (currentPage !== 1) {
      handlePageChange(1);
    }
  }, [products, filters, sort, itemsPerPage]);
  
  // Handle pagination
  useEffect(() => {
    // Get slice of products for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedProducts(filteredProducts.slice(startIndex, endIndex));
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handleRetry = () => {
    fetchProducts();
  };
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // If parent provided onPageChange, call it
      if (onPageChange) {
        onPageChange(page);
      } else {
        // Only scroll if parent doesn't control pagination (parent might do this itself)
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };
  
  // Handle filter changes with option to notify parent
  const handleFilterChange = (newFilters: ExtendedProductFilters) => {
    setFilters(newFilters);
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  // Handle sort changes with option to notify parent
  const handleSortChange = (newSort: ProductSort) => {
    setSort(newSort);
    if (onSortChange) {
      onSortChange(newSort);
    }
  };

  // Create a reusable view indicator for non-admin view
  const viewIndicatorElement = !isAdminView ? <ViewIndicator /> : undefined;

  if (loading) {
    return (
      <div className={className}>
        <div className="flex justify-between mb-6">
          <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="space-y-4">
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Failed to load products</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">{error}</p>
          <button
            onClick={handleRetry}
            className="mt-4 px-4 py-2 bg-primary-orange text-black dark:text-white rounded-md hover:bg-primary-orange-dark transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-6">
        <ProductFiltersComponent
          filters={filters}
          onFilterChange={handleFilterChange}
          categories={categories}
        />
        <ProductSortComponent 
          sort={sort} 
          onSortChange={handleSortChange} 
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No products found</p>
          {Object.keys(filters).length > 0 && (
            <button 
              onClick={() => handleFilterChange({})} 
              className="mt-2 text-sm text-primary-orange hover:text-primary-orange-dark dark:hover:text-primary-orange-light"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={`${isAdminView 
            ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' 
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'}`}
          >
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={onEdit}
                onDelete={onDelete}
                isAdminView={isAdminView}
                onAddToCart={onAddToCart}
                viewIndicator={viewIndicatorElement}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-md flex items-center ${
                    currentPage === 1
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  const isActive = page === currentPage;

                  // Show only current page, first, last, and 1 page before/after current
                  const shouldShow =
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1;

                  if (!shouldShow) {
                    // Show ellipsis only in the right positions
                    if (
                      (page === 2 && currentPage > 3) ||
                      (page === totalPages - 1 && currentPage < totalPages - 2)
                    ) {
                      return (
                        <span
                          key={page}
                          className="px-2 text-gray-500 dark:text-gray-400"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded-md ${
                        isActive
                          ? 'bg-primary-orange text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      aria-label={`Page ${page}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-md flex items-center ${
                    currentPage === totalPages
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}