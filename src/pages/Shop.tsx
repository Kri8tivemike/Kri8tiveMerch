import { useEffect } from 'react';
import ProductList from '../components/ProductList';
import { useProductStore } from '../stores/productStore';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../hooks/use-toast';
import type { Product, ProductFilters, ProductSort } from '../types/product';
import { usePersistentState } from '../hooks/usePersistentState';
import { useTheme } from '../contexts/ThemeProvider';

export default function Shop() {
  const { fetchProducts, products } = useProductStore();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { theme } = useTheme();

  // Using usePersistentState to save filters, sort, and pagination between navigations
  const [filters, setFilters] = usePersistentState<ProductFilters>('shop-filters', {});
  const [sort, setSort] = usePersistentState<ProductSort>('shop-sort', { 
    field: 'created_at', 
    direction: 'desc' 
  });
  const [currentPage, setCurrentPage] = usePersistentState<number>('shop-page', 1);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  // Handle filter changes
  const handleFiltersChange = (newFilters: ProductFilters) => {
    setFilters(newFilters);
    // Reset to page 1 when filters change
    setCurrentPage(1);
  };
  
  // Handle sort changes
  const handleSortChange = (newSort: ProductSort) => {
    setSort(newSort);
    // Reset to page 1 when sort changes
    setCurrentPage(1);
  };
  
  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle adding product to cart
  const handleAddToCart = (product: Product) => {
    // Default to first color and size if available
    const colorIndex = 0;
    const size = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Default';

    // Validate the product data before adding to cart
    if (!product || !product.id) {
      toast({
        title: 'Error',
        description: 'Invalid product data. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    // Check price validity
    if (!product.price || product.price <= 0) {
      toast({
        title: 'Invalid price',
        description: 'This product has an invalid price and cannot be added to cart.',
        variant: 'destructive',
      });
      console.error(`Attempted to add product with invalid price to cart:`, product);
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
      // Log the product being added for debugging
      console.log('Adding product to cart from Shop:', { 
        id: product.id, 
        name: product.name, 
        price: product.price 
      });
      
      // Use the correct function signature: addItem(product, quantity, selectedColor)
      const selectedColor = product.colors && product.colors.length > 0 ? 
        product.colors[colorIndex].name : undefined;
      
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

  return (
    <div className="min-h-screen bg-white dark:bg-dark-background transition-colors duration-200">
      {/* ProductList with persistent state and Add to Cart functionality */}
      <ProductList 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" 
        itemsPerPage={12} 
        initialFilters={filters}
        onFiltersChange={handleFiltersChange}
        initialSort={sort}
        onSortChange={handleSortChange}
        initialPage={currentPage}
        onPageChange={handlePageChange}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}