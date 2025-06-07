import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { databases, createMissingProductAttributes } from '../lib/appwrite';
import {
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  Settings,
  Loader2,
  RefreshCw,
  X,
  Bell,
  Menu
} from 'lucide-react';
import CustomizationRequestsManager from '../components/admin/CustomizationRequestsManager';
import CustomizationCostManager from '../components/admin/CustomizationCostManager';
import { checkCustomizationTable, runMigrations, ensureCustomizableField } from '../services/database.service';
import { useProductStore } from '../stores/productStore';
import { useToast } from '../contexts/ToastContext';
import { 
  ShoppingBag,
  Truck,
  LayoutDashboard,
  LucideIcon,
  DollarSign,
  Box,
  PlusCircle,
  Download,
  Store,
  MessageCircle
} from 'lucide-react';
import ProductForm from '../components/ProductForm';
import OrderList from '../components/shop/OrderList';
import CustomerList from '../components/shop/CustomerList';
import ShippingSettings from '../components/shop/ShippingSettings';
import { RoleGuard } from '../components/auth/RoleGuard';
import DatabaseSetupPanel from '../components/admin/DatabaseSetupPanel';
import ProductManager from '../components/shop/ProductManager';
import TelegramNotifications from '../components/shop/TelegramNotifications';
import { Product } from '../types/product';  // Import the Product type

// Helper function to fix missing database fields
const fixMissingDatabaseFields = async () => {
  try {
    console.log('Starting database field fixes...');
    
    // 1. Ensure customizable field exists
    await ensureCustomizableField();
    console.log('✅ Customizable field check completed');
    
    // 2. Create missing product attributes
    await createMissingProductAttributes();
    console.log('✅ Product attributes check completed');
    
    // 3. Run any pending migrations
    await runMigrations();
    console.log('✅ Database migrations completed');
    
    console.log('Database field fixes completed successfully!');
    return { success: true, message: 'Database field fixes completed successfully!' };
  } catch (error) {
    console.error('Error fixing database fields:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
};

/**
 * Creates the printing techniques collection in Appwrite if it doesn't exist
 * This function is specifically designed to fix the 404 error when the collection is missing
 */
export const fixPrintingTechniquesCollection = async (): Promise<{
  success: boolean;
  message: string;
  collection?: any;
  attributes?: any[];
}> => {
  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
  const PRINTING_TECHNIQUES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TECHNIQUES_COLLECTION_ID || 'printing_techniques';
  
  try {
    console.log('Creating printing techniques collection...');
    
    // Check if we have an API key for server-side operations
    if (!import.meta.env.VITE_APPWRITE_API_KEY) {
      console.error('No API key configured. Cannot create collection automatically.');
      return {
        success: false,
        message: 'Missing API key for server operations. Please create the collection manually in Appwrite console.'
      };
    }

    // Create collection using direct API call since client SDK requires server privileges
    const response = await fetch(
      `${import.meta.env.VITE_APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': import.meta.env.VITE_APPWRITE_PROJECT_ID,
          'X-Appwrite-Key': import.meta.env.VITE_APPWRITE_API_KEY
        },
        body: JSON.stringify({
          collectionId: PRINTING_TECHNIQUES_COLLECTION_ID,
          name: 'Printing Techniques',
          permissions: ['read("any")', 'create("any")', 'update("any")', 'delete("any")']
        })
      }
    );
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Successfully created printing_techniques collection!', result);
      
      // Now create the required attributes
      const attributesCreated = await createPrintingTechniquesAttributes();
      
      // Clear localStorage flag indicating missing collection
      localStorage.removeItem('printingTechniquesCollectionMissing');
      
      return {
        success: true,
        message: 'Successfully created printing techniques collection and attributes',
        collection: result,
        attributes: attributesCreated
      };
    } else {
      console.error('Failed to create collection:', result);
      return {
        success: false,
        message: `Failed to create collection: ${result.message || JSON.stringify(result)}`
      };
    }
  } catch (error: unknown) {
    console.error('Error creating printing techniques collection:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Error: ${errorMessage}`
    };
  }
};

/**
 * Creates the required attributes for the printing techniques collection
 */
const createPrintingTechniquesAttributes = async (): Promise<any[]> => {
  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
  const PRINTING_TECHNIQUES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TECHNIQUES_COLLECTION_ID || 'printing_techniques';
  
  const results: any[] = [];
  
  try {
    // Create name attribute (string, required)
    const nameResponse = await fetch(
      `${import.meta.env.VITE_APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${PRINTING_TECHNIQUES_COLLECTION_ID}/attributes/string`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': import.meta.env.VITE_APPWRITE_PROJECT_ID,
          'X-Appwrite-Key': import.meta.env.VITE_APPWRITE_API_KEY
        },
        body: JSON.stringify({
          key: 'name',
          size: 255,
          required: true
        })
      }
    );
    
    results.push({
      attribute: 'name',
      success: nameResponse.ok,
      result: await nameResponse.json()
    });
    
    // Create base_cost attribute (number, required)
    const costResponse = await fetch(
      `${import.meta.env.VITE_APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${PRINTING_TECHNIQUES_COLLECTION_ID}/attributes/float`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': import.meta.env.VITE_APPWRITE_PROJECT_ID,
          'X-Appwrite-Key': import.meta.env.VITE_APPWRITE_API_KEY
        },
        body: JSON.stringify({
          key: 'base_cost',
          required: true,
          min: 0
        })
      }
    );
    
    results.push({
      attribute: 'base_cost',
      success: costResponse.ok,
      result: await costResponse.json()
    });
    
    // Create design_area attribute (string, optional)
    const designAreaResponse = await fetch(
      `${import.meta.env.VITE_APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${PRINTING_TECHNIQUES_COLLECTION_ID}/attributes/string`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': import.meta.env.VITE_APPWRITE_PROJECT_ID,
          'X-Appwrite-Key': import.meta.env.VITE_APPWRITE_API_KEY
        },
        body: JSON.stringify({
          key: 'design_area',
          size: 100,
          required: false
        })
      }
    );
    
    results.push({
      attribute: 'design_area',
      success: designAreaResponse.ok,
      result: await designAreaResponse.json()
    });
    
    // Create is_active attribute (boolean, default: true)
    const activeResponse = await fetch(
      `${import.meta.env.VITE_APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${PRINTING_TECHNIQUES_COLLECTION_ID}/attributes/boolean`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': import.meta.env.VITE_APPWRITE_PROJECT_ID,
          'X-Appwrite-Key': import.meta.env.VITE_APPWRITE_API_KEY
        },
        body: JSON.stringify({
          key: 'is_active',
          required: false,
          default: true
        })
      }
    );
    
    results.push({
      attribute: 'is_active',
      success: activeResponse.ok,
      result: await activeResponse.json()
    });
    
    return results;
  } catch (error: unknown) {
    console.error('Error creating attributes:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({
      attribute: 'error',
      success: false,
      error: errorMessage
    });
    return results;
  }
};

