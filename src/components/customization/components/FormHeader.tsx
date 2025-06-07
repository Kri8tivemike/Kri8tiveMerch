import React from 'react';
import { Product } from '../../../types/product';

interface FormHeaderProps {
  productDetails: Product | null;
  product: Product;
}

export const FormHeader: React.FC<FormHeaderProps> = ({
  productDetails,
  product
}) => {
  return (
    <div className="mb-6 sm:mb-8 text-center">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 px-2">
        Customize Your Product
      </h1>
      <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-2 leading-relaxed">
        Transform your {productDetails?.name || product?.name || 'selected product'} with a personalized design that reflects your unique style
      </p>
    </div>
  );
}; 