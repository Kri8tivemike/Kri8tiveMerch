import React, { useState, useEffect, useRef } from 'react';
import { 
  Eye, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Search,
  ChevronDown,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
  ShoppingBag,
  X,
  MapPin,
  Phone,
  User,
  Sliders,
  Mail,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { databases } from '../../lib/appwrite';
import { Query } from 'appwrite';
import { useToast } from '../../hooks/use-toast';
import OrderStatusDropdown from './OrderMenu';
import { updateOrderStatus as updateOrderStatusAPI, orderStatusConfig } from '../../services/order.service';



// Simple custom dropdown components
const Dropdown = ({ 
  children, 
  trigger, 
  align = 'left'
}: { 
  children: React.ReactNode; 
  trigger: React.ReactNode;
  align?: 'left' | 'right';
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div className={`absolute z-10 mt-1 ${align === 'right' ? 'right-0' : 'left-0'} w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none`}>
          <div className="py-1" onClick={() => setIsOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

const DropdownItem = ({ 
  children, 
  onClick,
  disabled = false,
  className = ''
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) => (
  <button
    onClick={disabled ? undefined : onClick}
    className={`block w-full text-left px-4 py-2 text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'} ${className}`}
    disabled={disabled}
  >
    {children}
  </button>
);

const DropdownSeparator = () => <div className="border-t my-1" />;

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: {
    id: string;
    name: string;
    image_url?: string;
  };
}

interface ShippingAddress {
  first_name: string;
  last_name: string;
  email: string;
  address: string;
  city: string;
  country: string;
  postal_code: string;
  phone: string;
}

interface Order {
  id: string;
  user_id: string | null;
  customer: {
    name: string;
    email: string;
  };
  created_at: string;
  total_amount: number;
  shipping_cost: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: OrderItem[];
  shipping_address?: ShippingAddress | null;
}

type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

const statusColors = {
  Pending: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/30',
  Processing: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30',
  Shipped: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/30',
  Delivered: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/30',
  Cancelled: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30'
};

const statusIcons = {
  Pending: Package,
  Processing: Truck,
  Shipped: Truck,
  Delivered: CheckCircle,
  Cancelled: XCircle
};

// Format currency helper
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Custom OrderMenu component
const OrderMenu = ({ 
  order, 
  onStatusChange 
}: { 
  order: Order; 
  onStatusChange: (orderId: string, status: Order['status']) => void;
}) => {
  return (
    <OrderStatusDropdown
      currentStatus={order.status}
      orderId={order.id}
      onStatusChange={onStatusChange}
    />
  );
};

// Order Details Modal Component
interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onStatusChange: (orderId: string, status: Order['status']) => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose, onStatusChange }) => {
  // Create a reference for the modal content to detect outside clicks
  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle ESC key to close the modal
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Handle clicking outside to close the modal
    const handleOutsideClick = (event: MouseEvent) => {
      if (modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    document.addEventListener('mousedown', handleOutsideClick);

    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  const StatusIcon = statusIcons[order.status] || Package;
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div 
        ref={modalContentRef}
        className="bg-white dark:bg-[#121212] rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-200 dark:border-[#222222] flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <ShoppingBag className="w-5 h-5 mr-2" />
            Order Details <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">#{order.id}</span>
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Order Summary */}
        <div className="p-4 border-b border-gray-200 dark:border-[#222222] grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Order Information</h3>
            <div className="space-y-1 text-sm">
              <p className="flex items-center text-gray-600 dark:text-gray-300">
                <Calendar className="w-4 h-4 mr-2" />
                {formatDate(order.created_at)}
              </p>
              <p className="flex items-center text-gray-600 dark:text-gray-300">
                <User className="w-4 h-4 mr-2" />
                {order.customer.name}
              </p>
              <p className="flex items-center text-gray-600 dark:text-gray-300">
                <Mail className="w-4 h-4 mr-2" />
                {order.customer.email}
              </p>
              <div className="flex items-start mt-2">
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  statusColors[order.status]
                }`}>
                  <StatusIcon className="w-3 h-3 mr-1.5" />
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </div>
              </div>
            </div>
          </div>
          
          {order.shipping_address && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Shipping Information</h3>
              <div className="space-y-1 text-sm">
                <p className="flex items-center text-gray-600 dark:text-gray-300">
                  <User className="w-4 h-4 mr-2" />
                  {`${order.shipping_address.first_name} ${order.shipping_address.last_name}`}
                </p>
                <p className="flex items-center text-gray-600 dark:text-gray-300">
                  <MapPin className="w-4 h-4 mr-2" />
                  {order.shipping_address.address}
                </p>
                <p className="flex items-center text-gray-600 dark:text-gray-300">
                  <MapPin className="w-4 h-4 mr-2 opacity-0" />
                  {`${order.shipping_address.city}, ${order.shipping_address.country} ${order.shipping_address.postal_code}`}
                </p>
                <p className="flex items-center text-gray-600 dark:text-gray-300">
                  <Phone className="w-4 h-4 mr-2" />
                  {order.shipping_address.phone}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Order Items */}
        <div className="p-4 border-b border-gray-200 dark:border-[#222222]">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Order Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-[#222222]">
              <thead className="bg-gray-50 dark:bg-[#181818]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#121212] divide-y divide-gray-200 dark:divide-[#222222]">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.product?.image_url ? (
                          <img 
                            src={item.product.image_url} 
                            alt={item.product?.name || 'Product Image'} 
                            className="w-10 h-10 rounded object-cover mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 dark:bg-[#222222] flex items-center justify-center mr-3">
                            <Package className="w-6 h-6 text-gray-400 dark:text-gray-600" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.product?.name || `Product ID: ${item.product_id}`}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            SKU: {item.product_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="p-4 border-b border-gray-200 dark:border-[#222222] flex justify-end">
          <div className="w-full md:w-64 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(order.total_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Shipping</span>
              <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(order.shipping_cost)}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-[#222222] pt-1 mt-1">
              <div className="flex justify-between">
                <span className="text-gray-800 dark:text-gray-200 font-medium">Total</span>
                <span className="text-gray-900 dark:text-white font-bold">{formatCurrency(order.total_amount + order.shipping_cost)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions Footer */}
        <div className="p-4 flex justify-between items-center">
          <OrderMenu order={order} onStatusChange={onStatusChange} />
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-[#222222] hover:bg-gray-200 dark:hover:bg-[#2a2a2a] text-gray-800 dark:text-gray-200 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function OrderList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'created_at', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Use polling instead of real-time subscriptions
  useEffect(() => {
    // Initial fetch
    fetchOrders();
    
    // Set up polling interval (every 30 seconds)
    const pollingInterval = setInterval(() => {
      fetchOrders(true); // true = silent refresh
    }, 30000);
    
    // Clean up on unmount
    return () => {
      clearInterval(pollingInterval);
    };
  }, [currentPage, pageSize, sortConfig, statusFilter, dateFilter]);

  const fetchOrders = async (silent = false) => {
    if (isRefreshing) return;
    
    if (!silent) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    setError(null);
    
    try {
      // Get database and collection IDs from environment variables
      const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const ORDERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_ID;
      const ORDER_ITEMS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ORDER_ITEMS_COLLECTION_ID;
      
      if (!DATABASE_ID || !ORDERS_COLLECTION_ID) {
        throw new Error('Database or collection ID not configured');
      }
      
      // Build queries based on filters
      const queries = [];
      
      // Status filter
      if (statusFilter && statusFilter !== 'all') {
        queries.push(Query.equal('status', statusFilter));
      }
      
      // Date filter
      if (dateFilter && dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'yesterday': {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            startDate = new Date(yesterday.setHours(0, 0, 0, 0));
            break;
          }
          case 'last7days':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'last30days':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 30);
            break;
          default:
            startDate = new Date(0); // Start of time
        }
        
        queries.push(Query.greaterThanEqual('created_at', startDate.toISOString()));
      }
      
      // Search filter (search in order ID)
      if (searchQuery) {
        queries.push(Query.search('$id', searchQuery));
      }
      
      // Add sorting
      if (sortConfig.key) {
        const key = sortConfig.key === 'id' ? '$id' : sortConfig.key;
        queries.push(
          sortConfig.direction === 'asc' 
            ? Query.orderAsc(key) 
            : Query.orderDesc(key)
        );
      }
      
      // Add pagination
      const limit = pageSize;
      const offset = (currentPage - 1) * pageSize;
      queries.push(Query.limit(limit));
      queries.push(Query.offset(offset));
      
      // Fetch orders
      const ordersResponse = await databases.listDocuments(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        queries
      );
      
      if (!ordersResponse.documents || ordersResponse.documents.length === 0) {
        setOrders([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }
      
      // Get all order IDs to fetch their items
      const orderIds = ordersResponse.documents.map(order => order.$id);
      
      // Fetch order items for these orders if collection ID is available
      let orderItemsResponse: { documents?: any[] } = { documents: [] };
      if (ORDER_ITEMS_COLLECTION_ID) {
        orderItemsResponse = await databases.listDocuments(
          DATABASE_ID,
          ORDER_ITEMS_COLLECTION_ID,
          [Query.equal('order_id', orderIds)]
        );
      }
      
      // Group items by order ID
      const itemsByOrderId: Record<string, OrderItem[]> = {};
      if (orderItemsResponse.documents) {
        for (const item of orderItemsResponse.documents) {
          if (!itemsByOrderId[item.order_id]) {
            itemsByOrderId[item.order_id] = [];
          }
          itemsByOrderId[item.order_id].push({
            id: item.$id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price
          });
        }
      }
      
      // Map to Order objects
      const formattedOrders = await Promise.all(ordersResponse.documents.map(async order => {
        // Get user profile from role-based collections
        let customerName = 'Unknown Customer';
        let customerEmail = 'No email';
        
        if (order.user_id) {
          try {
            // Search across all role-based collections for the user
            const collections = ['customers', 'shop_managers', 'super_admins'];
            let profile = null;
            
            for (const collectionId of collections) {
              try {
                const profileResponse = await databases.listDocuments(
                  DATABASE_ID,
                  collectionId,
                  [Query.equal('user_id', order.user_id)]
                );
                
                if (profileResponse.documents && profileResponse.documents.length > 0) {
                  profile = profileResponse.documents[0];
                  break; // Found the profile, stop searching
                }
              } catch (collectionErr) {
                // Continue to next collection if this one fails
                console.warn(`Could not search ${collectionId} collection:`, collectionErr);
              }
            }
            
            if (profile) {
              customerName = profile.full_name || 
                `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
                customerName;
              
              customerEmail = profile.email || customerEmail;
            }
          } catch (err) {
            console.error('Error fetching profile:', err);
            // Continue with default values
          }
        }
        
        return {
          id: order.$id,
          user_id: order.user_id,
          customer: {
            name: customerName,
            email: customerEmail
          },
          created_at: order.created_at || order.$createdAt,
          total_amount: order.total_amount || 0,
          shipping_cost: order.shipping_cost || 0,
          status: order.status,
          items: itemsByOrderId[order.$id] || [],
          shipping_address: order.shipping_address ? JSON.parse(order.shipping_address) : null
        };
      }));
      
      setOrders(formattedOrders);
      
      // Calculate total pages from the count in headers
      const totalRecords = ordersResponse.total;
      setTotalPages(Math.max(1, Math.ceil(totalRecords / pageSize)));
      
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
      
      toast({
        title: "Error",
        description: "Could not fetch orders from the database.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOrders();
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // Add a new function for applying search and filters
  const applySearchAndFilters = async () => {
    setCurrentPage(1); // Reset to first page when applying new filters
    await fetchOrders();
  };

  // Replace the existing applyFilters function
  const applyFilters = applySearchAndFilters;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />;
    }
    
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5" />
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      // Show loading toast
      toast({
        title: "Updating order status...",
        description: "Please wait while we update the order status.",
        variant: "default"
      });

      // Optimistic update
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      // Update in database
      await updateOrderStatusAPI(orderId, newStatus);

      // Show success toast
      toast({
        title: "Order status updated",
        description: `Order status has been updated to ${orderStatusConfig[newStatus].label}`,
        variant: "default"
      });

      // Refresh data
      fetchOrders(true);
    } catch (error) {
      console.error('Error updating order status:', error);
      
      // Show error toast
      toast({
        title: "Failed to update order status",
        description: "There was an error updating the order status. Please try again.",
        variant: "destructive"
      });

      // Revert the optimistic update
      fetchOrders();
    }
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Order Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="relative w-full md:w-80">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input 
            type="text" 
            placeholder="Search orders..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value === '') {
                applySearchAndFilters();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                applySearchAndFilters();
              }
            }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-[#222222] bg-white dark:bg-[#181818] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-[#222222] bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-[#222222] bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
            </div>
          </button>
        </div>
      </div>
      
      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-[#181818] p-4 rounded-md shadow-sm space-y-4 mb-4 border border-gray-100 dark:border-[#222222]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setTimeout(applySearchAndFilters, 0);
                }}
                className="w-full px-4 py-2 border rounded-md border-gray-200 dark:border-[#222222] bg-white dark:bg-[#181818] text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setTimeout(applySearchAndFilters, 0);
                }}
                className="w-full px-4 py-2 border rounded-md border-gray-200 dark:border-[#222222] bg-white dark:bg-[#181818] text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => {
                setStatusFilter('all');
                setDateFilter('all');
                setSearchQuery('');
                setTimeout(applySearchAndFilters, 0);
                setShowFilters(false);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-md mb-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {/* Orders Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <p className="text-gray-500 dark:text-gray-400">Loading orders...</p>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-[#181818] rounded-lg border border-gray-100 dark:border-[#222222]">
          <div className="bg-white dark:bg-[#121212] p-4 rounded-full mb-4 border border-gray-100 dark:border-[#222222]">
            <ShoppingBag className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Orders Found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4 text-center">
            {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
              ? 'No orders match your search criteria. Try adjusting your filters.'
              : 'There are no orders yet.'}
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#121212] rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-[#222222]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-[#222222]">
              <thead className="bg-gray-50 dark:bg-[#181818]">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Order ID</span>
                      {getSortIcon('id')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Customer</span>
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date</span>
                      {getSortIcon('created_at')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Items</span>
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('total_amount')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Total</span>
                      {getSortIcon('total_amount')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#121212] divide-y divide-gray-200 dark:divide-[#222222]">
                {orders.map((order) => {
                  const StatusIcon = statusIcons[order.status] || Package;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-[#181818] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {order.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{order.customer.name}</div>
                        {order.customer.email && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{order.customer.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {order.items.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(order.total_amount + order.shipping_cost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          statusColors[order.status]
                        }`}>
                          <StatusIcon className="w-3 h-3 mr-1.5" />
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-3">
                        <button 
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetails(true);
                          }}
                          className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors"
                          title="View Order Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <OrderMenu order={order} onStatusChange={handleOrderStatusChange} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-white dark:bg-[#121212] border-t border-gray-200 dark:border-[#222222] flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, orders.length + (currentPage - 1) * pageSize)}
                </span>{' '}
                of <span className="font-medium">{orders.length + (currentPage - 1) * pageSize}</span> results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === 1
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#181818]'
                  }`}
                >
                  Previous
                </button>
                {/* Page Numbers */}
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handlePageChange(index + 1)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === index + 1
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#181818]'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === totalPages
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#181818]'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowOrderDetails(false);
            setSelectedOrder(null);
          }}
          onStatusChange={handleOrderStatusChange}
        />
      )}
    </div>
  );
}