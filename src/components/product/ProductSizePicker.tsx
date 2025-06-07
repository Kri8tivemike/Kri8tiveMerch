interface ProductSizePickerProps {
  sizes: string[];
  selectedSize: string;
  onSizeSelect: (size: string) => void;
}

export default function ProductSizePicker({ 
  sizes, 
  selectedSize, 
  onSizeSelect 
}: ProductSizePickerProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold">Size</h2>
        <button
          type="button"
          id="size-guide"
          name="size-guide"
          className="text-sm text-gray-600 hover:text-black"
        >
          Size guide
        </button>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
            id={`size-${size}`}
            name={`size-${size}`}
            onClick={() => onSizeSelect(size)}
            className={`py-2 border rounded-md ${
              selectedSize === size
                ? 'border-black bg-black text-white'
                : 'border-gray-300 hover:border-black'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}