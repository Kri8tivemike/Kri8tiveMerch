import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { ProductColor } from '../types/product';

// Predefined color palette
const colorPalette = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Lime', hex: '#84CC16' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Sky', hex: '#0EA5E9' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Violet', hex: '#8B5CF6' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Fuchsia', hex: '#D946EF' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Rose', hex: '#F43F5E' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gray', hex: '#6B7280' },
];

interface ColorPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onColorSelect: (color: Omit<ProductColor, 'id' | 'product_id' | 'created_at'>) => void;
}

export default function ColorPickerDialog({ isOpen, onClose, onColorSelect }: ColorPickerDialogProps) {
  const [colorName, setColorName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [customColor, setCustomColor] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colorName.trim()) return;

    onColorSelect({
      name: colorName.trim(),
      hex: selectedColor,
    });

    // Reset form
    setColorName('');
    setSelectedColor('#000000');
    setCustomColor(false);
    onClose();
  };

  const handlePaletteColorClick = (color: { name: string; hex: string }) => {
    setSelectedColor(color.hex);
    setColorName(color.name);
    setCustomColor(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="absolute right-0 top-0 pr-4 pt-4">
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Add Product Color
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Color Palette */}
                <div className="grid grid-cols-5 gap-2">
                  {colorPalette.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      className={`w-full aspect-square rounded-md border-2 transition-all ${
                        selectedColor === color.hex 
                          ? 'border-indigo-600 scale-110' 
                          : 'border-gray-200 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      onClick={() => handlePaletteColorClick(color)}
                      title={color.name}
                    />
                  ))}
                </div>

                {/* Custom Color Option */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="customColor"
                    checked={customColor}
                    onChange={(e) => setCustomColor(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="customColor" className="text-sm text-gray-600">
                    Use custom color
                  </label>
                </div>

                {customColor && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="h-10 w-20"
                    />
                    <span className="text-sm text-gray-600">
                      {selectedColor.toUpperCase()}
                    </span>
                  </div>
                )}

                <div>
                  <label htmlFor="colorName" className="block text-sm font-medium text-gray-700">
                    Color Name
                  </label>
                  <input
                    type="text"
                    id="colorName"
                    value={colorName}
                    onChange={(e) => setColorName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., Royal Blue"
                    required
                  />
                </div>

                <div className="flex flex-row-reverse gap-3 pt-4">
                  <button
                    type="submit"
                    className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Add Color
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
