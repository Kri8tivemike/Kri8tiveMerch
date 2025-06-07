import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, ArrowRight, AlertCircle, Wrench } from 'lucide-react';
import { createCustomizationRequest } from '../services/customization.service';
import { useToast } from '../hooks/use-toast';
import { account } from '../lib/appwrite';
import schemaFixes from '../lib/debugging/schemaFixes';

/**
 * Helper function to validate URLs
 */
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Payment Success page that handles Paystack redirect callbacks
 * This page is shown when returning from the Paystack direct payment flow
 */
export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [isSchemaError, setIsSchemaError] = useState(false);
  const [fixingSchema, setFixingSchema] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  
  useEffect(() => {
    async function processPayment() {
      try {
        // Get URL parameters
        const searchParams = new URLSearchParams(location.search);
        const reference = searchParams.get('reference') || searchParams.get('trxref');
        const status = searchParams.get('status');
        const redirect = searchParams.get('redirect');
        
        setPaymentReference(reference);
        
        console.log('Payment Success Page:', {
          reference,
          status,
          redirect,
          searchParams: Object.fromEntries(searchParams.entries()),
          timestamp: new Date().toISOString()
        });
        
        if (!reference) {
          throw new Error('No payment reference found in URL');
        }

        // Check if user is authenticated
        let currentUser;
        try {
          currentUser = await account.get();
        } catch (error) {
          throw new Error('Authentication required. Please login to view customization details.');
        }
        
        // If no authenticated user, reject the request
        if (!currentUser?.$id) {
          throw new Error('Authentication required. Please login to complete your customization.');
        }

        // Retrieve payment intent from localStorage
        const paymentIntentStr = localStorage.getItem('customization_payment_intent');
        if (!paymentIntentStr) {
          // If no payment intent is stored, this might be a direct payment from YourItemCustomizationForm
          // or another flow that doesn't use localStorage. Show a helpful message.
          console.warn('No payment intent found in localStorage. This might be a direct payment flow.');
          
          // Try to find an existing customization request with this payment reference
          try {
            // Import the service to search for requests
            const { getUserCustomizationRequests } = await import('../services/customization.service');
            console.log('Searching for customization requests...');
            const userRequests = await getUserCustomizationRequests();
            
            console.log('Found user requests:', userRequests.length);
            console.log('Looking for payment reference:', reference);
            console.log('All payment references:', userRequests.map(req => req.payment_reference));
            
            // Look for a request with this payment reference
            const matchingRequest = userRequests.find(req => req.payment_reference === reference);
            
            if (matchingRequest) {
              console.log('Found existing customization request:', matchingRequest);
              setError('Payment completed successfully! Redirecting to your customization request...');
              
              // Redirect to the confirmation page immediately
              setTimeout(() => {
                navigate(`/customization-confirmation/${matchingRequest.id}?reference=${reference}&status=success`);
              }, 500);
              
              return;
            } else {
              console.log('No matching request found for reference:', reference);
              console.log('Available requests:', userRequests.map(req => ({
                id: req.id,
                payment_reference: req.payment_reference,
                title: req.title,
                created_at: req.created_at
              })));
            }
          } catch (searchError) {
            console.error('Error searching for existing requests:', searchError);
          }
          
          // If no matching request found, show helpful message
          setError('Payment completed successfully, but session data was not found. Please check your customization requests in your account dashboard.');
          
          return;
        }
        
        const paymentIntent = JSON.parse(paymentIntentStr);
        console.log('Retrieved payment intent:', paymentIntent);
        
        // Verify the reference matches
        if (paymentIntent.reference !== reference) {
          console.warn('Reference mismatch:', {
            urlReference: reference,
            storedReference: paymentIntent.reference
          });
          // Continue anyway, but log the issue
        }

        // Create customization request based on the stored data
        const techniqueId = paymentIntent.techniqueId || paymentIntent.technique;
        
        // Get design URL and validate it
        let designUrl = Array.isArray(paymentIntent.designUrls) 
          ? paymentIntent.designUrls[0] 
          : paymentIntent.designUrls;
          
        // Validate the URL
        if (designUrl && !isValidUrl(designUrl)) {
          console.warn('Invalid design URL found:', designUrl);
          designUrl = null; // Set to null if it's not a valid URL
        }
          
        if (!techniqueId) {
          throw new Error('No technique ID found in payment data');
        }
        
        // Handle design URL - truncate if too long or use placeholder
        let processedDesignUrl = designUrl;
        if (processedDesignUrl && processedDesignUrl.length > 500) {
          // If it's a data URL, replace with a placeholder
          if (processedDesignUrl.startsWith('data:')) {
            processedDesignUrl = 'Design uploaded (data URL too long for storage)';
          } else {
            // Truncate regular URLs
            processedDesignUrl = processedDesignUrl.substring(0, 497) + '...';
          }
        }

        // Create very concise description within character limits
        const description = `Customization using ${paymentIntent.technique_name || 'standard'} technique on ${
          paymentIntent.customizationType === 'product' 
            ? 'product' 
            : paymentIntent.itemType || 'personal item'
        }. Size: ${paymentIntent.selectedSize || 'Medium'}${
          paymentIntent.color ? `, Color: ${paymentIntent.color}` : ''
        }. Quantity: ${paymentIntent.quantity || 1}. Payment ref: ${reference}.`;

        // Prepare data for customization request
        const requestData = {
          user_id: currentUser.$id, // Use authenticated user ID
          title: paymentIntent.customizationType === 'product'
            ? `Custom ${paymentIntent.productId ? paymentIntent.productId.substring(0, 8) : 'Product'}`
            : paymentIntent.itemType 
              ? `Custom ${paymentIntent.itemType}`
              : `Customization Request ${new Date().toISOString().split('T')[0]}`,
          description: description,
          status: 'Pending' as const,
          created_at: new Date().toISOString(),
          technique_id: techniqueId,
          technique: paymentIntent.technique_name, // Use 'technique' field as per Appwrite schema
          design_url: processedDesignUrl || 'Design uploaded',
          item_type: paymentIntent.customizationType === 'personal' ? paymentIntent.itemType : undefined,
          size: paymentIntent.selectedSize || 'Medium',
          color: paymentIntent.color,
          quantity: paymentIntent.quantity || 1,
          // Calculate proper cost breakdown
          technique_cost: paymentIntent.technique_cost || 2510, // Default DTF cost
          fabric_cost: paymentIntent.fabric_cost || 2500, // Default 160 GSM fabric cost
          unit_cost: (paymentIntent.technique_cost || 2510) + (paymentIntent.fabric_cost || 2500),
          total_cost: paymentIntent.amount || ((paymentIntent.technique_cost || 2510) + (paymentIntent.fabric_cost || 2500)) * (paymentIntent.quantity || 1),
          phone_number: paymentIntent.phone_number,
          whatsapp_number: paymentIntent.whatsapp_number,
          delivery_address: paymentIntent.delivery_address,
          fabric_quality: paymentIntent.fabricQuality || 160,
          fabric_purchase_option: paymentIntent.fabric_purchase_option || 'help_buy',
          payment_reference: reference,
          payment_completed: true,
          image_url: processedDesignUrl && processedDesignUrl.length <= 500 ? processedDesignUrl : null // Only include if valid and short enough
        };
        
        console.log('Creating customization request with data:', requestData);
        
        // Create the customization request
        const result = await createCustomizationRequest(requestData);
        
        // Check if we have a customization ID
        if (result?.id) {
          console.log('Customization request created successfully:', result);
          setRequestId(result.id);
          
          // Clear stored payment data
            localStorage.removeItem('customization_payment_intent');
            
          // Show success message
          toast({
            title: "Success!",
            description: "Your customization request has been created.",
            variant: "default"
          });
          
          // Redirect to the confirmation page after a delay
          setTimeout(() => {
            navigate(`/customization-confirmation/${result.id}`);
          }, 3000);
        } else {
          throw new Error('Customization request creation failed');
        }
      } catch (err) {
        console.error('Error processing payment:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        
        // Check if this is a schema error
        if (errorMessage.includes('Invalid document structure') || 
            errorMessage.includes('Unknown attribute') ||
            errorMessage.includes('material') ||
            errorMessage.includes('technique_name')) {
          setIsSchemaError(true);
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    
    processPayment();
  }, [location, navigate, toast]);
  
  const handleFixSchema = async () => {
    setFixingSchema(true);
    
    try {
      // Use the schema fix utility
      const fixed = await schemaFixes.fixAllSchemaIssues();
      
      if (fixed) {
        toast({
          title: "Schema Fixed",
          description: "Database schema has been updated. You can now try again.",
          variant: "default"
        });
        
        // Give the user the option to retry
        setIsSchemaError(false);
        setError("Database schema has been fixed. Please try again.");
      } else {
        toast({
          title: "Fix Failed",
          description: "Could not fix the database schema. Please try again later.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error fixing schema:', err);
      toast({
        title: "Fix Failed",
        description: "An error occurred while fixing the schema.",
        variant: "destructive"
      });
    } finally {
      setFixingSchema(false);
    }
  };
  
  if (loading) {
  return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-500 dark:text-blue-400 animate-spin mb-4" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Processing Payment</h1>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              Please wait while we confirm your payment and create your customization request...
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full animate-pulse w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col items-center">
            <div className={`p-3 rounded-full mb-4 ${
              error.includes('Payment completed successfully') 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              {error.includes('Payment completed successfully') ? (
                <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {error.includes('Payment completed successfully') ? 'Payment Successful' : 'Payment Processing Error'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">{error}</p>
            
            {(error.includes('session data was not found') || error.includes('check your customization requests')) && (
              <button
                onClick={() => navigate('/dashboard/customization-requests')}
                className="w-full flex items-center justify-center px-4 py-2 mb-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                View My Requests
              </button>
            )}
            
            {isSchemaError && (
              <button
                onClick={handleFixSchema}
                disabled={fixingSchema}
                className="w-full flex items-center justify-center px-4 py-2 mb-3 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors"
              >
                {fixingSchema ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Fixing Schema...
                  </>
                ) : (
                  <>
                    <Wrench className="mr-2 h-4 w-4" />
                    Fix Database Schema
                  </>
                )}
              </button>
            )}
            
            {paymentReference && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Your payment reference: <span className="font-mono">{paymentReference}</span>
              </p>
            )}
            
            <button
              onClick={() => navigate('/customize')}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Return to Customization <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col items-center">
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h1>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
            Your payment has been confirmed and your customization request has been created.
            You will be redirected to the confirmation page shortly.
          </p>
          <button
            onClick={() => navigate(`/customization-confirmation/${requestId}`)}
            className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          >
            View Customization Details <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 