// Make the function available globally
if (typeof window !== 'undefined') {
  (window as any).fixMissingDatabaseFields = fixMissingDatabaseFields;
  (window as any).fixPrintingTechniquesCollection = fixPrintingTechniquesCollection;
}

// You can also declare the type if needed
declare global {
  interface Window {
    fixMissingDatabaseFields: typeof fixMissingDatabaseFields;
    fixPrintingTechniquesCollection: typeof fixPrintingTechniquesCollection;
  }
}

// Add an interface for the ProductManager props
interface ProductManagerProps {
  products: any[]; // Using any for now since we don't know the exact structure
  loading: boolean;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onSubmit: () => void;
  editingProductId: string | null;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  setEditingProductId: (id: string | null) => void;
  onView: (id: string) => void;
}

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  email?: string | null;
  username?: string | null;
  delivery_address?: string | null;
};

type AdminRole = 'shop_manager' | 'super_admin';

interface ShopStats {
  totalSales: string;
  orders: string;
  customers: string;
  products: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface NavigationGroup {
  group: string;
  items: NavigationItem[];
}

export default function ShopManager() {
  const [activeTab, setActiveTab] = useState('products');
  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(60); // seconds
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [stats, setStats] = useState<ShopStats>({
    totalSales: '0',
    orders: '0',
    customers: '0',
    products: '0'
  });
  
  // Environment variables for Appwrite
  const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
  const customersCollectionId = 'customers';
  const ordersCollectionId = import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_ID || '';
  
  const { products, fetchProducts, deleteProduct } = useProductStore();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isCustomizationEnabled, setIsCustomizationEnabled] = useState(true);
  const { user, profile } = useAuth();

