import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeProvider';
import { CartItem } from '../types/product';
import { databases } from '../lib/appwrite';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  formatCurrency: (amount: number) => string;
}

export const OrderSummary = ({ 
  items,
  subtotal,
  shipping,
  total,
  formatCurrency
}: OrderSummaryProps) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<string>('');

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Please add items to your cart before proceeding to checkout.");
      return;
    }
    
    // Add immediate client-side stock validation before server check
    const outOfStockItems = items.filter(item => item.product.stock_quantity <= 0);
    const lowStockItems = items.filter(item => 
      item.product.stock_quantity > 0 && 
      item.product.stock_quantity < item.quantity
    );
    
    if (outOfStockItems.length > 0) {
      const itemNames = outOfStockItems.map(item => item.product.name).join(', ');
      toast.error(`Cannot proceed with checkout: ${itemNames} ${outOfStockItems.length === 1 ? 'is' : 'are'} out of stock.`);
      return;
    }
    
    if (lowStockItems.length > 0) {
      const itemDetails = lowStockItems.map(item => 
        `${item.product.name} (${item.product.stock_quantity} available, ${item.quantity} requested)`
      ).join(', ');
      toast.error(`Cannot proceed with checkout: ${itemDetails}`);
      return;
    }
    
    setIsSubmitting(true);
    setCheckoutStatus('Initializing checkout...');

    try {
      // Price validation before checkout
      setCheckoutStatus('Validating prices...');
      const invalidPriceItems = items.filter(item => !item.product?.price || item.product.price <= 0);
      if (invalidPriceItems.length > 0) {
        const invalidItems = invalidPriceItems.map(item => item.product?.name || 'Unknown product').join(', ');
        toast.error(`Cannot checkout with invalid prices for: ${invalidItems}`);
        setIsSubmitting(false);
        setCheckoutStatus('');
        return;
      }
      
      // Final stock verification before checkout
      setCheckoutStatus('Verifying stock availability...');
      const productIds = items.map(item => item.product.id);
      
      if (productIds.length > 0) {
        try {
          // Check stock for each product
          const stockChecks = await Promise.all(
            items.map(async (item) => {
              try {
                const product = await databases.getDocument(
                  import.meta.env.VITE_APPWRITE_DATABASE_ID,
                  import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
                  item.product.id
                );
                
                return {
                  name: product.name || item.product.name,
                  requested: item.quantity,
                  available: product.stock_quantity || product.stock || 0,
                  hasEnoughStock: (product.stock_quantity || product.stock || 0) >= item.quantity
                };
              } catch (error) {
                console.error(`Error checking stock for ${item.product.name}:`, error);
                return {
                  name: item.product.name,
                  requested: item.quantity,
                  available: 0,
                  hasEnoughStock: false,
                  error: true
                };
              }
            })
          );

          // Check if any products have insufficient stock
          const outOfStockItems = stockChecks.filter(item => !item.hasEnoughStock);
          
          if (outOfStockItems.length > 0) {
            const itemsList = outOfStockItems
              .map(item => `${item.name} (${item.available} available, ${item.requested} requested)`)
              .join(', ');
            
            toast.error(`Cannot proceed with checkout: ${itemsList}`);
            setIsSubmitting(false);
            setCheckoutStatus('');
            return;
          }
          
          // If products have stock errors (couldn't be verified)
          const errorItems = stockChecks.filter(item => item.error);
          if (errorItems.length > 0) {
            toast.error("Could not verify stock for some items. Please try again.");
            setIsSubmitting(false);
            setCheckoutStatus('');
            return;
          }
        } catch (error) {
          console.error('Error during stock verification:', error);
          toast.error("Could not verify product availability. Please try again.");
          setIsSubmitting(false);
          setCheckoutStatus('');
          return;
        }
      }

      // All checks passed, proceed to checkout
      setCheckoutStatus('Redirecting to checkout...');
      toast.success("You're being redirected to complete your order.");
      
      // Small delay to allow toast to be seen
      setTimeout(() => {
        navigate('/checkout');
      }, 500);
      
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
      setCheckoutStatus('');
    }
  };

  return (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-6 shadow-md`}>
      <h2 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Order Summary</h2>
      
      <dl className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <dt className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Subtotal</dt>
          <dd className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(subtotal)}</dd>
        </div>
        
        <div className="flex items-center justify-between">
          <dt className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Shipping</dt>
          <dd className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {shipping === 0 ? 'Free' : formatCurrency(shipping)}
          </dd>
        </div>
        
        <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} pt-4 flex items-center justify-between`}>
          <dt className={`text-base font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Order total</dt>
          <dd className={`text-base font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(total)}</dd>
        </div>
      </dl>
      
      <div className="mt-6">
        <button
          type="button"
          onClick={handleCheckout}
          disabled={isSubmitting || items.length === 0}
          className={`w-full rounded-md border border-transparent ${
            isDarkMode 
              ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500' 
              : 'bg-black hover:bg-gray-800 focus:ring-gray-500'
          } py-3 px-4 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 ${
            (isSubmitting || items.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          tabIndex={0}
          aria-label="Proceed to checkout"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {checkoutStatus || 'Processing...'}
            </span>
          ) : (
            'Checkout'
          )}
        </button>
      </div>
    </div>
  );
}; 