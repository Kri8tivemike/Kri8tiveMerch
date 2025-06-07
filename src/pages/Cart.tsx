import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeProvider';
import { CartItem } from '../types/product';
import { useEffect, useState } from 'react';
import { databases } from '../lib/appwrite';
import { getProduct } from '../services/product.service';
import { OrderSummary } from '../components/OrderSummary';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount);
};

export default function Cart() {
  const { items, removeItem, updateQuantity, addItem } = useCart();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [isUpdating, setIsUpdating] = useState(false);
  const [stockCheckInProgress, setStockCheckInProgress] = useState(false);

  // Validate cart items on mount
  useEffect(() => {
    const validateCartItems = async () => {
      // Identify invalid items
      const invalidItems = items.filter((item: CartItem) => !item.product || !item.product.id);
      if (invalidItems.length > 0) {
        invalidItems.forEach((item: CartItem) => {
          if (item.product?.id) {
            removeItem(item.product.id);
          }
        });
        toast.error("Some invalid items have been removed from your cart.");
      }

      // Verify stock availability and product data for all cart items
      if (items.length > 0) {
        setStockCheckInProgress(true);
        try {
          // Fetch each product directly using getProduct service
          const updatedItems = await Promise.all(
            items.map(async (item: CartItem) => {
              try {
                // Fetch the full product data with pricing
                const fullProduct = await getProduct(item.product.id);
                
                // If product is out of stock, return null to indicate it should be removed
                if (fullProduct.stock_quantity <= 0) {
                  // This product will be removed from cart
                  return null;
                }
                
                // Create an updated cart item with the full product data
                return {
                  ...item,
                  product: fullProduct,
                  // Adjust quantity if needed based on stock
                  quantity: Math.min(item.quantity, fullProduct.stock_quantity)
                };
              } catch (error) {
                console.error(`Error fetching product ${item.product.id}:`, error);
                // Keep the item as is if there's an error
                return item;
              }
            })
          );

          // Filter out null items (out of stock products)
          const filteredItems = updatedItems.filter(item => item !== null);
          
          // Track which items were removed due to being out of stock
          const removedItems = items.filter(originalItem => 
            !filteredItems.some(updatedItem => 
              updatedItem && updatedItem.product.id === originalItem.product.id
            )
          );
          
          // Check if any items were removed due to being out of stock
          const hasRemovedItems = removedItems.length > 0;

          // Check if any quantities were adjusted
          const hasQuantityUpdates = filteredItems.some((updatedItem, index) => 
            updatedItem && items[index] && updatedItem.quantity !== items[index].quantity
          );

          // Check if any prices changed
          const hasPriceUpdates = filteredItems.some((updatedItem, index) => 
            updatedItem && items[index] && 
            updatedItem.product.price !== items[index].product.price && 
            updatedItem.product.price !== 0
          );

          // Update the cart with refreshed product data
          if (hasRemovedItems || hasQuantityUpdates || hasPriceUpdates) {
            // Remove all items first
            items.forEach(item => {
              if (item.product.id) {
                removeItem(item.product.id);
              }
            });
            
            // Add back only valid items
            filteredItems.forEach(item => {
              if (item && item.product.id) {
                // Only add back if the product has a valid price and stock
                if (item.product.price > 0 && item.product.stock_quantity > 0) {
                  addItem(item.product, item.quantity, item.selectedColor);
                }
              }
            });

            if (hasRemovedItems) {
              const removedNames = removedItems.map(item => item.product.name).join(", ");
              toast.error(`Some items have been removed from your cart because they are out of stock: ${removedNames}`);
            }

            if (hasQuantityUpdates) {
              toast.success("Some item quantities were adjusted based on available stock.");
            }

            if (hasPriceUpdates) {
              toast.success("Some product prices have been updated to current values.");
            }
          }
        } catch (error) {
          console.error('Error refreshing cart data:', error);
        } finally {
          setStockCheckInProgress(false);
        }
      }
    };

    validateCartItems();
  }, [items, removeItem, updateQuantity, toast, addItem]);

  // Add a helper function to validate product prices
  const validatePrices = () => {
    let hasInvalidPrices = false;
    
    // Check for invalid prices in cart items
    items.forEach(item => {
      if (!item.product?.price || item.product.price <= 0) {
        console.error(`Invalid price for product ${item.product?.id}: ${item.product?.price}`);
        hasInvalidPrices = true;
      }
    });
    
    if (hasInvalidPrices) {
      console.warn('Found products with invalid prices in cart');
      toast.error("Some products in your cart have invalid prices. Please try refreshing the page or removing these items.");
    }
    
    return !hasInvalidPrices;
  };

  // Run price validation when cart changes
  useEffect(() => {
    if (items.length > 0) {
      validatePrices();
    }
  }, [items]);

  // Calculate subtotal with price validation
  const subtotal = items.reduce(
    (sum: number, item: CartItem) => {
      const price = item.product?.price || 0;
      if (price <= 0) {
        console.warn(`Product ${item.product?.id || 'unknown'} has invalid price: ${price}`);
      }
      return sum + price * item.quantity;
    },
    0
  );
  
  const shipping = subtotal > 10000 ? 0 : 1500; // Free shipping over ₦10,000, else ₦1,500
  const total = subtotal + shipping;

  const handleQuantityChange = async (
    productId: string,
    currentQty: number,
    change: number
  ) => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const newQty = currentQty + change;
      if (newQty < 1) {
        toast.error("Quantity cannot be less than 1. Remove item instead.");
        setIsUpdating(false);
        return;
      }

      // Check stock availability in real-time
      try {
        const product = await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
          productId
        );
      
        // Handle field name mismatch - server uses 'stock' but client code uses 'stock_quantity'
        const stockQuantity = product.stock_quantity !== undefined ? product.stock_quantity : product.stock || 0;
        
        if (newQty > stockQuantity) {
          toast.error(`Only ${stockQuantity} items available.`);
          // Update to maximum available if current quantity is too high
          if (currentQty > stockQuantity) {
            updateQuantity(productId, stockQuantity);
          }
          setIsUpdating(false);
          return;
        }

        updateQuantity(productId, newQty);
        
        // Only show toast when increasing quantity to avoid too many notifications
        if (change > 0) {
          toast.success(`Quantity updated to ${newQty}.`);
        }
      } catch (error) {
        console.error('Error checking stock:', error);
        toast.error("Could not verify stock availability. Please try again.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      removeItem(productId);
      toast.success(`${productName} has been removed from your cart.`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (stockCheckInProgress) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'} pt-24`}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-gray-400' : 'border-gray-900'}`} />
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'} pt-24`}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <ShoppingBag className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <h2 className={`mt-2 text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Your cart is empty</h2>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Start shopping to add items to your cart
            </p>
            <div className="mt-6">
              <Link
                to="/shop"
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  isDarkMode 
                    ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500' 
                    : 'bg-black hover:bg-gray-800 focus:ring-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-offset-2`}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'} pt-24`}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'} sm:text-4xl`}>
          Shopping Cart
        </h1>

        <form className="mt-12 lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start xl:gap-x-16">
          <div className="lg:col-span-7">
            <div className="space-y-8">
              {items.map((item: CartItem) => (
                <div 
                  key={`${item.product.id}-${item.quantity}-${item.selectedColor || ''}`} 
                  className={`flex flex-col sm:flex-row gap-6 pb-6 ${isDarkMode ? 'border-gray-700' : 'border-b'}`}
                >
                  <div className={`w-full sm:w-24 h-24 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-md overflow-hidden`}>
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <h3 className={`text-base font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {item.product.name}
                        </h3>
                        {item.selectedColor && (
                          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Color: {item.selectedColor}
                          </p>
                        )}
                        {item.product.price <= 0 && (
                          <p className={`mt-1 text-sm text-red-500`}>
                            Price error detected
                          </p>
                        )}
                      </div>
                      <p className={`ml-4 text-base font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {item.product.price > 0 ? 
                          formatCurrency(item.product.price * item.quantity) : 
                          <span className="text-red-500">Invalid price</span>
                        }
                      </p>
                    </div>

                    <div className="mt-4 sm:mt-0 sm:pr-9 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isUpdating}
                          className={`rounded-md p-1 ${
                            isUpdating 
                              ? 'text-gray-400' 
                              : isDarkMode 
                                ? 'text-gray-400 hover:text-gray-200' 
                                : 'text-gray-600 hover:text-gray-900'
                          }`}
                          onClick={() => item.product.id && handleQuantityChange(
                            item.product.id,
                            item.quantity,
                            -1
                          )}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} select-none w-8 text-center`}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={isUpdating}
                          className={`rounded-md p-1 ${
                            isUpdating 
                              ? 'text-gray-400' 
                              : isDarkMode 
                                ? 'text-gray-400 hover:text-gray-200' 
                                : 'text-gray-600 hover:text-gray-900'
                          }`}
                          onClick={() => item.product.id && handleQuantityChange(
                            item.product.id,
                            item.quantity,
                            1
                          )}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={isUpdating}
                        className={`ml-4 ${
                          isUpdating 
                            ? 'text-gray-400' 
                            : isDarkMode 
                              ? 'text-gray-400 hover:text-gray-200' 
                              : 'text-gray-600 hover:text-gray-900'
                        }`}
                        onClick={() => item.product.id && handleRemoveItem(
                          item.product.id,
                          item.product.name
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 lg:col-span-5 lg:mt-0">
            <OrderSummary 
              items={items}
              subtotal={subtotal}
              shipping={shipping}
              total={total}
              formatCurrency={formatCurrency}
            />
          </div>
        </form>
      </div>
    </div>
  );
}