  useEffect(() => {
    // Initial setup only when component mounts
    setIsLoading(false);
    checkCustomizationFeature();
    checkShippingLocationsTable();
    
    // Check for customizable field in the database schema
    const initializeSchema = async () => {
      try {
        console.log('Checking for customizable field in database schema...');
        await ensureCustomizableField();
        
        // Also check for and create missing product attributes
        console.log('Checking for missing product attributes...');
        await createMissingProductAttributes();
      } catch (error) {
        console.error('Error checking database schema:', error);
        // Continue anyway, the app will handle missing fields gracefully
      }
    };
    
    initializeSchema();
    
    // Cleanup function
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Get role from auth context
    if (profile && profile.role) {
      setUserRole(profile.role);
    }
  }, [profile]);

  useEffect(() => {
    if (!isLoading && userRole) {
      loadData();
      
      // Set up auto-refresh timer if enabled
      if (autoRefresh) {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
        
        refreshTimerRef.current = setInterval(() => {
          loadData(true); // true = silent refresh (no loading indicator)
        }, refreshInterval * 1000);
      } else if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [isLoading, userRole, autoRefresh, refreshInterval]);

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsDataLoading(true);
      
      console.log("Loading real-time data directly from database - no cached data");
      
      // Need to ensure database IDs are proper strings (with fallback to empty string)
      const db = databaseId || '';
      const ordersCollection = ordersCollectionId || '';
      
      // Start all fetch operations concurrently
      const [
        productsData,
        ordersData,
        customersData
      ] = await Promise.all([
        fetchProducts(), // Product store will handle the fetch
        databases.listDocuments(db, ordersCollection),
        databases.listDocuments(db, customersCollectionId) // Use customers collection directly
      ]);
      
      // All documents in customers collection are customers (no need to filter by role)
      const customers = customersData.documents;
      const orders = ordersData.documents || [];

      // Calculate total sales
      const totalSales = orders
        .reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0)
        .toFixed(2);

      setStats({
        totalSales,
        orders: orders.length.toString(),
        customers: customers.length.toString(),
        products: (products?.length || 0).toString()
      });
      
      setLastRefreshed(new Date());
      
      // Show refresh notification for non-silent refreshes
      if (!silent) {
        showToast("Real-time data loaded from database", "success");
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      if (!silent) {
        showToast("Failed to load dashboard data. Please try again.", "error");
      }
    } finally {
      if (!silent) setIsDataLoading(false);
    }
  }, [fetchProducts, products?.length, showToast, databaseId, ordersCollectionId, customersCollectionId]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    
    loadData(false); // Initial load
    const interval = setInterval(() => {
      loadData(true); // Silent refresh for auto-updates
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadData]);

  const handleEdit = (productId: string) => {
    setEditingProductId(productId);
    setShowForm(true);
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);
      showToast("Product deleted successfully", "success");
      loadData(); // Refresh data after deletion
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast("Failed to delete product. Please try again.", "error");
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingProductId(null);
    loadData(); // Refresh data after submission
    showToast("Product has been saved successfully", "success");
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Check if customization table exists and enable feature
  const checkCustomizationFeature = async () => {
    try {
      const tableExists = await checkCustomizationTable();
      
      if (!tableExists) {
        console.log('Customization table does not exist, attempting to run migrations');
        try {
          await runMigrations();
          setIsCustomizationEnabled(true);
        } catch (error) {
          console.error('Failed to run migrations:', error);
          setIsCustomizationEnabled(false);
          showToast("Customization requests feature is not available. Please contact support.", "error");
        }
      } else {
        setIsCustomizationEnabled(true);
      }
    } catch (error) {
      console.error('Error checking customization feature:', error);
      setIsCustomizationEnabled(false);
    }
  };

