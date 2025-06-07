import { create } from 'zustand';
import { Product } from '../types/product';
import { getProducts, createProduct as createProductService, updateProduct as updateProductService, deleteProduct as deleteProductService } from '../services/product.service';

// Track if a fetch is already in progress to prevent duplicate calls
let isFetchingProducts = false;

// Create a type for color data that only includes the required fields
export interface ProductColorInput {
  name: string;
  hex: string;
}

interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  createProduct: (product: Omit<Product, 'id' | 'created_at' | 'colors'>, colors: ProductColorInput[]) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Omit<Product, 'id' | 'created_at'>>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  optimisticDelete: (id: string) => void;
  rollbackDelete: (product: Product) => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    // Skip if already fetching to prevent duplicate calls
    if (isFetchingProducts) {
      console.log('Skipping duplicate fetchProducts call - already in progress');
      return;
    }
    
    set({ loading: true, error: null });
    isFetchingProducts = true;
    
    try {
      console.log('Fetching products from Appwrite');
      const products = await getProducts();
      
      if (!products || products.length === 0) {
        console.warn('No products found');
        set({ products: [], error: null });
        return;
      }
      
      console.log('Products fetched successfully:', products.length, 'products');
      
      // Validate products for potential issues
      const outOfStockProducts = products.filter(product => product.stock_quantity <= 0);
      const zeroPricedProducts = products.filter(product => !product.price || product.price <= 0);
      const productsWithoutImages = products.filter(
        p => !p.image_url && 
             (!p.colors || p.colors.length === 0 || !p.colors.some(c => c.image_url)) &&
             (!p.gallery_images || p.gallery_images.length === 0)
      );
      
      console.log(`Found ${outOfStockProducts.length} products out of stock out of ${products.length} total products`);
      
      if (zeroPricedProducts.length > 0) {
        console.error(`Found ${zeroPricedProducts.length} products with zero or invalid prices:`);
        zeroPricedProducts.forEach(product => {
          console.error(`- ${product.name} (ID: ${product.id}) has invalid price: ${product.price}`);
        });
      }
      
      if (productsWithoutImages.length > 0) {
        console.warn(`Found ${productsWithoutImages.length} products without any images:`);
        productsWithoutImages.forEach(p => {
          console.warn(`- ${p.name} (ID: ${p.id}) is missing an image`);
        });
      }
      
      // Filter out products with invalid prices to prevent issues in the UI
      const validProducts = products.filter(product => product.price > 0);
      if (validProducts.length < products.length) {
        console.warn(`Filtered out ${products.length - validProducts.length} products with invalid prices`);
        set({ 
          products: validProducts,
          error: zeroPricedProducts.length > 0 ? 
            `${zeroPricedProducts.length} products have invalid prices and were hidden.` : null
        });
      } else {
        set({ products, error: null });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      set({ 
        error: `Failed to load products: ${(error as Error).message}. Please try refreshing the page.`,
        products: [] // Clear products on error to avoid showing stale data
      });
    } finally {
      set({ loading: false });
      isFetchingProducts = false;
    }
  },

  optimisticDelete: (id: string) => {
    set(state => ({
      products: state.products.filter(product => product.id !== id)
    }));
  },

  rollbackDelete: (product: Product) => {
    set(state => ({
      products: [...state.products, product]
    }));
  },

  deleteProduct: async (id: string) => {
    const deletedProduct = get().products.find(p => p.id === id);
    if (!deletedProduct) return;

    // Optimistically remove the product
    get().optimisticDelete(id);

    try {
      await deleteProductService(id);
    } catch (error) {
      // If the delete fails, rollback the optimistic update
      console.error('Error deleting product:', error);
      get().rollbackDelete(deletedProduct);
      throw error;
    }
  },

  createProduct: async (product, colors) => {
    set({ loading: true });
    try {
      const newProduct = await createProductService({
        ...product,
        colors: [], // Colors will be added by the service
      }, colors);

      set(state => ({
        products: [newProduct, ...state.products],
        error: null
      }));
    } catch (error) {
      console.error('Error creating product:', error);
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateProduct: async (id, updates) => {
    set({ loading: true });
    try {
      const updatedProduct = await updateProductService(id, updates);

      set(state => ({
        products: state.products.map(product =>
          product.id === id ? updatedProduct : product
        ),
        error: null
      }));
    } catch (error) {
      console.error('Error updating product:', error);
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));