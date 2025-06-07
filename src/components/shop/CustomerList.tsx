import { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  User, 
  Filter,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { databases } from '../../lib/appwrite';
import { Query } from 'appwrite';
import { useToast } from '../../hooks/use-toast';
import CustomerDetailsModal from './CustomerDetailsModal';

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

export default function CustomerList() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [spendingFilter, setSpendingFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [orderFilter, setOrderFilter] = useState<'all' | 'new' | 'returning'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Customer | null;
    direction: 'asc' | 'desc';
  }>({ key: 'lastOrder', direction: 'desc' });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  // Define specific customer ID at component level instead of inside function
  const specificCustomerId = '7ad3872f-9239-4797-9b0f-1ea77e298a6b';
  const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

  useEffect(() => {
    // Force a fresh data load when component mounts
    fetchCustomers(true);
    
    // Set up auto-refresh interval for real-time data
    const refreshInterval = setInterval(() => {
      console.log("Auto-refreshing customer data to ensure real-time view");
      fetchCustomers(true);
    }, AUTO_REFRESH_INTERVAL);
    
    // Cleanup interval on component unmount
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);
  
  // Implement a debounced customer state update to prevent flickering
  const setCustomersWithDebounce = (customerData: Customer[]) => {
    console.log("Setting customer data with stable values:", customerData);
    
    // Ensure we're not losing data by comparing with existing state
    setCustomers(prevCustomers => {
      // If data is the same (simple ID check), skip update to prevent flickering
      if (prevCustomers.length === customerData.length && 
          prevCustomers[0]?.id === customerData[0]?.id &&
          prevCustomers[0]?.phone_number === customerData[0]?.phone_number) {
        console.log("No changes in customer data, skipping update");
        return prevCustomers;
      }
      return customerData;
    });
  };

  // Helper function to set default sample customer with stable data and debounced updates
  function useDefaultSampleCustomer() {
    console.log("Using default sample customer data");
    setCustomersWithDebounce([getDefaultFallbackCustomer('sample-1')]);
  }

  // Helper function to use fallback with real ID - update to use the reusable function
  function useFallbackWithRealId(userId: string) {
    console.log("Using fallback data with real user ID:", userId);
    setCustomersWithDebounce([getDefaultFallbackCustomer(userId)]);
  }

  // Move the default fallback customer creation to a function that returns the object
  const getDefaultFallbackCustomer = (userId: string = specificCustomerId): Customer => {
    return {
      id: userId,
      name: 'Michael IGUARIEDE',
      email: 'kri8tivemike@gmail.com',
      phone_number: null,
      whatsapp_number: null,
      delivery_address: null,
      orders: 4,
      totalSpent: 249.95,
      lastOrder: '2024-03-25T10:00:00Z',
      joinDate: '2024-03-24T10:00:00Z',
      avatar_url: null
    };
  };

  const fetchCustomers = async (forceReload = false) => {
    if (!forceReload && lastRefreshed && Date.now() - lastRefreshed.getTime() < 5000) {
      console.log("Skipping fetch - data recently refreshed");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch users from role-based collections
      const collections = ['customers', 'shop_managers', 'super_admins'];
      let allUsers: any[] = [];
      
      for (const collectionId of collections) {
        try {
          const response = await databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            collectionId,
            [
              Query.limit(100),
              Query.orderDesc('$createdAt')
            ]
          );
          
          // Add collection info to each user for role identification
          const usersWithRole = response.documents.map(user => ({
            ...user,
            role: collectionId === 'customers' ? 'customer' : 
                  collectionId === 'shop_managers' ? 'shop_manager' : 'super_admin'
          }));
          
          allUsers = [...allUsers, ...usersWithRole];
        } catch (collectionError) {
          console.warn(`Could not fetch from ${collectionId} collection:`, collectionError);
        }
      }

      // Fetch orders from Appwrite
      const ordersResponse = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_ID,
        [
          Query.limit(1000),
          Query.orderDesc('created_at')
        ]
      );

      // Deduplicate users based on user_id (same user might exist in multiple role collections)
      const uniqueUsers = new Map();
      allUsers.forEach(user => {
        const userId = user.user_id || user.$id;
        if (!uniqueUsers.has(userId)) {
          uniqueUsers.set(userId, user);
        } else {
          // If duplicate found, keep the one with higher priority role
          const existing = uniqueUsers.get(userId);
          const existingPriority = existing.role === 'super_admin' ? 3 : existing.role === 'shop_manager' ? 2 : 1;
          const currentPriority = user.role === 'super_admin' ? 3 : user.role === 'shop_manager' ? 2 : 1;
          
          console.log(`Duplicate user found: ${userId}, keeping ${currentPriority > existingPriority ? user.role : existing.role} role`);
          
          if (currentPriority > existingPriority) {
            uniqueUsers.set(userId, user);
          }
        }
      });

      console.log(`Deduplicated users: ${allUsers.length} -> ${uniqueUsers.size}`);

      // Process and combine the data
      const customerData = Array.from(uniqueUsers.values()).map(user => {
        // Use user_id to match orders (since that's how orders reference users)
        const userId = user.user_id || user.$id;
        const userOrders = ordersResponse.documents.filter(order => order.user_id === userId);
        const totalSpent = userOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        const lastOrder = userOrders.length > 0 ? userOrders[0].created_at : null;

        return {
          id: userId,
          name: user.full_name || user.first_name + ' ' + user.last_name || user.email,
          email: user.email,
          phone_number: user.phone || user.phone_number || null,
          whatsapp_number: user.whatsapp_number || null,
          delivery_address: user.delivery_address || null,
          orders: userOrders.length,
          totalSpent,
          lastOrder,
          joinDate: user.$createdAt,
          avatar_url: user.avatar_url || null
        };
      });

      setCustomersWithDebounce(customerData);
      setLastRefreshed(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customer data. Please try again.');
      setIsLoading(false);
      
      // Use fallback data for development/testing
      if (process.env.NODE_ENV === 'development') {
        useDefaultSampleCustomer();
      }
    }
  };

  const handleSort = (key: keyof Customer) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  const getFilteredCustomers = () => {
    return customers
      .filter(customer => {
        // Search filter
        const matchesSearch = 
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (customer.phone_number && customer.phone_number.includes(searchQuery));
        
        // Spending filter
        let matchesSpending = true;
        if (spendingFilter === 'low') {
          matchesSpending = customer.totalSpent < 100;
        } else if (spendingFilter === 'medium') {
          matchesSpending = customer.totalSpent >= 100 && customer.totalSpent < 300;
        } else if (spendingFilter === 'high') {
          matchesSpending = customer.totalSpent >= 300;
        }
        
        // Order count filter
        let matchesOrders = true;
        if (orderFilter === 'new') {
          matchesOrders = customer.orders <= 1;
        } else if (orderFilter === 'returning') {
          matchesOrders = customer.orders > 1;
        }
        
        return matchesSearch && matchesSpending && matchesOrders;
      })
      .sort((a, b) => {
        if (!sortConfig.key) return 0;
        
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
  };

  const filteredCustomers = getFilteredCustomers();

  const getSortIcon = (key: keyof Customer) => {
    if (sortConfig.key !== key) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50">
          <path d="M7 15L12 20L17 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M7 9L12 4L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      );
    }
    
    return sortConfig.direction === 'asc' ? (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 9L12 4L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
    ) : (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 15L12 20L17 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
    );
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Add these handlers for the modal:
  const handleViewDetails = async (customer: Customer) => {
    setIsLoading(true);
    
    try {
      // Get latest profile data from role-based collections
      try {
        const collections = ['customers', 'shop_managers', 'super_admins'];
        let latestProfile = null;
        
        for (const collectionId of collections) {
          try {
            const profileResponse = await databases.listDocuments(
              import.meta.env.VITE_APPWRITE_DATABASE_ID,
              collectionId,
              [Query.equal('user_id', customer.id)]
            );
            
            if (profileResponse.documents && profileResponse.documents.length > 0) {
              latestProfile = profileResponse.documents[0];
              break; // Found the profile, stop searching
            }
          } catch (collectionErr) {
            // Continue to next collection if this one fails
            console.warn(`Could not search ${collectionId} collection:`, collectionErr);
          }
        }
         
        if (latestProfile) {
          // Update customer with latest profile data
          customer = {
            ...customer,
            name: latestProfile.full_name || customer.name,
            avatar_url: latestProfile.avatar_url || customer.avatar_url
          };
        }
      } catch (error) {
        console.error('Error fetching latest profile:', error);
      }

      // Get latest contact info
      try {
        const contactResponse = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_CUSTOMIZATION_COLLECTION_ID,
          [
            Query.equal('user_id', customer.id),
            Query.orderDesc('created_at'),
            Query.limit(1)
          ]
        );
        
        if (contactResponse.documents.length > 0) {
          const contactData = contactResponse.documents[0];
          customer = {
            ...customer,
            phone_number: contactData.phone_number || customer.phone_number,
            whatsapp_number: contactData.whatsapp_number || customer.whatsapp_number,
            delivery_address: contactData.delivery_address || customer.delivery_address
          };
        }
      } catch (error) {
        console.error('Error fetching contact info:', error);
      }

      setSelectedCustomer(customer);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('Error loading customer details:', error);
      toast({
        title: "Error",
        description: "Failed to load customer details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsDetailsModalOpen(false);
  };

  // Add function to handle manual refresh
  const handleManualRefresh = () => {
    fetchCustomers(true);
    toast({
      title: "Refreshing Data",
      description: "Loading real-time customer data from database",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Failed to load customers</h3>
        <p className="text-gray-500 mt-1 mb-4">{error}</p>
        <button
          onClick={() => fetchCustomers()}
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header Section */}
      <div className="bg-white dark:bg-[#121212] rounded-lg shadow-sm p-6 border border-gray-100 dark:border-[#181818]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Customers</h2>
            <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Real-time customer data
              </span>
              {lastRefreshed && (
                <span className="ml-3">
                  Last refreshed: {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search customers..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-[#222222] bg-white dark:bg-[#181818] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button
              onClick={handleManualRefresh}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-[#222222] bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-[#222222] bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              <span className={`transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`}>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          </div>
        </div>
        
        {/* Filters Section */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-[#181818] rounded-lg border border-gray-100 dark:border-[#222222]">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Spending Level</label>
              <select
                value={spendingFilter}
                onChange={(e) => setSpendingFilter(e.target.value as 'all' | 'low' | 'medium' | 'high')}
                className="w-full px-4 py-2 border rounded-md border-gray-200 dark:border-[#222222] bg-white dark:bg-[#181818] text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Spending Levels</option>
                <option value="low">Low Spenders (less than ₦25,000)</option>
                <option value="medium">Medium Spenders (₦25,000-₦100,000)</option>
                <option value="high">High Spenders (more than ₦100,000)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Type</label>
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value as 'all' | 'new' | 'returning')}
                className="w-full px-4 py-2 border rounded-md border-gray-200 dark:border-[#222222] bg-white dark:bg-[#181818] text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Customers</option>
                <option value="new">New Customers (1 or fewer orders)</option>
                <option value="returning">Returning Customers (2+ orders)</option>
              </select>
            </div>
            
            <div className="col-span-1 sm:col-span-2 flex justify-end">
              <button
                onClick={() => {
                  setSpendingFilter('all');
                  setOrderFilter('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-md mb-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && customers.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <p className="text-gray-500 dark:text-gray-400">Loading customer data...</p>
          </div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-[#181818] rounded-lg border border-gray-100 dark:border-[#222222]">
          <div className="bg-white dark:bg-[#121212] p-4 rounded-full mb-4 border border-gray-100 dark:border-[#222222]">
            <User className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Customers Found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4 text-center">
            {searchQuery || spendingFilter !== 'all' || orderFilter !== 'all'
              ? 'No customers match your search criteria. Try adjusting your filters.'
              : 'There are no customers yet.'}
          </p>
          <button
            onClick={handleManualRefresh}
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
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Customer</span>
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('joinDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Joined</span>
                      {getSortIcon('joinDate')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('orders')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Orders</span>
                      {getSortIcon('orders')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('totalSpent')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Total Spent</span>
                      {getSortIcon('totalSpent')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('lastOrder')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Last Order</span>
                      {getSortIcon('lastOrder')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    <span>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#121212] divide-y divide-gray-200 dark:divide-[#222222]">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-[#181818] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-100 dark:bg-[#222222] flex items-center justify-center">
                          {customer.avatar_url ? (
                            <img className="h-10 w-10 rounded-full" src={customer.avatar_url} alt={customer.name} />
                          ) : (
                            <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {customer.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(customer.joinDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {customer.orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {customer.lastOrder ? formatDate(customer.lastOrder) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <button
                        onClick={() => handleViewDetails(customer)}
                        className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Customer Details Modal */}
      {isDetailsModalOpen && selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={handleCloseModal}
          isOpen={isDetailsModalOpen}
        />
      )}
    </div>
  );
}