  // Check if shipping_locations table exists and create it if not
  const checkShippingLocationsTable = async () => {
    try {
      console.log('Checking for shipping_locations collection...');
      
      // Instead of checking if table exists, we'll just create it if it doesn't exist
      // This will be handled in the ShippingSettings component
      console.log('Collection check will be handled by the ShippingSettings component when needed');
    } catch (error) {
      console.error('Error checking shipping_locations schema:', error);
    }
  };

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#121212]">
        <div className="flex flex-col items-center p-8 bg-white dark:bg-dark-surface rounded-lg shadow-md">
          <Box className="w-16 h-16 text-blue-600 dark:text-blue-500 mb-4 animate-pulse" />
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Loading Admin Panel</h2>
          <p className="text-gray-600 dark:text-gray-300">Please wait while we load your dashboard...</p>
        </div>
      </div>
    );
  }

  // Update the navigation items with grouping
  const navigationItems: NavigationGroup[] = [
    {
      group: "Overview",
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      group: "Store Management",
      items: [
        { id: 'products', label: 'Products', icon: Package },
        { id: 'orders', label: 'Orders', icon: ShoppingBag },
        { id: 'customers', label: 'Customers', icon: Users },
      ]
    },
    {
      group: "Services",
      items: [
        ...(isCustomizationEnabled ? [
          { id: 'customizations', label: 'Customization', icon: ShoppingCart },
          { id: 'customization-cost', label: 'Customization Cost', icon: DollarSign }
        ] : []),
        { id: 'shipping', label: 'Shipping', icon: Truck },
      ]
    },
    {
      group: "System",
      items: [
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'telegram', label: 'Notifications', icon: Bell },
      ]
    }
  ];

  return (
    <RoleGuard allowedRoles={['shop_manager', 'super_admin']}>
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 mx-auto container px-4 py-6">
          <header className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">Shop Manager</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage your products, orders, and customers.</p>
              </div>
              
              {/* Add the DatabaseSetupPanel here */}
              <DatabaseSetupPanel />
              
              {/* Real-time mode indicator */}
              <div className="my-4 md:my-0 flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => {
                    setEditingProductId(null);
                    setShowForm(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center justify-center"
                >
                  <PlusCircle className="w-4 h-4 mr-2" /> 
                  Add Product
                </button>
                <button 
                  onClick={() => {
                    // Implement export to CSV functionality
                    console.log("Export to CSV functionality not implemented yet.");
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center"
                >
                  <Download className="w-4 h-4 mr-2" /> 
                  Export CSV
                </button>
              </div>
            </div>
          </header>

          {/* Stats Row */}
          <div className="mb-4 bg-white dark:bg-dark-surface rounded-lg shadow-sm p-3 border border-green-200 dark:border-green-900 flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse mr-2"></div>
              <span className="text-sm font-medium text-green-800 dark:text-green-400">Real-time Data Mode</span>
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">All data is fetched directly from the database without caching</span>
            </div>
            <button 
              onClick={() => loadData()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md flex items-center"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isDataLoading ? 'animate-spin' : ''}`} />
              Refresh All Data
            </button>
          </div>
          
          <div className="lg:flex gap-6">
            {/* Mobile Menu Button */}
            <div className="block lg:hidden mb-4">
              <button 
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-dark-surface hover:shadow-sm focus:outline-none transition-all duration-200"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Sidebar - Desktop */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white dark:bg-dark-surface rounded-xl shadow-md sticky top-20 h-[calc(100vh-6rem)] flex flex-col overflow-hidden border border-gray-100 dark:border-[#111827]">
                <div className="p-6 border-b border-gray-100 dark:border-[#111827] bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                  <h2 className="text-xl font-semibold">Shop Manager</h2>
                  <p className="text-sm text-gray-300 mt-1">
                    {userRole === 'super_admin' ? 'Super Admin' : 'Shop Manager'} Dashboard
                  </p>
                  <div className="mt-3 flex items-center">
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <nav className="p-4">
                    {navigationItems.map((group, groupIndex) => (
                      <div key={group.group} className={`mb-6 ${groupIndex !== 0 ? 'pt-6 border-t border-gray-100 dark:border-[#111827]' : ''}`}>
                        <h3 className="px-4 text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                          {group.group}
                        </h3>
                        <div className="space-y-1">
                          {group.items.map((item: NavigationItem) => (
                            <button
                              key={item.id}
                              onClick={() => setActiveTab(item.id)}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                                activeTab === item.id
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#121212] hover:text-gray-900 dark:hover:text-white'
                              }`}
                            >
                              <item.icon className={`w-5 h-5 ${
                                activeTab === item.id
                                  ? 'text-white'
                                  : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
                              }`} />
                              <span className="font-medium">{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            {/* Sidebar - Mobile */}
            {mobileMenuOpen && (
              <div className="lg:hidden fixed inset-0 z-40">
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm" onClick={toggleMobileMenu} />
                <div className="relative flex flex-col w-full max-w-xs bg-white dark:bg-dark-surface h-full shadow-xl transition-transform duration-300 ease-in-out">
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                      <h2 className="text-xl font-semibold">Shop Manager</h2>
                      <button
                        onClick={toggleMobileMenu}
                        className="rounded-md text-gray-200 hover:text-white focus:outline-none"
                        aria-label="Close menu"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <nav className="p-4">
                        {navigationItems.map((group, groupIndex) => (
                          <div key={group.group} className={`mb-6 ${groupIndex !== 0 ? 'pt-6 border-t border-gray-100 dark:border-[#111827]' : ''}`}>
                            <h3 className="px-4 text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                              {group.group}
                            </h3>
                            <div className="space-y-1">
                              {group.items.map((item: NavigationItem) => (
                                <button
                                  key={item.id}
                                  onClick={() => {
                                    setActiveTab(item.id);
                                    setMobileMenuOpen(false);
                                  }}
                                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                                    activeTab === item.id
                                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#121212] hover:text-gray-900 dark:hover:text-white'
                                  }`}
                                >
                                  <item.icon className={`w-5 h-5 ${
                                    activeTab === item.id
                                      ? 'text-white'
                                      : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
                                  }`} />
                                  <span className="font-medium">{item.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1">
              {isDataLoading && (
                <div className="fixed inset-0 flex justify-center items-center bg-white dark:bg-[#121212] bg-opacity-80 dark:bg-opacity-80 z-50">
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="mt-2 text-sm text-gray-600 dark:text-gray-300">Loading data...</span>
                  </div>
                </div>
              )}
              
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Top section - Stats overview */}
                  <div className="bg-white dark:bg-[#121212] rounded-xl shadow-md border border-gray-100 dark:border-[#181818]">
                    <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-[#181818]">
                      <div className="flex items-center gap-3">
                        <LayoutDashboard className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sales Overview</h2>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#181818] rounded-lg p-1">
                        <button className="px-3 py-1 text-sm rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252525]">Week</button>
                        <button className="px-3 py-1 text-sm rounded-md bg-black text-white">Month</button>
                        <button className="px-3 py-1 text-sm rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252525]">Year</button>
                        </div>
                        </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
                      {[
                        { label: 'Total Sales', value: `₦${stats.totalSales}`, icon: TrendingUp, color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
                        { label: 'Orders', value: stats.orders, icon: ShoppingBag, color: 'bg-gradient-to-r from-purple-500 to-purple-600' },
                        { label: 'Customers', value: stats.customers, icon: Users, color: 'bg-gradient-to-r from-amber-500 to-amber-600' },
                        { label: 'Products', value: stats.products, icon: Package, color: 'bg-gradient-to-r from-emerald-500 to-emerald-600' }
                      ].map((stat, index) => (
                        <div key={index} className="bg-white dark:bg-[#121212] rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-[#181818] transform transition-transform hover:scale-105 hover:shadow-md">
                          <div className={`h-2 w-full ${stat.color}`}></div>
                          <div className="p-5">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                                <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{stat.value}</p>
                              </div>
                              <div className={`p-3 rounded-full ${stat.color} text-white`}>
                                <stat.icon className="w-5 h-5" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Middle section - Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sales Trend */}
                    <div className="bg-white dark:bg-[#121212] rounded-xl shadow-md p-6 border border-gray-100 dark:border-[#181818]">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sales Trend</h3>
                      <div className="h-[250px] w-full">
                        {/* This will be replaced by the actual chart from DashboardCharts component */}
                        <div className="bg-gray-50 dark:bg-[#181818] h-full rounded-lg flex items-center justify-center p-4">
                          <img 
                            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMCA5MEwzMCA2MEw2MCAxMTBMOTAgODBMMTIwIDEyMEwxNTAgOTBMMTgwIDEwMEwyMTAgNzBMMjQwIDkwTDI3MCA4MEwzMDAgOTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzNiODJmNiIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPHBhdGggZD0iTTAgOTBMMzAgNjBMNjAgMTEwTDkwIDgwTDEyMCAxMjBMMTUwIDkwTDE4MCAxMDBMMjEwIDcwTDI0MCA5MEwyNzAgODBMMzAwIDkwIiBmaWxsPSJyZ2JhKDU5LDEzMCwyNDYsMC4xKSIgc3Ryb2tlPSJub25lIi8+Cjwvc3ZnPg==" 
                            alt="Sales trend visualization" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>Week 1</span>
                          <span>Week 2</span>
                          <span>Week 3</span>
                          <span>Week 4</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Status */}
                    <div className="bg-white dark:bg-[#121212] rounded-xl shadow-md p-6 border border-gray-100 dark:border-[#181818]">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order by Status</h3>
                      <div className="h-[250px] flex items-center justify-center">
                        {/* This will be replaced by the actual chart from DashboardCharts component */}
                        <div className="relative w-48 h-48">
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#f0f0f0" strokeWidth="15" />
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="15" strokeDasharray="40 160" strokeDashoffset="25" />
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="15" strokeDasharray="50 160" strokeDashoffset="65" />
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="15" strokeDasharray="30 160" strokeDashoffset="115" />
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="15" strokeDasharray="65 160" strokeDashoffset="145" />
                          </svg>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                          <span className="text-sm text-gray-600 dark:text-gray-300">Pending 15%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                          <span className="text-sm text-gray-600 dark:text-gray-300">Processing 26%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                          <span className="text-sm text-gray-600 dark:text-gray-300">Shipped 19%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-500"></span>
                          <span className="text-sm text-gray-600 dark:text-gray-300">Delivered 33%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                          <span className="text-sm text-gray-600 dark:text-gray-300">Cancelled 7%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom section - Product Performance and Recent Activity */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Products */}
                    <div className="bg-white dark:bg-[#121212] rounded-xl shadow-md p-6 border border-gray-100 dark:border-[#181818]">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Products</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Classic White Tee</span>
                          <div className="w-1/2 bg-gray-200 dark:bg-[#181818] rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Premium Black Tee</span>
                          <div className="w-1/2 bg-gray-200 dark:bg-[#181818] rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Essential Gray Tee</span>
                          <div className="w-1/2 bg-gray-200 dark:bg-[#181818] rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Organic Cotton Tee</span>
                          <div className="w-1/2 bg-gray-200 dark:bg-[#181818] rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Vintage Logo Tee</span>
                          <div className="w-1/2 bg-gray-200 dark:bg-[#181818] rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '40%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white dark:bg-[#121212] rounded-xl shadow-md p-6 border border-gray-100 dark:border-[#181818]">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">New order #1234 received</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Order #1232 shipped</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">4 hours ago</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">New customer registration</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">5 hours ago</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-amber-500 mt-2"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Product "Classic White Tee" restocked</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">1 day ago</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Order #1231 delivered</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">1 day ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Products Tab */}
              {activeTab === 'products' && (
                <div className="space-y-6">
                  {showForm ? (
                    <div className="bg-white dark:bg-dark-surface rounded-xl shadow-md p-6 border border-gray-100 dark:border-[#111827]">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {editingProductId ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <button 
                          onClick={() => {
                            setShowForm(false);
                            setEditingProductId(null);
                          }}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      
                      <ProductForm 
                        mode={editingProductId ? 'edit' : 'create'}
                        initialProduct={editingProductId ? products.find(p => p.id === editingProductId) : undefined}
                        onSuccess={handleFormSubmit}
                      />
                    </div>
                  ) : (
                    <ProductManager
                      products={products.map(p => {
                        // Make a properly typed product object with all required fields
                        const product: Product = {
                          id: p.id,
                          name: p.name,
                          description: p.description,
                          price: p.price,
                          category: p.category || 'uncategorized',
                          image_url: p.image_url || '',
                          // Handle stock quantity from either stock_quantity or stock field
                          // Also ensure it's always a number ≥ 0
                          stock_quantity: (() => {
                            // First check if stock_quantity exists and is a number
                            if (typeof p.stock_quantity === 'number') {
                              return Math.max(0, p.stock_quantity);
                            }
                            // Then check if stock_quantity exists but needs conversion
                            if (p.stock_quantity !== undefined && p.stock_quantity !== null) {
                              const converted = Number(p.stock_quantity);
                              return isNaN(converted) ? 0 : Math.max(0, converted);
                            }
                            // Then check if there's a stock field (old field name)
                            if (typeof p.stock === 'number') {
                              return Math.max(0, p.stock);
                            }
                            // Try to convert stock field if it exists
                            if (p.stock !== undefined && p.stock !== null) {
                              const converted = Number(p.stock);
                              return isNaN(converted) ? 0 : Math.max(0, converted);
                            }
                            // Default to 0 if nothing valid is found
                            return 0;
                          })(),
                          sku: p.sku || '',
                          created_at: p.created_at || new Date().toISOString(),
                          updated_at: p.updated_at || undefined,
                          colors: p.colors || [],
                          customizable: p.customizable,
                          sizes: p.sizes || [],
                          gallery_images: p.gallery_images || []
                        };
                        return product;
                      })}
                      loading={isDataLoading}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      onSubmit={handleFormSubmit}
                      editingProductId={editingProductId}
                      showForm={showForm}
                      setShowForm={setShowForm}
                      setEditingProductId={setEditingProductId}
                      onView={(id) => navigate(`/product/${id}`)}
                    />
                  )}
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  {/* Order Component goes here */}
                  <OrderList />
                </div>
              )}

              {/* Customers Tab */}
              {activeTab === 'customers' && (
                <div className="space-y-6">
                  {/* Customer Component goes here */}
                  <CustomerList />
                </div>
              )}

              {/* Customization Tab */}
              {activeTab === 'customizations' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-dark-surface rounded-xl shadow-md border border-gray-100 dark:border-[#111827]">
                    <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-[#111827]">
                      <div className="flex items-center gap-3">
                        <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Customization Requests</h2>
                      </div>
                    </div>
                    <div className="p-6">
                      <CustomizationRequestsManager />
                    </div>
                  </div>
                </div>
              )}

              {/* Customization Cost Tab */}
              {activeTab === 'customization-cost' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-dark-surface rounded-xl shadow-md border border-gray-100 dark:border-[#111827]">
                    <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-[#111827]">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Customization Pricing</h2>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Set pricing for different customization options
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <CustomizationCostManager />
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Tab */}
              {activeTab === 'shipping' && (
                <div className="space-y-6">
                  {/* Shipping Management Component goes here */}
                  <div className="bg-white dark:bg-dark-surface rounded-xl shadow-md border border-gray-100 dark:border-[#111827] overflow-hidden">
                    <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-[#111827]">
                      <div className="flex items-center gap-3">
                        <Truck className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Shipping Settings</h2>
                      </div>
                    </div>
                    <div className="p-6">
                      <ShippingSettings />
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">

                  {/* Store Information */}
                  <div className="bg-white dark:bg-dark-surface rounded-xl shadow-md p-6 border border-gray-100 dark:border-[#111827]">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Store className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                      Store Information
                    </h3>
                    
                    <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-100 dark:border-[#111827] p-6">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store Name</label>
                          <input 
                            type="text" 
                            placeholder="Kri8tive Blanks" 
                            className="w-full px-3 py-2 bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#111827] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store Email</label>
                          <input 
                            type="email" 
                            placeholder="contact@kri8tiveblanks.com" 
                            className="w-full px-3 py-2 bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#111827] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store Phone</label>
                          <input 
                            type="tel" 
                            placeholder="+234 123 456 7890" 
                            className="w-full px-3 py-2 bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#111827] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store Address</label>
                        <textarea 
                          rows={3}
                          placeholder="123 Main Street, Lagos, Nigeria" 
                          className="w-full px-3 py-2 bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#111827] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        ></textarea>
                      </div>
                      
                      <div className="mt-6 flex justify-end">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Telegram Notifications Tab */}
              {activeTab === 'telegram' && (
                <div className="space-y-6">
                  {/* Telegram Bot Settings */}
                  <div className="bg-white dark:bg-dark-surface rounded-xl shadow-md p-6 border border-gray-100 dark:border-[#111827]">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                      Telegram Notification Settings
                    </h3>
                    
                    <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-100 dark:border-[#111827] p-6">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                          <TelegramNotifications />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}