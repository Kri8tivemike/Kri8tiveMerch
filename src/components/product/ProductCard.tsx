import { Link } from 'react-router-dom';
import type { Product } from '../../types/product';
import { ShoppingCart, Palette, Check, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { ImagePlaceholder } from '../ui/ImagePlaceholder';
import { SafeImage } from '../common/SafeImage';
import WishlistToggle from './WishlistToggle';
import { useState, useEffect, ReactNode } from 'react';
import { useTheme } from '../../contexts/ThemeProvider';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onEdit?: (productId: string) => void;
  onDelete?: (productId: string) => void;
  isAdminView?: boolean;
  className?: string;
  viewIndicator?: ReactNode;
}

export default function ProductCard({ 
  product, 
  onAddToCart, 
  onEdit,
  onDelete,
  isAdminView = false,
  className = '',
  viewIndicator
}: ProductCardProps) {
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const { theme } = useTheme();
  
  // Set up image source from product data
  useEffect(() => {
    // Try to get the best available image
    let src = null;
    
    // Check product image_url first
    if (product.image_url && product.image_url.trim() !== '') {
      src = product.image_url;
    } 
    // Then check first color's image if available
    else if (product.colors && 
             product.colors.length > 0 && 
             product.colors[0].image_url &&
             product.colors[0].image_url.trim() !== '') {
      src = product.colors[0].image_url;
    }
    // Finally check gallery images if available
    else if (product.gallery_images && 
             product.gallery_images.length > 0 &&
             product.gallery_images[0].trim() !== '') {
      src = product.gallery_images[0];
    }
    
    // Validate and fix Appwrite URLs
    if (src) {
      // Check if it's a valid Appwrite URL
      if (src.includes('appwrite') || src.includes('cloud.appwrite.io')) {
        // Ensure the URL is properly formatted for Appwrite
        try {
          const url = new URL(src);
          // If it's an Appwrite URL, make sure it's accessible
          setImageSrc(src);
        } catch (error) {
          console.warn(`Invalid URL format for product "${product.name}": ${src}`);
          setImageSrc(null);
        }
      } else {
        // For external URLs, use as-is
        setImageSrc(src);
      }
    } else {
      console.warn(`No image found for product "${product.name}" (ID: ${product.id})`);
      setImageSrc(null);
    }
  }, [product]);
  
  // Add debugging effect
  useEffect(() => {
    if (product.stock_quantity <= 0) {
      console.log(`Product "${product.name}" (ID: ${product.id}) is out of stock. Stock quantity: ${product.stock_quantity}`);
    }
  }, [product]);
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAddToCart && product.stock_quantity > 0) {
      setIsAddedToCart(true);
      onAddToCart(product);
      
      // Reset the state after 1.5 seconds
      setTimeout(() => {
        setIsAddedToCart(false);
      }, 1500);
    }
  };

  const isOutOfStock = product.stock_quantity <= 0;

  // Add extra debugging log
  if (isOutOfStock) {
    console.log(`Rendering ${product.name} as out of stock. Stock quantity: ${product.stock_quantity}`);
  }

  return isAdminView ? (
    <div className="flex items-center p-4 bg-white dark:bg-dark-surface rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex-shrink-0">
        <div className="w-[100px] h-[100px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                  {imageSrc ? (
          <SafeImage
            src={imageSrc}
            alt={product.name}
            className="w-full h-full object-cover"
            optimizeForAppwrite={true}
            width={100}
            height={100}
            thumbnail={true}
          />
        ) : (
          <ImagePlaceholder />
        )}
          
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white text-xs font-bold px-2 py-1 bg-red-600 rounded">
                OUT OF STOCK
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="ml-4 flex-grow min-w-0">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">{product.description}</p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white">₦{product.price.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              product.stock_quantity > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {product.stock_quantity > 0 ? `In Stock (${product.stock_quantity})` : 'Out of Stock'}
            </span>
            {product.category && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                {product.category}
              </span>
            )}
            {product.customizable !== undefined && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                product.customizable === true || product.customizable === 'Enabled' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
              }`}>
                {typeof product.customizable === 'string' 
                  ? product.customizable 
                  : product.customizable ? 'Enabled' : 'Disabled'}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                onEdit?.(product.id.toString());
              }}
              className="text-sm text-primary-emerald hover:text-primary-emerald-dark"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                if (window.confirm('Are you sure you want to delete this product?')) {
                  onDelete?.(product.id.toString());
                }
              }}
              className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <Link to={`/product/${product.id}`} className={`group block ${className}`}>
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
        {imageSrc ? (
          <SafeImage
            src={imageSrc}
            alt={product.name}
            width={400}
            height={400}
            quality={85}
            optimizeForAppwrite={true}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
            <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
            <span className="text-xs text-gray-500">No image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
        
        {/* Add view indicator from props */}
        {viewIndicator}
        
        {/* Sleek Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-[1px]"></div>
            <div className="bg-red-600 text-white px-4 py-1.5 rounded-md font-medium text-sm flex items-center z-10 shadow-lg transform -rotate-6 tracking-wide">
              <AlertCircle className="w-4 h-4 mr-1.5" strokeWidth={2.5} />
              OUT OF STOCK
            </div>
          </div>
        )}
        
        {/* Wishlist toggle button */}
        <WishlistToggle 
          productId={product.id.toString()} 
          productName={product.name}
          className="absolute top-2 right-2"
        />
        
        {/* Customization icon */}
        {(product.customizable === true || product.customizable === 'Enabled') && (
          <div 
            className="absolute top-12 right-2 bg-primary-emerald text-white p-1.5 rounded-full shadow-lg" 
            title="Customizable Product"
          >
            <Palette className="w-4 h-4" />
          </div>
        )}
        
        {/* Action Button: "Add to Cart" or no button for out of stock items */}
        <div className="absolute bottom-2 right-2">
          {!isOutOfStock && onAddToCart && (
            <button
              onClick={handleAddToCart}
              className={`p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
                isAddedToCart 
                ? 'bg-primary-emerald text-white hover:bg-primary-emerald-dark' 
                : 'bg-primary-orange text-black hover:bg-primary-orange-dark'
              }`}
              title={isAddedToCart ? "Added to Cart" : "Add to Cart"}
              aria-label={isAddedToCart ? "Added to Cart" : "Add to Cart"}
              tabIndex={0}
              disabled={isAddedToCart}
            >
              {isAddedToCart ? (
                <Check className="w-5 h-5" />
              ) : (
                <ShoppingCart className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-4 space-y-1">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{product.name}</h3>
          <p className="text-gray-900 dark:text-white font-medium">₦{product.price.toLocaleString()}</p>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{product.description}</p>
        
        <div className="flex flex-wrap gap-2">
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 inline-block px-2 py-1 rounded">
            {product.category}
          </div>
          
          {/* Simplified stock indicator */}
          <div className={`text-xs font-medium inline-flex items-center px-2 py-1 rounded ${
            isOutOfStock 
              ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' 
              : 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
          }`}>
            {isOutOfStock ? 'Out of Stock' : `In Stock (${product.stock_quantity})`}
          </div>
        </div>
        
        {product.colors && product.colors.length > 0 && (
          <div className="flex gap-1 mt-2">
            {product.colors.map((color, index) => (
              <div
                key={index}
                className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        )}
        
        {product.sizes && product.sizes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Sizes:</span>
            {product.sizes.map((size) => (
              <span 
                key={size} 
                className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 inline-block px-1.5 py-0.5 rounded"
              >
                {size}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}