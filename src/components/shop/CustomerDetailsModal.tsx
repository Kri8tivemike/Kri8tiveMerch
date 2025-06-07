import { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  CreditCard, 
  Clock, 
  Package, 
  Loader2,
  RefreshCw
} from 'lucide-react';
import { databases } from '../../lib/appwrite';
import { Query } from 'appwrite';
import { useToast } from '../../hooks/use-toast';

// Define types
interface Customer {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;
  whatsapp_number: string | null;
  delivery_address: string | null;
  orders: number;
  totalSpent: number;
  lastOrder: string | null;
  joinDate: string;
  avatar_url: string | null;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  items?: any[];
}

interface CustomerDetailsModalProps {
  customer: Customer | null;
  onClose: () => void;
  isOpen: boolean;
}

const CustomerDetailsModal = ({ customer, onClose, isOpen }: CustomerDetailsModalProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const { toast } = useToast();

  // Set initial customer data
  useEffect(() => {
    if (customer) {
      console.log('Initial customer data in modal:', customer);
      // Set customer data immediately without triggering additional fetches
      setCustomerData(customer);
      
      // Don't fetch data here - we'll do it only when the modal is open
    }
  }, [customer]);

  // Fetch data only when modal opens
  useEffect(() => {
    let fetchTimer: NodeJS.Timeout | null = null;
    let refreshInterval: NodeJS.Timeout | null = null;
    
    if (isOpen && customerData) {
      // Force immediate data refresh from database when modal opens
      if (!customerData.id.startsWith('sample-')) {
        console.log('Modal opened, immediately fetching fresh data for:', customerData.id);
        fetchLatestCustomerData(customerData.id);
        
        // Set up periodic refresh for contact information
        refreshInterval = setInterval(() => {
          console.log('Refreshing contact information from database...');
          fetchLatestCustomerData(customerData.id);
        }, 5000); // Refresh every 5 seconds
      }
      
      // Debounce order data fetching to prevent flickering
      fetchTimer = setTimeout(() => {
        // Fetch orders when modal opens
        fetchCustomerOrders();
      }, 300); // Small delay to prevent rapid re-renders
      
      // Note: Appwrite doesn't support the same real-time subscription model as Supabase
      // We're using periodic polling instead (via the refreshInterval above)
    }
    
    // Clean up timers
    return () => {
      if (fetchTimer) clearTimeout(fetchTimer);
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [isOpen, customerData?.id]); // Only depend on isOpen and the ID to avoid extra renders

  // Helper function to update profile data with change detection
  const updateProfileDataWithCheck = (profile: any) => {
    setCustomerData(prevData => {
      if (!prevData) return null;
      
      // Track which fields changed for visual feedback
      const changedFields = {
        phone: prevData.phone_number !== profile.phone_number,
        whatsapp: prevData.whatsapp_number !== profile.whatsapp_number,
        address: prevData.delivery_address !== profile.delivery_address,
        avatar: prevData.avatar_url !== profile.avatar_url
      };
      
      // Skip update if nothing changed
      const hasChanges = 
        changedFields.phone ||
        changedFields.whatsapp ||
        changedFields.address ||
        changedFields.avatar;
        
      if (!hasChanges) {
        console.log('No changes detected in profile data, skipping update');
        return prevData; // Return existing data if nothing changed
      }
      
      // Show toast notification with specific field changes
      let changeMessage = 'Customer data updated:';
      const changedFieldNames: string[] = [];
      
      if (changedFields.phone) changedFieldNames.push('Phone number');
      if (changedFields.whatsapp) changedFieldNames.push('WhatsApp number');
      if (changedFields.address) changedFieldNames.push('Delivery address');
      
      if (changedFieldNames.length > 0) {
        changeMessage += ' ' + changedFieldNames.join(', ');
        
        toast({
          title: "Real-time Update",
          description: changeMessage,
        });
      }
      
      // Extract name parts safely
      const fullName = profile.full_name || '';
      // Use type assertion to safely access potential properties
      const profileAny = profile as any;
      const firstName = profileAny.first_name || '';
      const lastName = profileAny.last_name || '';
      
      return {
        ...prevData,
        name: fullName || `${firstName} ${lastName}`.trim() || prevData.name,
        phone_number: profile.phone_number ?? prevData.phone_number,
        whatsapp_number: profile.whatsapp_number ?? prevData.whatsapp_number,
        delivery_address: profile.delivery_address ?? prevData.delivery_address,
        avatar_url: profile.avatar_url || prevData.avatar_url
      };
    });
  };

  // Update the original function to use the new one with change detection
  const updateProfileData = (profile: any) => {
    if (!profile) return;
    
    console.log('Updating profile data with:', {
      phone: profile.phone_number,
      whatsapp: profile.whatsapp_number
    });
    
    setCustomerData(prevData => {
      if (!prevData) return null;
      
      // Use type assertion for additional fields
      const profileAny = profile as any;
      
      return {
        ...prevData,
        name: profile.full_name || prevData.name,
        phone_number: profile.phone_number,
        whatsapp_number: profile.whatsapp_number,
        delivery_address: profile.delivery_address,
        avatar_url: profile.avatar_url || prevData.avatar_url,
        joinDate: profile.created_at || prevData.joinDate
      };
    });
  };

  // Update the fetchLatestCustomerData function to handle the data correctly
  const fetchLatestCustomerData = async (userId: string) => {
    try {
      // First check if this is a sample ID (not a real UUID)
      if (userId.startsWith('sample-')) {
        console.log('Not fetching sample customer from database:', userId);
        setContactLoading(false);
        return; // Exit early - no need to query the database for sample data
      }
      
      console.log("Fetching latest contact data for customer ID:", userId);
      setContactLoading(true);
      
      // Validate ID format before querying
      if (!userId || userId.trim() === '') {
        console.error('Invalid ID format:', userId);
        toast({
          title: "Error",
          description: "Invalid customer ID format",
          variant: "destructive",
        });
        setContactLoading(false);
        return;
      }
      
      // First get basic profile info from role-based collections
      console.log('Fetching basic profile data from role-based collections...');
      try {
        const collections = ['customers', 'shop_managers', 'super_admins'];
        let profile = null;
        
        for (const collectionId of collections) {
          try {
            const profileResponse = await databases.listDocuments(
              import.meta.env.VITE_APPWRITE_DATABASE_ID,
              collectionId,
              [Query.equal('user_id', userId)]
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
          // Extract profile data
          const profileData = {
            id: profile.$id,
            full_name: profile.full_name || profile.name,
            avatar_url: profile.avatar_url,
            created_at: profile.created_at,
            role: profile.role
          };
          
          // Update customer data with profile info
          updateProfileData(profileData);
        }
      } catch (profileError) {
        console.error('Error fetching basic profile data:', profileError);
      }
      
      // Then get contact info from the customization_requests table
      console.log('Fetching contact info from customization_requests...');
      try {
        const { documents } = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_CUSTOMIZATION_COLLECTION_ID,
          [
            Query.equal('user_id', userId),
            Query.orderDesc('created_at'),
            Query.limit(1)
          ]
        );
        
        if (documents.length > 0) {
          const latestRequest = documents[0];
          const contactInfo = {
            phone_number: latestRequest.phone_number,
            whatsapp_number: latestRequest.whatsapp_number,
            delivery_address: latestRequest.delivery_address
          };
          
          // Update customer data with contact info
          updateProfileDataWithCheck(contactInfo);
        }
      } catch (contactError) {
        console.error('Error fetching contact info:', contactError);
      }
      
      setContactLoading(false);
    } catch (error) {
      console.error('Error fetching customer data:', error);
      setContactLoading(false);
      toast({
        title: "Error",
        description: "Failed to fetch customer data",
        variant: "destructive",
      });
    }
  };

  // Fetch customer orders
  const fetchCustomerOrders = async () => {
    if (!customerData) return;
    
    // Skip for sample customers
    if (customerData.id.startsWith('sample-')) {
      console.log('Not fetching orders for sample customer');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Fetching orders for customer:', customerData.id);
      
      const { documents } = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_ID,
        [
          Query.equal('user_id', customerData.id),
          Query.orderDesc('created_at')
        ]
      );
      
      // Map Appwrite documents to Order interface
      const ordersList = documents.map(doc => ({
        id: doc.$id,
        created_at: doc.created_at,
        status: doc.status,
        total_amount: doc.total || doc.total_amount || 0,
        items: doc.items || []
      }));
      
      setOrders(ordersList);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to fetch customer orders",
        variant: "destructive",
      });
    }
  };

  if (!isOpen || !customerData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Customer Details</h2>
            {!customerData.id.startsWith('sample-') && (
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2"></div>
                <span className="text-xs text-green-600">Real-time database data</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Only show refresh button for real customers */}
            {!customerData.id.startsWith('sample-') && (
              <button 
                onClick={() => customerData && fetchLatestCustomerData(customerData.id)}
                className="text-blue-500 hover:text-blue-700 p-1.5 rounded-full hover:bg-gray-100"
                title="Refresh customer data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Sample data indicator for non-real customers */}
        {customerData.id.startsWith('sample-') && (
          <div className="bg-amber-50 px-4 py-2 text-amber-800 text-sm flex items-center">
            <span className="font-medium">Sample Data:</span>
            <span className="ml-2">This is sample customer information for demonstration purposes.</span>
          </div>
        )}
        
        <div className="overflow-y-auto p-6 max-h-[calc(90vh-8rem)]">
          {/* Customer Header */}
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 rounded-full mr-4 overflow-hidden border-2 border-gray-200">
              {customerData.avatar_url ? (
                <img 
                  src={customerData.avatar_url} 
                  alt={`${customerData.name}'s profile`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; // Prevent infinite loop
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(customerData.name)}&background=0D8ABC&color=fff&size=128`;
                  }}
                />
              ) : (
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(customerData.name)}&background=0D8ABC&color=fff&size=128`}
                  alt={`${customerData.name}'s profile`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{customerData.name}</h3>
              <p className="text-sm text-gray-500">Customer since {new Date(customerData.joinDate).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3 text-gray-500 flex items-center justify-between">
              <span>Personal Information</span>
              {!customerData.id.startsWith('sample-') && (
                <button 
                  onClick={() => customerData && fetchLatestCustomerData(customerData.id)}
                  className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                  disabled={contactLoading}
                >
                  {contactLoading ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3 mr-1" />
                  )}
                  Refresh Contact Info
                </button>
              )}
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email Address</p>
                    <p className="text-gray-900">{customerData.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone Number</p>
                    <p className="text-gray-900 relative group">
                      {contactLoading ? (
                        <span className="flex items-center">
                          <Loader2 className="h-3 w-3 mr-2 animate-spin text-blue-500" />
                          Loading...
                        </span>
                      ) : customerData.phone_number ? (
                        <>
                          {customerData.phone_number}
                          <span className="absolute -left-2 top-0 h-full w-1 bg-green-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        </>
                      ) : (
                        'Not provided'
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className={`w-5 h-5 ${customerData.whatsapp_number ? 'text-green-500' : 'text-gray-400'} mr-2 mt-0.5`} />
                  <div>
                    <p className="text-sm font-medium text-gray-500">WhatsApp Number</p>
                    <p className="text-gray-900 relative group">
                      {contactLoading ? (
                        <span className="flex items-center">
                          <Loader2 className="h-3 w-3 mr-2 animate-spin text-green-500" />
                          Loading...
                        </span>
                      ) : customerData.whatsapp_number ? (
                        <>
                          {customerData.whatsapp_number}
                          <span className="absolute -left-2 top-0 h-full w-1 bg-green-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"></span>
                          <p className="text-xs text-green-600">For order updates via WhatsApp</p>
                        </>
                      ) : (
                        'Not provided'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Delivery Information */}
          {customerData.delivery_address && (
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3 text-gray-500">Delivery Information</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Delivery Address</p>
                    <p className="text-gray-900">{customerData.delivery_address}</p>
                    <p className="text-xs text-gray-500">Default shipping address for orders</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Customer Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-900">{customerData.orders}</p>
                </div>
                <ShoppingBag className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Total Spent</p>
                  <p className="text-2xl font-bold text-purple-900">${customerData.totalSpent.toFixed(2)}</p>
                </div>
                <CreditCard className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700">Last Order</p>
                  <p className="text-lg font-bold text-amber-900">
                    {customerData.lastOrder ? new Date(customerData.lastOrder).toLocaleDateString() : 'No orders'}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
            </div>
          </div>
          
          {/* Order History */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order History</h3>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-gray-50 rounded-lg py-8 text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                <p className="mt-1 text-sm text-gray-500">This customer hasn't placed any orders yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          #{order.id.substring(0, 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            order.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                            order.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${parseFloat(String(order.total_amount)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t p-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsModal; 