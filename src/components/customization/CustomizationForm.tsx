import React, { Fragment, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { Product } from '../../types/product';
import { AuthModal } from '../auth/AuthModal';
import { useToast } from '../../hooks/use-toast';
import { SimpleDesignCanvas } from './SimpleDesignCanvas';
import { useCustomizationForm } from '../../hooks/useCustomizationForm';
import { Button } from '../ui/Button';
import { Palette } from 'lucide-react';
import {
  TechniqueSelection,
  DesignCanvas,
  ProgressIndicator,
  OrderDetails,
  CostSummary,
  PaymentSection,
  ProductInfoDisplay,
  FormHeader,
  ErrorDisplay
} from './components';

interface CustomizationFormProps {
  product: Product;
  onSuccess?: () => void;
  className?: string;
}

export default function CustomizationForm({ 
  product, 
  onSuccess, 
  className = ''
}: CustomizationFormProps) {
  const { toast } = useToast();
  
  // Use the custom hook for all state management and business logic
  const {
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
    isProcessingPayment,
    paymentFailed,
    useDirectPayment,
    setUseDirectPayment,
    selectedTechnique,
    selectedTechniqueCost,
    selectedTechniqueName,
    designUrls,
    designNames,
    permanentDesignUrls,

    productDetails,
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
  } = useCustomizationForm(product, onSuccess);

  // Handle canvas design save from ImageKit-only canvas
  const handleCanvasDesignSave = useCallback((designData: any) => {
    // Check if this is the new "Submit All Files" format
    if (designData.designFiles || designData.savedFiles || designData.totalFiles !== undefined) {
      // New format: Handle bulk submission of all design files
      handleBulkDesignSubmission(designData);
      return;
    }
    
    // Handle legacy single design format (with getDesignUrls function) and direct data
    let imageUrl: string;
    let designName: string;
    let imagekitFileId: string;
    
    if (designData.getDesignUrls && typeof designData.getDesignUrls === 'function') {
      // Legacy format: canvas provides getDesignUrls function
      const urls = designData.getDesignUrls();
      if (urls.length > 0) {
        imageUrl = urls[urls.length - 1]; // Get the latest URL
        designName = `design-${Date.now()}`;
        imagekitFileId = `imagekit-${Date.now()}`;
      } else {
        // No design URLs available yet - this is normal on initial load
        // Don't log a warning or return, just skip processing for now
        return;
      }
    } else {
      // Direct design data format
      imageUrl = designData.imageUrl || designData.url;
      designName = designData.name || `design-${Date.now()}`;
      imagekitFileId = designData.imagekitFileId || designData.fileId;
    }
    
    if (!imageUrl) {
      console.error('No image URL provided in design data');
      return;
    }
    
    // Update form state only if the URL is not already present
    setDesignUrls(prev => {
      if (!prev.includes(imageUrl)) {
        return [...prev, imageUrl];
      }
      return prev;
    });
    setDesignNames(prev => {
      if (!prev.includes(designName)) {
        return [...prev, designName];
      }
      return prev;
    });
    setPermanentDesignUrls(prev => {
      if (!prev.includes(imageUrl)) {
        return [...prev, imageUrl];
      }
      return prev;
    });
    // Note: Don't close canvas for individual saves - only for bulk submissions
    
    // Store canvas design data for payment processing (optimized to prevent quota issues)
    try {
    const currentPaymentIntent = localStorage.getItem('customization_payment_intent');
    if (currentPaymentIntent) {
        const paymentData = JSON.parse(currentPaymentIntent);
        
        // Initialize arrays if not exists
        if (!paymentData.canvasDesigns) {
          paymentData.canvasDesigns = [];
        }
        if (!paymentData.permanentDesignUrls) {
          paymentData.permanentDesignUrls = [];
        }
        if (!paymentData.designFileNames) {
          paymentData.designFileNames = [];
        }
        
        // Limit the number of stored designs to prevent quota issues
        if (paymentData.canvasDesigns.length < 5) {
          // Add the new canvas design with minimal data
        paymentData.canvasDesigns.push({
          imageUrl: imageUrl,
            fileName: (designName + '.png').substring(0, 50), // Limit filename length
            name: designName.substring(0, 30), // Limit name length
          timestamp: new Date().toISOString(),
        });
        
          // Store ImageKit URL for database submission (limit to 5 URLs)
          if (paymentData.permanentDesignUrls.length < 5) {
        paymentData.permanentDesignUrls.push(imageUrl);
            paymentData.designFileNames.push((designName + '.png').substring(0, 50));
          }
          
          // Check data size before storing
          const dataString = JSON.stringify(paymentData);
          const dataSize = new Blob([dataString]).size;
          
          if (dataSize < 4000000) { // 4MB limit
        localStorage.setItem('customization_payment_intent', JSON.stringify(paymentData));
            console.log('Updated payment intent with canvas design (optimized):', {
          designName: designName,
          totalCanvasDesigns: paymentData.canvasDesigns.length,
              dataSize: `${Math.round(dataSize / 1024)}KB`
            });
          } else {
            console.warn('Payment data too large, skipping canvas design storage');
          }
        } else {
          console.warn('Maximum canvas designs reached (5), skipping storage');
        }
      }
      } catch (error) {
        console.error('Error updating payment intent with canvas design:', error);
    }
    
    toast({
      title: 'Design Saved',
      description: 'Your canvas design has been saved to ImageKit and added to your design collection!',
    });
  }, [setDesignUrls, setDesignNames, setPermanentDesignUrls, toast]);

  // Handle bulk submission of all design files from canvas
  const handleBulkDesignSubmission = (allDesignData: any) => {
    try {
      const { designFiles = [], savedFiles = [], currentCanvas, totalFiles = 0, metadata = {} } = allDesignData;
      
      // Collect all URLs and names for form state
      const allUrls: string[] = [];
      const allNames: string[] = [];
      const allPermanentUrls: string[] = [];
      
      // Process design files (uploaded images)
      designFiles.forEach((file: any) => {
        if (file.imageUrl && file.imageUrl.startsWith('http')) {
          allUrls.push(file.imageUrl);
          allNames.push(file.fileName || file.name);
          allPermanentUrls.push(file.imageUrl);
        }
      });
      
      // Process saved files - these are the main focus for this update
      savedFiles.forEach((file: any) => {
        if (file.imageUrl && file.imageUrl.startsWith('http')) {
          allUrls.push(file.imageUrl);
          allNames.push(file.fileName || file.name);
          allPermanentUrls.push(file.imageUrl);
        }
      });
      
      // Log the saved files being processed
      console.log('Processing saved files in bulk submission:', {
        totalSavedFiles: savedFiles.length,
        validSavedFileUrls: savedFiles.filter((f: any) => f.imageUrl && f.imageUrl.startsWith('http')).map((f: any) => f.imageUrl),
        savedFileNames: savedFiles.map((f: any) => f.fileName || f.name)
      });
      
      // Update form state with all collected URLs
      setDesignUrls(prev => {
        const newUrls = [...prev, ...allUrls];
        console.log('Updated designUrls:', newUrls);
        return newUrls;
      });
      setDesignNames(prev => {
        const newNames = [...prev, ...allNames];
        console.log('Updated designNames:', newNames);
        return newNames;
      });
      setPermanentDesignUrls(prev => {
        const newPermanentUrls = [...prev, ...allPermanentUrls];
        console.log('Updated permanentDesignUrls:', newPermanentUrls);
        return newPermanentUrls;
      });
      setIsCanvasFullscreen(false);
      
      // Store all design data for payment processing
      const currentPaymentIntent = localStorage.getItem('customization_payment_intent');
      if (currentPaymentIntent) {
        try {
          const paymentData = JSON.parse(currentPaymentIntent);
          
          // Initialize arrays if not exists
          if (!paymentData.canvasDesigns) {
            paymentData.canvasDesigns = [];
          }
          if (!paymentData.permanentDesignUrls) {
            paymentData.permanentDesignUrls = [];
          }
          if (!paymentData.designFileNames) {
            paymentData.designFileNames = [];
          }
          
          // Add all design files to canvas designs
          [...designFiles, ...savedFiles].forEach((file: any) => {
            if (file.imageUrl && file.imageUrl.startsWith('http')) {
              paymentData.canvasDesigns.push({
                imageUrl: file.imageUrl,
                thumbnailUrl: file.thumbnailUrl || file.imageUrl,
                fileName: file.fileName || file.name,
                imagekitFileId: file.imagekitFileId,
                name: file.name,
                timestamp: file.timestamp || new Date().toISOString(),
                elements: file.elements || [],
                type: file.type || 'submitted',
                description: file.description || 'Design file from canvas'
              });
              
              // Store URLs for database submission - ensure no duplicates
              if (!paymentData.permanentDesignUrls.includes(file.imageUrl)) {
                paymentData.permanentDesignUrls.push(file.imageUrl);
                paymentData.designFileNames.push(file.fileName || file.name);
              }
            }
          });
          
          // Add current canvas if it has elements
          if (currentCanvas && currentCanvas.elements && currentCanvas.elements.length > 0) {
            paymentData.canvasDesigns.push({
              imageUrl: '', // Will be generated when canvas is saved
              thumbnailUrl: '',
              fileName: 'current-canvas-design.png',
              imagekitFileId: `current-canvas-${Date.now()}`,
              name: currentCanvas.name || 'Current Canvas Design',
              timestamp: currentCanvas.timestamp || new Date().toISOString(),
              elements: currentCanvas.elements,
              type: 'current'
            });
          }
          
          // Update the stored payment intent
          localStorage.setItem('customization_payment_intent', JSON.stringify(paymentData));
          
          console.log('Updated payment intent with bulk design submission:', {
            totalSubmittedFiles: totalFiles,
            designFiles: designFiles.length,
            savedFiles: savedFiles.length,
            currentCanvas: currentCanvas ? 'included' : 'none',
            totalCanvasDesigns: paymentData.canvasDesigns.length,
            allPermanentUrls: paymentData.permanentDesignUrls.length,
            allFileNames: paymentData.designFileNames.length,
            savedFileDetails: savedFiles.map((f: any) => ({
              name: f.name,
              fileName: f.fileName,
              imageUrl: f.imageUrl,
              type: f.type
            })),
            metadata: metadata
          });
        } catch (error) {
          console.error('Error updating payment intent with bulk design submission:', error);
        }
      }
      
      // Create detailed success message
      const breakdown = [];
      if (designFiles.length > 0) breakdown.push(`${designFiles.length} uploaded image${designFiles.length !== 1 ? 's' : ''}`);
      if (savedFiles.length > 0) breakdown.push(`${savedFiles.length} saved design${savedFiles.length !== 1 ? 's' : ''}`);
      if (currentCanvas && currentCanvas.elements && currentCanvas.elements.length > 0) breakdown.push('current canvas');
      
      toast({
        title: 'All Design Files Submitted',
        description: `Successfully submitted ${totalFiles} design file${totalFiles !== 1 ? 's' : ''} for your customization request!${breakdown.length > 0 ? ` (${breakdown.join(', ')})` : ''}`,
      });
      
    } catch (error) {
      console.error('Error handling bulk design submission:', error);
      toast({
        title: 'Submission Error',
        description: 'Failed to submit design files. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Fragment>
    <div className={cn(
      "max-w-6xl mx-auto p-3 sm:p-4 md:p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen",
      className
    )}>
      {/* Header */}
        <FormHeader productDetails={productDetails} product={product} />

        {/* Product Info Display */}
        <ProductInfoDisplay product={product} productDetails={productDetails} />

      {/* Progress Indicator */}
        <ProgressIndicator currentStep={step} />

      {/* Error Display */}
        <ErrorDisplay error={error} />

      {/* Form Steps */}
      <div className="mb-8">
        {/* Step 1: Technique Selection */}
        {step === 'technique' && (
            <TechniqueSelection
              printingTechniquesData={printingTechniquesData}
              printingTechniqueCosts={printingTechniqueCosts}
              selectedTechnique={selectedTechnique}
              selectedTechniqueCost={selectedTechniqueCost}
              productDetails={productDetails}
              product={product}
              onTechniqueSelect={handleTechniqueSelect}
              onNext={() => setStep('design')}
            />
        )}

        {/* Step 2: Create Design (Canvas Only) */}
        {step === 'design' && (
            <div className="max-w-6xl mx-auto space-y-8 px-4">
              {/* Header */}
              <div className="text-center space-y-4 mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
                  <Palette className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Create Your Design
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Bring your vision to life with our professional design canvas. Add text, shapes, images, and more to create the perfect custom design.
                </p>
              </div>

              {/* Canvas Section */}
              <div className="w-full flex justify-center px-4">
                <DesignCanvas
                  onExpandCanvas={() => setIsCanvasFullscreen(true)}
                />
              </div>

              {/* Navigation */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 pt-8">
                <Button
                  variant="outline"
                  onClick={() => setStep('technique')}
                  className="flex items-center justify-center gap-2 px-6 py-3 text-base font-medium border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Technique
                </Button>
                <Button
                  onClick={() => setStep('details')}
                  className="flex items-center justify-center gap-2 px-6 py-3 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Continue to Order Details
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
        )}

        {/* Details Step */}
        {step === 'details' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Complete Your Order
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Review your selections and provide delivery details
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Order Details */}
                <div className="lg:col-span-2">
                  <OrderDetails
                    productDetails={productDetails}
                    product={product}
                    productLoading={productLoading}
                    productError={productError}
                    selectedSize={selectedSize}
                    quantity={quantity}
                    contactInfo={contactInfo}
                    onSizeSelect={handleSizeSelect}
                    onQuantityChange={handleQuantityChange}
                    onContactInfoChange={handleContactInfoChange}
                  />
                </div>

                {/* Cost Summary */}
                <div className="lg:col-span-1">
                  <CostSummary
                    productDetails={productDetails}
                    product={product}
                    selectedTechniqueCost={selectedTechniqueCost}
                    quantity={quantity}
                    totalCost={totalCost}
                    showDetailedBreakdown={showDetailedBreakdown}
                    onToggleBreakdown={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
                        />
                      </div>
                    </div>

              {/* Payment Section */}
            <div className="max-w-4xl mx-auto pt-8">
                <PaymentSection
                  isAuthenticated={isAuthenticated}
                  isValid={isValid}
                  errorMessage={errorMessage}
                  isPaystackConfigured={isPaystackConfigured}
                  isProcessingPayment={isProcessingPayment}
                  formSubmitted={formSubmitted}
                  paymentFailed={paymentFailed}
                  useDirectPayment={useDirectPayment}
                  totalCost={totalCost}
                  payRef={payRef}
                  productDetails={productDetails}
                  product={product}
                  selectedTechniqueName={selectedTechniqueName}
                  selectedSize={selectedSize}
                  quantity={quantity}
                  onBack={() => setStep('design')}
                  onAuthModalOpen={() => setIsAuthModalOpen(true)}
                  onSubmitWithoutPayment={handleSubmitWithoutPayment}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentClose={handlePaymentClose}
                  onDirectPayment={openDirectPaymentUrl}
                  onToggleDirectPayment={() => setUseDirectPayment(true)}
                              />
                            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Design Canvas */}
      {isCanvasFullscreen && (
        <SimpleDesignCanvas
          productId={product.id}
          productImage={(productDetails || product)?.image_url || (productDetails || product as any)?.images?.[0]}
            onDesignSave={handleCanvasDesignSave}
          isFullscreen={true}
          onClose={() => setIsCanvasFullscreen(false)}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthenticated(true);
          setIsAuthModalOpen(false);
          toast({
            title: "Authentication Successful",
            description: "You can now submit your customization request",
          });
        }}
      />
    </div>
    </Fragment>
  );
}
