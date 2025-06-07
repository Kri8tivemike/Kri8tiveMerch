import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { getOrder } from '../services/order.service';
import { CheckCircle, Package, ArrowLeft, AlertCircle, ShoppingCart } from 'lucide-react';
import { sendOrderNotification } from '../services/telegram.service';
import { account } from '../lib/appwrite';
import { useTheme } from '../contexts/ThemeProvider';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount);
};

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationSent, setNotificationSent] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Function to check if we came from a successful payment (through URL params)
  useEffect(() => {
    const payment = searchParams.get('payment');
    const reference = searchParams.get('reference');
    
    if (payment === 'success' && reference) {
      setPaymentSuccess(true);
      setPaymentReference(reference);
    }
  }, [searchParams]);

  // Function to send Telegram notification
  const sendNotification = async (orderData: any) => {
    try {
      // Only send notification if not already sent
      if (notificationSent) return;
      
      // Get user data if available
      let userName = 'Customer';
      try {
        const user = await account.get();
        userName = user.name || user.$id || 'Customer';
      } catch (error) {
        console.log('Not authenticated, using default customer name');
      }
      
      // Format order items for notification
      const orderItems = orderData.items.map((item: any) => ({
        productName: item.product?.name || 'Product',
        quantity: item.quantity,
        price: item.price
      }));
      
      // Calculate total (order amount + shipping)
      const total = orderData.total_amount + (orderData.shipping_cost || 0);
      
      // Send notification
      await sendOrderNotification({
        orderId: orderData.id,
        customerName: userName,
        orderTotal: total,
        orderItems: orderItems,
        shippingCost: orderData.shipping_cost || 0
      });
      
      setNotificationSent(true);
      console.log('Order notification sent successfully');
    } catch (error) {
      console.error('Failed to send order notification:', error);
      // Don't show error to user - fail silently as this is a background task
    }
  };

  useEffect(() => {
    async function loadOrder() {
      try {
        if (!orderId) throw new Error('No order ID provided');
        
        // Skip loading order for special "error" ID
        if (orderId === 'error') {
          setLoading(false);
          return;
        }
        
        const orderData = await getOrder(orderId);
        setOrder(orderData);
        
        // Send Telegram notification when a new order is loaded
        // Check if order is recent (within last 10 minutes) to avoid sending notifications for old orders
        const orderTime = new Date(orderData.created_at).getTime();
        const currentTime = new Date().getTime();
        const tenMinutesInMs = 10 * 60 * 1000;
        
        if (currentTime - orderTime < tenMinutesInMs) {
          await sendNotification(orderData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} pt-24`}>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-gray-400' : 'border-gray-900'}`} />
          </div>
        </div>
      </div>
    );
  }

  // Payment was successful but order creation failed (likely due to stock issues)
  if (orderId === 'error' && paymentSuccess) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} pt-24`}>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-lg shadow-sm`}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
              <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Payment Successful, But...</h1>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-md mx-auto`}>
                Your payment was processed successfully, but we couldn't complete your order. 
                This usually happens when items go out of stock between checkout and payment.
              </p>
            </div>

            <div className={`border-t border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} py-4 mb-6`}>
              <div className="flex justify-between mb-2">
                <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Payment reference:</span>
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{paymentReference}</span>
              </div>
              <div className="flex justify-between">
                <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Payment date:</span>
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className={`${isDarkMode ? 'bg-amber-900/30' : 'bg-amber-50'} p-4 rounded-md mb-6`}>
              <p className={`${isDarkMode ? 'text-amber-300' : 'text-amber-800'} text-sm`}>
                <strong>What happened?</strong> Your payment was successful, but one or more items in your cart are no longer available or have insufficient stock.
              </p>
              <p className={`${isDarkMode ? 'text-amber-300' : 'text-amber-800'} text-sm mt-2`}>
                <strong>What's next?</strong> Don't worry - your payment has been recorded. 
                Our customer service will contact you soon to resolve this issue. You can either choose alternative items or receive a refund.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <Link
                to="/shop"
                className={`block w-full ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-black hover:bg-gray-800'} text-white text-center py-3 rounded-md font-medium transition-colors`}
              >
                <ShoppingCart className="w-4 h-4 inline-block mr-2" />
                Continue Shopping
              </Link>
              <Link
                to="/contact"
                className={`block w-full ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-black hover:bg-gray-50 border border-gray-300'} text-center py-3 rounded-md font-medium transition-colors`}
              >
                Contact Customer Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !order) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} pt-24`}>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm text-center`}>
            {paymentSuccess ? (
              <>
                <h1 className={`text-2xl font-bold text-amber-600 mb-4`}>Payment Processed</h1>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                  Your payment was successful, but there was an error creating your order. 
                  Please contact our customer support with your payment reference number: {paymentReference}.
                </p>
              </>
            ) : (
              <>
                <h1 className={`text-2xl font-bold text-red-600 mb-4`}>Order Not Found</h1>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>{error || 'Unable to load order details'}</p>
              </>
            )}
            <Link
              to="/"
              className={`inline-flex items-center text-sm ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'}`}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} pt-24`}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-lg shadow-sm`}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Order Confirmed!</h1>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Thank you for your purchase. We'll send you shipping updates via email.
            </p>
          </div>

          <div className={`border-t border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} py-4 mb-6`}>
            <div className="flex justify-between mb-2">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Order number:</span>
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Order date:</span>
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {new Date(order.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className={`flex-shrink-0 w-20 h-20 ${!item.product?.image_url && isDarkMode ? 'bg-gray-700' : ''}`}>
                  {item.product?.image_url ? (
                    <img 
                      src={item.color?.image_url || item.product.image_url} 
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <Package className={`w-full h-full ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.product?.name}</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Quantity: {item.quantity}
                    {item.size && ` • Size: ${item.size}`}
                    {item.color?.name && ` • Color: ${item.color.name}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} pt-4 space-y-2`}>
            <div className="flex justify-between">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Subtotal</span>
              <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(order.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Shipping</span>
              <span>
                {order.shipping_cost === 0 ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(order.shipping_cost || 0)}</span>
                )}
              </span>
            </div>
            <div className={`flex justify-between font-bold pt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <span>Total</span>
              <span>{formatCurrency(order.total_amount + (order.shipping_cost || 0))}</span>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <Link
              to="/"
              className={`block w-full ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-black hover:bg-gray-800'} text-white text-center py-3 rounded-md font-medium transition-colors`}
            >
              Continue Shopping
            </Link>
            <Link
              to="/account"
              className={`block w-full ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-black hover:bg-gray-50 border border-gray-300'} text-center py-3 rounded-md font-medium transition-colors`}
              onClick={() => sessionStorage.setItem('myAccountActiveTab', 'orders')}
            >
              View All Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 