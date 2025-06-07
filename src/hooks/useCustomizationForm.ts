import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types/product';
import { databases } from '../lib/appwrite';
import { APPWRITE_DB_ID, APPWRITE_PRODUCTS_COLLECTION_ID } from '../constants/appwrite';
import { getPrintingTechniques } from '../services/order.service';
import { uploadDesign, createCustomizationRequest } from '../services/customization.service';

// Types
export type FormStep = 'technique' | 'design' | 'details';

export interface TechniqueCost {
  id: string;
  name: string;
  cost: number;
}

export interface ContactInfo {
  phone_number: string;
  whatsapp_number: string;
  delivery_address: string;
}

export const printingTechniques = [
  {
    id: 'DTF',
    title: 'DTF Printing',
    description: 'Direct-to-film printing for vibrant, durable designs with excellent wash resistance.',
    size: '10x10',
  },
  {
    id: 'SUB',
    title: 'Sublimation',
    description: 'Full-color, edge-to-edge printing perfect for all-over designs and photographs.',
    size: '12x12',
  },
  {
    id: 'FLEX',
    title: 'Flex Vinyl',
    description: 'Premium heat transfer vinyl for sharp, professional results with a smooth finish.',
    size: '10x10',
  },
  {
    id: 'FLOCK',
    title: 'Flock Vinyl',
    description: 'Textured, velvet-like finish for a unique and premium feel.',
    size: '15x15',
  },
  {
    id: 'PUFF',
    title: '3D Puff',
    description: 'Raised, dimensional prints that add texture and depth to your designs.',
    size: '12x12',
  },
];

const defaultPrintingTechniqueCosts: TechniqueCost[] = [
  { id: 'DTF', name: 'DTF Printing', cost: 2510 },
  { id: 'SUB', name: 'Sublimation', cost: 3011 },
  { id: 'FLEX', name: 'Flex Vinyl', cost: 4780 },
  { id: 'FLOCK', name: 'Flock Vinyl', cost: 4780 },
  { id: 'PUFF', name: '3D Puff', cost: 6010 },
];

const generatePaymentReference = (): string => {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 1000000);
  return `KRI8BLANK_PROD_${timestamp}_${randomNum}`;
};

