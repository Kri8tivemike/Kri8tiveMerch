import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

interface ColorPickerProps {
  initialColor?: string;
  onChange: (color: string) => void;
}

// Convert HSLA to Hex
function hslaToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c/2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

// Convert Hex to HSLA
function hexToHsla(hex: string): { h: number; s: number; l: number; a: number } {
  // Remove the hash at the start if it's there
  hex = hex.replace(/^#/, '');

  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h = Math.round(h * 60);
  }

  s = Math.round(s * 100);
  const al = Math.round(l * 100);

  return { h, s, l: al, a: 1 };
}

export default function ColorPicker({ initialColor = '#ff0000', onChange }: ColorPickerProps) {
  const [hsla, setHsla] = useState({
    h: 0,    // hue (0-360)
    s: 100,  // saturation (0-100)
    l: 50,   // lightness (0-100)
    a: 1     // alpha (0-1)
  });

  const [isDragging, setIsDragging] = useState(false);
  const [selectedColor, setSelectedColor] = useState(initialColor);

  useEffect(() => {
    // Parse initial color if provided
    if (initialColor.startsWith('#')) {
      const hslaValues = hexToHsla(initialColor);
      setHsla(hslaValues);
    }
  }, [initialColor]);

  const debouncedOnChange = useCallback(
    debounce((color: string) => {
      onChange(color);
    }, 100),
    [onChange]
  );

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const h = parseInt(e.target.value);
    const newHsla = { ...hsla, h };
    setHsla(newHsla);
    updateColor(newHsla);
  };

  const handleSaturationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = parseInt(e.target.value);
    const newHsla = { ...hsla, s };
    setHsla(newHsla);
    updateColor(newHsla);
  };

  const handleLightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const l = parseInt(e.target.value);
    const newHsla = { ...hsla, l };
    setHsla(newHsla);
    updateColor(newHsla);
  };

  const updateColor = (newHsla: typeof hsla) => {
    const hexColor = hslaToHex(newHsla.h, newHsla.s, newHsla.l);
    setSelectedColor(hexColor);
    debouncedOnChange(hexColor);
  };

  const handleHueMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleHueDrag(e);
    document.addEventListener('mousemove', handleHueDrag);
    document.addEventListener('mouseup', handleDragEnd);
  };

  const handleHueDrag = (e: MouseEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const container = document.getElementById('hue-slider');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const hue = Math.round((x / rect.width) * 360);
    
    const newHsla = { ...hsla, h: hue };
    setHsla(newHsla);
    updateColor(newHsla);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleHueDrag);
    document.removeEventListener('mouseup', handleDragEnd);
  };

  return (
    <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6 space-y-6">
      {/* Color Preview with Hex Values */}
      <div className="flex gap-4">
        <div
          className="w-24 h-24 rounded-lg shadow-inner flex-shrink-0"
          style={{ backgroundColor: selectedColor }}
        />
        <div className="flex flex-col justify-center space-y-1 flex-1">
          <div className="text-sm text-gray-600">
            Hex: {selectedColor}
          </div>
        </div>
      </div>

      {/* Hue Slider */}
      <div>
        <div
          id="hue-slider"
          className="w-full h-6 rounded-lg cursor-pointer relative overflow-hidden"
          style={{
            background: `linear-gradient(to right, 
              hsl(0, 100%, 50%), 
              hsl(60, 100%, 50%), 
              hsl(120, 100%, 50%), 
              hsl(180, 100%, 50%), 
              hsl(240, 100%, 50%), 
              hsl(300, 100%, 50%), 
              hsl(360, 100%, 50%))`
          }}
          onMouseDown={handleHueMouseDown}
        >
          <div
            className="absolute top-0 w-2 h-full -ml-1 shadow-md"
            style={{
              left: `${(hsla.h / 360) * 100}%`,
              backgroundColor: 'white'
            }}
          />
        </div>
      </div>

      {/* Saturation, Lightness, and Alpha Controls */}
      <div className="space-y-4">
        {/* Saturation */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">Saturation</label>
            <span className="text-sm text-gray-500">{hsla.s}%</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={hsla.s}
              onChange={handleSaturationChange}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-gray-200 to-blue-500"
              style={{
                background: `linear-gradient(to right, 
                  hsla(${hsla.h}, 0%, ${hsla.l}%, ${hsla.a}), 
                  hsla(${hsla.h}, 100%, ${hsla.l}%, ${hsla.a}))`
              }}
            />
          </div>
        </div>

        {/* Lightness */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">Lightness</label>
            <span className="text-sm text-gray-500">{hsla.l}%</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={hsla.l}
              onChange={handleLightnessChange}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, 
                  hsla(${hsla.h}, ${hsla.s}%, 0%, ${hsla.a}), 
                  hsla(${hsla.h}, ${hsla.s}%, 50%, ${hsla.a}), 
                  hsla(${hsla.h}, ${hsla.s}%, 100%, ${hsla.a}))`
              }}
            />
          </div>
        </div>

        {/* Alpha */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">Opacity</label>
            <span className="text-sm text-gray-500">{Math.round(hsla.a * 100)}%</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={hsla.a}
              onChange={(e) => {
                const a = parseFloat(e.target.value);
                const newHsla = { ...hsla, a };
                setHsla(newHsla);
                updateColor(newHsla);
              }}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, 
                  hsla(${hsla.h}, ${hsla.s}%, ${hsla.l}%, 0), 
                  hsla(${hsla.h}, ${hsla.s}%, ${hsla.l}%, 1))`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
