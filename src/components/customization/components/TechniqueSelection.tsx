import React from 'react';
import { CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/utils';
import { Product } from '../../../types/product';

interface TechniqueCost {
  id: string;
  name: string;
  cost: number;
}

interface PrintingTechnique {
  id: string;
  title: string;
  description: string;
  size: string;
}

interface TechniqueSelectionProps {
  printingTechniquesData: PrintingTechnique[];
  printingTechniqueCosts: TechniqueCost[];
  selectedTechnique: string;
  selectedTechniqueCost: number;
  productDetails: Product | null;
  product: Product;
  onTechniqueSelect: (techniqueId: string, cost: number, name: string) => void;
  onNext: () => void;
}

export const TechniqueSelection: React.FC<TechniqueSelectionProps> = ({
  printingTechniquesData,
  printingTechniqueCosts,
  selectedTechnique,
  selectedTechniqueCost,
  productDetails,
  product,
  onTechniqueSelect,
  onNext
}) => {
  const currentProduct = productDetails || product;
  const productPrice = currentProduct?.price || 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 md:p-8">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 px-2">
          Choose Your Printing Technique
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-2 leading-relaxed">
          Select the printing method that best suits your design requirements. Each technique offers unique benefits for different types of artwork.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {printingTechniquesData.map((technique) => (
          <div
            key={technique.id}
            onClick={() => {
              const techniqueData = printingTechniqueCosts.find(t => t.id === technique.id);
              if (techniqueData) {
                onTechniqueSelect(technique.id, techniqueData.cost, techniqueData.name);
              } else {
                onTechniqueSelect(technique.id, 0, technique.title);
                console.warn(`No cost data found for technique ${technique.id}, using title: ${technique.title}`);
              }
            }}
            className={cn(
              "relative p-4 sm:p-6 border-2 rounded-lg sm:rounded-xl transition-all cursor-pointer group hover:shadow-lg",
              selectedTechnique === technique.id
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg ring-2 ring-indigo-200 dark:ring-indigo-800"
                : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-gray-800"
            )}
          >
            <div className="flex items-start">
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {technique.title}
                  </h3>
                  {selectedTechnique === technique.id && (
                    <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-indigo-500 rounded-full flex-shrink-0">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                  )}
                </div>
                
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 leading-relaxed">
                  {technique.description}
                </p>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <div className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    <span className="font-medium">{technique.size}</span>
                  </div>
                  
                  <div className="text-left sm:text-right">
                    <div className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      {printingTechniqueCosts.find(t => t.id === technique.id)?.cost 
                        ? `₦${printingTechniqueCosts.find(t => t.id === technique.id)?.cost.toLocaleString()}`
                        : 'Price unavailable'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">per design</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          {productPrice > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 sm:px-4 py-2">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                Base product cost: <span className="font-bold text-gray-900 dark:text-white">₦{productPrice.toLocaleString()}</span>
              </div>
            </div>
          )}
          {selectedTechnique && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-3 sm:px-4 py-2">
              <div className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400">
                Technique cost: <span className="font-bold">₦{selectedTechniqueCost.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
        <Button 
          onClick={onNext} 
          disabled={!selectedTechnique}
          className={cn(
            "flex items-center px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium w-full sm:w-auto justify-center",
            !selectedTechnique && "opacity-50 cursor-not-allowed"
          )}
        >
          Continue to Upload <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
    </div>
  );
}; 