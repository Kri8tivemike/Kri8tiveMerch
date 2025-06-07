import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProductStore } from '../../stores/productStore';
import type { Product } from '../../types/product';
import ProductCard from '../product/ProductCard';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../hooks/use-toast';
import { useTheme } from '../../contexts/ThemeProvider';
import { getOptimizedImageUrl } from '../../services/imageOptimizer.service';

export default function FeaturedProducts() {
  const { products, loading, error, fetchProducts } = useProductStore();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { theme } = useTheme();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Memoize featured products to prevent unnecessary re-renders
  const featuredProducts = useMemo(() => {
    return products
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 4);
  }, [products]);

  // Preload critical images for better LCP (Largest Contentful Paint)
  useEffect(() => {
    if (featuredProducts.length > 0) {
      // Preload the first product image (above the fold)
      const firstProduct = featuredProducts[0];
      if (firstProduct?.image_url) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        
        // Use the optimized image URL for preloading
        const optimizedUrl = getOptimizedImageUrl(firstProduct.image_url, {
          width: 400,
          height: 400,
          quality: 85
        });
        
        link.href = optimizedUrl || firstProduct.image_url;
        document.head.appendChild(link);
        
        // Cleanup on unmount
        return () => {
          if (document.head.contains(link)) {
            document.head.removeChild(link);
          }
        };
      }
    }
  }, [featuredProducts]);

  // Handle adding product to cart
  const handleAddToCart = (product: Product) => {
    // Validate the product data before adding to cart
    if (!product || !product.id) {
      toast({
        title: 'Error',
        description: 'Invalid product data. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    // Check stock availability
    if (!product.stock_quantity || product.stock_quantity <= 0) {
      toast({
        title: 'Out of stock',
        description: 'This product is currently out of stock.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Get the first available color if any
      const selectedColor = product.colors && product.colors.length > 0 ? 
        product.colors[0].name : undefined;

      addItem(product, 1, selectedColor);
      toast({
        title: 'Added to cart',
        description: `${product.name} has been added to your cart.`,
      });
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item to cart. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Enhanced loading skeleton with better visual hierarchy
  if (loading) {
    return (
      <section className="py-20 bg-gray-50 dark:bg-dark-surface transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-64 mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="group">
                {/* Image skeleton with aspect ratio */}
                <div className="aspect-square rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
                </div>
                
                {/* Content skeleton */}
                <div className="mt-4 space-y-3">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gray-50 dark:bg-dark-surface transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold mb-2">Unable to load products</h3>
              <p className="text-sm opacity-75">{error}</p>
            </div>
            <button 
              onClick={() => fetchProducts()}
              className="btn btn-primary px-6 py-2 rounded-md font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50 dark:bg-dark-surface transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with enhanced styling */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 dark:text-white">Featured Products</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover our latest collection of premium custom t-shirts, optimized for fast loading with AVIF image technology
          </p>
        </div>
        
        {featuredProducts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 9h.01M15 9h.01M9 15h.01M15 15h.01" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No products available</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Check back soon for new arrivals!</p>
            <Link
              to="/shop"
              className="btn btn-primary inline-block px-6 py-2 rounded-md font-medium transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <>
            {/* Products Grid with enhanced performance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  className={`${index === 0 ? 'priority-image' : ''}`} // Mark first image as priority
                />
              ))}
            </div>
            
            {/* Call to Action */}
            <div className="text-center mt-12">
              <Link
                to="/shop"
                className="btn btn-secondary inline-flex items-center px-8 py-3 rounded-md font-medium transition-all duration-200 hover:scale-105"
              >
                <span>View All Products</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}