export const useCustomizationForm = (product: Product, onSuccess?: () => void) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State variables
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [uploadingDesign, setUploadingDesign] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<FormStep>('technique');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);

  // Payment state
  const [paymentReference, setPaymentReference] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [useDirectPayment, setUseDirectPayment] = useState(false);

  // Selected technique data
  const [selectedTechnique, setSelectedTechnique] = useState<string>('');
  const [selectedTechniqueCost, setSelectedTechniqueCost] = useState<number>(0);
  const [selectedTechniqueName, setSelectedTechniqueName] = useState<string>('');

  // Design upload data
  const [designUrls, setDesignUrls] = useState<string[]>([]);
  const [designFiles, setDesignFiles] = useState<File[]>([]);
  const [designNames, setDesignNames] = useState<string[]>([]);
  const [permanentDesignUrls, setPermanentDesignUrls] = useState<string[]>([]);
  // Note: dragActive state removed since upload functionality is no longer needed

  // Product details state
  const [productDetails, setProductDetails] = useState<Product | null>(product);
  const [productPrice, setProductPrice] = useState<number>(product?.price || 0);

  // Size and quantity data
  const [selectedSize, setSelectedSize] = useState<string>(product?.selectedSize || '');
  const [quantity, setQuantity] = useState<number>(1);

  // Contact information
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    phone_number: '',
    whatsapp_number: '',
    delivery_address: ''
  });

  // Cost data
  const [printingTechniqueCosts, setPrintingTechniqueCosts] = useState<TechniqueCost[]>([]);
  const [printingTechniquesData, setPrintingTechniquesData] = useState<typeof printingTechniques>([]);
  const [totalCost, setTotalCost] = useState<number>(0);

  // Fullscreen canvas state
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);

  // Payment configuration
  const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  const isPaystackConfigured = paystackPublicKey && paystackPublicKey.startsWith('pk_');

  // State for preventing duplicate submissions
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionRef, setLastSubmissionRef] = useState<string | null>(null);

  // Fetch customization costs
  const getCustomizationCosts = async () => {
    try {
      const techniques = await getPrintingTechniques();
      
      const techniqueCosts: TechniqueCost[] = techniques.map(technique => ({
        id: technique.id,
        name: technique.name,
        cost: technique.cost
      }));
      
      const mappedTechniques = techniques.map(technique => {
        const fallbackTechnique = printingTechniques.find(
          t => t.title.toLowerCase() === technique.name.toLowerCase()
        );
        
        return {
          id: technique.id,
          title: technique.name,
          description: technique.description || fallbackTechnique?.description || 
            'Custom printing technique for your designs.',
          size: technique.design_area || fallbackTechnique?.size || '10x10',
        };
      });
      
      return {
        techniques: techniqueCosts.length > 0 ? techniqueCosts : defaultPrintingTechniqueCosts,
        printingTechniquesData: mappedTechniques.length > 0 ? mappedTechniques : printingTechniques
      };
    } catch (error) {
      console.error('Error fetching customization costs:', error);
      return {
        techniques: defaultPrintingTechniqueCosts,
        printingTechniquesData: printingTechniques
      };
    }
  };

  // Load cost data
  useEffect(() => {
    const loadCostData = async () => {
      setLoading(true);
      try {
        const costData = await getCustomizationCosts();
        setPrintingTechniqueCosts(costData.techniques);
        setPrintingTechniquesData(costData.printingTechniquesData);
      } catch (error) {
        console.error('Failed to load customization costs:', error);
        toast({
          title: 'Error',
          description: 'Failed to load customization costs. Using default values instead.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadCostData();
  }, [toast]);

  // Fetch product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!product?.id) {
        setProductDetails(product);
        return;
      }
      setProductLoading(true);
      setProductError(null);
      try {
        const fetchedProduct = await databases.getDocument(
          APPWRITE_DB_ID,
          APPWRITE_PRODUCTS_COLLECTION_ID,
          product.id
        );
        const productData = fetchedProduct as unknown as Product;
        setProductDetails(productData);
        setProductPrice(productData.price || 0);
      } catch (err) {
        console.error('Error fetching product details:', err);
        setProductError('Failed to load product details. Please try again.');
        setProductDetails(product);
        toast({
          title: 'Error Loading Product',
          description: 'Could not fetch complete product details. Some options might be limited.',
          variant: 'destructive',
        });
      } finally {
        setProductLoading(false);
      }
    };

    fetchProductDetails();
  }, [product, toast]);

  // Set default size
  useEffect(() => {
    if (productDetails?.sizes && productDetails.sizes.length > 0 && !selectedSize) {
      setSelectedSize(productDetails.sizes[0]);
    }
    if (product && product.id !== productDetails?.id) {
       setStep('technique');
    }
  }, [productDetails, product, selectedSize]);

  // Calculate total cost
  useEffect(() => {
    const currentProduct = productDetails || product;
    const productCost = currentProduct?.price || 0;
    const techniqueCost = selectedTechniqueCost || 0;
    const unitCost = productCost + techniqueCost;
    const total = unitCost * quantity;
    setTotalCost(total);
  }, [productDetails, product?.price, selectedTechniqueCost, quantity]);

  // Note: File upload functionality removed - designs are now created only through canvas

  // Validation
  const validateFormForPayment = (): { isValid: boolean; errorMessage: string } => {
    if (!selectedTechnique) {
      return { isValid: false, errorMessage: "Please select a printing technique first" };
    }
    // Note: Design validation removed since canvas designs are saved separately
    // and may not appear in designUrls until after canvas interaction
    if (!selectedSize) {
      return { isValid: false, errorMessage: "Please select a size" };
    }
    if (!contactInfo.phone_number.trim()) {
      return { isValid: false, errorMessage: "Please provide your phone number" };
    }
    if (!contactInfo.delivery_address.trim()) {
      return { isValid: false, errorMessage: "Please provide your delivery address" };
    }
    return { isValid: true, errorMessage: "" };
  };

  // Store payment data with size optimization
  const storePaymentData = (payRef: string) => {
    try {
      // Clear any existing large data first
      localStorage.removeItem('customization_payment_intent');
      
    const designUrl = permanentDesignUrls.length > 0 ? permanentDesignUrls[0] : designUrls[0];

      // Collect only essential design filenames (limit to prevent quota issues)
    const allDesignFileNames: string[] = [];
    
      // Limit to first 5 designs to prevent quota issues
      const limitedPermanentUrls = permanentDesignUrls.slice(0, 5);
      const limitedDesignUrls = designUrls.slice(0, 5);
      
      // Generate simple filenames from URLs
      if (limitedPermanentUrls.length > 0) {
        limitedPermanentUrls.forEach((url, index) => {
          if (url && url.trim() !== '' && !url.startsWith('blob:')) {
            const urlParts = url.split('/');
            const lastPart = urlParts[urlParts.length - 1];
            if (lastPart && lastPart.includes('.')) {
              // Extract just the filename without full path
              const filename = lastPart.split('?')[0]; // Remove query params
              allDesignFileNames.push(filename.substring(0, 50)); // Limit filename length
            } else {
              allDesignFileNames.push(`design-${index + 1}.png`);
            }
          }
        });
    }
    
      // Remove duplicates and limit total count
      const uniqueDesignFileNames = [...new Set(allDesignFileNames)].slice(0, 5);

      // Create minimal payment data object
    const paymentData = {
      reference: payRef,
      productId: product?.id || '',
        productName: (product?.name || '').substring(0, 100), // Limit length
      productPrice: product?.price || 0,
      selectedSize: selectedSize || '',
      selectedTechnique: selectedTechnique || null,
        techniqueId: selectedTechnique || null,
        technique_name: (selectedTechniqueName || '').substring(0, 50),
      technique_cost: selectedTechniqueCost || 0,
      amount: totalCost || 0,
      customizationType: 'product',
      quantity: quantity || 1,
        // Store only essential URLs (limit to prevent quota issues)
        designUrls: limitedDesignUrls,
        permanentDesignUrls: limitedPermanentUrls,
        designFileNames: uniqueDesignFileNames,
      phone_number: contactInfo.phone_number || '',
      whatsapp_number: contactInfo.whatsapp_number || '',
        delivery_address: (contactInfo.delivery_address || '').substring(0, 200), // Limit length
      timestamp: new Date().toISOString(),
    };

      // Check size before storing
      const dataString = JSON.stringify(paymentData);
      const dataSize = new Blob([dataString]).size;
      
      if (dataSize > 4000000) { // 4MB limit (conservative)
        console.warn('Payment data too large, reducing further...');
        // Further reduce data if still too large
        paymentData.designUrls = paymentData.designUrls.slice(0, 2);
        paymentData.permanentDesignUrls = paymentData.permanentDesignUrls.slice(0, 2);
        paymentData.designFileNames = paymentData.designFileNames.slice(0, 2);
      }

    localStorage.setItem('customization_payment_intent', JSON.stringify(paymentData));
    
      console.log('Payment data stored (optimized):', {
      reference: payRef,
        designFileNames: uniqueDesignFileNames.length,
      totalDesigns: uniqueDesignFileNames.length,
        dataSize: `${Math.round(dataSize / 1024)}KB`,
      productName: product?.name
    });
    } catch (error) {
      console.error('Error storing payment data:', error);
      // Fallback: store minimal data only
      try {
        const minimalData = {
          reference: payRef,
          productId: product?.id || '',
          productName: product?.name || '',
          selectedTechnique: selectedTechnique,
          amount: totalCost,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem('customization_payment_intent', JSON.stringify(minimalData));
        console.log('Stored minimal payment data as fallback');
      } catch (fallbackError) {
        console.error('Failed to store even minimal payment data:', fallbackError);
      }
    }
  };

  // Submit request with payment
  const submitCustomizationRequestWithPayment = async (paymentRef: string) => {
    // Prevent duplicate submissions
    if (isSubmitting) {
      console.log('Submission already in progress, skipping duplicate');
      return null;
    }
    
    // Check if this payment reference was already processed
    if (lastSubmissionRef === paymentRef) {
      console.log('Payment reference already processed, skipping duplicate:', paymentRef);
      return null;
    }
    
    setIsSubmitting(true);
    setLastSubmissionRef(paymentRef);
    
    try {
      if (!selectedTechnique || designUrls.length === 0 || !selectedSize) {
        throw new Error('Missing required fields');
      }

      // Get stored payment data to access filenames
      let designFileName = '';
      let allDesignFileNames: string[] = [];
      
      try {
        const storedPaymentData = localStorage.getItem('customization_payment_intent');
        if (storedPaymentData) {
          const paymentData = JSON.parse(storedPaymentData);
          if (paymentData.designFileNames && paymentData.designFileNames.length > 0) {
            allDesignFileNames = paymentData.designFileNames;
            designFileName = paymentData.designFileNames[0];
          }
        }
      } catch (error) {
        console.warn('Error retrieving design filenames from payment data:', error);
      }

      // Use ImageKit URLs from permanent design URLs (these are the actual ImageKit URLs)
      const designUrl = permanentDesignUrls.length > 0 ? permanentDesignUrls[0] : designUrls[0];
      if (!designFileName) {
        // Try to extract filename from URL or generate one
        if (designUrl && !designUrl.startsWith('blob:')) {
          const urlParts = designUrl.split('/');
          const lastPart = urlParts[urlParts.length - 1];
          if (lastPart && lastPart.includes('.')) {
            designFileName = lastPart;
          } else {
            designFileName = `product-design-${Date.now()}.png`;
          }
        } else {
          designFileName = `product-design-${Date.now()}.png`;
        }
      }

      // Convert filenames to proper Appwrite URLs
      const convertFileNameToAppwriteUrl = (fileName: string): string => {
        if (!fileName || fileName.trim() === '') {
          return '';
        }

        // If it's already a URL, return as-is
        if (fileName.startsWith('http') || fileName.includes('cloud.appwrite.io')) {
          return fileName;
        }

        // For filenames that follow our pattern: ViewName-ShortCode-Timestamp.png
        // We'll construct the proper Appwrite URL
        const projectId = '67ea2c3b00309b589901';
        const bucketId = 'user_avatars';
        
        // Since we can't easily search for the file by name in this context,
        // we'll use the permanent URLs if available, or construct a URL pattern
        if (permanentDesignUrls.length > 0) {
          const matchingUrl = permanentDesignUrls.find(url => 
            url && url.includes('cloud.appwrite.io') && url.includes('user_avatars')
          );
          if (matchingUrl) {
            return matchingUrl;
          }
        }

        // If we have a timestamp in the filename, try to construct URL
        const timestampMatch = fileName.match(/-(\d+)\.png$/);
        if (timestampMatch) {
          // This is a fallback - in practice, we should use the actual file ID
          // For now, return the filename and let the backend handle it
          return fileName;
        }

        // Fallback: return the filename as-is
        return fileName;
      };

      // Use ImageKit URLs directly from permanentDesignUrls (these are already proper URLs)
      const primaryDesignUrl = permanentDesignUrls.length > 0 ? permanentDesignUrls[0] : designUrl;
      const secondaryDesignUrl = permanentDesignUrls.length > 1 ? permanentDesignUrls[1] : undefined;

      const currentProduct = productDetails || product;
      const productName = currentProduct?.name || '';
      const productPrice = currentProduct?.price || 0;
      const productId = currentProduct?.id || '';

      // Create concise notes within 1000 character limit
      const baseNote = `Product customization request. Payment completed via reference: ${paymentRef}`;
      const designCount = allDesignFileNames.length > 0 ? allDesignFileNames.length : permanentDesignUrls.length;
      const designInfo = `. ${designCount} design file(s) uploaded.`;
      
      // Add additional design URLs to notes if there are more than 2
      let additionalDesignUrls = '';
      if (permanentDesignUrls.length > 2) {
        const extraUrls = permanentDesignUrls.slice(2);
        additionalDesignUrls = ` Additional designs: ${extraUrls.join(', ')}`;
      }
      
      // Keep notes under 1000 characters by being concise
      let notes = baseNote + designInfo;
      
      // Add technique info if space allows
      if (selectedTechniqueName && notes.length + selectedTechniqueName.length + 20 < 950) {
        notes += ` Technique: ${selectedTechniqueName}.`;
      }
      
      // Add additional URLs if space allows
      if (additionalDesignUrls && notes.length + additionalDesignUrls.length < 950) {
        notes += additionalDesignUrls;
      }
      
      // Ensure notes don't exceed 1000 characters
      if (notes.length > 1000) {
        notes = notes.substring(0, 997) + '...';
      }

      // Create admin_notes with structured design data for better parsing
      // Limit to prevent exceeding 1000 character database limit
      let adminNotes = '';
      if (permanentDesignUrls.length > 0) {
        // Only store first 3 URLs to stay within character limit
        const limitedUrls = permanentDesignUrls.slice(0, 3);
        adminNotes = `DESIGN_URLS: ${limitedUrls.join('|')}`;
        
        // Add count if there are more designs
        if (permanentDesignUrls.length > 3) {
          adminNotes += ` | TOTAL: ${permanentDesignUrls.length}`;
        }
        
        // Add limited filenames if available and space allows
        if (allDesignFileNames.length > 0 && adminNotes.length < 800) {
          const limitedNames = allDesignFileNames.slice(0, 3);
          const filenamesText = ` | FILENAMES: ${limitedNames.join('|')}`;
          if (adminNotes.length + filenamesText.length < 950) {
            adminNotes += filenamesText;
          }
        }
        
        // Ensure we don't exceed 1000 characters
        if (adminNotes.length > 950) {
          adminNotes = adminNotes.substring(0, 947) + '...';
        }
      }

      const requestData = {
        user_id: user?.id || (user as any)?.$id || '',
        title: `Product Customization - ${productName}`,
        description: `Product customization using ${selectedTechniqueName} technique.`,
        status: 'Pending' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        technique_id: selectedTechnique || '',
        technique_name: selectedTechniqueName || '',
        design_url: primaryDesignUrl, // Use ImageKit URL
        item_type: 'product',
        size: selectedSize,
        quantity: quantity,
        unit_cost: (productPrice + selectedTechniqueCost),
        technique_cost: selectedTechniqueCost,
        total_cost: totalCost,
        phone_number: contactInfo.phone_number,
        whatsapp_number: contactInfo.whatsapp_number,
        delivery_address: contactInfo.delivery_address,
        product_id: productId,
        product_name: productName,
        product_price: productPrice,
        product_size: selectedSize,
        product_cost: productPrice,
        user_name: user?.email?.split('@')[0] || 'Unknown User',
        user_email: user?.email || 'unknown@email.com',
        payment_reference: paymentRef || '',
        payment_completed: true,
        image_url: secondaryDesignUrl && secondaryDesignUrl.startsWith('http') ? secondaryDesignUrl : undefined, // Use proper URL for secondary design
        material: undefined,
        color: undefined,
        fabric_quality: undefined,
        fabric_purchase_option: undefined,
        fabric_cost: 0,
        notes: notes,
        admin_notes: adminNotes, // Store structured design data here
        material_id: undefined
      };

      if (!requestData.product_name || !requestData.product_size) {
        throw new Error('Product name and size are required');
      }

      const response = await createCustomizationRequest(requestData);
      return response;
    } catch (error) {
      console.error('Error submitting customization request with payment:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Payment success handler
  const handlePaymentSuccess = (response: any) => {
    toast({
      title: "Payment Successful!",
      description: "Your payment was successful. Processing your customization request...",
      variant: "default"
    });
    
    setIsProcessingPayment(true);
    storePaymentData(response.reference);
    
    submitCustomizationRequestWithPayment(response.reference)
      .then(requestData => {
        if (requestData?.id) {
          (window as any).customizationId = requestData.id;
          navigate(`/customization-confirmation/${requestData.id}?reference=${response.reference}&status=success&productName=${encodeURIComponent(productDetails?.name || product.name)}`);
        } else {
          toast({
            title: "Almost there!",
            description: "Your payment was received, but you'll need to complete the form submission.",
            variant: "default"
          });
          navigate(`/payment/success?reference=${response.reference}&redirect=customization`);
        }
      })
      .catch(error => {
        console.error('Error submitting request after payment:', error);
        toast({
          title: "Payment received",
          description: "Your payment was successful. Please contact support to complete your order.",
          variant: "default"
        });
        navigate(`/payment/success?reference=${response.reference}&redirect=customization`);
      })
      .finally(() => {
        setIsProcessingPayment(false);
      });
  };

  // Payment close handler
  const handlePaymentClose = () => {
    setPaymentFailed(true);
  };

  // Direct payment
  const openDirectPaymentUrl = () => {
    const directPaymentUrl = 'https://paystack.com/pay/kri8tiveblanks';
    window.open(directPaymentUrl, '_blank');
  };

  // Submit without payment
  const handleSubmitWithoutPayment = async () => {
    const { isValid } = validateFormForPayment();
    if (!isValid) {
      toast({
        title: "Form incomplete",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setFormSubmitted(true);

    try {
      // Use proper Appwrite URL instead of placeholder text
      let primaryDesignUrl = '';
      let secondaryDesignUrl = '';
      
      // Prefer permanent URLs (Appwrite storage URLs) over temporary blob URLs
      if (permanentDesignUrls.length > 0) {
        primaryDesignUrl = permanentDesignUrls[0];
        secondaryDesignUrl = permanentDesignUrls.length > 1 ? permanentDesignUrls[1] : '';
      } else if (designUrls.length > 0) {
        // Fallback to design URLs, but avoid blob URLs in database
        const nonBlobUrls = designUrls.filter(url => !url.startsWith('blob:'));
        if (nonBlobUrls.length > 0) {
          primaryDesignUrl = nonBlobUrls[0];
          secondaryDesignUrl = nonBlobUrls.length > 1 ? nonBlobUrls[1] : '';
        } else {
          // If only blob URLs available, use a placeholder that indicates upload was successful
          primaryDesignUrl = `Design uploaded - ${designFiles.length > 0 ? designFiles[0].name : 'custom-design'} - ${Date.now()}`;
        }
      } else {
        primaryDesignUrl = 'Design uploaded';
      }

      const currentProduct = productDetails || product;
      const productName = currentProduct?.name || '';
      const productPrice = currentProduct?.price || 0;
      const productId = currentProduct?.id || '';

      // Create concise notes within 1000 character limit
      const baseNote = `Product customization request submitted without payment.`;
      const designCount = designFiles.length > 0 ? designFiles.length : (permanentDesignUrls.length > 0 ? permanentDesignUrls.length : 1);
      const designInfo = ` ${designCount} design file(s) uploaded.`;
      
      // Add additional design URLs to notes if there are more than 2
      let additionalDesignUrls = '';
      if (permanentDesignUrls.length > 2) {
        const extraUrls = permanentDesignUrls.slice(2);
        additionalDesignUrls = ` Additional designs: ${extraUrls.join(', ')}`;
      }
      
      // Keep notes under 1000 characters by being concise
      let notes = baseNote + designInfo;
      
      // Add technique info if space allows
      if (selectedTechniqueName && notes.length + selectedTechniqueName.length + 20 < 950) {
        notes += ` Technique: ${selectedTechniqueName}.`;
      }
      
      // Add additional URLs if space allows
      if (additionalDesignUrls && notes.length + additionalDesignUrls.length < 950) {
        notes += additionalDesignUrls;
      }
      
      // Ensure notes don't exceed 1000 characters
      if (notes.length > 1000) {
        notes = notes.substring(0, 997) + '...';
      }

              // Create admin_notes with structured design data for better parsing
        // Limit to prevent exceeding 1000 character database limit
        let adminNotes = '';
        if (permanentDesignUrls.length > 0) {
          // Only store first 3 URLs to stay within character limit
          const limitedUrls = permanentDesignUrls.slice(0, 3);
          adminNotes = `DESIGN_URLS: ${limitedUrls.join('|')}`;
          
          // Add count if there are more designs
          if (permanentDesignUrls.length > 3) {
            adminNotes += ` | TOTAL: ${permanentDesignUrls.length}`;
          }
          
          // Get design filenames from stored data
          const allDesignFileNames: string[] = [];
          if (designFiles.length > 0) {
            allDesignFileNames.push(...designFiles.map(file => file.name));
          }
          
          // Add limited filenames if available and space allows
          if (allDesignFileNames.length > 0 && adminNotes.length < 800) {
            const limitedNames = allDesignFileNames.slice(0, 3);
            const filenamesText = ` | FILENAMES: ${limitedNames.join('|')}`;
            if (adminNotes.length + filenamesText.length < 950) {
              adminNotes += filenamesText;
            }
          }
          
          // Ensure we don't exceed 1000 characters
          if (adminNotes.length > 950) {
            adminNotes = adminNotes.substring(0, 947) + '...';
          }
        }

      const requestData = {
        user_id: user?.id || (user as any)?.$id || '',
        title: `Product Customization - ${productName}`,
        description: `Product customization using ${selectedTechniqueName} technique.`,
        status: 'Pending' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        technique_id: selectedTechnique || '',
        technique_name: selectedTechniqueName || '',
        design_url: primaryDesignUrl, // Use proper URL or meaningful placeholder
        item_type: 'product',
        size: selectedSize,
        quantity: quantity,
        unit_cost: (productPrice + selectedTechniqueCost),
        technique_cost: selectedTechniqueCost,
        total_cost: totalCost,
        phone_number: contactInfo.phone_number,
        whatsapp_number: contactInfo.whatsapp_number,
        delivery_address: contactInfo.delivery_address,
        product_id: productId,
        product_name: productName,
        product_price: productPrice,
        product_size: selectedSize,
        product_cost: productPrice,
        user_name: user?.email?.split('@')[0] || 'Unknown User',
        user_email: user?.email || 'unknown@email.com',
        payment_reference: undefined,
        payment_completed: false,
        image_url: (secondaryDesignUrl && secondaryDesignUrl.startsWith('http')) ? secondaryDesignUrl : 
                   (currentProduct?.image_url && currentProduct.image_url.startsWith('http')) ? currentProduct.image_url : undefined,
        material: undefined,
        color: undefined,
        fabric_quality: undefined,
        fabric_purchase_option: undefined,
        fabric_cost: 0,
        notes: notes,
        admin_notes: adminNotes, // Store structured design data here
        material_id: undefined,
      };

      await createCustomizationRequest(requestData);

      toast({
        title: "Request submitted!",
        description: "Your customization request has been submitted successfully",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission failed",
        description: "Failed to submit your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFormSubmitted(false);
    }
  };

  // Handler functions
  const handleTechniqueSelect = (techniqueId: string, cost: number, name: string) => {
    setSelectedTechnique(techniqueId);
    setSelectedTechniqueCost(cost);
    setSelectedTechniqueName(name);
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
  };

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

  const handleContactInfoChange = (info: ContactInfo) => {
    setContactInfo(info);
  };

  const { isValid, errorMessage } = validateFormForPayment();
  const payRef = paymentReference || generatePaymentReference();
  if (!paymentReference) {
    setPaymentReference(payRef);
  }

  if (isValid) {
    storePaymentData(payRef);
  }

  return {
    // State
    isAuthenticated,
    setIsAuthenticated,
    isAuthModalOpen,
    setIsAuthModalOpen,
    loading,
    productLoading,
    productError,
    uploadingDesign,
    error,
    step,
    setStep,
    formSubmitted,
    showDetailedBreakdown,
    setShowDetailedBreakdown,
    paymentReference,
    setPaymentReference,
    isProcessingPayment,
    paymentFailed,
    useDirectPayment,
    setUseDirectPayment,
    selectedTechnique,
    selectedTechniqueCost,
    selectedTechniqueName,
    designUrls,
    designFiles,
    designNames,
    permanentDesignUrls,

    productDetails,
    productPrice,
    selectedSize,
    quantity,
    contactInfo,
    printingTechniqueCosts,
    printingTechniquesData,
    totalCost,
    isCanvasFullscreen,
    setIsCanvasFullscreen,
    isPaystackConfigured,
    
    // Validation
    isValid,
    errorMessage,
    payRef,
    
    // Handlers
    handlePaymentSuccess,
    handlePaymentClose,
    openDirectPaymentUrl,
    handleSubmitWithoutPayment,
    handleTechniqueSelect,
    handleSizeSelect,
    handleQuantityChange,
    handleContactInfoChange,
    
    // Setters for design data
    setDesignUrls,
    setDesignNames,
    setPermanentDesignUrls,
  };
}; 