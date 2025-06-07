import { useState, useEffect, useRef } from 'react';
import { useCart } from '../contexts/CartContext';
import { Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../services/order.service';
import { useToast } from '../hooks/use-toast';
import { calculateShippingCost, getShippingLocations, ShippingLocation } from '../services/shipping.service';
import { useTheme } from '../contexts/ThemeProvider';
import { env } from '../config/env';

// Define the PaystackPop type for TypeScript
declare global {
  interface Window {
    PaystackPop: {
      setup(options: {
        key: string;
        email: string;
        amount: number;
        ref?: string;
        metadata?: any;
        callback: (response: any) => void;
        onClose: () => void;
      }): {
        openIframe(): void;
      };
    };
  }
}

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Replace the seedTestShippingLocations function with this version that doesn't try to add locations
const getDefaultShippingLocations = (): ShippingLocation[] => {
  // Return hard-coded shipping locations for UI to use when API access fails
  return [
    { id: 'default-1', state: 'Lagos', city: 'Lagos', cost: 1500 },
    { id: 'default-2', state: 'Lagos', city: 'Ikeja', cost: 1500 },
    { id: 'default-3', state: 'Lagos', city: 'Lekki', cost: 2000 },
    { id: 'default-4', state: 'Lagos', city: 'Victoria Island', cost: 2500 },
    { id: 'default-5', state: 'Abuja', city: 'Central', cost: 2500 },
    { id: 'default-6', state: 'Abuja', city: 'Garki', cost: 3000 },
    { id: 'default-7', state: 'Rivers', city: 'Port Harcourt', cost: 3000 }
  ];
};

export default function Checkout() {
  const navigate = useNavigate();
  const { items, clearCart } = useCart();
  const { theme } = useTheme(); // Get current theme
  const { toast } = useToast(); // Use hook for toast
  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria', // Default country for Nigeria
    postalCode: '',
    phone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingLocations, setShippingLocations] = useState<ShippingLocation[]>([]);
  const [shippingCost, setShippingCost] = useState<number>(1500);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  // Reference to track if Paystack script is loaded
  const paystackLoaded = useRef(false);

  useEffect(() => {
    if (!items || items.length === 0) {
      navigate('/cart');
      return;
    }

    // Only load Paystack script if not already loaded and items exist in cart
    if (!paystackLoaded.current && items.length > 0) {
      paystackLoaded.current = true;
      
      const script = document.createElement('script');
      script.id = 'paystack-script';
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Paystack script loaded successfully');
      };
      
      document.head.appendChild(script);
      
      return () => {
        // Cleanup script on component unmount
        const scriptElem = document.getElementById('paystack-script');
        if (scriptElem) document.head.removeChild(scriptElem);
      };
    }
  }, [items, navigate]);

  useEffect(() => {
    // Load shipping locations
    const loadShippingLocations = async () => {
      try {
        setIsLoadingLocations(true);
        const locations = await getShippingLocations();
        console.log('Raw shipping locations loaded:', locations);
        
        // Ensure we have locations data
        if (!locations || locations.length === 0) {
          console.warn('No shipping locations returned from API, using default data');
          
          // Check if it could be a permissions error from previous calls
          const defaultLocations = getDefaultShippingLocations();
          setShippingLocations(defaultLocations);
          
          // Extract unique states
          const states = [...new Set(defaultLocations.map(loc => loc.state))].sort();
          console.log('Using default states:', states);
          setAvailableStates(states);
          
          // Show a toast with instructions on how to fix properly
          toast.custom((t) => (
            <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} px-6 py-4 shadow-md rounded-lg flex flex-col items-start`}>
              <div className="flex items-center gap-2">
                <span role="img" aria-label="warning" className="text-yellow-500 text-xl">⚠️</span>
                <span className="font-semibold">Shipping data is unavailable</span>
              </div>
              <p className="mt-2 text-sm">You need to run a command to fix shipping permissions.</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    // Copy the command to clipboard
                    navigator.clipboard.writeText('fixShippingPermissions()');
                    toast.success('Command copied to clipboard');
                  }}
                  className={`text-xs px-3 py-1.5 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-md`}
                >
                  Copy Command
                </button>
                <button
                  onClick={() => {
                    // Show more detailed instructions
                    toast((t) => (
                      <div className="px-4 py-3">
                        <div className="font-semibold mb-2">How to fix shipping permissions:</div>
                        <ol className="list-decimal list-inside text-sm space-y-1">
                          <li>Open the browser console (F12 or Cmd+Option+J)</li>
                          <li>Paste or type: <code className="bg-gray-100 text-purple-700 px-1 rounded">fixShippingPermissions()</code></li>
                          <li>Press Enter and wait for confirmation</li>
                          <li>Refresh the page</li>
                        </ol>
                      </div>
                    ), { duration: 10000 });
                  }}
                  className={`text-xs px-3 py-1.5 ${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-md`}
                >
                  Show Instructions
                </button>
              </div>
            </div>
          ), { duration: 15000 });
        } else {
          // Use actual data from API
          setShippingLocations(locations);
          
          // Extract unique states for dropdown
          const states = [...new Set(locations.map(loc => loc.state))].sort();
          console.log('Setting available states from API data:', states);
          setAvailableStates(states);
        }
      } catch (error) {
        console.error('Error loading shipping locations:', error);
        
        // It's definitely a permissions error now, use default data
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Use default shipping cost
        setShippingCost(1500);
        
        // Set default locations for UI not to break
        const defaultLocations = getDefaultShippingLocations();
        setShippingLocations(defaultLocations);
        
        // Extract unique states
        const states = [...new Set(defaultLocations.map(loc => loc.state))].sort();
        console.log('Using default states (after error):', states);
        setAvailableStates(states);
        
        // Show helpful error message with fix instructions and buttons
        toast.custom((t) => (
          <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} px-6 py-4 shadow-md rounded-lg`}>
            <div className="flex items-center gap-2">
              <span role="img" aria-label="error" className="text-red-500 text-xl">🛑</span>
              <span className="font-semibold">Shipping Location Error</span>
            </div>
            <p className="mt-2 text-sm">Permission error accessing shipping data.</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  // Try to execute fixShippingPermissions directly
                  try {
                    // Check if the function exists in the window object
                    if (typeof (window as any).fixShippingPermissions === 'function') {
                      toast.promise(
                        (window as any).fixShippingPermissions(),
                        {
                          loading: 'Fixing permissions...',
                          success: 'Permissions fixed! Refreshing...',
                          error: 'Failed to fix permissions. Try manually.'
                        }
                      ).then(() => {
                        // Refresh the page after successful fix
                        setTimeout(() => window.location.reload(), 1500);
                      });
                    } else {
                      toast.error('Fix function not available. Please run manually in console.');
                    }
                  } catch (err) {
                    console.error('Error running fix function:', err);
                    toast.error('Error running fix. Try manually in console.');
                  }
                }}
                className={`text-xs px-3 py-1.5 ${theme === 'dark' ? 'bg-green-700 hover:bg-green-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-md`}
              >
                Fix Automatically
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('fixShippingPermissions()');
                  toast.success('Command copied to clipboard!');
                }}
                className={`text-xs px-3 py-1.5 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-md`}
              >
                Copy Fix Command
              </button>
            </div>
          </div>
        ), { duration: 20000 });
      } finally {
        setIsLoadingLocations(false);
      }
    };

    loadShippingLocations();
  }, []);

  // Update available cities when state changes
  useEffect(() => {
    if (formData.state) {
      console.log('State selected:', formData.state);
      console.log('Shipping locations for filtering cities:', shippingLocations);
      
      const filteredLocations = shippingLocations.filter(loc => loc.state === formData.state);
      console.log('Filtered locations for state:', filteredLocations);
      
      const cities = filteredLocations.map(loc => loc.city).sort();
      console.log('Setting available cities:', cities);
      
      // Remove duplicates
      const uniqueCities = [...new Set(cities)];
      setAvailableCities(uniqueCities);
      
      // Reset city if the previously selected city isn't available in the new state
      if (formData.city && !uniqueCities.includes(formData.city)) {
        console.log('Resetting city as previously selected city is not available in new state');
        setFormData(prev => ({
          ...prev,
          city: ''
        }));
      }
    } else {
      console.log('No state selected, clearing cities');
      setAvailableCities([]);
      // Clear city when no state is selected
      if (formData.city) {
        setFormData(prev => ({
          ...prev,
          city: ''
        }));
      }
    }
  }, [formData.state, shippingLocations]);

  // Calculate shipping cost when state or city changes
  useEffect(() => {
    const updateShippingCost = async () => {
      if (formData.state && formData.city) {
        try {
          const cost = await calculateShippingCost(formData.state, formData.city);
          if (cost !== null) {
            setShippingCost(cost);
          } else {
            // Default shipping cost if no match found
            setShippingCost(1500);
          }
        } catch (error) {
          console.error('Error calculating shipping cost:', error);
          setShippingCost(1500);
        }
      }
    };

    updateShippingCost();
  }, [formData.state, formData.city]);

  const subtotal = items.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );
  
  // Use dynamic shipping cost
  const shipping = subtotal > 10000 ? 0 : shippingCost;
  const total = subtotal + shipping;

  // Function to check if Paystack is ready
  const isPaystackReady = () => {
    return paystackLoaded.current && window.PaystackPop !== undefined;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      // Show loading state
      setIsProcessing(true);
      const loadingToastId = toast({
        title: "Processing",
        description: "Processing your order...",
      }).id;
      
      // Validate cart items
      if (items.length === 0) {
        toast.dismiss(loadingToastId);
        toast({
          title: "Error",
          description: "Your cart is empty",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Validate product IDs
      const invalidItems = items.filter(item => !item.product?.id);
      if (invalidItems.length > 0) {
        toast.dismiss(loadingToastId);
        toast({
          title: "Error",
          description: "Some items in your cart are invalid",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Validate form data
      if (!formData.email || !formData.firstName || !formData.lastName || 
          !formData.address || !formData.city || !formData.state || !formData.country || 
          !formData.postalCode || !formData.phone) {
        toast.dismiss(loadingToastId);
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Generate unique reference for this transaction
      const reference = 'KRI8TIVE_ORDER_' + Math.floor(Math.random() * 1000000000 + 1);
      
      // Prepare order data
      const orderData = {
        items: items.map(item => ({
          product_id: item.product!.id,
          quantity: item.quantity,
          price: Number(item.product!.price),
          color: item.selectedColor,
          size: item.product?.selectedSize
        })),
        total_amount: Number(subtotal),
        total: Number(total),
        shipping_cost: Number(shipping),
        shipping_address: {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          country: formData.country.trim(),
          postal_code: formData.postalCode.trim(),
          phone: formData.phone.trim()
        }
      };

      // Check if Paystack is loaded
      if (!isPaystackReady()) {
        // If Paystack isn't ready yet, show an error and allow retry
        toast.dismiss(loadingToastId);
        toast({
          title: "Error",
          description: "Payment gateway is not ready yet. Please try again in a moment.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Dismiss loading toast as we're about to show Paystack dialog
      toast.dismiss(loadingToastId);

      // Initialize Paystack payment
      const handler = window.PaystackPop.setup({
        key: env.VITE_PAYSTACK_PUBLIC_KEY,
        email: formData.email,
        amount: Math.round(total * 100), // Convert to kobo (smallest currency unit)
        ref: reference,
        metadata: {
          custom_fields: [
            {
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: `${formData.firstName} ${formData.lastName}`
            },
            {
              display_name: "Order Items",
              variable_name: "order_items",
              value: JSON.stringify(items.map(item => ({
                id: item.product?.id,
                name: item.product?.name,
                quantity: item.quantity,
                color: item.selectedColor
              })))
            }
          ]
        },
        callback: function(response) {
          console.log('Payment complete! Reference:', response.reference);
          
          // Create order in your system after successful payment
          // Using setTimeout to ensure this runs after Paystack modal is closed
          setTimeout(async function() {
            try {
              // Create order in your system after successful payment, passing the payment reference
              const order = await createOrder(orderData, response.reference);
              
              // Clear cart
              clearCart();
              
              // Show success message
              toast({
                title: "Success",
                description: "Payment successful! Order placed.",
              });
              
              // Redirect to order confirmation
              navigate(`/order-confirmation/${order.id}`);
            } catch (error) {
              console.error('Order creation error:', error);
              
              // Specific error for stock issues - properly check error type first
              let isStockError = false;
              if (error instanceof Error) {
                isStockError = 
                  error.message.includes('out of stock') || 
                  error.message.includes('insufficient quantity');
              }
              
              if (isStockError) {
                toast({
                  title: "Stock Error",
                  description: 'Your payment was successful, but some items in your cart are no longer available. Your payment reference is: ' + response.reference,
                  variant: "destructive",
                });
              } else {
                toast({
                  title: "Order Error",
                  description: error instanceof Error 
                    ? error.message 
                    : 'Payment was successful, but there was an error creating your order. Please contact support with reference: ' + response.reference,
                  variant: "destructive",
                });
              }
              
              // Navigate to order confirmation page with payment=success and reference parameters
              navigate(`/order-confirmation/error?payment=success&reference=${response.reference}`);
            } finally {
              setIsProcessing(false);
            }
          }, 100);
        },
        onClose: function() {
          // Handle case when user closes payment modal
          toast({
            title: "Cancelled",
            description: "Payment was cancelled",
            variant: "destructive",
          });
          setIsProcessing(false);
        },
      });
      
      handler.openIframe();
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : 'There was an error processing your order. Please try again.',
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = e.target.value;
    const name = e.target.name as keyof FormData;
    
    // Format card number with spaces
    if (name === 'cardNumber' && e.target instanceof HTMLInputElement) {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    }
    
    // Format expiry date
    if (name === 'expiryDate' && e.target instanceof HTMLInputElement) {
      value = value.replace(/\D/g, '').replace(/(\d{2})(\d{2})/, '$1/$2');
    }
    
    // Format CVV
    if (name === 'cvv' && e.target instanceof HTMLInputElement) {
      value = value.replace(/\D/g, '').slice(0, 3);
    }

    // Format phone number for Nigeria (optional)
    if (name === 'phone' && e.target instanceof HTMLInputElement) {
      // Allow only digits and plus sign at the beginning
      value = value.replace(/[^\d+]/g, '');
      // Ensure it starts with +234 for Nigeria
      if (value.startsWith('+')) {
        if (!value.startsWith('+234') && value.length > 1) {
          value = '+234' + value.substring(1).replace(/^234/, '');
        }
      } else if (value.startsWith('234')) {
        value = '+' + value;
      } else if (value.startsWith('0')) {
        value = '+234' + value.substring(1);
      } else if (value && !value.startsWith('+234')) {
        value = '+234' + value;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isLoading = false; // Replace state.loading check

  if (isLoading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} pt-24`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} pt-24`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Checkout</h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-2`}>Complete your order</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm`}>
              <div className="space-y-6">
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm`}>
                  <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Contact Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        required
                        className={`form-input mt-1 block w-full rounded-md ${
                          theme === 'dark' 
                            ? 'border-gray-700 bg-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                            : 'border-gray-300 focus:border-black focus:ring-black'
                        }`}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          First Name
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          required
                          className={`form-input mt-1 block w-full rounded-md ${
                            theme === 'dark' 
                              ? 'border-gray-700 bg-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                              : 'border-gray-300 focus:border-black focus:ring-black'
                          }`}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Last Name
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          required
                          className={`form-input mt-1 block w-full rounded-md ${
                            theme === 'dark' 
                              ? 'border-gray-700 bg-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                              : 'border-gray-300 focus:border-black focus:ring-black'
                          }`}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm`}>
                  <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Shipping Address</h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="address" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Address
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        required
                        placeholder="Enter your street address"
                        className={`form-input mt-1 block w-full rounded-md ${
                          theme === 'dark' 
                            ? 'border-gray-700 bg-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                            : 'border-gray-300 focus:border-black focus:ring-black'
                        }`}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="state" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          State
                        </label>
                        <select
                          id="state"
                          name="state"
                          value={formData.state}
                          required
                          className={`form-select mt-1 block w-full rounded-md ${
                            theme === 'dark' 
                              ? 'border-gray-700 bg-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                              : 'border-gray-300 focus:border-black focus:ring-black'
                          }`}
                          onChange={handleChange}
                          disabled={isLoadingLocations}
                        >
                          <option value="">Select State</option>
                          {availableStates && availableStates.length > 0 ? (
                            availableStates.map(state => (
                              <option key={state} value={state}>{state}</option>
                            ))
                          ) : (
                            <option value="" disabled>No states available</option>
                          )}
                        </select>
                        {isLoadingLocations && (
                          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Loading available locations...
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="city" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          City
                        </label>
                        <select
                          id="city"
                          name="city"
                          value={formData.city}
                          required
                          className={`form-select mt-1 block w-full rounded-md ${
                            theme === 'dark' 
                              ? 'border-gray-700 bg-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                              : 'border-gray-300 focus:border-black focus:ring-black'
                          }`}
                          onChange={handleChange}
                          disabled={!formData.state || isLoadingLocations}
                        >
                          <option value="">Select City</option>
                          {availableCities && availableCities.length > 0 ? (
                            availableCities.map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))
                          ) : (
                            <option value="" disabled>No cities available</option>
                          )}
                        </select>
                        {formData.state && availableCities.length === 0 && !isLoadingLocations && (
                          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>
                            No cities available for selected state
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="country" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Country
                        </label>
                        <input
                          type="text"
                          id="country"
                          name="country"
                          value={formData.country}
                          required
                          className={`form-input mt-1 block w-full rounded-md ${
                            theme === 'dark' 
                              ? 'border-gray-700 bg-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                              : 'border-gray-300 focus:border-black focus:ring-black'
                          }`}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="postalCode" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Postal Code
                        </label>
                        <input
                          type="text"
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
                          placeholder="e.g., 100001"
                          required
                          className={`form-input mt-1 block w-full rounded-md ${
                            theme === 'dark' 
                              ? 'border-gray-700 bg-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                              : 'border-gray-300 focus:border-black focus:ring-black'
                          }`}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="phone" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        placeholder="+234 XXX XXX XXXX"
                        required
                        className={`form-input mt-1 block w-full rounded-md ${
                          theme === 'dark' 
                            ? 'border-gray-700 bg-gray-700 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                            : 'border-gray-300 focus:border-black focus:ring-black'
                        }`}
                        onChange={handleChange}
                      />
                      <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Nigerian format: +234 XXX XXX XXXX
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm`}>
                  <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Payment Information</h2>
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                    Payment will be securely processed by Paystack after you submit your order.
                  </p>
                  
                  <div className={`flex items-center space-x-2 p-4 ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-md`}>
                    <Shield className="w-5 h-5 text-blue-500" />
                    <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                      For testing, use card: 5060 6666 6666 6666, exp: any future date, cvv: any 3 digits
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || !paystackLoaded.current}
                  className={`w-full py-3 rounded-md font-medium text-white ${
                    isProcessing || !paystackLoaded.current
                      ? 'bg-gray-500 cursor-not-allowed' 
                      : theme === 'dark'
                        ? 'bg-indigo-600 hover:bg-indigo-700 transition-colors'
                        : 'bg-black hover:bg-gray-800 transition-colors'
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : !paystackLoaded.current ? (
                    "Loading Payment Gateway..."
                  ) : (
                    'Pay with Paystack'
                  )}
                </button>
              </div>
            </form>
          </div>

          <div>
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm mb-4`}>
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Order Summary</h2>
              <div className="space-y-4">
                {/* Locations List */}
                {items.map((item) => (
                  <div key={`${item.product?.id}-${item.selectedColor || 'default'}`} className="flex gap-4">
                    <div className="w-20 h-20 flex-shrink-0">
                      <img
                        src={item.selectedColor && item.product?.colors 
                          ? item.product.colors.find(c => c.hex === item.selectedColor)?.image_url || item.product.image_url
                          : item.product?.image_url}
                        alt={item.product?.name}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                    <div className="flex-grow">
                      <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.product?.name}</h3>
                      {item.selectedColor && item.product?.colors && (
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Color: {item.product.colors.find(c => c.hex === item.selectedColor)?.name || 'Default'}
                        </p>
                      )}
                      {item.product?.selectedSize && (
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Size: {item.product.selectedSize}</p>
                      )}
                      <div className="flex justify-between mt-1">
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Qty: {item.quantity}</p>
                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency((item.product?.price || 0) * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} pt-4 space-y-2`}>
                  <div className="flex justify-between">
                    <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Subtotal</span>
                    <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Shipping</span>
                    <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {shipping === 0 ? (
                        <span className={`${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>Free</span>
                      ) : isLoadingLocations ? (
                        <span className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Calculating...</span>
                      ) : (
                        formatCurrency(shipping)
                      )}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Free shipping on orders over {formatCurrency(10000)}
                    </p>
                  )}
                  {formData.state && formData.city && shipping > 0 && (
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Shipping to {formData.city}, {formData.state}
                    </p>
                  )}
                  <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} pt-2`}>
                    <div className="flex justify-between font-bold">
                      <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Total</span>
                      <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}