import { useParams, useNavigate } from 'react-router-dom';
import { Minus, Plus, Star, ChevronRight, Ruler, ShoppingBag, Palette, X, XCircle, ArrowLeft, ArrowRight, Maximize, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { useTheme } from '../contexts/ThemeProvider';
import { databases } from '../lib/appwrite';
import { Query } from 'appwrite';
import { retryRequest } from '../utils/retry';
import type { Product } from '../types/product';
import WishlistToggle from '../components/product/WishlistToggle';
import CustomizationForm from '../components/customization/CustomizationForm';
import { SizeSelector } from '../components';
import { SafeImage } from '../components/common/SafeImage';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showCustomizeForm, setShowCustomizeForm] = useState(false);
  const [galleryLightboxOpen, setGalleryLightboxOpen] = useState(false);
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!id) {
          throw new Error('Product ID is required');
        }

        // Get database and collection IDs
        const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
        const PRODUCTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID || '';
        const COLORS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PRODUCT_COLORS_COLLECTION_ID || '';

        const data = await retryRequest(async () => {
          // Get the product document
          const productDoc = await databases.getDocument(
            DATABASE_ID,
            PRODUCTS_COLLECTION_ID,
            id
          );

          // Get the product colors
          const colorsResponse = await databases.listDocuments(
            DATABASE_ID,
            COLORS_COLLECTION_ID,
            [Query.equal('product_id', id)]
          );

          // Combine the product with its colors
          return {
            ...productDoc,
            colors: colorsResponse.documents
          };
        });

        if (data) {
          // Use type assertion to access properties safely
          const productData = data as any;
          
          // Check if gallery_images is in the database response
          const hasGalleryImages = 'gallery_images' in productData && 
                                   Array.isArray(productData.gallery_images) && 
                                   productData.gallery_images.length > 0;
          
          console.log(`Product has gallery images in database: ${hasGalleryImages}`);
          
          // Try to get gallery images from localStorage if not in database or empty
          let galleryImages = hasGalleryImages ? productData.gallery_images : [];
          
          if ((!hasGalleryImages) && productData.$id) {
            try {
              const storedGallery = localStorage.getItem(`product_${productData.$id}_gallery`);
              if (storedGallery) {
                galleryImages = JSON.parse(storedGallery);
                console.log(`Loaded ${galleryImages.length} gallery images from localStorage for product ${productData.$id}`);
                
                // Only attempt to update database if we know the field exists
                const galleryFieldExists = localStorage.getItem('galleryImagesFieldExists') === 'true';
                
                // If we loaded from localStorage and the field exists in database,
                // update the database with these images for future consistency
                if (galleryFieldExists && galleryImages.length > 0) {
                  try {
                    await databases.updateDocument(
                      DATABASE_ID,
                      PRODUCTS_COLLECTION_ID,
                      productData.$id,
                      { gallery_images: galleryImages }
                    );
                    console.log('Synchronized gallery images from localStorage to database');
                  } catch (syncError: any) {
                    // If we get an 'Unknown attribute' error, mark the field as non-existent
                    if (syncError.message?.includes('Unknown attribute') ||
                        syncError.message?.includes('gallery_images')) {
                      localStorage.setItem('galleryImagesFieldExists', 'false');
                      console.log('Field gallery_images not available in schema, using localStorage only');
                    } else {
                      console.warn('Could not sync gallery images to database:', syncError);
                    }
                  }
                }
              }
            } catch (e) {
              console.warn('Failed to load gallery images from localStorage:', e);
            }
          }
          
          const transformedProduct: Product = {
            id: productData.$id,
            name: productData.name,
            description: productData.description,
            price: productData.price,
            stock_quantity: productData.stock_quantity || 0,
            image_url: productData.image_url,
            category: productData.category,
            sku: productData.sku || '',
            created_at: productData.$createdAt,
            updated_at: productData.$updatedAt,
            colors: Array.isArray(productData.colors) ? productData.colors.map((color: any) => ({
              id: color.$id,
              product_id: color.product_id,
              name: color.name,
              hex: color.hex,
              image_url: color.image_url || productData.image_url,
              created_at: color.$createdAt,
              updated_at: color.$updatedAt
            })) : [],
            sizes: productData.sizes || [],
            // Ensure customizable is never undefined 
            customizable: productData.customizable === true || productData.customizable === 'Enabled' 
              ? 'Enabled' 
              : 'Disabled',
            // Use our potentially database or localStorage-loaded gallery images
            gallery_images: galleryImages
          };
          setProduct(transformedProduct);
          setSelectedImage(transformedProduct.image_url);
          
          // Set initial color and size if available
          if (transformedProduct.colors && transformedProduct.colors.length > 0) {
            setSelectedColor(transformedProduct.colors[0].hex);
          }
          
          if (transformedProduct.sizes && transformedProduct.sizes.length > 0) {
            setSelectedSize(transformedProduct.sizes[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        toast({
          title: 'Error',
          description: 'Failed to load product details. Please try again.',
          variant: 'destructive',
        });
        navigate('/shop');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, toast, navigate]);

  // Handle keyboard events for the confirmation dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showConfirmation) {
        setShowConfirmation(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showConfirmation]);

  const handleAddToCart = () => {
    if (!product) {
      toast({
        title: 'Error',
        description: 'Product information is missing.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if the product is in stock
    if (product.stock_quantity <= 0) {
      toast({
        title: 'Out of stock',
        description: 'This product is currently out of stock.',
        variant: 'destructive',
      });
      return;
    }

    // Check if the requested quantity is available
    if (quantity > product.stock_quantity) {
      toast({
        title: 'Insufficient stock',
        description: `Only ${product.stock_quantity} items available.`,
        variant: 'destructive',
      });
      return;
    }
    
    // Validate that a size is selected if sizes are available
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast({
        title: 'Size required',
        description: 'Please select a size for this product.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Find the color index based on the selected color hex
      let colorIndex = 0;
      if (selectedColor && product.colors && Array.isArray(product.colors)) {
        const foundIndex = product.colors.findIndex(color => color.hex === selectedColor);
        if (foundIndex !== -1) {
          colorIndex = foundIndex;
        }
      }
      
      // Use default size if none is selected
      const size = selectedSize || '';

      addItem(
        product,
        quantity,
        selectedColor || undefined  // Pass the selected color
      );

      toast({
        title: 'Added to cart',
        description: `${product.name} has been added to your cart.`,
      });
      
      // Show confirmation dialog instead of redirecting immediately
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item to cart. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle color selection
  const handleColorSelect = (hex: string) => {
    setSelectedColor(hex);
    
    // If the color has a specific image, update the selected image
    if (product?.colors) {
      const selectedColorObj = product.colors.find(color => color.hex === hex);
      if (selectedColorObj?.image_url) {
        setSelectedImage(selectedColorObj.image_url);
      }
    }
  };

  // Handle size selection
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
  };

  // Handle customization form completion
  const handleCustomizationSuccess = () => {
    toast({
      title: 'Success',
      description: 'Your customization request has been submitted successfully!',
    });
    setShowCustomizeForm(false);
  };

  // Handle opening the gallery lightbox
  const openGalleryLightbox = (index: number) => {
    // If product has gallery images, use them, otherwise use main product image
    if (product?.gallery_images && product.gallery_images.length > 0) {
    setSelectedGalleryIndex(index);
    } else {
      // If there are no gallery images, show the main product image
      setSelectedGalleryIndex(0);
    }
    
    setGalleryLightboxOpen(true);
    // Prevent scrolling when lightbox is open
    document.body.style.overflow = 'hidden';
  };

  // Handle closing the gallery lightbox
  const closeGalleryLightbox = () => {
    setGalleryLightboxOpen(false);
    document.body.style.overflow = '';
  };

  // Navigate through gallery images in lightbox
  const navigateGalleryLightbox = (direction: 'next' | 'prev') => {
    if (!product) return;
    
    // Determine which images to use for navigation
    const lightboxImages = hasGalleryImages 
      ? product.gallery_images!
      : [product.image_url];
    
    if (lightboxImages.length <= 1) return;
    
    if (direction === 'next') {
      setSelectedGalleryIndex((prev) => 
        prev === lightboxImages.length - 1 ? 0 : prev + 1
      );
    } else {
      setSelectedGalleryIndex((prev) => 
        prev === 0 ? lightboxImages.length - 1 : prev - 1
      );
    }
  };

  // Handle keyboard events for gallery lightbox navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!galleryLightboxOpen) return;
      
      if (e.key === 'Escape') {
        closeGalleryLightbox();
      } else if (e.key === 'ArrowRight') {
        navigateGalleryLightbox('next');
      } else if (e.key === 'ArrowLeft') {
        navigateGalleryLightbox('prev');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [galleryLightboxOpen, product?.gallery_images]);

  // Check if the product has gallery images to display in the lightbox
  const hasGalleryImages = product?.gallery_images && 
                         Array.isArray(product.gallery_images) && 
                         product.gallery_images.length > 0;
  
  // Only render the lightbox if we have gallery images or at least the main product image
  const renderGalleryLightbox = () => {
    if (!galleryLightboxOpen || !product) return null;
    
    // Determine which images to display in the lightbox
    const lightboxImages = hasGalleryImages 
      ? product.gallery_images!
      : [product.image_url];
    
    return (
      <div 
        className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
        onClick={closeGalleryLightbox}
      >
        <div 
          className="relative w-full max-w-6xl max-h-screen p-4 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={closeGalleryLightbox}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
            aria-label="Close gallery"
          >
            <XCircle className="w-6 h-6" />
          </button>
          
          {/* Navigation buttons - only show if we have multiple images */}
          {lightboxImages.length > 1 && (
            <>
          <button
            onClick={() => navigateGalleryLightbox('prev')}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
            aria-label="Previous image"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => navigateGalleryLightbox('next')}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
            aria-label="Next image"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
            </>
          )}
          
          {/* Main image */}
          <div className="flex-1 flex items-center justify-center">
            <SafeImage
              src={lightboxImages[selectedGalleryIndex]}
              alt={`${product.name} gallery image ${selectedGalleryIndex + 1}`}
              optimizeForAppwrite={true}
              className="max-h-[85vh] max-w-full object-contain"
            />
          </div>
          
          {/* Thumbnails - only show if we have multiple images */}
          {lightboxImages.length > 1 && (
          <div className="mt-4 flex justify-center gap-2 overflow-x-auto">
              {lightboxImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedGalleryIndex(index)}
                className={`w-16 h-16 rounded overflow-hidden flex-shrink-0 border-2 ${
                  index === selectedGalleryIndex ? 'border-blue-500' : 'border-transparent'
                }`}
                aria-label={`View gallery image ${index + 1}`}
                aria-current={index === selectedGalleryIndex}
              >
                <SafeImage
                  src={image}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  optimizeForAppwrite={true}
                  thumbnail={true}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
          )}
          
          {/* Counter - only show if we have multiple images */}
          {lightboxImages.length > 1 && (
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
              {selectedGalleryIndex + 1} / {lightboxImages.length}
          </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Product not found</p>
      </div>
    );
  }

  // Create an array of all product images
  const allProductImages = [
    product.image_url,
    ...(hasGalleryImages ? product.gallery_images! : [])
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#121212]' : 'bg-gray-50'} pt-16`}>
      {/* Breadcrumb */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <button onClick={() => navigate('/')} className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-900'}`}>
              Home
            </button>
          </li>
          <ChevronRight className="w-4 h-4" />
          <li>
            <button onClick={() => navigate('/shop')} className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-900'}`}>
              Shop
            </button>
          </li>
          <ChevronRight className="w-4 h-4" />
          <li>
            <button onClick={() => navigate(`/category/${product.category}`)} className={`${isDarkMode ? 'hover:text-gray-300' : 'hover:text-gray-900'}`}>
              {product.category}
            </button>
          </li>
          <ChevronRight className="w-4 h-4" />
          <li className={`${isDarkMode ? 'text-gray-300' : 'text-gray-900'} font-medium`}>{product.name}</li>
        </ol>
      </nav>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSizeGuide(false);
          }}
        >
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Size Guide</h3>
              <button
                onClick={() => setShowSizeGuide(false)}
                className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}
                aria-label="Close size guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Size</th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Chest (inches)</th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Waist (inches)</th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Length (inches)</th>
                  </tr>
                </thead>
                <tbody className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  <tr>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>XS</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>33-34</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>25-26</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>26</td>
                  </tr>
                  <tr>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>S</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>35-36</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>27-28</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>27</td>
                  </tr>
                  <tr>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>M</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>37-38</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>29-30</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>28</td>
                  </tr>
                  <tr>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>L</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>39-40</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>31-32</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>29</td>
                  </tr>
                  <tr>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>XL</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>41-42</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>33-34</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>30</td>
                  </tr>
                  <tr>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>2XL</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>43-44</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>35-36</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>31</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className={`mt-6 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <p className="mb-2">How to measure:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><span className="font-medium">Chest:</span> Measure around the fullest part of your chest, keeping the tape horizontally.</li>
                <li><span className="font-medium">Waist:</span> Measure around your natural waistline, keeping the tape comfortably loose.</li>
                <li><span className="font-medium">Length:</span> Measure from the top of the shoulder to the bottom hem.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Cart Confirmation Dialog */}
      {showConfirmation && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirmation(false);
          }}
        >
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full p-6 animate-bounce-in`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <button
                onClick={() => setShowConfirmation(false)}
                className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className={`text-xl font-medium text-center mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Added to Cart!</h3>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-center mb-6`}>
              {product.name} has been added to your cart.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className={`flex-1 py-2 px-4 ${isDarkMode 
                  ? 'border border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-md  
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                type="button"
              >
                Continue Shopping
              </button>
              <button
                onClick={() => navigate('/checkout')}
                className="flex-1 py-2 px-4 bg-indigo-600 border border-transparent rounded-md text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                type="button"
              >
                View Cart
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Customization Form Modal */}
      {showCustomizeForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCustomizeForm(false);
          }}
        >
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-lg w-full my-8 flex flex-col max-h-[85vh] relative animate-slide-in-up`}>
            {/* Sticky Header */}
            <div className={`flex justify-between items-center p-5 ${isDarkMode ? 'border-gray-700' : 'border-b'} sticky top-0 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} z-10 rounded-t-lg`}>
              <div className="flex items-center">
                <Palette className={`w-5 h-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'} mr-2`} />
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Customize {product.name}</h2>
              </div>
              <button
                onClick={() => setShowCustomizeForm(false)}
                className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'} p-1 rounded-full transition-colors`}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="overflow-y-auto p-5 flex-grow">
              <div className="mb-4 flex items-start space-x-4">
                <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                  <SafeImage 
                    src={product.image_url} 
                    alt={product.name}
                    optimizeForAppwrite={true}
                    thumbnail={true}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{product.name}</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>₦{product.price.toLocaleString()}</p>
                </div>
              </div>
              
              <CustomizationForm 
                product={product} 
                onSuccess={handleCustomizationSuccess}
              />
            </div>
          </div>
        </div>
      )}

      {/* Gallery Lightbox */}
      {renderGalleryLightbox()}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm overflow-hidden`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[80vh]">
            {/* Product Gallery - Modern Layout */}
            <div className={`relative h-full flex flex-col ${isDarkMode ? 'bg-gray-700' : 'bg-[#f8f8f8]'}`}>
              {/* Main Product Image - Improved with removed padding */}
              <div className="flex-1 flex flex-col justify-start items-center relative">
                {/* Wishlist toggle repositioned to top-right of image area with higher z-index */}
                <div className="absolute top-4 right-4 z-30">
                  {id && product && (
                    <WishlistToggle 
                      productId={id as string} 
                      productName={product.name} 
                      size="lg" 
                      className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
                    />
                  )}
                </div>
                
                <div className="w-full h-full flex items-start justify-center pt-6 relative">
                  <SafeImage
                    src={selectedImage}
                    alt={`${product.name} view`}
                    width={550}
                    height={550}
                    quality={90}
                    optimizeForAppwrite={true}
                    className="h-auto max-h-[550px] w-auto max-w-full object-contain transition-opacity duration-300"
                  />
                  
                  {/* Image zoom/lightbox trigger - repositioned to top-left with higher z-index */}
                  <button
                    onClick={() => openGalleryLightbox(0)}
                    className="absolute top-3 left-3 p-2 bg-white bg-opacity-80 rounded-full shadow-md text-gray-700 hover:bg-opacity-100 transition-all z-30"
                    aria-label="View full image"
                  >
                    <Maximize className="h-4 w-4" />
                  </button>
                  
                  {/* Thumbnail Navigation - Overlaying the product image */}
                  {allProductImages.length > 1 && (
                    <div className="absolute left-1/2 transform -translate-x-1/2 bottom-[15%] z-20">
                      <div className="flex gap-1.5 bg-white bg-opacity-90 backdrop-blur-sm py-2 px-3 rounded-md shadow-lg">
                        {allProductImages.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImage(image)}
                            className={`w-[60px] h-[60px] overflow-hidden flex-shrink-0 transition-all ${
                              selectedImage === image 
                                ? 'border-[3px] border-blue-500 scale-105 shadow-sm' 
                                : 'border border-gray-300 hover:border-gray-400'
                            }`}
                            aria-label={`View image ${index + 1}`}
                          >
                            <SafeImage
                              src={image}
                              alt={`${product.name} thumbnail ${index + 1}`}
                              optimizeForAppwrite={true}
                              thumbnail={true}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-6 lg:p-8 flex flex-col">
              <div className="mb-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className={`${isDarkMode ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-100 text-indigo-800'} text-xs px-2.5 py-1 rounded-full uppercase tracking-wide font-medium`}>
                    {product.category}
                  </span>
                </div>
                
                <h1 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>{product.name}</h1>
                
                <div className="flex items-center mb-5">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          product.rating && star <= Math.round(product.rating)
                            ? 'text-yellow-400 fill-current'
                            : isDarkMode ? 'text-gray-600' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {product.rating_count ? `(${product.rating_count} reviews)` : '(No reviews yet)'}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                    ₦{product.price.toLocaleString()}
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} line-through`}>
                        ₦{product.compare_at_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  {/* Stock Status */}
                  <div className="text-sm">
                    {product.stock_quantity > 0 ? (
                      <span className={`${product.stock_quantity < 5 ? 'text-amber-600' : 'text-green-600'} flex items-center`}>
                        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${product.stock_quantity < 5 ? 'bg-amber-600' : 'bg-green-600'}`}></span>
                        {product.stock_quantity < 5 
                          ? `Only ${product.stock_quantity} left in stock` 
                          : `In stock (${product.stock_quantity} available)`}
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center">
                        <span className="inline-block w-2 h-2 rounded-full mr-1 bg-red-600"></span>
                        Out of stock
                      </span>
                    )}
                  </div>
                </div>
                
                <div className={`prose ${isDarkMode ? 'prose-invert' : 'prose-gray'} prose-sm mb-6`} dangerouslySetInnerHTML={{ __html: product.description || '' }} />

                {/* Product Colors - Improved */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        Colour selected: {product.colors.find(c => c.hex === selectedColor)?.name || 'None'}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {product.colors.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => handleColorSelect(color.hex)}
                          className={`relative w-8 h-8 rounded-full transition-all ${
                            selectedColor === color.hex 
                              ? 'ring-2 ring-offset-2 ring-indigo-600' 
                              : `ring-1 ${isDarkMode ? 'ring-gray-600 hover:ring-gray-500' : 'ring-gray-300 hover:ring-gray-400'}`
                          }`}
                          style={{ backgroundColor: color.hex }}
                          aria-label={`Select ${color.name} color`}
                          aria-pressed={selectedColor === color.hex}
                          title={color.name}
                        >
                          {selectedColor === color.hex && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <Check className={`w-4 h-4 ${
                                parseInt(color.hex.slice(1), 16) > 0x7FFFFF ? 'text-gray-800' : 'text-white'
                              }`} />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Sizes - Using New Component */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className={`text-base font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>Available Sizes</h3>
                      <button
                        type="button"
                        onClick={() => setShowSizeGuide(true)}
                        className={`text-sm ${isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'} flex items-center`}
                      >
                        <Ruler className="w-4 h-4 mr-1" />
                        <span>Size Guide</span>
                      </button>
                    </div>
                    
                    <SizeSelector
                      sizes={product.sizes}
                      selectedSize={selectedSize}
                      onSizeSelect={handleSizeSelect}
                      colorScheme="indigo"
                      showSelectedText={true}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                )}

                {/* Product Metadata - Simple Pills */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  <div className={`${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'} px-3 py-1.5 rounded-full text-sm`}>
                    100% Cotton
                  </div>
                  <div className={`${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'} px-3 py-1.5 rounded-full text-sm`}>
                    Made in USA
                  </div>
                  <div className={`${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'} px-3 py-1.5 rounded-full text-sm`}>
                    Machine Washable
                  </div>
                </div>
              </div>

              {/* Quantity and Add to Cart - Fixed at bottom */}
              <div className={`${isDarkMode ? 'border-gray-700' : 'border-t'} pt-6 mt-auto`}>
                <div className="flex flex-col space-y-4">
                  {/* Quantity Selector */}
                  <div className="flex items-center justify-between">
                    <label className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>Quantity</label>
                    <div className={`flex items-center ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border border-gray-300'} rounded-md overflow-hidden`}>
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className={`p-2 ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'} transition-colors`}
                        aria-label="Decrease quantity"
                        disabled={quantity <= 1}
                      >
                        <Minus className={`w-4 h-4 ${isDarkMode ? 'text-gray-300' : ''}`} />
                      </button>
                      <span className={`w-12 text-center font-medium ${isDarkMode ? 'text-gray-300' : ''}`}>{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className={`p-2 ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'} transition-colors`}
                        aria-label="Increase quantity"
                        disabled={quantity >= product.stock_quantity}
                      >
                        <Plus className={`w-4 h-4 ${isDarkMode ? 'text-gray-300' : ''}`} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      onClick={handleAddToCart}
                      disabled={product.stock_quantity <= 0 || quantity > product.stock_quantity}
                      className={`py-3 px-4 rounded-md
                        focus:outline-none focus:ring-2 focus:ring-offset-2
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors flex items-center justify-center gap-2
                        ${product.stock_quantity <= 0 
                          ? 'bg-gray-400 text-white hover:bg-gray-500 focus:ring-gray-500' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'}`}
                      aria-label={
                        product.stock_quantity <= 0 
                          ? 'Out of Stock' 
                          : 'Add to cart'
                      }
                      type="button"
                    >
                      {product.stock_quantity <= 0 ? (
                        <>
                          <ShoppingBag className="w-5 h-5" />
                          <span>Out of Stock</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-5 h-5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                    
                    {/* Only show Customize button if product has customization enabled */}
                    {(product.customizable === true || product.customizable === 'Enabled') && (
                      <button
                        onClick={() => setShowCustomizeForm(true)}
                        className={`py-3 px-4 ${isDarkMode 
                          ? 'border border-indigo-500 text-indigo-400 hover:bg-indigo-900' 
                          : 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50'} rounded-md 
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                          transition-colors flex items-center justify-center gap-2`}
                        aria-label="Customize this product"
                        type="button"
                      >
                        <Palette className="w-5 h-5" />
                        <span>Customize</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}