import React from 'react';
import { Check } from 'lucide-react';

export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | '4XL' | string;

interface SizeSelectorProps {
  sizes: Size[];
  selectedSize?: Size | null;
  selectedSizes?: Size[];
  onSizeSelect: (size: Size) => void;
  colorScheme?: 'blue' | 'indigo' | 'amber' | 'gray';
  showSelectedText?: boolean;
  className?: string;
  disabled?: boolean;
  isDarkMode?: boolean;
  multiSelect?: boolean;
}

/**
 * A reusable size selector component that displays size options in a modern circular design
 * Supports both single and multi-selection modes
 */
export const SizeSelector = ({
  sizes,
  selectedSize,
  selectedSizes = [],
  onSizeSelect,
  colorScheme = 'indigo',
  showSelectedText = false,
  className = '',
  disabled = false,
  isDarkMode = false,
  multiSelect = false
}: SizeSelectorProps) => {
  // Helper function to check if a size is selected
  const isSizeSelected = (size: Size): boolean => {
    if (multiSelect) {
      return selectedSizes.includes(size);
    }
    return selectedSize === size;
  };

  // Define color schemes
  const colorStyles = {
    blue: {
      selected: isDarkMode 
        ? 'bg-blue-900 text-blue-100 ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800' 
        : 'bg-blue-100 text-blue-700 ring-2 ring-blue-500 ring-offset-2',
      badge: 'bg-blue-500',
      hover: isDarkMode 
        ? 'hover:bg-blue-900/50 hover:border-blue-700' 
        : 'hover:bg-blue-50 hover:border-blue-300'
    },
    indigo: {
      selected: isDarkMode 
        ? 'bg-indigo-900 text-indigo-100 ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-800' 
        : 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 ring-offset-2',
      badge: 'bg-indigo-500',
      hover: isDarkMode 
        ? 'hover:bg-indigo-900/50 hover:border-indigo-700' 
        : 'hover:bg-indigo-50 hover:border-indigo-300'
    },
    amber: {
      selected: isDarkMode 
        ? 'bg-amber-900 text-amber-100 ring-2 ring-amber-500 ring-offset-2 ring-offset-gray-800' 
        : 'bg-amber-100 text-amber-700 ring-2 ring-amber-500 ring-offset-2',
      badge: 'bg-amber-500',
      hover: isDarkMode 
        ? 'hover:bg-amber-900/50 hover:border-amber-700' 
        : 'hover:bg-amber-50 hover:border-amber-300'
    },
    gray: {
      selected: isDarkMode 
        ? 'bg-gray-700 text-gray-100 ring-2 ring-gray-400 ring-offset-2 ring-offset-gray-800' 
        : 'bg-gray-200 text-gray-800 ring-2 ring-gray-500 ring-offset-2',
      badge: isDarkMode ? 'bg-gray-400' : 'bg-gray-600',
      hover: isDarkMode 
        ? 'hover:bg-gray-700/70 hover:border-gray-600' 
        : 'hover:bg-gray-50 hover:border-gray-400'
    }
  };

  const colors = colorStyles[colorScheme];

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const isSelected = isSizeSelected(size);
          return (
            <button
              key={size}
              type="button"
              onClick={() => !disabled && onSizeSelect(size)}
              className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                isSelected
                  ? `${colors.selected} font-semibold transform scale-105 shadow-sm`
                  : isDarkMode 
                    ? `bg-gray-700 border border-gray-600 text-gray-200 ${colors.hover}` 
                    : `bg-white border border-gray-200 text-gray-800 ${colors.hover}`
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              aria-label={`Select size ${size}`}
              aria-pressed={isSelected}
              disabled={disabled}
              tabIndex={disabled ? -1 : 0}
              onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSizeSelect(size);
                }
              }}
            >
              {size}
              {isSelected && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 ${colors.badge} rounded-full flex items-center justify-center`}>
                  <Check className="h-2 w-2 text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {showSelectedText && (
        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {multiSelect ? (
            selectedSizes.length > 0 
              ? `Selected sizes: ${selectedSizes.join(', ')}` 
              : "Please select sizes"
          ) : (
            selectedSize ? `Selected size: ${selectedSize}` : "Please select a size"
          )}
        </p>
      )}
    </div>
  );
};

export default SizeSelector; 