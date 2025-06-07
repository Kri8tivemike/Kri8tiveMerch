import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import { Upload, AlertCircle, ImageIcon, Loader2, LogIn, CheckCircle, Calculator, DollarSign } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn, formatCurrency } from '../../lib/utils';
import { AuthModal } from '../auth/AuthModal';
import { useTheme } from '../../contexts/ThemeProvider';
import { createCustomizationRequest } from '../../services/customization.service';
import { uploadDesignFile } from '../../services/upload.service';
// Import payment components
import PaymentOptionPanel from '../payment/PaymentOptionPanel';

// Types
interface PrintingTechnique {
  id: string;
  name: string;
  description: string;
  max_size: string;
  cost: number;
}

interface FabricCost {
  quality: number;
  cost: number;
}

interface YourItemFormData {
  technique_id: string;
  technique_name: string;
  design_file: File | null;
  design_url: string;
  design_file_id: string; // Appwrite file ID
  item_description: string;
  size: string;
  color: string;
  quantity: number;
  phone_number: string;
  whatsapp_number: string;
  delivery_address: string;
  unit_cost: number;
  technique_cost: number;
  fabric_cost: number;
  total_cost: number;
  want_to_buy_blank: boolean; // New field for fabric purchase option
}

interface YourItemCustomizationFormProps {
  className?: string;
}

