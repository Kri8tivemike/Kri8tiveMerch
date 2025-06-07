import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types/product';
import { getProduct } from "../services/product.service";
import toast from 'react-hot-toast';

// Define the shape of our cart context
interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, selectedColor?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
  error: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        // Make sure parsedCart is an array
        if (Array.isArray(parsedCart)) {
          setItems(parsedCart);
        } else {
          console.error('Cart data is not an array:', parsedCart);
          setItems([]);
          localStorage.removeItem('cart');
        }
      } else {
        // Initialize with empty array if no cart exists
        setItems([]);
      }
    } catch (e) {
      console.error('Failed to parse cart from localStorage:', e);
      setItems([]);
      localStorage.removeItem('cart');
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // Validate cart items against current product data
  const validateCart = async () => {
    if (!Array.isArray(items) || items.length === 0) return;

    try {
      const productIds = items.map(item => item.product?.id).filter(Boolean);
      if (productIds.length === 0) {
        // If we have items but no valid product IDs, clear the cart
        setItems([]);
        return;
      }

      let hasChanges = false;
      let hasStockIssues = false;
      let hasCustomizationChanges = false;
      let hasImageChanges = false;
      let hasInfoChanges = false;

      // Fetch current product data for all items in cart
      const products = await Promise.all(
        productIds.map(async (id) => {
          try {
            return await getProduct(id);
          } catch (error) {
            console.error(`Error fetching product ${id}:`, error);
            return null;
          }
        })
      );
      
      const validProducts = products.filter(Boolean); // Remove nulls
      
      const updatedItems = items.map(item => {
        // Skip invalid items
        if (!item.product?.id) return null;
        
        const currentProduct = validProducts.find(p => p && p.id === item.product.id);
        
        if (!currentProduct) {
          hasChanges = true;
          return null; // Product no longer exists
        }

        // Check for stock changes
        if (currentProduct.stock_quantity < item.quantity) {
          hasStockIssues = true;
          hasChanges = true;
          return {
            ...item,
            quantity: currentProduct.stock_quantity,
            product: currentProduct
          };
        }

        // Check for customization changes
        if (currentProduct.customizable !== item.product.customizable) {
          hasCustomizationChanges = true;
          hasChanges = true;
        }

        // Check for image changes
        if (currentProduct.image_url !== item.product.image_url) {
          hasImageChanges = true;
          hasChanges = true;
        }

        // Check for name or description changes
        if (currentProduct.name !== item.product.name || 
            currentProduct.description !== item.product.description) {
          hasInfoChanges = true;
          hasChanges = true;
        }

        // Update the product data in the cart item
        return {
          ...item,
          product: currentProduct
        };
      });

      // Remove null items (products that no longer exist)
      const filteredItems = updatedItems.filter((item): item is CartItem => item !== null);

      if (hasChanges) {
        setItems(filteredItems);
        
        // Set appropriate error message based on what changed
        if (hasStockIssues) {
          setError('Some items in your cart have limited stock');
        } else if (hasCustomizationChanges) {
          setError('Some items in your cart have updated customization options');
        } else if (hasImageChanges) {
          setError('Some items in your cart have updated images');
        } else if (hasInfoChanges) {
          setError('Some items in your cart have updated information');
        } else {
          setError('Some items in your cart have been updated');
        }

        // Show toast if provided
        toast.success('Your cart has been updated due to product changes');
      }
    } catch (error) {
      console.error('Error validating cart:', error);
      setError('Failed to validate cart items');
      // Don't clear the cart on error, let the user decide what to do
    }
  };

  // Validate cart whenever it changes
  useEffect(() => {
    validateCart();
  }, [items]);

  const addItem = (product: Product, quantity = 1, selectedColor?: string) => {
    if (!product || !product.id) {
      console.error('Attempted to add invalid product to cart:', product);
      return;
    }

    // Validate product price to ensure it's not zero or invalid
    if (!product.price || product.price <= 0) {
      console.error('Attempted to add product with invalid price to cart:', product);
      toast.error('Unable to add product with invalid price to cart');
      return;
    }
    
    // Log the product being added for debugging
    console.log('Adding product to cart:', { 
      id: product.id, 
      name: product.name, 
      price: product.price, 
      quantity 
    });
    
    setItems(currentItems => {
      // Ensure currentItems is an array
      const safeItems = Array.isArray(currentItems) ? currentItems : [];
      
      const existingItem = safeItems.find(item => 
        item.product?.id === product.id && 
        (!selectedColor || item.selectedColor === selectedColor)
      );

      if (existingItem) {
        // Update quantity of existing item
        const newQuantity = existingItem.quantity + quantity;
        
        // Check if we have enough stock
        if (newQuantity > product.stock_quantity) {
          toast.error(`Only ${product.stock_quantity} items available`);
          return safeItems;
        }

        return safeItems.map(item =>
          item.product?.id === product.id && (!selectedColor || item.selectedColor === selectedColor)
            ? { ...item, quantity: newQuantity, product: { ...product } } // Ensure we use the latest product data
            : item
        );
      } else {
        // Check if we have enough stock for new item
        if (quantity > product.stock_quantity) {
          toast.error(`Only ${product.stock_quantity} items available`);
          return safeItems;
        }

        // Add new item (make a deep copy of the product to avoid reference issues)
        return [...safeItems, { 
          product: { ...product }, 
          quantity, 
          selectedColor 
        }];
      }
    });
  };

  const removeItem = (productId: string) => {
    if (!productId) {
      console.error('Attempted to remove item with invalid product ID');
      return;
    }
    
    setItems(currentItems => {
      // Ensure currentItems is an array
      const safeItems = Array.isArray(currentItems) ? currentItems : [];
      return safeItems.filter(item => item.product?.id !== productId);
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (!productId || typeof quantity !== 'number' || quantity < 1) {
      console.error('Invalid arguments for updateQuantity:', { productId, quantity });
      return;
    }
    
    setItems(currentItems => {
      // Ensure currentItems is an array
      const safeItems = Array.isArray(currentItems) ? currentItems : [];
      
      return safeItems.map(item => {
        if (item.product?.id === productId) {
          // Check if we have enough stock
          if (quantity > (item.product?.stock_quantity || 0)) {
            toast.error(`Only ${item.product?.stock_quantity} items available`);
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      });
    });
  };

  // Calculate totals
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  const total = items.reduce((sum, item) => {
    // Ensure we have valid price and quantity
    const price = item.product?.price || 0;
    const quantity = item.quantity || 0;
    return sum + (price * quantity);
  }, 0);

  // Expose error to UI
  const clearError = () => setError(null);

  // Clear cart
  const clearCart = () => {
    setItems([]);
    setError(null);
  };

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      total,
      error
    }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
