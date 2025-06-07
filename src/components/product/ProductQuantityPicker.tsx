import { Minus, Plus } from 'lucide-react';

interface ProductQuantityPickerProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  price: number;
}

export default function ProductQuantityPicker({ 
  quantity, 
  onQuantityChange,
  price 
}: ProductQuantityPickerProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold">Quantity</h2>
        <p className="text-sm text-gray-600">Price per item: ${price}</p>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          id="decrease-quantity"
          name="decrease-quantity"
          onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
          className="p-2 border rounded-md hover:border-black"
          aria-label="Decrease quantity"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-12 text-center">{quantity}</span>
        <button
          type="button"
          id="increase-quantity"
          name="increase-quantity"
          onClick={() => onQuantityChange(quantity + 1)}
          className="p-2 border rounded-md hover:border-black"
          aria-label="Increase quantity"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}