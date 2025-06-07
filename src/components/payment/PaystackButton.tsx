import React, { useEffect, useState } from 'react';
import { Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { env } from '../../config/env';

interface PaystackButtonProps {
  amount: number;
  email: string;
  reference: string;
  onSuccess?: (response: any) => void;
  onClose?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  metadata?: any;
  className?: string;
}

const PaystackButton: React.FC<PaystackButtonProps> = ({
  amount,
  email,
  reference,
  onSuccess,
  onClose,
  isLoading = false,
  disabled = false,
  metadata = {},
  className = '',
}) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  const [showDirectCheckout, setShowDirectCheckout] = useState(false);
  
  // Load the Paystack script
  useEffect(() => {
    console.log('PaystackButton: Attempting to load script');
    
    // Check if PaystackPop is already available globally
    if (window.PaystackPop) {
      console.log('PaystackButton: PaystackPop already available, no need to load script');
      setScriptLoaded(true);
      return;
    }
    
    // Check if the script already exists
    const existingScript = document.getElementById('paystack-script');
    if (existingScript) {
      console.log('PaystackButton: Script already exists in DOM');
      setScriptLoaded(true);
      return;
    }
    
    // Create and add the script in the exact same way as Checkout.tsx
    const script = document.createElement('script');
    script.id = 'paystack-script';
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    
    script.onload = () => {
      console.log('PaystackButton: Script loaded successfully');
      setScriptLoaded(true);
    };
    
    script.onerror = (error) => {
      console.error('PaystackButton: Failed to load script:', error);
      setScriptFailed(true);
    };
    
    // Append to head like Checkout.tsx does, not body
    document.head.appendChild(script);
    console.log('PaystackButton: Script appended to head');
    
    // Set a timeout to check if script loads within 5 seconds
    const timeout = setTimeout(() => {
      if (!window.PaystackPop) {
        console.warn('PaystackButton: Script loading timed out');
        setScriptFailed(true);
      }
    }, 5000);
    
    return () => {
      clearTimeout(timeout);
      // Cleanup script on component unmount
      const scriptElem = document.getElementById('paystack-script');
      if (scriptElem) document.head.removeChild(scriptElem);
    };
  }, []);
  
  // Direct checkout function for when popup fails
  const handleDirectCheckout = () => {
    try {
      // Convert amount to kobo (smallest currency unit)
      const amountInKobo = Math.floor(amount * 100);
      
      // Use a direct form POST which is more reliable than window.open
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://checkout.paystack.com/';
      form.target = '_blank';
      
      // Add required fields
      const addField = (name: string, value: string) => {
        const field = document.createElement('input');
        field.type = 'hidden';
        field.name = name;
        field.value = value;
        form.appendChild(field);
      };
      
      // Add all required fields
      addField('email', email);
      addField('amount', amountInKobo.toString());
      addField('reference', reference);
      addField('callback', `${window.location.origin}/payment/success?reference=${reference}`);
      addField('metadata', JSON.stringify(metadata));
      addField('currency', 'NGN');
      
      // Append form to body, submit it, and remove it
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      
      console.log('Direct checkout form submitted');
    } catch (error) {
      console.error('Failed to open direct checkout:', error);
      // As a last resort, open a simple URL
      window.open(`https://checkout.paystack.co/?amount=${Math.floor(amount * 100)}&email=${encodeURIComponent(email)}&ref=${reference}&currency=NGN`, '_blank');
    }
  };
  
  // Initialize Paystack payment without using document.write
  const handlePaymentInitialize = () => {
    console.log('Payment button clicked - initializing Paystack payment');
    
    // Use the Paystack key from environment variables
    const paystackKey = env.VITE_PAYSTACK_PUBLIC_KEY;
    
    // Log the key being used (for debugging) - show only first few chars for security
    console.log('Using Paystack test key:', paystackKey.substring(0, 10) + '...');
    console.log('Key length:', paystackKey.length);
    
    // Log button state for debugging
    console.log('Button state:', {
      isLoading,
      disabled,
      scriptLoaded,
      scriptFailed,
      amount,
      email,
      reference,
      hasPaystackPop: !!window.PaystackPop
    });
    
    // Convert amount to kobo (smallest currency unit)
    const amountInKobo = Math.floor(amount * 100);
    
    // Make sure window.PaystackPop is available
    if (!window.PaystackPop) {
      console.error('PaystackButton: Script not loaded yet or PaystackPop not available');
      alert('Payment system not ready. Using direct checkout instead.');
      handleDirectCheckout();
      return;
    }
    
    // Update metadata to include customizationId if needed
    if ((window as any).customizationId) {
      metadata = {
        ...metadata,
        customizationId: (window as any).customizationId
      };
    }
    
    // Configure Paystack using the same approach as in Checkout.tsx that works
    try {
      console.log('Attempting to initialize Paystack with:', {
        key: `${paystackKey.substring(0, 10)}...`,
        email,
        amount: amountInKobo,
        ref: reference,
        hasMetadata: !!metadata
      });
      
      // Use the setup and openIframe approach that works in Checkout.tsx
      const handler = window.PaystackPop.setup({
        key: paystackKey,
        email: email.trim(),
        amount: amountInKobo,
        ref: reference,
        metadata: metadata || {},
        callback: function(response) {
          console.log('Payment successful:', response);
          // Handle successful payment
          if (onSuccess) {
            console.log('Calling onSuccess callback with response:', response);
            onSuccess(response);
            // If onSuccess is provided, let it handle the navigation
            // Don't do automatic redirect as the parent component will handle it
            return;
          }
          
          // Only redirect automatically if no onSuccess callback is provided
          setTimeout(() => {
            const customizationId = (window as any).customizationId;
            if (!customizationId) {
              // If customizationId is not set, redirect to payment success page
              window.location.href = `/payment/success?reference=${response.reference}&redirect=customization`;
            } else {
              // Redirect to customization confirmation page with the customizationId
              window.location.href = `/customization-confirmation/${customizationId}?reference=${response.reference}&status=success`;
            }
          }, 1000); // Wait a second before redirecting to allow other logic to complete
        },
        onClose: function() {
          console.log('Payment window closed');
          // Show direct checkout option after popup is closed
          setShowDirectCheckout(true);
          if (onClose) onClose();
        }
      });
      
      // Open the iframe after setup
      handler.openIframe();
      
      console.log('Paystack initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Paystack:', error);
      alert('Payment initialization failed. Trying direct checkout instead.');
      handleDirectCheckout();
    }
  };

  return (
    <div className="w-full">
      {/* Show warning if script failed to load */}
      {scriptFailed && (
        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
          Payment system couldn't load. Try our alternative payment method below.
        </div>
      )}
      
      {/* Main payment button */}
      <button
        type="button"
        onClick={handlePaymentInitialize}
        disabled={isLoading || disabled || (!scriptLoaded && !scriptFailed)}
        className={`w-full flex justify-center items-center py-3.5 px-4 rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${(isLoading || disabled || (!scriptLoaded && !scriptFailed)) ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <ExternalLink className="w-5 h-5 mr-2" />
            <span className="font-medium">Pay ₦{amount.toLocaleString()}</span>
          </>
        )}
      </button>
      
      {/* Direct checkout button shown when popup fails or is closed */}
      {(showDirectCheckout || scriptFailed) && (
        <button
          type="button"
          onClick={handleDirectCheckout}
          className="mt-2 w-full text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          Try alternative payment method →
        </button>
      )}
    </div>
  );
};

// Add TypeScript declaration for the Paystack object
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
      new(): {
        newTransaction(config: {
          key: string;
          email: string;
          amount: number;
          ref: string;
          metadata?: any;
          currency?: string;
          channels?: string[];
          label?: string;
          plan?: string;
          quantity?: number;
          subaccount?: string;
          transaction_charge?: number;
          bearer?: string;
          onSuccess?: (response: any) => void;
          onClose?: () => void;
        }): void;
      };
    };
  }
}

export default PaystackButton; 