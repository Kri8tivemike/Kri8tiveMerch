import React from 'react';
import { Shirt, Sparkles, Palette } from 'lucide-react';
import type { Product } from '../../types/product';

interface ProductGridProps {
  products: Product[];
  selectedSizes: Record<string, string>;
  onSizeSelect: (productId: string, size: string) => void;
  onProductSelect: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  selectedSizes,
  onSizeSelect,
  onProductSelect,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6">
      {products.map((product) => (
        <div key={product.id} className="bg-white dark:bg-gray-700 rounded-lg sm:rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-600">
          <div className="h-28 sm:h-48 overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                <Shirt className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-500" />
              </div>
            )}
            <div className="absolute top-2 right-2 bg-primary-orange text-white p-1 rounded-full">
              <Palette className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="p-2 sm:p-4">
            <div className="flex justify-between items-start mb-1">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-base truncate pr-1">
                  {product.name}
                  <span className="inline-flex ml-1 text-primary-orange relative group">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-full mb-1 w-32 bg-gray-900 text-white text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      Customizable Item
                    </span>
                  </span>
                </h3>
                <div className="bg-primary-orange/10 px-2 py-1 rounded-md inline-block mt-1 mb-1">
                  <p className="text-sm sm:text-base font-bold text-primary-orange">₦{product.price.toLocaleString()}</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{product.category}</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 dark:text-gray-400">Customizable</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1 sm:line-clamp-2 mb-2 sm:mb-3">{product.description}</p>
            
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-3">
                <label className="text-xs text-gray-600 dark:text-gray-300 block mb-1">Select Size:</label>
                <div className="flex flex-wrap gap-1">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => onSizeSelect(product.id, size)}
                      className={`px-2 py-1 text-xs rounded-md border ${
                        selectedSizes[product.id] === size
                          ? 'bg-primary-orange/20 border-primary-orange text-primary-orange-dark dark:text-primary-orange-light'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                      } transition-colors duration-200`}
                      aria-label={`Select size ${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={() => onProductSelect(product)}
              className={`w-full bg-primary-orange text-black dark:text-white py-1 sm:py-2 rounded-md hover:bg-primary-orange-dark transition-colors text-xs sm:text-sm flex items-center justify-center ${
                product.sizes && product.sizes.length > 0 && !selectedSizes[product.id]
                  ? 'opacity-70'
                  : ''
              }`}
            >
              <Palette className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Customize This
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}; 