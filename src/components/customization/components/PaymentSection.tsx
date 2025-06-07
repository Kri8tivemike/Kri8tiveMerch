import React from 'react';
import { Button } from '../../ui/Button';
import { AlertCircle, LogIn, Loader2, DollarSign, ChevronLeft } from 'lucide-react';
import PaymentOptionPanel from '../../payment/PaymentOptionPanel';
import { Product } from '../../../types/product';
import { useAuth } from '../../../contexts/AuthContext';

interface PaymentSectionProps {
  isAuthenticated: boolean;
  isValid: boolean;
  errorMessage: string;
  isPaystackConfigured: boolean;
  isProcessingPayment: boolean;
  formSubmitted: boolean;
  paymentFailed: boolean;
  useDirectPayment: boolean;
  totalCost: number;
  payRef: string;
  productDetails: Product | null;
  product: Product;
  selectedTechniqueName: string;
  selectedSize: string;
  quantity: number;
  onBack: () => void;
  onAuthModalOpen: () => void;
  onSubmitWithoutPayment: () => void;
  onPaymentSuccess: (response: any) => void;
  onPaymentClose: () => void;
  onDirectPayment: () => void;
  onToggleDirectPayment: () => void;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({
  isAuthenticated,
  isValid,
  errorMessage,
  isPaystackConfigured,
  isProcessingPayment,
  formSubmitted,
  paymentFailed,
  useDirectPayment,
  totalCost,
  payRef,
  productDetails,
  product,
  selectedTechniqueName,
  selectedSize,
  quantity,
  onBack,
  onAuthModalOpen,
  onSubmitWithoutPayment,
  onPaymentSuccess,
  onPaymentClose,
  onDirectPayment,
  onToggleDirectPayment
}) => {
  const { user } = useAuth();
  const currentProduct = productDetails || product;

  if (isProcessingPayment) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <button
          type="button"
          disabled={true}
          className="w-full flex justify-center items-center py-3.5 px-4 rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-500 opacity-70 cursor-not-allowed"
        >
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Processing Payment...
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Payment & Submission</h3>
      </div>

      <div className="space-y-4">
        {/* Validation Error Display */}
        {!isValid && isAuthenticated && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700 dark:text-red-300">{errorMessage}</span>
          </div>
        )}

        {/* Payment Configuration Notice */}
        {!isPaystackConfigured && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Payment Configuration Required
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  To enable online payments, please configure your Paystack public key in the environment variables. 
                  You can still submit your customization request without payment.
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                  Add <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">VITE_PAYSTACK_PUBLIC_KEY</code> to your .env file
                </p>
              </div>
            </div>
          </div>
        )}

        {!isAuthenticated ? (
          <Button
            onClick={onAuthModalOpen}
            className="w-full"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign in to Continue
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={onSubmitWithoutPayment}
              disabled={formSubmitted || !isValid}
              className="flex-1"
              variant="outline"
            >
              {formSubmitted ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
            
            {useDirectPayment ? (
              <div className="flex-1 space-y-3">
                <button
                  type="button"
                  onClick={onDirectPayment}
                  disabled={!isValid || totalCost <= 0}
                  className="w-full flex justify-center items-center py-3.5 px-4 rounded-lg shadow-sm text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DollarSign className="w-5 h-5 mr-2" />
                  Pay ₦{totalCost.toLocaleString()}
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Using alternative payment method
                </p>
              </div>
            ) : (
              <div className="flex-1">
                <PaymentOptionPanel
                  amount={totalCost}
                  email={user?.email || 'test@example.com'}
                  reference={payRef}
                  onSuccess={onPaymentSuccess}
                  onClose={onPaymentClose}
                  isLoading={isProcessingPayment}
                  disabled={!isValid || totalCost <= 0}
                  metadata={{
                    customization_type: 'product',
                    technique: selectedTechniqueName,
                    product_name: currentProduct?.name || 'Unknown Product',
                    size: selectedSize,
                    quantity: quantity
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Alternative payment options */}
        {isAuthenticated && !useDirectPayment && (
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={onToggleDirectPayment}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
            >
              Having trouble? Try alternative payment method
            </button>
          </div>
        )}

        {/* Fallback payment option */}
        {paymentFailed && (
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={onDirectPayment}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
            >
              Still having issues? Try direct payment link
            </button>
          </div>
        )}

        {/* Back Button */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="flex items-center px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Back to Design
          </Button>
        </div>
      </div>
    </div>
  );
}; 