import { useState } from 'react';
import ColorPicker from './ColorPicker';

interface ProductColorPickerProps {
  colors: Array<{ name: string; hex: string }>;
  selectedColor: number;
  onColorSelect: (index: number) => void;
}

export default function ProductColorPicker({ 
  colors, 
  selectedColor, 
  onColorSelect 
}: ProductColorPickerProps) {
  const [showSelected, setShowSelected] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState('hsla(0, 100%, 50%, 1)');
  const [tempCustomColor, setTempCustomColor] = useState('hsla(0, 100%, 50%, 1)');
  const [isCustomSelected, setIsCustomSelected] = useState(false);

  const handleCustomColorSelect = () => {
    setIsCustomSelected(true);
    onColorSelect(-1); // Use -1 to indicate custom color
  };

  const handlePresetColorSelect = (index: number) => {
    setIsCustomSelected(false);
    onColorSelect(index);
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold">Color</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              showColorPicker 
                ? 'bg-black text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setShowSelected(!showSelected)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              showSelected 
                ? 'bg-black text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Selected
          </button>
          <span className="text-sm text-gray-600">
            {isCustomSelected ? 'Custom Color' : colors[selectedColor].name}
          </span>
        </div>
      </div>

      {showColorPicker && (
        <div className="mb-4">
          <ColorPicker
            initialColor={tempCustomColor}
            onChange={setTempCustomColor}
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setCustomColor(tempCustomColor);
                setShowColorPicker(false);
                handleCustomColorSelect();
              }}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Confirm Color
            </button>
          </div>
        </div>
      )}
      
      <div className="flex gap-2">
        {colors.map((color, index) => {
          const isSelected = !isCustomSelected && selectedColor === index;
          const buttonStyle = {
            backgroundColor: (isSelected || showSelected) ? color.hex : 'transparent',
            background: (isSelected || showSelected)
              ? color.hex 
              : `linear-gradient(45deg, 
                  hsl(0, 100%, 50%), 
                  hsl(60, 100%, 50%), 
                  hsl(120, 100%, 50%), 
                  hsl(180, 100%, 50%), 
                  hsl(240, 100%, 50%), 
                  hsl(300, 100%, 50%), 
                  hsl(360, 100%, 50%))`
          };
          
          return (
            <button
              key={index}
              type="button"
              id={`color-${index}`}
              name={`color-${index}`}
              onClick={(e) => {
                e.preventDefault();
                handlePresetColorSelect(index);
              }}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                isSelected
                  ? 'border-black scale-110'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={buttonStyle}
              aria-label={color.name}
            />
          );
        })}
        {/* Custom color radio circle */}
        <button
          type="button"
          className={`w-8 h-8 rounded-full border-2 transition-all ${
            isCustomSelected
              ? 'border-black scale-110'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          style={{ backgroundColor: customColor }}
          onClick={(e) => {
            e.preventDefault();
            if (isCustomSelected) {
              setShowColorPicker(!showColorPicker);
            } else {
              setTempCustomColor(customColor);
              setShowColorPicker(true);
              handleCustomColorSelect();
            }
          }}
          aria-label="Custom Color"
        />
      </div>
    </div>
  );
}