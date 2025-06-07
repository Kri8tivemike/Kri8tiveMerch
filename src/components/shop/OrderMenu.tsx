import React, { useState, useRef, useEffect } from 'react';
import { Check, Package, ShoppingBag, Truck, CheckCircle, XCircle, MoreVertical } from 'lucide-react';
import { orderStatusConfig } from '../../services/order.service';

type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

interface OrderStatusDropdownProps {
  currentStatus: OrderStatus;
  orderId: string;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  triggerElement?: React.ReactNode;
  align?: 'left' | 'right';
}

const OrderStatusDropdown: React.FC<OrderStatusDropdownProps> = ({
  currentStatus,
  orderId,
  onStatusChange,
  triggerElement,
  align = 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get status icon component by name
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Package':
        return <Package className="w-4 h-4 mr-2" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-4 h-4 mr-2" />;
      case 'Truck':
        return <Truck className="w-4 h-4 mr-2" />;
      case 'CheckCircle':
        return <CheckCircle className="w-4 h-4 mr-2" />;
      case 'XCircle':
        return <XCircle className="w-4 h-4 mr-2" />;
      default:
        return <Package className="w-4 h-4 mr-2" />;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle status change
  const handleStatusChange = (status: OrderStatus) => {
    onStatusChange(orderId, status);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {triggerElement || (
          <button 
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
            aria-label="Update order status"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {isOpen && (
        <div 
          className={`absolute z-10 mt-1 ${align === 'right' ? 'right-0' : 'left-0'} w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden`}
        >
          <div className="py-1 text-sm text-gray-700 dark:text-gray-300">
            <div className="px-4 py-2 font-medium border-b border-gray-100 dark:border-gray-700">
              Update Status
            </div>
            
            {/* Status options */}
            {(Object.keys(orderStatusConfig) as OrderStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center ${
                  currentStatus === status 
                    ? `${orderStatusConfig[status].bgClass} font-medium` 
                    : status === 'Cancelled' 
                      ? 'text-red-600 dark:text-red-400' 
                      : ''
                }`}
              >
                {getIconComponent(orderStatusConfig[status].icon)}
                {orderStatusConfig[status].label}
                {currentStatus === status && <Check className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderStatusDropdown; 