import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types/product';
import { formatCurrency } from '../../lib/utils';

interface ProductItemProps {
  product: Product;
  className?: string;
  showAddToCart?: boolean;
  showDetails?: boolean;
  onAddToCart?: (product: Product) => void;
}

const ProductItem: React.FC<ProductItemProps> = ({
  product,
  className = '',
  showAddToCart = false,
  showDetails = true,
  onAddToCart
}) => {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}>
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative pb-[100%] overflow-hidden bg-gray-100 dark:bg-gray-700">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
          )}
          
          {product.stock_quantity === 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
              Out of Stock
            </div>
          )}
          
          {product.customizable && (
            <div className="absolute top-2 right-2 bg-indigo-500 text-white text-xs font-medium px-2 py-1 rounded">
              Customizable
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="text-gray-900 dark:text-white font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
          
          <div className="flex justify-between items-center">
            <p className="text-gray-700 dark:text-gray-300 font-bold">
              {formatCurrency(product.price)}
            </p>
            
            {showAddToCart && product.stock_quantity > 0 && (
              <button
                onClick={handleAddToCart}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 p-1 rounded-full transition-colors"
                aria-label="Add to cart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
              </button>
            )}
          </div>
          
          {showDetails && (
            <div className="mt-2 space-y-1">
              <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2">
                {product.description}
              </p>
              
              {product.category && (
                <span className="inline-block text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                  {product.category}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductItem; 