import React from 'react';
import { Calculator } from 'lucide-react';
import { Product } from '../../../types/product';

interface CostSummaryProps {
  productDetails: Product | null;
  product: Product;
  selectedTechniqueCost: number;
  quantity: number;
  totalCost: number;
  showDetailedBreakdown: boolean;
  onToggleBreakdown: () => void;
}

export const CostSummary: React.FC<CostSummaryProps> = ({
  productDetails,
  product,
  selectedTechniqueCost,
  quantity,
  totalCost,
  showDetailedBreakdown,
  onToggleBreakdown
}) => {
  return (
    <div className="lg:col-span-1">
      <div className="sticky top-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg border border-blue-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Cost Summary</h3>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={onToggleBreakdown}
              className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {showDetailedBreakdown ? 'Hide' : 'Show'} breakdown
              </span>
              <div className="flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${showDetailedBreakdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {showDetailedBreakdown && (
              <div className="space-y-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Base Product</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ₦{((productDetails || product)?.price || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Printing Technique</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ₦{selectedTechniqueCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Quantity</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">× {quantity}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ₦{(((productDetails || product)?.price || 0) + selectedTechniqueCost).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold">₦{totalCost.toLocaleString()}</span>
              </div>
              <p className="text-blue-100 text-xs mt-1">Including all fees and taxes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 