const YourItemCustomizationForm: React.FC<YourItemCustomizationFormProps> = ({ className }) => {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [formData, setFormData] = useState<YourItemFormData>({
    technique_id: '',
    technique_name: '',
    design_file: null,
    design_url: '',
    design_file_id: '',
    item_description: '',
    size: '',
    color: '',
    quantity: 1,
    phone_number: '',
    whatsapp_number: '',
    delivery_address: '',
    unit_cost: 0,
    technique_cost: 0,
    fabric_cost: 0,
    total_cost: 0,
    want_to_buy_blank: false,
  });

  const [techniques, setTechniques] = useState<PrintingTechnique[]>([]);
  const [selectedTechnique, setSelectedTechnique] = useState<PrintingTechnique | null>(null);
  const [selectedFabricQuality, setSelectedFabricQuality] = useState<number>(160);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [designPreview, setDesignPreview] = useState<string>('');

  // Payment configuration and state
  const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  const isPaystackConfigured = paystackPublicKey && paystackPublicKey.startsWith('pk_');
  const [paymentReference, setPaymentReference] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [useDirectPayment, setUseDirectPayment] = useState(false);

  // Fabric costs
  const fabricCosts: FabricCost[] = [
    { quality: 160, cost: 2500 },
    { quality: 180, cost: 3000 },
    { quality: 200, cost: 3500 },
    { quality: 220, cost: 4000 },
  ];

  // Load printing techniques from Appwrite using the service
  useEffect(() => {
    const loadTechniques = async () => {
      try {
        setIsLoading(true);
        
        // Import the service function
        const { fetchPrintingTechniques } = await import('../../services/customization-costs.service');
        
        // Fetch techniques using the service
        const techniquesFromService = await fetchPrintingTechniques();
        
        // Map service data to our interface
        const mappedTechniques: PrintingTechnique[] = techniquesFromService
          .filter((technique: any) => technique.is_active) // Only active techniques
          .map((technique: any) => ({
            id: technique.id, // Use service ID (which is Appwrite document ID)
            name: technique.name,
            description: `${technique.name} printing technique`, // Generate description
            max_size: technique.design_area || 'A4',
            cost: technique.cost
          }));
        
        console.log('Loaded techniques from service:', mappedTechniques);
        setTechniques(mappedTechniques);
      } catch (error) {
        console.error('Error loading techniques from service:', error);
        
        // Fallback to mock data if service fails
        const fallbackTechniques: PrintingTechnique[] = [
          { id: 'dtf', name: 'DTF', description: 'Direct to Film printing', max_size: 'A4', cost: 2510 },
          { id: 'dtg', name: 'DTG', description: 'Direct to Garment printing', max_size: 'A4', cost: 5110 },
          { id: 'flock-htv', name: 'Flock HTV', description: 'Heat Transfer Vinyl', max_size: 'A4', cost: 4780 },
          { id: 'glitter-htv', name: 'Glitter HTV', description: 'Glitter Heat Transfer', max_size: 'A4', cost: 9111 },
          { id: 'reflective-htv', name: 'Reflective HTV', description: 'Reflective Heat Transfer', max_size: 'A4', cost: 5010 },
          { id: 'sublimation', name: 'Sublimation', description: 'Full-color sublimation printing', max_size: 'A4', cost: 3011 },
        ];
        setTechniques(fallbackTechniques);
        
        toast({
          title: "Warning",
          description: "Using fallback technique data. Some features may be limited.",
          variant: "default",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTechniques();
  }, [toast]);

  // Calculate costs
  const calculateCosts = useCallback(() => {
    if (!selectedTechnique) return;

    const techniqueCost = selectedTechnique.cost;
    // Only include fabric cost if user wants to buy blank
    const fabricCostData = fabricCosts.find(f => f.quality === selectedFabricQuality);
    const fabricCost = formData.want_to_buy_blank ? (fabricCostData?.cost || 0) : 0;
    const unitCost = techniqueCost + fabricCost;
    const totalCost = unitCost * formData.quantity;

    setFormData(prev => ({
      ...prev,
      technique_cost: techniqueCost,
      fabric_cost: fabricCost,
      unit_cost: unitCost,
      total_cost: totalCost,
    }));
  }, [selectedTechnique, selectedFabricQuality, formData.quantity, formData.want_to_buy_blank]);

  useEffect(() => {
    calculateCosts();
  }, [calculateCosts]);



  // Handle technique selection
  const handleTechniqueSelect = (technique: PrintingTechnique) => {
    setSelectedTechnique(technique);
    setFormData(prev => ({
      ...prev,
      technique_id: technique.id,
      technique_name: technique.name,
    }));
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setUploadProgress(0);

    try {
      // Upload file to Appwrite storage
      const uploadResult = await uploadDesignFile(file, (progress) => {
        setUploadProgress(progress);
      });

      // Create preview for local display
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setDesignPreview(dataUrl);
      };
      reader.readAsDataURL(file);

      // Update form data with uploaded file info
      setFormData(prev => ({
        ...prev,
        design_file: file,
        design_url: uploadResult.url,
        design_file_id: uploadResult.fileId,
      }));
      
      toast({
        title: "Upload successful",
        description: "Your design has been uploaded successfully to secure storage",
      });

    } catch (error) {
      console.error('Upload error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload design. Please try again.';
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    // Validation
    if (!selectedTechnique) {
      toast({
        title: "Missing technique",
        description: "Please select a printing technique",
        variant: "destructive",
      });
      return;
    }

    if (!formData.design_file) {
      toast({
        title: "Missing design",
        description: "Please upload your design file",
        variant: "destructive",
      });
      return;
    }

    if (!formData.item_description.trim()) {
      toast({
        title: "Missing description",
        description: "Please describe your item",
        variant: "destructive",
      });
      return;
    }

    if (!formData.size.trim()) {
      toast({
        title: "Missing size",
        description: "Please specify the size",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the uploaded design URL directly (no need to handle data URLs anymore)
      const designUrl = formData.design_url || 'Design uploaded';

      const requestData = {
        user_id: user?.id || '',
        // User details
        user_name: user?.email?.split('@')[0] || 'Unknown User',
        user_email: user?.email || 'unknown@email.com',
        
        title: `Personal Item Customization - ${formData.item_description}`,
        description: `Personal item customization using ${formData.technique_name} technique.\n\nItem: ${formData.item_description}\nSize: ${formData.size}\nColor: ${formData.color || 'N/A'}\nQuantity: ${formData.quantity}`,
        status: 'Pending' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        
        // Core customization fields
        technique_id: formData.technique_id,
        technique_name: formData.technique_name,
        design_url: designUrl,
        item_type: 'personal_item',
        size: formData.size, 
        color: formData.color,
        quantity: formData.quantity,
        
        // Cost breakdown
        unit_cost: formData.unit_cost,
        technique_cost: formData.technique_cost,
        fabric_cost: formData.fabric_cost,
        total_cost: formData.total_cost,
        
        // Contact information
        phone_number: formData.phone_number,
        whatsapp_number: formData.whatsapp_number,
        delivery_address: formData.delivery_address,
        
        // Fabric details
        fabric_quality: formData.want_to_buy_blank ? selectedFabricQuality : undefined,
        fabric_purchase_option: formData.want_to_buy_blank ? 'help_buy' as const : 'already_have' as const,
        
        // Payment details for non-payment submission
        payment_reference: undefined,
        payment_completed: false,

        // Additional fields (ensure non-applicable product fields are undefined)
        material_id: undefined, 
        product_id: undefined,
        product_name: undefined, 
        product_price: undefined,
        product_cost: undefined,
        product_size: undefined, // item's size is already captured in 'size' field for personal_item
        image_url: undefined, // No specific product image for personal item
        admin_notes: undefined, // Default to undefined

        notes: `Personal item customization. Item: ${formData.item_description}`,
      };

      await createCustomizationRequest(requestData);

      toast({
        title: "Request submitted!",
        description: "Your customization request has been submitted successfully",
      });

      // Reset form
      setFormData({
        technique_id: '',
        technique_name: '',
        design_file: null,
        design_url: '',
        design_file_id: '',
        item_description: '',
        size: '',
        color: '',
        quantity: 1,
        phone_number: '',
        whatsapp_number: '',
        delivery_address: '',
        unit_cost: 0,
        technique_cost: 0,
        fabric_cost: 0,
        total_cost: 0,
        want_to_buy_blank: false,
      });
      setSelectedTechnique(null);
      setDesignPreview('');

      // Navigate to requests page
      navigate('/dashboard/customization-requests');

    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission failed",
        description: "Failed to submit your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to generate a unique payment reference
  const generatePaymentReference = (): string => {
    const timestamp = new Date().getTime();
    const randomNum = Math.floor(Math.random() * 1000000);
    return `KRI8BLANK_PERSONAL_${timestamp}_${randomNum}`;
  };



  // Validation function to check if form is ready for payment
  const validateFormForPayment = (): { isValid: boolean; errorMessage: string } => {
    if (!selectedTechnique) {
      return { isValid: false, errorMessage: "Please select a printing technique first" };
    }

    if (!formData.design_file) {
      return { isValid: false, errorMessage: "Please upload your design file" };
    }

    if (!formData.item_description.trim()) {
      return { isValid: false, errorMessage: "Please describe your item" };
    }

    if (!formData.size.trim()) {
      return { isValid: false, errorMessage: "Please specify the size" };
    }

    if (!formData.phone_number.trim()) {
      return { isValid: false, errorMessage: "Please provide your phone number" };
    }

    if (!formData.delivery_address.trim()) {
      return { isValid: false, errorMessage: "Please provide your delivery address" };
    }

    return { isValid: true, errorMessage: "" };
  };

  // Store payment data in localStorage before payment
  const storePaymentData = (payRef: string) => {
    // Use the uploaded design URL directly
    const designUrl = formData.design_url || `Design file: ${formData.design_file?.name || 'uploaded_design'}`;

    const paymentIntent = {
      reference: payRef,
      technique: formData.technique_id,
      techniqueId: formData.technique_id,
      technique_name: formData.technique_name,
      designUrls: [designUrl || 'Design uploaded'],
      designNames: [formData.design_file?.name || 'design'],
      selectedSize: formData.size,
      customizationType: 'personal',
      amount: formData.total_cost,
      itemType: formData.item_description,
      color: formData.color,
      fabricQuality: formData.want_to_buy_blank ? selectedFabricQuality : null,
      quantity: formData.quantity,
      // Include cost breakdown for proper field mapping
      technique_cost: formData.technique_cost,
      fabric_cost: formData.fabric_cost,
      unit_cost: formData.unit_cost,
      phone_number: formData.phone_number,
      whatsapp_number: formData.whatsapp_number,
      delivery_address: formData.delivery_address,
      timestamp: Date.now(),
      user_email: user?.email,
      user_id: user?.id || (user as any)?.$id || 'unknown',
      fabric_purchase_option: formData.want_to_buy_blank ? 'help_buy' as const : 'already_have' as const
    };
    
    console.log('Storing payment intent in localStorage:', paymentIntent);
    localStorage.setItem('customization_payment_intent', JSON.stringify(paymentIntent));
  };

  const handlePaymentSuccess = (response: any) => {
    console.log('YourItemCustomizationForm: Payment completed successfully:', response);
    
    toast({
      title: "Payment Successful!",
      description: "Your payment was successful. Processing your customization request...",
      variant: "default"
    });
    
    // Set processing state
    setIsProcessingPayment(true);
    
    // Store payment data for fallback processing
    storePaymentData(response.reference);
    
    // Submit the customization request with payment reference
    console.log('YourItemCustomizationForm: Submitting customization request with payment reference:', response.reference);
    submitCustomizationRequestWithPayment(response.reference)
      .then(requestData => {
        if (requestData?.id) {
          console.log('YourItemCustomizationForm: Customization request created after payment:', requestData);
          
          // Store customizationId in window object for potential use
          (window as any).customizationId = requestData.id;
          
          // Navigate to confirmation page
          navigate(`/customization-confirmation/${requestData.id}?reference=${response.reference}&status=success`);
        } else {
          console.error('YourItemCustomizationForm: No request data returned after payment submission');
          toast({
            title: "Almost there!",
            description: "Your payment was received, but you'll need to complete the form submission.",
            variant: "default"
          });
          // Navigate to payment success page as fallback
          navigate(`/payment/success?reference=${response.reference}&redirect=customization`);
        }
      })
      .catch(error => {
        console.error('YourItemCustomizationForm: Error submitting request after payment:', error);
        toast({
          title: "Payment received",
          description: "Your payment was successful. Please contact support to complete your order.",
          variant: "default"
        });
        // Navigate to payment success page as fallback
        navigate(`/payment/success?reference=${response.reference}&redirect=customization`);
      })
      .finally(() => {
        setIsProcessingPayment(false);
      });
  };

  const handlePaymentClose = () => {
    console.log('Payment window closed by user');
    setIsProcessingPayment(false);
    setPaymentFailed(true);
    toast({
      title: "Payment cancelled",
      description: "Payment was cancelled by user",
      variant: "destructive",
    });
  };

  // Function to open direct payment URL as fallback
  const openDirectPaymentUrl = () => {
    try {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to proceed with payment",
          variant: "destructive"
        });
        return;
      }

      const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_7d571c7fa4bb1423dea9e6dfd9d18438ccb469ba';
      const payRef = paymentReference || generatePaymentReference();
      if (!paymentReference) {
        setPaymentReference(payRef);
      }

      // Store payment data
      storePaymentData(payRef);

      // Convert amount to kobo
      const amountInKobo = Math.floor(formData.total_cost * 100);
      
      // Create checkout URL
      const checkoutUrl = `https://checkout.paystack.co/?amount=${amountInKobo}&email=${encodeURIComponent(user.email)}&key=${encodeURIComponent(paystackKey)}&ref=${payRef}&currency=NGN`;
      
      // Open in new window
      window.open(checkoutUrl, '_blank');
      
      toast({
        title: "Payment Page Opening",
        description: "You'll be redirected to Paystack's secure payment page in a new window.",
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to open direct payment URL:', error);
      toast({
        title: "Payment Error",
        description: "Could not initialize payment. Please try again or contact support.",
        variant: "destructive"
      });
    }
  };

  // Submit customization request with payment reference
  const submitCustomizationRequestWithPayment = async (paymentRef: string) => {
    try {
      // Validate required fields
      if (!selectedTechnique) {
        throw new Error('No printing technique selected');
      }

      if (!formData.design_file) {
        throw new Error('No design file uploaded');
      }

      if (!formData.item_description.trim()) {
        throw new Error('Item description is required');
      }

      if (!formData.size.trim()) {
        throw new Error('Size is required');
      }

      // Create concise description within character limits
      const description = `Personal item customization using ${formData.technique_name} technique.

Item: ${formData.item_description}
Size: ${formData.size}
Color: ${formData.color || 'N/A'}
Quantity: ${formData.quantity}
Fabric Quality: ${selectedFabricQuality} GSM

Payment Reference: ${paymentRef}

Technical Details:
- Technique: ${formData.technique_name}
- Unit Cost: ₦${formData.unit_cost.toLocaleString()}
- Total Cost: ₦${formData.total_cost.toLocaleString()}
- Phone: ${formData.phone_number || 'N/A'}
- WhatsApp: ${formData.whatsapp_number || 'N/A'}`;

      // Use the uploaded design URL directly (no need to handle data URLs anymore)
      const designUrl = formData.design_url || 'Design uploaded';

      // Create the request data matching the expected schema
      const requestData = {
        user_id: user?.id || (user as any)?.$id || '',
        // User details
        user_name: user?.email?.split('@')[0] || 'Unknown User',
        user_email: user?.email || 'unknown@email.com',

        title: `Personal Item Customization - ${formData.item_description}`,
        description: description, // This already includes paymentRef
        status: 'Pending' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        
        // Core customization fields
        technique_id: formData.technique_id,
        technique_name: formData.technique_name, 
        design_url: designUrl,
        item_type: 'personal_item',
        size: formData.size,
        color: formData.color,
        quantity: formData.quantity,
        
        // Cost breakdown
        unit_cost: formData.unit_cost,
        technique_cost: formData.technique_cost,
        fabric_cost: formData.fabric_cost,
        total_cost: formData.total_cost,
        
        // Contact information
        phone_number: formData.phone_number,
        whatsapp_number: formData.whatsapp_number,
        delivery_address: formData.delivery_address,
        
        // Fabric details
        fabric_quality: formData.want_to_buy_blank ? selectedFabricQuality : undefined,
        fabric_purchase_option: formData.want_to_buy_blank ? 'help_buy' as const : 'already_have' as const,
        
        // Payment details for payment submission
        payment_reference: paymentRef, 
        payment_completed: true,

        // Additional fields that might be expected (ensure non-applicable product fields are undefined)
        material_id: undefined,
        product_id: undefined,
        product_name: undefined,
        product_price: undefined,
        product_cost: undefined,
        product_size: undefined, // item's size is already captured in 'size' field for personal_item
        image_url: undefined, // No specific product image for personal item
        admin_notes: undefined, // Default to undefined
        
        notes: `Personal item customization. Payment completed via reference: ${paymentRef}`,
      };

      console.log('Submitting customization request with payment:', requestData);

      const response = await createCustomizationRequest(requestData);
      console.log('Customization request created:', response);

      return response;
    } catch (error) {
      console.error('Error submitting customization request with payment:', error);
      throw error;
    }
  };

  return (
    <div className={cn(
      "max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg",
      className
    )}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Personal Item Customization
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Bring your own item (t-shirt, hoodie, etc.) and we'll customize it with your design
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
              1
            </div>
            <span className="text-sm font-medium text-blue-600">Technique</span>
          </div>
          <div className="flex-1 h-px bg-gray-300 mx-4"></div>
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              formData.design_file ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
            )}>
              2
            </div>
            <span className={cn(
              "text-sm font-medium",
              formData.design_file ? "text-blue-600" : "text-gray-600"
            )}>
              Design
            </span>
          </div>
          <div className="flex-1 h-px bg-gray-300 mx-4"></div>
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              formData.item_description && formData.size ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
            )}>
              3
            </div>
            <span className={cn(
              "text-sm font-medium",
              formData.item_description && formData.size ? "text-blue-600" : "text-gray-600"
            )}>
              Details
            </span>
          </div>
        </div>
      </div>

      {/* Step 1: Technique Selection */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Select Printing Technique
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Choose the best printing technique for your design.
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading printing techniques...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {techniques.map((technique) => (
              <div
                key={technique.id}
                className={cn(
                  "p-4 border-2 rounded-lg cursor-pointer transition-all duration-200",
                  selectedTechnique?.id === technique.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
                onClick={() => handleTechniqueSelect(technique)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {technique.name}
                  </h3>
                  <span className="text-blue-600 font-bold">
                    {formatCurrency(technique.cost)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {technique.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Max Size: {technique.max_size}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Design Upload */}
      {selectedTechnique && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Upload Your Design
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Area */}
            <div>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  isLoading
                    ? "border-blue-300 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {isLoading ? (
                  <div className="space-y-4">
                    <Loader2 className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Uploading design...
                      </p>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">{uploadProgress}%</p>
                    </div>
                  </div>
                ) : formData.design_file ? (
                  <div className="space-y-4">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formData.design_file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(formData.design_file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Click to upload your design
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                Design Preview
              </h3>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                {designPreview ? (
                  <img
                    src={designPreview}
                    alt="Design preview"
                    className="w-full h-48 object-contain rounded"
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">No design uploaded</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Item Details */}
      {formData.design_file && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Item Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Item Description *
                </label>
                <Input
                  name="item_description"
                  placeholder="e.g., Cotton T-shirt, Hoodie, etc."
                  value={formData.item_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, item_description: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Size *
                </label>
                <Input
                  name="size"
                  placeholder="e.g., Medium, Large, XL"
                  value={formData.size}
                  onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <Input
                  name="color"
                  placeholder="e.g., Black, White, Navy"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantity
                </label>
                <Input
                  name="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Do you want to buy blank T-Shirt? *
                </label>
                <div className="flex space-x-6">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="want_to_buy_blank"
                      value="yes"
                      checked={formData.want_to_buy_blank === true}
                      onChange={() => setFormData(prev => ({ ...prev, want_to_buy_blank: true }))}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="want_to_buy_blank"
                      value="no"
                      checked={formData.want_to_buy_blank === false}
                      onChange={() => setFormData(prev => ({ ...prev, want_to_buy_blank: false }))}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">No</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Select "Yes" if you need us to provide the blank item, or "No" if you're bringing your own
                </p>
              </div>

              {/* Conditional Fabric Quality Dropdown */}
              {formData.want_to_buy_blank && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fabric Quality (GSM) *
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    value={selectedFabricQuality}
                    onChange={(e) => setSelectedFabricQuality(parseInt(e.target.value))}
                  >
                    {fabricCosts.map((fabric) => (
                      <option key={fabric.quality} value={fabric.quality}>
                        {fabric.quality} GSM - {formatCurrency(fabric.cost)}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Higher GSM means thicker, more durable fabric
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <Input
                  name="phone_number"
                  placeholder="Your phone number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  WhatsApp Number
                </label>
                <Input
                  name="whatsapp_number"
                  placeholder="Your WhatsApp number"
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Delivery Address *
                </label>
                <textarea
                  name="delivery_address"
                  placeholder="Your complete delivery address"
                  value={formData.delivery_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[80px]"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cost Summary */}
      {selectedTechnique && formData.design_file && (
        <div className="mb-8">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Cost Breakdown
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Printing Technique ({selectedTechnique.name})</span>
                <span className="font-medium">{formatCurrency(formData.technique_cost)}</span>
              </div>
              {formData.want_to_buy_blank && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Fabric Quality ({selectedFabricQuality} GSM)</span>
                  <span className="font-medium">{formatCurrency(formData.fabric_cost)}</span>
                </div>
              )}
              {!formData.want_to_buy_blank && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Fabric Cost (Bringing own item)</span>
                  <span className="font-medium text-green-600">₦0.00</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Unit Cost</span>
                <span className="font-medium">{formatCurrency(formData.unit_cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Quantity</span>
                <span className="font-medium">{formData.quantity}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">Total Cost</span>
                  <span className="text-blue-600">{formatCurrency(formData.total_cost)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Section */}
      {selectedTechnique && formData.design_file && formData.item_description && formData.size && (
        <div className="space-y-4">


          {/* Validation Error Display */}
          {(() => {
            const { isValid, errorMessage } = validateFormForPayment();
            if (!isValid && isAuthenticated) {
              return (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800/30 flex items-start">
                  <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              );
            }
            return null;
          })()}

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

          <div className="flex flex-col sm:flex-row gap-4">
            {isAuthenticated ? (
              (() => {
                const { isValid } = validateFormForPayment();
                
                if (isProcessingPayment) {
                  return (
                    <button
                      type="button"
                      disabled={true}
                      className="w-full flex justify-center items-center py-3.5 px-4 rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-500 opacity-70 cursor-not-allowed"
                    >
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing Payment...
                    </button>
                  );
                }

                // Generate payment reference
                const payRef = paymentReference || generatePaymentReference();
                if (!paymentReference) {
                  setPaymentReference(payRef);
                }

                // Store payment data before showing payment options
                if (isValid) {
                  storePaymentData(payRef);
                }

                return (
                  <>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !isValid}
                      className="flex-1"
                      variant="outline"
                    >
                      {isSubmitting ? (
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
                          onClick={openDirectPaymentUrl}
                          disabled={!isValid || formData.total_cost <= 0}
                          className="w-full flex justify-center items-center py-3.5 px-4 rounded-lg shadow-sm text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <DollarSign className="w-5 h-5 mr-2" />
                          Pay ₦{formData.total_cost.toLocaleString()}
                        </button>
                        <p className="text-xs text-gray-500 text-center">
                          Using alternative payment method
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <PaymentOptionPanel
                          amount={formData.total_cost}
                          email={user?.email || 'test@example.com'}
                          reference={payRef}
                          onSuccess={handlePaymentSuccess}
                          onClose={handlePaymentClose}
                          isLoading={isProcessingPayment}
                          disabled={!isValid || formData.total_cost <= 0}
                          metadata={{
                            customization_type: 'personal_item',
                            technique: formData.technique_name,
                            item_description: formData.item_description,
                            size: formData.size,
                            quantity: formData.quantity
                          }}
                        />
                      </div>
                    )}
                  </>
                );
              })()
            ) : (
              <Button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign in to Continue
              </Button>
            )}
          </div>

          {/* Alternative payment options */}
          {isAuthenticated && !useDirectPayment && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setUseDirectPayment(true)}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                Having trouble? Try alternative payment method
              </button>
            </div>
          )}

          {/* Fallback payment option */}
          {paymentFailed && (
            <div className="text-center">
              <button
                type="button"
                onClick={openDirectPaymentUrl}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                Still having issues? Try direct payment link
              </button>
            </div>
          )}
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default YourItemCustomizationForm; 