import React from 'react';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { cn } from '../../../lib/utils';
import { Product } from '../../../types/product';

interface ContactInfo {
  phone_number: string;
  whatsapp_number: string;
  delivery_address: string;
}

interface OrderDetailsProps {
  productDetails: Product | null;
  product: Product;
  productLoading: boolean;
  productError: string | null;
  selectedSize: string;
  quantity: number;
  contactInfo: ContactInfo;
  onSizeSelect: (size: string) => void;
  onQuantityChange: (quantity: number) => void;
  onContactInfoChange: (info: ContactInfo) => void;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({
  productDetails,
  product,
  productLoading,
  productError,
  selectedSize,
  quantity,
  contactInfo,
  onSizeSelect,
  onQuantityChange,
  onContactInfoChange
}) => {
  return (
    <div className="lg:col-span-2 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Order Details</h3>
        </div>

        <div className="space-y-6">
          {/* Size Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Size
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {productLoading && (
                <div className="col-span-full">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Loading sizes...</span>
                  </div>
                </div>
              )}
              {productError && (
                <div className="col-span-full">
                  <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                    {productError}
                  </p>
                </div>
              )}
              {!productLoading && !productError && (!productDetails?.sizes || productDetails.sizes.length === 0) && (
                <div className="col-span-full">
                  <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    No sizes available for this product.
                  </p>
                </div>
              )}
              {!productLoading && !productError && productDetails?.sizes?.map((size: string) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onSizeSelect(size)}
                  className={cn(
                    "relative h-12 rounded-xl border-2 font-medium transition-all duration-200 hover:scale-105",
                    selectedSize === size
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/25"
                      : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500"
                  )}
                >
                  {size}
                  {selectedSize === size && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Quantity
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                  className="w-12 h-12 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                  </svg>
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 h-12 text-center bg-transparent border-none focus:outline-none text-lg font-semibold text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => onQuantityChange(quantity + 1)}
                  className="w-12 h-12 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {quantity === 1 ? '1 item' : `${quantity} items`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Contact Information</h3>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <Input
                name="phone_number"
                type="tel"
                placeholder="Enter your phone number"
                value={contactInfo.phone_number}
                onChange={(e) => onContactInfoChange({ ...contactInfo, phone_number: e.target.value })}
                className="pl-10 h-12 rounded-xl border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              WhatsApp Number
              <span className="text-xs text-gray-500 ml-1">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
                </svg>
              </div>
              <Input
                name="whatsapp_number"
                type="tel"
                placeholder="WhatsApp number (if different)"
                value={contactInfo.whatsapp_number}
                onChange={(e) => onContactInfoChange({ ...contactInfo, whatsapp_number: e.target.value })}
                className="pl-10 h-12 rounded-xl border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Delivery Address *
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <Textarea
                placeholder="Enter your complete delivery address including city, state, and postal code"
                value={contactInfo.delivery_address}
                onChange={(e) => onContactInfoChange({ ...contactInfo, delivery_address: e.target.value })}
                className="pl-10 pt-3 min-h-[100px] rounded-xl border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 