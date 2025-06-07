import React, { useState } from 'react';
import PaystackButton from './PaystackButton';
import { HelpCircle } from 'lucide-react';
import { env } from '../../config/env';

interface PaymentOptionPanelProps {
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

const PaymentOptionPanel: React.FC<PaymentOptionPanelProps> = ({
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
  const [showHelp, setShowHelp] = useState(false);

  const handleDirectPaymentUrl = () => {
    try {
      // Use the Paystack key from environment variables
      const paystackKey = env.VITE_PAYSTACK_PUBLIC_KEY;
      
      // Amount in the smallest currency unit (kobo for NGN)
      const amountInKobo = Math.floor(amount * 100);
      
      // Create checkout URL directly
      const checkoutUrl = `https://checkout.paystack.co/?amount=${amountInKobo}&email=${encodeURIComponent(email)}&key=${encodeURIComponent(paystackKey)}&ref=${reference}&currency=NGN`;
      
      // Open in a new window
      window.open(checkoutUrl, '_blank');
    } catch (error) {
      console.error('Error opening direct payment URL:', error);
      alert('Could not open payment page. Please try again.');
    }
  };

  return (
    <div className="w-full">
      {/* Payment content */}
      <div className="mb-4">
        <PaystackButton
          amount={amount}
          email={email}
          reference={reference}
          onSuccess={onSuccess}
          onClose={onClose}
          isLoading={isLoading}
          disabled={disabled}
          metadata={{
            ...metadata,
            customizationId: (window as any).customizationId
          }}
          className={className}
        />
      </div>

      {/* Having trouble section */}
      <div className="mt-2 text-center">
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center justify-center mx-auto"
        >
          <HelpCircle className="w-3 h-3 mr-1" />
          Having trouble with payment?
        </button>
        
        {showHelp && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm text-gray-600 border border-gray-200">
            <p className="mb-2">Try this alternative payment method:</p>
            <ul className="text-xs space-y-2">
              <li>
                <button 
                  type="button"
                  onClick={handleDirectPaymentUrl}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Pay directly via Paystack checkout
                </button>
              </li>
              <li>
                <a 
                  href={`https://checkout.paystack.co/?amount=${Math.floor(amount * 100)}&email=${encodeURIComponent(email)}&key=${env.VITE_PAYSTACK_PUBLIC_KEY}&ref=${reference}&currency=NGN`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Open Paystack checkout page
                </a>
              </li>
            </ul>
            <p className="mt-2 text-xs text-gray-500">
              For testing, use card: 4084 0840 8408 4081, CVV: 408, Expiry: 10/25
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentOptionPanel; 