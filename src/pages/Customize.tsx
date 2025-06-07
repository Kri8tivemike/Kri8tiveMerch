import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomizationForm from '../components/customization/CustomizationForm';
import { ProductGrid } from '../components/customization/ProductGrid';
import { ProductList } from '../components/customization/ProductList';
import { SearchAndFilter } from '../components/customization/SearchAndFilter';
import { useToast } from '../contexts/ToastContext';
import type { Product } from '../types/product';
import { getProducts } from '../services/product.service';
import { useTheme } from '../contexts/ThemeProvider';
import { createCustomizationRequest } from '../services/customization.service';
import { databases } from '../lib/appwrite';
import { APPWRITE_DB_ID, APPWRITE_PRODUCTS_COLLECTION_ID } from '../constants/appwrite';
import { mockProducts, shouldUseMockProducts } from '../utils/mock-products';

interface FilterCategory {
  id: string;
  name: string;
}

export default function Customize() {
  const { showToast } = useToast();
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isOwnItem, setIsOwnItem] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'shop' | 'customize'>('shop');
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  // Categories for filtering
  const categories: FilterCategory[] = useMemo(() => [
    { id: 'all', name: 'All Products' },
    { id: 'clothing', name: 'Clothing' },
    { id: 'accessories', name: 'Accessories' },
    { id: 'home', name: 'Home Goods' }
  ], []);

  const loadCustomizableProducts = useCallback(async () => {
      setLoading(true);
      setError(null);
      
      if (shouldUseMockProducts()) {
          console.warn('⚠️ Using mock product data as per localStorage setting.');
          showToast('Using mock data. Run "disableProductMockMode()" in console to use live data.', 'warning');
          setProducts(mockProducts as any);
          setFilteredProducts(mockProducts as any);
          setLoading(false);
          return;
      }
      
        try {
          const productsData = await getProducts();
          
          const customizableProducts = productsData.filter((product: Product) => 
            product.customizable === true || 
            product.customizable === 'Enabled'
          );
          
          if (customizableProducts.length > 0) {
            setProducts(customizableProducts);
            setFilteredProducts(customizableProducts);
          } else {
            const fallbackProducts = productsData.slice(0, 4);
            setProducts(fallbackProducts);
            setFilteredProducts(fallbackProducts);
            showToast('Customization feature is being set up. Showing available products instead.', 'info');
        }
      } catch (err) {
        console.error('Failed to load products:', err);
        setError('Failed to load live product data. Displaying mock products as a fallback.');
        showToast('Failed to load live data. Using mock products instead.', 'warning');
        setProducts(mockProducts as any);
        setFilteredProducts(mockProducts as any);
    } finally {
        setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadCustomizableProducts();
  }, [loadCustomizableProducts]);

  const filterProducts = useCallback(() => {
    let filtered = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
    }

    if (activeCategory && activeCategory !== 'all') {
      filtered = filtered.filter(product =>
        product.category.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, activeCategory]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const handleProductSelect = useCallback(async (product: Product) => {
    const selectedSize = selectedSizes[product.id];
    
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      showToast('Please select a size first', 'warning');
      return;
    }
    
    // Fetch complete product details including price
    try {
      const productDetails = await databases.getDocument(
        APPWRITE_DB_ID,
        APPWRITE_PRODUCTS_COLLECTION_ID,
        product.id
      );
      
      // Cast the Appwrite document to Product type and preserve the selectedSize
      setSelectedProduct({
        ...product,
        ...productDetails as unknown as Product,
        selectedSize: selectedSize,
        price: (productDetails as any).price || product.price || 0
      });
      setActiveView('customize');
    } catch (error) {
      console.error('Error fetching product details:', error);
      setSelectedProduct({
        ...product,
        selectedSize: selectedSize
      });
      setActiveView('customize');
    }
  }, [selectedSizes, showToast]);
  
  const handleSizeSelect = useCallback((productId: string, size: string) => {
    setSelectedSizes(prev => ({
      ...prev,
      [productId]: size
    }));
  }, []);

  const handleCloseCustomization = useCallback(() => {
    setSelectedProduct(null);
    setIsOwnItem(false);
    setActiveView('shop');
  }, []);

  const handleRequestSuccess = useCallback(() => {
    showToast('Your customization request has been successfully submitted.', 'success');
    setSelectedProduct(null);
    setIsOwnItem(false);
    setActiveView('shop');
  }, [showToast]);

  const handleShopProducts = useCallback(() => {
    setActiveView('shop');
    setSelectedProduct(null);
    setIsOwnItem(false);
    
    requestAnimationFrame(() => {
      const productsSection = document.getElementById('products-section');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }, []);

  const handleBringYourOwnItem = () => {
    navigate('/customize/bring-your-own-item');
  };

  // Check for payment success in URL parameters
  useEffect(() => {
    const checkPaymentCallback = async () => {
      // Check URL for payment callback
      const urlParams = new URLSearchParams(location.search);
      const paymentReference = urlParams.get('reference');
      const trxref = urlParams.get('trxref');
      const paymentStatus = urlParams.get('status');
      
      // Debug payment parameters
      if (paymentReference || trxref) {
        console.log('Payment callback detected:', {
          reference: paymentReference,
          trxref,
          status: paymentStatus,
          path: location.pathname,
          search: location.search,
          timestamp: new Date().toISOString()
        });
      }
      
      // Check if we're returning from a payment
      if (paymentReference || trxref) {
        // Get payment details from localStorage
        const paymentIntentStr = localStorage.getItem('customization_payment_intent');
        if (!paymentIntentStr) {
          console.error('Payment information not found in localStorage');
          showToast('Payment information not found. Please try again.', 'error');
          return;
        }
        
        try {
          const paymentIntent = JSON.parse(paymentIntentStr);
          const storedReference = paymentIntent.reference;
          
          console.log('Retrieved payment intent from localStorage:', { 
            storedReference,
            paymentIntentValid: !!paymentIntent,
            paymentIntentData: paymentIntent
          });
          
          // Verify the reference matches what we stored
          if (storedReference === paymentReference || storedReference === trxref) {
            showToast('Processing your payment...', 'info');
            
            // Create the customization request
            try {
              // Get product ID from stored data or use personal item ID
              const productId = paymentIntent.customizationType === 'product' 
                ? (paymentIntent.productId || selectedProduct?.id || undefined)
                : undefined;
                
              // Determine technique ID using the stored technique info
              const techniqueId = paymentIntent.techniqueId || paymentIntent.technique;
              
              // Determine technique cost (default to a reasonable value if not available)
              const techniqueCost = paymentIntent.amount || 5000;
              const quantity = paymentIntent.quantity || 1; // Default quantity
              
              // Handle multiple design URLs from different sources
              let allDesignUrls: string[] = [];
              
              // Add uploaded design URLs from payment intent
              if (paymentIntent.designUrls) {
                if (Array.isArray(paymentIntent.designUrls)) {
                  allDesignUrls = [...allDesignUrls, ...paymentIntent.designUrls];
                } else if (typeof paymentIntent.designUrls === 'string') {
                  allDesignUrls.push(paymentIntent.designUrls);
                }
              }
              
              // Add permanent design URLs (from canvas saves)
              if (paymentIntent.permanentDesignUrls) {
                if (Array.isArray(paymentIntent.permanentDesignUrls)) {
                  const validPermanentUrls = paymentIntent.permanentDesignUrls.filter((url: string) => 
                    url && url.trim() !== '' && url !== 'data:image/png;base64,'
                  );
                  allDesignUrls = [...allDesignUrls, ...validPermanentUrls];
                } else if (typeof paymentIntent.permanentDesignUrls === 'string' && paymentIntent.permanentDesignUrls.trim() !== '') {
                  allDesignUrls.push(paymentIntent.permanentDesignUrls);
                }
              }
              
              // Add canvas-saved designs if available
              if (paymentIntent.canvasDesigns) {
                if (Array.isArray(paymentIntent.canvasDesigns)) {
                  const canvasUrls = paymentIntent.canvasDesigns
                    .map((design: any) => design.preview || design.appwriteUrl || design.thumbnailUrl)
                    .filter((url: string) => url && url.trim() !== '');
                  allDesignUrls = [...allDesignUrls, ...canvasUrls];
                }
              }
              
              // Remove duplicates and empty URLs
              allDesignUrls = [...new Set(allDesignUrls.filter(url => url && url.trim() !== ''))];
              
              console.log('All design URLs for submission:', allDesignUrls);
              
              // Use the primary design URL (first one) for the main design_url field
              const primaryDesignUrl = allDesignUrls.length > 0 ? allDesignUrls[0] : '';
              
              // Create additional design URLs as a JSON string for the notes field
              const designUrlsInfo = allDesignUrls.length > 1 
                ? `\n\nDesign URLs:\n${allDesignUrls.map((url, index) => `${index + 1}. ${url}`).join('\n')}`
                : '';
              
              // Create request data, ensuring all required fields are present
              const requestData = await createCustomizationRequest({
                technique_id: techniqueId,
                technique_name: paymentIntent.technique_name,
                design_url: primaryDesignUrl,
                image_url: allDesignUrls.length > 1 ? allDesignUrls[1] : undefined, // Second design URL if available
                size: paymentIntent.selectedSize || 'Medium',
                product_id: productId,
                item_type: paymentIntent.customizationType === 'personal' ? paymentIntent.itemType : undefined,
                technique_cost: techniqueCost,
                notes: `Payment reference: ${storedReference}\nPayment status: ${paymentStatus || 'completed'}${designUrlsInfo}\n\nTotal designs uploaded: ${allDesignUrls.length}`,
                quantity: quantity,
                unit_cost: techniqueCost,
                total_cost: techniqueCost * quantity,
                phone_number: paymentIntent.phone_number,
                whatsapp_number: paymentIntent.whatsapp_number,
                delivery_address: paymentIntent.delivery_address,
                color: paymentIntent.color,
                fabric_quality: paymentIntent.fabricQuality,
                product_name: paymentIntent.product_name || selectedProduct?.name,
                product_price: paymentIntent.product_price || selectedProduct?.price,
                payment_reference: storedReference // Store the payment reference in the dedicated field
              });
              
              console.log('Customization request created:', requestData);
              console.log('Design URLs submitted to database:', {
                primary_design_url: primaryDesignUrl,
                secondary_image_url: allDesignUrls.length > 1 ? allDesignUrls[1] : undefined,
                total_designs: allDesignUrls.length,
                all_urls: allDesignUrls
              });
              
              // Clear the stored payment intent
              localStorage.removeItem('customization_payment_intent');
              
              // Show success message
              showToast('Your customization request has been successfully submitted!', 'success');
              
              // Navigate to confirmation page
              if (requestData?.id) {
                navigate(`/customization-confirmation/${requestData.id}`);
              } else {
                showToast('Request created but ID not returned. Please check your account.', 'warning');
                navigate('/account/customizations');
              }
            } catch (error) {
              console.error('Error creating customization request:', error);
              showToast('Error submitting customization request. Please contact support.', 'error');
            }
          } else {
            console.error('Invalid payment reference:', { 
              urlReference: paymentReference || trxref,
              storedReference,
              match: storedReference === (paymentReference || trxref)
            });
            showToast('Invalid payment reference. Please try again.', 'error');
          }
        } catch (error) {
          console.error('Error processing payment callback:', error);
          showToast('Error processing payment. Please try again.', 'error');
        }
      }
    };
    
    checkPaymentCallback();
  }, [location, navigate, showToast, selectedProduct]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 sm:py-20">
        <div className="w-8 h-8 sm:w-10 sm:h-10 text-primary-orange animate-spin">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
          </svg>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-red-600 dark:text-red-400 mb-8">
          <p>{error}</p>
          <button 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
            onClick={loadCustomizableProducts}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">No customizable products available</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">We don't have any products available for customization at the moment.</p>
          <a href="/shop" className="px-4 py-2 bg-primary-orange text-black dark:text-white rounded-md hover:bg-primary-orange-dark">
            Browse all products
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Custom Design Studio Banner */}
      <div className="bg-gray-900 -mx-3 sm:mx-0 sm:rounded-xl mb-6 sm:mb-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-cover bg-bottom opacity-50 dark:opacity-30" 
          style={{ backgroundImage: "url('/images/custom-design-banner.webp')" }}>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40"></div>
        <div className="px-4 sm:px-6 py-8 sm:py-12 md:py-16 text-center text-white relative z-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 px-2 sm:px-0 pt-2 sm:pt-4 md:pt-6">Custom Design Studio</h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto mb-4 sm:mb-6 md:mb-8 px-2 sm:px-0 leading-relaxed">
            Create your unique custom apparel using our premium printing techniques. Choose from our
            products or bring your own item for customization.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-2 sm:px-0">
            <button
              onClick={handleShopProducts}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-md font-semibold transition-colors text-sm sm:text-base ${
                activeView === 'shop'
                  ? 'bg-primary-orange text-black hover:bg-primary-orange-dark'
                  : 'bg-transparent text-white hover:bg-white/10 border border-white'
              }`}
              aria-label="Shop Products"
              tabIndex={0}
            >
              Shop Products
            </button>
            <button
              onClick={handleBringYourOwnItem}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-md font-semibold transition-colors text-sm sm:text-base ${
                activeView === 'customize' && isOwnItem
                  ? 'bg-primary-orange text-black hover:bg-primary-orange-dark'
                  : 'bg-transparent text-white hover:bg-white/10 border border-white'
              }`}
              aria-label="Bring Your Own Item"
              tabIndex={0}
            >
              Bring Your Own Item
            </button>
          </div>
        </div>
      </div>

      {selectedProduct ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 md:p-6 transition-colors duration-200">
          <div className="flex justify-end items-center mb-3 sm:mb-4">
            <button 
              onClick={handleCloseCustomization}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
              aria-label="Close customization form"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <CustomizationForm 
            product={selectedProduct} 
            onSuccess={handleRequestSuccess}
          />
        </div>
      ) : (
        <>
          <div id="products-section" className="mb-4 sm:mb-6">
            <SearchAndFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
            
            {/* Products Display */}
            <div className="rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 transition-colors duration-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 gap-2">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Available Products</h2>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{filteredProducts.length} products</span>
              </div>
              
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 sm:py-16 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-1 sm:mb-2">No products found</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">Try adjusting your search criteria</p>
                  {(searchQuery || activeCategory) && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setActiveCategory(null);
                      }}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-orange text-black dark:text-white text-sm rounded-md hover:bg-primary-orange-dark transition-colors duration-200"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                    viewMode === 'grid' ? (
                  <ProductGrid
                    products={filteredProducts.map(product => ({
                      ...product,
                      displayPrice: `₦${product.price.toLocaleString()}`
                    }))}
                    selectedSizes={selectedSizes}
                    onSizeSelect={handleSizeSelect}
                    onProductSelect={handleProductSelect}
                  />
                ) : (
                  <ProductList
                    products={filteredProducts.map(product => ({
                      ...product,
                      displayPrice: `₦${product.price.toLocaleString()}`
                    }))}
                    selectedSizes={selectedSizes}
                    onSizeSelect={handleSizeSelect}
                    onProductSelect={handleProductSelect}
                  />
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}