import React from 'react';
import { Product } from '../../../types/product';

interface ProductInfoDisplayProps {
  product: Product;
  productDetails: Product | null;
}

export const ProductInfoDisplay: React.FC<ProductInfoDisplayProps> = ({
  product,
  productDetails
}) => {
  const currentProduct = productDetails || product;

  if (!currentProduct) return null;

  return (
    <div className="flex items-center p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6 sm:mb-8">
      <div className="relative flex-shrink-0">
        <img 
          src={currentProduct?.image_url || (currentProduct as any)?.images?.[0] || '/images/placeholder-product.jpg'} 
          alt={currentProduct?.name}
          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg sm:rounded-xl shadow-md"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/placeholder-product.jpg';
          }}
        />
        <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-indigo-500 rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      <div className="ml-4 sm:ml-6 min-w-0 flex-1">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
          {currentProduct?.name}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Selected Product
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center mt-2 gap-1 sm:gap-0">
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Base Price:</span>
          <span className="sm:ml-2 text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400">
            ₦{currentProduct?.price.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}; 