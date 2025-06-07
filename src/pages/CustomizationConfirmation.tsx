import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getCustomizationRequestById, getTechniqueNameById } from '../services/customization.service';
import { CustomizationRequest } from '../types/customization';
import { 
  CheckCircle, 
  Brush, 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  MessageCircle, 
  DollarSign, 
  PencilRuler, 
  Hash, 
  Phone, 
  MapPin, 
  StickyNote,
  User,
  ImageIcon,
  Download
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { databases } from '../lib/appwrite';
import { APPWRITE_DB_ID, APPWRITE_PRODUCTS_COLLECTION_ID } from '../constants/appwrite';
import jsPDF from 'jspdf';

// Utility function to format currency in Nigerian Naira
const formatNaira = (amount: number) => {
  const formattedAmount = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  return `₦${formattedAmount}`;
};

// Component to display product cost
const ProductCostDisplay = ({ 
  customization,
  fetchProductById,
  fallbackProductName 
}: { 
  customization: CustomizationRequest;
  fetchProductById: (id: string) => Promise<any>;
  fallbackProductName?: string;
}) => {
  const [productInfo, setProductInfo] = useState<{name: string, price: number} | null>(null);
  const [loading, setLoading] = useState(false);

  // Debug logging
  console.log('ProductCostDisplay: Component rendered with:', {
    customization_product_name: customization.product_name,
    customization_product_price: customization.product_price,
    customization_product_cost: customization.product_cost,
    customization_product_id: customization.product_id,
    fallbackProductName,
    productInfo
  });

  useEffect(() => {
    const loadProduct = async () => {
      // First priority: Use product_name and product_cost from customization request
      if (customization.product_name && customization.product_cost !== undefined && customization.product_cost !== null) {
        console.log('ProductCostDisplay: Using product_cost from customization request:', {
          name: customization.product_name,
          cost: customization.product_cost,
          costType: typeof customization.product_cost
        });
        setProductInfo({
          name: customization.product_name,
          price: Number(customization.product_cost) // Use product_cost field
        });
        return;
      }

      // Second priority: Use product_name and product_price from customization request
      if (customization.product_name && customization.product_price !== undefined && customization.product_price !== null) {
        console.log('ProductCostDisplay: Using product_price from customization request:', {
          name: customization.product_name,
          price: customization.product_price,
          priceType: typeof customization.product_price
        });
        setProductInfo({
          name: customization.product_name,
          price: Number(customization.product_price) // Use product_price field
        });
        return;
      }

      // Third priority: Use product data from the product object if available
      if (customization.product && customization.product.name && customization.product.price !== undefined) {
        console.log('ProductCostDisplay: Using product object from customization request:', {
          name: customization.product.name,
          price: customization.product.price
        });
        setProductInfo({
          name: customization.product.name,
          price: Number(customization.product.price)
        });
        return;
      }

      // Fallback: fetch from database if product_id exists but name/price are missing
      if (customization.product_id) {
        setLoading(true);
        console.log('ProductCostDisplay: Fetching product data from database for ID:', customization.product_id);
        const product = await fetchProductById(customization.product_id);
        if (product) {
          setProductInfo({
            name: product.name,
            price: product.price
          });
        }
        setLoading(false);
      } else if (fallbackProductName) {
        // Use fallback product name from URL if available (but no price)
        console.log('ProductCostDisplay: Using fallback product name from URL:', fallbackProductName);
        setProductInfo({
          name: fallbackProductName,
          price: 0 // We don't have price from URL, so show 0
        });
      }
    };

    loadProduct();
  }, [customization, fetchProductById, fallbackProductName]);

  if (loading) {
    return (
      <div className="flex justify-between items-center">
        <span className="text-gray-600 dark:text-gray-400">Loading Product...</span>
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (!productInfo) {
    return null;
  }

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600 dark:text-gray-400">{productInfo.name}:</span>
      <span className="text-gray-900 dark:text-gray-100">
        {(productInfo.price !== undefined && productInfo.price !== null && !isNaN(productInfo.price) && productInfo.price >= 0)
          ? formatNaira(productInfo.price) 
          : 'Price not available'}
      </span>
    </div>
  );
};





export default function CustomizationConfirmation() {
  const { requestId } = useParams();
  const location = useLocation();
  const [customization, setCustomization] = useState<CustomizationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [techniqueName, setTechniqueName] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();

  // Extract URL parameters for fallback data
  const searchParams = new URLSearchParams(location.search);
  const urlProductName = searchParams.get('productName');

  // Function to fetch product details by ID
  const fetchProductById = async (productId: string) => {
    if (!productId) return null;
    
    try {
      console.log('Fetching product by ID:', productId);
      const productData = await databases.getDocument(
        APPWRITE_DB_ID,
        APPWRITE_PRODUCTS_COLLECTION_ID,
        productId
      );
      console.log('Product fetched successfully:', productData);
      return {
        name: productData.name || 'Product',
        price: productData.price || 0,
        ...productData
      };
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchCustomization = async () => {
      if (!requestId) {
        setError('No request ID provided');
        setLoading(false);
        return;
      }

      try {
        const requestData = await getCustomizationRequestById(requestId);
        
        // Basic validation - only check for essential fields
        if (!requestData || !requestData.id || !requestData.user_id || !requestData.status) {
          console.error('Missing essential fields in request data:', {
            hasId: !!requestData?.id,
            hasUserId: !!requestData?.user_id,
            hasStatus: !!requestData?.status,
            requestData
          });
          setError('Invalid customization request data');
          setLoading(false);
          return;
        }

        // Log the received data for debugging
        console.log('Customization request data received:', requestData);
        console.log('Data validation check:', {
          hasId: !!requestData.id,
          hasUserId: !!requestData.user_id,
          hasStatus: !!requestData.status,
          hasTitle: !!requestData.title,
          hasDescription: !!requestData.description,
          hasTechniqueId: !!requestData.technique_id,
          hasTechniqueName: !!requestData.technique_name,
          hasTechnique: !!requestData.technique,
          hasDesignUrl: !!requestData.design_url,
          designUrlValue: requestData.design_url,
          designUrlType: typeof requestData.design_url,
          designUrlLength: requestData.design_url?.length,
          isDataUrl: requestData.design_url?.startsWith('data:'),
          hasSize: !!requestData.size,
          hasTechniqueCost: requestData.technique_cost !== undefined,
          hasUnitCost: requestData.unit_cost !== undefined,
          hasTotalCost: requestData.total_cost !== undefined
        });

        setCustomization(requestData as CustomizationRequest);

        // Fetch technique name if technique_id exists but technique_name is missing
        if (requestData.technique_id && !requestData.technique_name && !requestData.technique) {
          console.log('Fetching technique name for ID:', requestData.technique_id);
          try {
            const fetchedTechniqueName = await getTechniqueNameById(requestData.technique_id);
            if (fetchedTechniqueName) {
              setTechniqueName(fetchedTechniqueName);
              console.log('Fetched technique name:', fetchedTechniqueName);
            }
          } catch (techniqueError) {
            console.error('Error fetching technique name:', techniqueError);
          }
        }

        // Fetch product details if product_id exists
        console.log('Checking for product ID in request data:', {
          product_id: requestData.product_id,
          'product?.id': requestData.product?.id,
          item_type: requestData.item_type,
          fullRequestData: requestData
        });

        // Product details are now included in the customization request data
        if (requestData.product_id) {
          console.log('Product ID found:', requestData.product_id);
        } else if (requestData.product?.id) {
          console.log('Product object found:', requestData.product.id);
        } else {
          console.log('No product ID found - this might be a personal item customization');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching customization:', err);
        
        // Provide more specific error messages
        if (err instanceof Error) {
          if (err.message.includes('Authentication required') || err.message.includes('logged in')) {
            setError('Please log in to view this customization request');
          } else if (err.message.includes('permission') || err.message.includes('not found')) {
            setError('Customization request not found or you do not have permission to view it');
          } else {
            setError(`Failed to load customization details: ${err.message}`);
          }
        } else {
          setError('Failed to load customization details');
        }
        setLoading(false);
      }
    };

    fetchCustomization();
  }, [requestId]);



  // Function to generate and download PDF
  const generatePDF = async () => {
    if (!customization) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = margin;
      
      // Helper function to add text with word wrapping
      const addText = (text: string, x: number, y: number, options: any = {}) => {
        const fontSize = options.fontSize || 10;
        const maxWidth = options.maxWidth || pageWidth - 2 * margin;
        const lineHeight = options.lineHeight || fontSize * 1.1;
        const align = options.align || 'left';
        
        pdf.setFontSize(fontSize);
        if (options.bold) pdf.setFont('helvetica', 'bold');
        else pdf.setFont('helvetica', 'normal');
        
        const lines = pdf.splitTextToSize(text, maxWidth);
        lines.forEach((line: string, index: number) => {
          let xPos = x;
          if (align === 'center') {
            xPos = (pageWidth - pdf.getTextWidth(line)) / 2;
          } else if (align === 'right') {
            xPos = pageWidth - margin - pdf.getTextWidth(line);
          }
          pdf.text(line, xPos, y + (index * lineHeight));
        });
        
        return y + (lines.length * lineHeight);
      };
      
      // Header with Kri8tive Branding
      pdf.setFillColor(255, 87, 34); // Orange background for branding
      pdf.rect(0, 0, pageWidth, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      yPosition = addText('KRI8TIVE', pageWidth / 2, 18, { fontSize: 20, bold: true, align: 'center' });
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(7);
      pdf.text('Custom Design Studio', pageWidth / 2, 28, { align: 'center' });
      
      // Reset text color and position
      pdf.setTextColor(0, 0, 0);
      yPosition = 55;
      
      // CUSTOMIZATION REQUEST Section
      yPosition = addText('CUSTOMIZATION REQUEST', margin, yPosition, { fontSize: 12, bold: true });
      yPosition += 6;
      
      // Dynamic Request ID
      yPosition = addText(`Request ID: ${customization.id || 'N/A'}`, margin, yPosition, { fontSize: 10 });
      yPosition += 6;
      
      // Dynamic Date - use created_at if available, otherwise current date
      const requestDate = customization.created_at 
        ? new Date(customization.created_at).toLocaleDateString('en-GB')
        : new Date().toLocaleDateString('en-GB');
      yPosition = addText(`Date: ${requestDate}`, margin, yPosition, { fontSize: 10 });
      yPosition += 12;
      
      // CUSTOMIZATION DETAILS Section
      yPosition = addText('CUSTOMIZATION DETAILS', margin, yPosition, { fontSize: 12, bold: true });
      yPosition += 6;
      
      // Dynamic Item Details
      const itemDetails = [
        customization.item_type || customization.product?.name || 'Custom Item',
        customization.color,
        customization.size ? `Size ${customization.size}` : null
      ].filter(Boolean).join(' - ');
      yPosition = addText(`Item Details: ${itemDetails}`, margin, yPosition, { fontSize: 10 });
      yPosition += 6;
      
      // Dynamic Printing Technique
      const technique = techniqueName || customization.technique_name || customization.technique || 'N/A';
      yPosition = addText(`Printing Technique: ${technique}`, margin, yPosition, { fontSize: 10 });
      yPosition += 6;
      
      // Dynamic Quantity
      yPosition = addText(`Quantity: ${customization.quantity || 1}`, margin, yPosition, { fontSize: 10 });
      yPosition += 12;
      
      // PAYMENT INFORMATION Section
      yPosition = addText('PAYMENT INFORMATION', margin, yPosition, { fontSize: 12, bold: true });
      yPosition += 8;
      
      // Create a table-like structure for payment details
      const leftCol = margin;
      const rightCol = pageWidth - margin - 35;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      // Dynamic Product Cost (if applicable)
      if (customization.product_id || customization.product_name || urlProductName) {
        const productName = customization.product_name || customization.product?.name || urlProductName || 'Product';
        const productCost = customization.product_cost || customization.product_price || customization.product?.price || 0;
        if (productCost > 0) {
          pdf.text(`${productName}:`, leftCol, yPosition);
          pdf.text(formatNaira(productCost), rightCol, yPosition);
          yPosition += 8;
        }
      }
      
      // Dynamic Technique Cost
      if (customization.technique_cost && customization.technique_cost > 0) {
        const pdfTechniqueName = customization.technique_name || techniqueName || customization.technique || 'Printing Technique';
        pdf.text(`${pdfTechniqueName}:`, leftCol, yPosition);
        pdf.text(formatNaira(customization.technique_cost), rightCol, yPosition);
        yPosition += 8;
      }
      
      // Dynamic Fabric Cost
      if (customization.fabric_cost && customization.fabric_cost > 0) {
        pdf.text('Fabric Cost:', leftCol, yPosition);
        pdf.text(formatNaira(customization.fabric_cost), rightCol, yPosition);
        yPosition += 8;
      }
      
      // Unit Cost (if available)
      if (customization.unit_cost && customization.unit_cost > 0) {
        pdf.text('Unit Cost:', leftCol, yPosition);
        pdf.text(formatNaira(customization.unit_cost), rightCol, yPosition);
        yPosition += 10;
      }
      
      // Total Amount with line separator
      pdf.setLineWidth(0.5);
      pdf.line(leftCol, yPosition, rightCol + 35, yPosition);
      yPosition += 8;
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Total Amount:', leftCol, yPosition);
      pdf.text(formatNaira(customization.total_cost || 0), rightCol, yPosition);
      yPosition += 15;
      
      // Customer Contact Information (if available)
      if (customization.phone_number || customization.whatsapp_number || customization.delivery_address) {
        yPosition = addText('CUSTOMER CONTACT INFORMATION', margin, yPosition, { fontSize: 12, bold: true });
        yPosition += 6;
        
        if (customization.phone_number) {
          yPosition = addText(`Phone: ${customization.phone_number}`, margin, yPosition, { fontSize: 10 });
          yPosition += 6;
        }
        
        if (customization.whatsapp_number) {
          yPosition = addText(`WhatsApp: ${customization.whatsapp_number}`, margin, yPosition, { fontSize: 10 });
          yPosition += 6;
        }
        
        if (customization.delivery_address) {
          yPosition = addText(`Delivery Address: ${customization.delivery_address}`, margin, yPosition, { fontSize: 10, maxWidth: pageWidth - 2 * margin });
          yPosition += 10;
        }
      }
      
      // Company Address Section
      yPosition = addText('COMPANY ADDRESS', margin, yPosition, { fontSize: 12, bold: true });
      yPosition += 6;
      yPosition = addText('#54 Abeokuta Street, Anifowose, Ikeja, Lagos, Nigeria', margin, yPosition, { fontSize: 10, maxWidth: pageWidth - 2 * margin });
      yPosition += 6;
      yPosition = addText('Call or WhatsApp: +2348147953648', margin, yPosition, { fontSize: 10 });
      yPosition += 6;
      yPosition = addText('Email: support@kri8tive.com', margin, yPosition, { fontSize: 10 });
      
      // Footer
      const footerY = pdf.internal.pageSize.getHeight() - 15;
      pdf.setFontSize(7);
      pdf.setTextColor(128, 128, 128);
      pdf.text('Generated by Kri8tive Custom Design Studio', margin, footerY);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - margin - 70, footerY);
      
      // Save the PDF with new naming convention
      const fileName = `Kri8tive_Customization_${customization.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "PDF Downloaded",
        description: "Your customization details have been downloaded as a PDF.",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !customization) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {error || 'Something went wrong'}
        </h1>
        <Link
          to="/customize"
          className="flex items-center gap-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customization
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/customize"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customization
        </Link>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            Request Submitted Successfully
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Design Preview and Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Design Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Design Preview
              </h2>
            </div>
            <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800">
              {(() => {
                // Check if design_url exists and is a valid URL (not a placeholder text)
                const hasValidDesignUrl = customization.design_url && 
                  (customization.design_url.startsWith('data:') || 
                   customization.design_url.startsWith('http') || 
                   customization.design_url.startsWith('/'));
                
                const isPlaceholderText = customization.design_url && 
                  (customization.design_url.includes('data URL too long') || 
                   customization.design_url.includes('Design uploaded') ||
                   customization.design_url.includes('File uploaded'));

                if (hasValidDesignUrl && !isPlaceholderText) {
                  return (
                <div className="w-full h-full relative">
                  {/* Loading indicator */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                      <p className="text-sm">Loading design...</p>
                    </div>
                  </div>
                  
                  <img
                    src={customization.design_url}
                    alt="Design Preview"
                    className="object-contain w-full h-full relative z-10 bg-white dark:bg-gray-800"
                    onLoad={(e) => {
                      console.log('Design image loaded successfully:', {
                        url: customization.design_url,
                        isDataUrl: customization.design_url?.startsWith('data:'),
                        urlLength: customization.design_url?.length
                      });
                      // Hide loading indicator
                      const target = e.target as HTMLImageElement;
                      const loader = target.previousElementSibling as HTMLElement;
                      if (loader) {
                        loader.style.display = 'none';
                      }
                    }}
                    onError={(e) => {
                      console.error('Failed to load design image:', customization.design_url);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      
                      // Show error fallback
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) {
                        fallback.style.display = 'flex';
                      }
                      
                      // Hide loading indicator
                      const loader = target.previousElementSibling as HTMLElement;
                      if (loader) {
                        loader.style.display = 'none';
                      }
                    }}
                  />
                  
                  {/* Error fallback */}
                  <div className="absolute inset-0 hidden items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Failed to load design image</p>
                      <p className="text-xs mt-1 opacity-75">Image may be corrupted or unavailable</p>
                    </div>
                  </div>
                </div>
                  );
                } else if (isPlaceholderText) {
                  // Show a special message for placeholder text (when data URL was too long)
                  return (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm font-medium">Design File Uploaded</p>
                        <p className="text-xs mt-1 opacity-75">Design was uploaded successfully</p>
                        <p className="text-xs opacity-75">Preview not available due to file size</p>
                      </div>
                    </div>
                  );
                } else {
                  // No design URL available
                  return (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">No design preview available</p>
                  </div>
                </div>
                  );
                }
              })()}
            </div>
          </div>

          {/* Customization Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Brush className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Customization Details
              </h2>
            </div>

            <div className="space-y-4">
              {/* Reference Number */}
              <div className="flex items-start gap-3 text-sm">
                <Hash className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-700 dark:text-gray-300">Payment Reference</p>
                  <p className="text-gray-600 dark:text-gray-400 font-semibold font-mono text-xs break-all">
                    {customization.payment_reference || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Design Upload Count */}
              <div className="flex items-start gap-3 text-sm">
                <ImageIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-700 dark:text-gray-300">Designs Uploaded</p>
                  <p className="text-gray-600 dark:text-gray-400 font-semibold">
                    {(() => {
                      // Count actual design files available
                      let designCount = 0;
                      
                      // Check design_url
                      if (customization.design_url && customization.design_url.trim() !== '') {
                        designCount++;
                      }
                      
                      // Check image_url if different from design_url
                      if (customization.image_url && 
                          customization.image_url.trim() !== '' && 
                          customization.image_url !== customization.design_url) {
                        designCount++;
                      }
                      
                      // Check for additional URLs in notes and admin_notes
                      const noteUrls = customization.notes?.match(/https?:\/\/[^\s\n]+/g) || [];
                      const adminNoteUrls = customization.admin_notes?.match(/https?:\/\/[^\s\n]+/g) || [];
                      
                      // Check for structured design data in admin_notes
                      const structuredMatch = customization.admin_notes?.match(/DESIGN_URLS:\s*([^|]+(?:\|[^|]+)*)/);
                      if (structuredMatch) {
                        const structuredUrls = structuredMatch[1].split('|').map(url => url.trim()).filter(url => url);
                        designCount += structuredUrls.filter(url => 
                          url !== customization.design_url && url !== customization.image_url
                        ).length;
                        
                        // Check for total count
                        const totalMatch = customization.admin_notes?.match(/TOTAL:\s*(\d+)/);
                        if (totalMatch) {
                          const totalDesigns = parseInt(totalMatch[1]);
                          return totalDesigns > designCount ? `${totalDesigns}` : `${designCount}`;
                        }
                      } else {
                        // Count unique URLs from notes
                        const allUrls = [...noteUrls, ...adminNoteUrls];
                        const uniqueUrls = allUrls.filter(url => 
                          url !== customization.design_url && url !== customization.image_url
                        );
                        designCount += uniqueUrls.length;
                      }
                      
                      return designCount > 0 ? `${designCount}` : '1';
                    })()}
                  </p>
                </div>
              </div>

              {/* Printing Technique */}
              <div className="flex items-start gap-3 text-sm">
                <PencilRuler className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-700 dark:text-gray-300">Printing Technique</p>
                  <p className="text-gray-600 dark:text-gray-400 font-semibold break-words">
                    {techniqueName || customization.technique || 'N/A'} 
                    {customization.technique_cost && customization.technique_cost > 0 && ` (${formatNaira(customization.technique_cost as number)})`}
                  </p>
                </div>
              </div>

              {/* Fabric Details */}
              {customization.fabric_purchase_option === 'help_buy' && customization.fabric_quality && (
                <div className="flex items-start gap-3 text-sm">
                  <Brush className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-700 dark:text-gray-300">Fabric Details</p>
                    <p className="text-gray-600 dark:text-gray-400 font-semibold break-words">
                      Help buying fabric ({customization.fabric_quality} GSM)
                      {customization.material && ` - ${customization.material}`}
                      {customization.fabric_cost !== undefined && customization.fabric_cost > 0 && 
                        ` (${formatNaira(customization.fabric_cost as number)})`}
                    </p>
                  </div>
                </div>
              )}

              {/* Item Details */}
              <div className="flex items-start gap-3 text-sm">
                <StickyNote className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-700 dark:text-gray-300">Item Details</p>
                  <p className="text-gray-600 dark:text-gray-400 font-semibold break-words">
                    {customization.item_type || customization.product?.name || 'Custom Item'}
                    {customization.color && ` - ${customization.color}`}
                    {customization.size && ` - Size ${customization.size}`}
                  </p>
                </div>
              </div>

              {/* Quantity */}
              <div className="flex items-start gap-3 text-sm">
                <Hash className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-700 dark:text-gray-300">Quantity</p>
                  <p className="text-gray-600 dark:text-gray-400 font-semibold">{customization.quantity || 1} units</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Cost Breakdown
            </h2>
          </div>

          <div className="space-y-3 font-mono">
            {/* Product Cost - Show for product customizations */}
            {!!(customization?.product_id || customization?.product_name || urlProductName) && (
              <ProductCostDisplay 
                customization={customization} 
                fetchProductById={fetchProductById}
                fallbackProductName={urlProductName || undefined}
              />
            )}

            {/* Technique Cost */}
            {!!(customization?.technique_cost && customization.technique_cost > 0) && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">
                  {customization.technique_name || techniqueName || 'Printing Technique'}:
                </span>
                <span className="text-gray-900 dark:text-gray-100">
                  {formatNaira(customization.technique_cost as number)}
                </span>
              </div>
            )}

            {/* Fabric Cost - Only show if it's greater than 0 */}
            {!!(customization?.fabric_cost && customization.fabric_cost > 0) && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Fabric Cost:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {formatNaira(customization.fabric_cost as number)}
                </span>
              </div>
            )}

            {/* Horizontal Line */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>

            {/* Total Amount */}
            <div className="flex justify-between items-center pt-1">
              <span className="font-semibold text-gray-800 dark:text-gray-200">Total Amount:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {formatNaira(customization?.total_cost || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Contact Information
              </h2>
            </div>
            <button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors text-sm font-medium"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            {/* Phone Number */}
            {customization.phone_number && (
              <div className="flex items-start gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Phone Number</p>
                  <p className="text-gray-600 dark:text-gray-400">{customization.phone_number}</p>
                </div>
              </div>
            )}

            {/* WhatsApp Number */}
            {customization.whatsapp_number && (
              <div className="flex items-start gap-3 text-sm">
                <MessageCircle className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">WhatsApp Number</p>
                  <p className="text-gray-600 dark:text-gray-400">{customization.whatsapp_number}</p>
                </div>
              </div>
            )}

            {/* Delivery Address */}
            {customization.delivery_address && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Delivery Address</p>
                  <p className="text-gray-600 dark:text-gray-400">{customization.delivery_address}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 