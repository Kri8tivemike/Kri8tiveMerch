import React from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { env } from '../../config/env';

interface DirectPaystackButtonProps {
  amount: number;
  email: string;
  reference: string;
  onSuccess?: (response: any) => void;
  onClose?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * A simpler Paystack button that uses direct URLs instead of the JS SDK
 * This avoids issues with script loading and browser compatibility
 */
const DirectPaystackButton: React.FC<DirectPaystackButtonProps> = ({
  amount,
  email,
  reference,
  onSuccess,
  onClose,
  isLoading = false,
  disabled = false,
  className = '',
}) => {
  const handlePayment = () => {
    try {
      // Extract customizationId from metadata if available
      const customizationId = onSuccess && typeof onSuccess === 'function' 
        ? ((window as any).customizationId || '') 
        : '';
      
      // Use the Paystack key from environment variables
      const paystackKey = env.VITE_PAYSTACK_PUBLIC_KEY;
      
      // Amount in the smallest currency unit (kobo for NGN)
      const amountInKobo = Math.floor(amount * 100);
      
      // Use a direct form POST which is more reliable than window.open
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://checkout.paystack.com/';
      form.target = '_blank';
      
      // Add required fields
      const addHiddenField = (name: string, value: string) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      };
      
      addHiddenField('key', paystackKey);
      addHiddenField('email', email);
      addHiddenField('amount', amountInKobo.toString());
      addHiddenField('ref', reference);
      
      // Set up callback URL to redirect to the customization confirmation page
      const callbackUrl = customizationId 
        ? `${window.location.origin}/customization-confirmation/${customizationId}?reference=${reference}&status=success`
        : `${window.location.origin}/payment/success?reference=${reference}&redirect=customization`;
      
      addHiddenField('callback_url', callbackUrl);
      addHiddenField('cancel_url', `${window.location.origin}/customize`);
      
      // Append form to body, submit it, and remove it
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      
      // Start checking for when payment completes
      const checkPaymentCompletion = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlReference = urlParams.get('reference');
        
        if (urlReference === reference) {
          if (onSuccess) {
            onSuccess({ reference, status: 'success' });
          }
          clearInterval(checkInterval);
        }
      };
      
      // Check every 2 seconds
      const checkInterval = setInterval(checkPaymentCompletion, 2000);
      
      // Clear interval after 20 minutes (failsafe)
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 20 * 60 * 1000);
    } catch (error) {
      console.error('Error opening payment page:', error);
      
      // Fallback to direct URL approach if form submission fails
      try {
        // Create a simpler checkout URL with minimal parameters
        const checkoutUrl = `https://checkout.paystack.com/?amount=${Math.floor(amount * 100)}&email=${encodeURIComponent(email)}&reference=${reference}`;
        
        // Open in a new window
        window.open(checkoutUrl, '_blank');
      } catch (fallbackError) {
        console.error('Even fallback payment approach failed:', fallbackError);
        alert('Could not open payment page. Please try again or contact support.');
        if (onClose) onClose();
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={isLoading || disabled}
      className={`w-full flex justify-center items-center py-3.5 px-4 rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${(isLoading || disabled) ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
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
  );
};

export default DirectPaystackButton; 