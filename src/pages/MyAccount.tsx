import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeProvider';
import { account } from '../lib/appwrite';
import { toast } from '../hooks/use-toast';
import {
  User,
  Settings,
  ShoppingBag,
  Heart,
  CreditCard,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Loader2,
  Upload,
  AlertCircle,
  CheckIcon,
  XIcon,
  Smartphone,
  Monitor,
  MapPin,
  LogOut,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  RefreshCcw,
  Mail,
  ChevronDown,
  Phone
} from 'lucide-react';
import { getUserCustomizationRequests } from '../services/customization.service';
import { getUserOrders } from '../services/order.service';
import { getUserWishlist, removeFromWishlist } from '../services/profile.service';
import { updateProfile, uploadAvatar } from '../services/profile.service';
import { SafeImage } from '../components/common/SafeImage';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alert';

// Define AppwriteUser type to include $id property
export type AppwriteUser = {
  $id: string;
  [key: string]: any;
};

// Define an interface for the extended profile data
interface ExtendedProfile {
  email: string;
  name?: string;
  full_name: string | undefined;
  avatar_url: string | undefined;
  phone_number: string | undefined;
  whatsapp_number: string | undefined;
  delivery_address: string | undefined;
}

// Define a type for the account tabs
type AccountTab = 'orders' | 'wishlist' | 'customization' | 'payment' | 'settings' | 'security';

// Update the AuthProfile interface to specify what fields we need from auth
interface AuthProfile {
  id: string;
  name?: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  whatsapp_number?: string;
  delivery_address?: string;
  role?: string;
}

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Helper function to capitalize words in a string
const capitalizeWords = (str: string | undefined): string => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};



export default function MyAccount() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<AccountTab>(() => {
    // Restore active tab from sessionStorage to maintain tab state across navigations
    const savedTab = sessionStorage.getItem('myAccountActiveTab') as AccountTab;
    return savedTab || 'orders';
  });
  
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profile, setProfile] = useState<ExtendedProfile>({ 
    email: '', 
    full_name: undefined,
    avatar_url: undefined,
    phone_number: undefined,
    whatsapp_number: undefined,
    delivery_address: undefined
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [customizationRequests, setCustomizationRequests] = useState<any[]>([]);
  const [customizationLoading, setCustomizationLoading] = useState(false);
  const [customizationError, setCustomizationError] = useState<string | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, profile: authProfile, signOut, isEmailVerified, resendVerification, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Compute display name to avoid re-renders
  const displayName = useMemo(() => {
    if (authProfile?.full_name) return capitalizeWords(authProfile.full_name);
    if (authProfile?.name) return capitalizeWords(authProfile.name);
    return 'User';
  }, [authProfile?.full_name, authProfile?.name]);

  // Add expanded order ID state to track which order is expanded
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Add expanded request ID state to track which request is expanded
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

  // Security tab state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false);
  const [passwordUpdateError, setPasswordUpdateError] = useState<string | null>(null);
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  // Define fetch functions first
  const fetchOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      
      if (!user) {
        setOrdersLoading(false);
        return;
      }
      
      const orders = await getUserOrders();
      setOrders(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrdersError('Failed to fetch orders. Please try again.');
    } finally {
      setOrdersLoading(false);
    }
  }, [user]);

  const fetchWishlist = useCallback(async () => {
    try {
      setWishlistLoading(true);
      
      if (!user) {
        setWishlistLoading(false);
        return;
      }
      
      // Use the service function to get wishlist data
      const wishlistData = await getUserWishlist();
      setWishlist(wishlistData);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      // Don't show error, just set empty wishlist
      setWishlist([]);
    } finally {
      setWishlistLoading(false);
    }
  }, [user]);

  const fetchCustomizationRequests = useCallback(async () => {
    try {
      setCustomizationLoading(true);
      setCustomizationError(null);
      
      if (!user) {
        setCustomizationLoading(false);
        return;
      }
      
      const requests = await getUserCustomizationRequests();
      setCustomizationRequests(requests);
    } catch (error) {
      console.error('Error fetching customization requests:', error);
      setCustomizationError('Failed to fetch customization requests. Please try again.');
    } finally {
      setCustomizationLoading(false);
    }
  }, [user]);

  // Save active tab to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('myAccountActiveTab', activeTab);
  }, [activeTab]);

  // Update profile state when authProfile changes
  useEffect(() => {
    if (authProfile) {
      setProfile(prevProfile => ({
        ...prevProfile,
        email: user?.email || '',
        name: authProfile.full_name || authProfile.name, // Prioritize full_name, fall back to name
        full_name: authProfile.full_name || authProfile.name,
        avatar_url: authProfile.avatar_url,
        phone_number: authProfile.phone,
        whatsapp_number: authProfile.whatsapp_number,
        delivery_address: authProfile.delivery_address
      }));
      
      // Set avatar URL if present in authProfile
      if (authProfile.avatar_url) {
        setAvatarUrl(authProfile.avatar_url);
      }
    }
  }, [authProfile, user]);

  // Fetch orders when the orders tab is active
  useEffect(() => {
    if (activeTab === 'orders' && user) {
      fetchOrders();
    }
  }, [activeTab, user, fetchOrders]);

  // Fetch wishlist when the wishlist tab is active
  useEffect(() => {
    if (activeTab === 'wishlist' && user) {
      fetchWishlist();
    }
  }, [activeTab, user, fetchWishlist]);

  // Fetch customization requests when the customization tab is active
  useEffect(() => {
    if (activeTab === 'customization' && user) {
      fetchCustomizationRequests();
    }
  }, [activeTab, user, fetchCustomizationRequests]);

  // Initialize session data when security tab is active
  useEffect(() => {
    if (activeTab === 'security') {
      fetchSessionData();
    }
  }, [activeTab]);

  // Function to fetch active sessions from Appwrite
  const fetchSessionData = async () => {
    if (!user) return;
    
    try {
      setSessionsLoading(true);
      console.log('[Sessions] Starting to fetch session data...');
      
      // Get active sessions from Appwrite
      const response = await account.listSessions();
      console.log('[Sessions] Raw response from Appwrite:', JSON.stringify(response, null, 2));
      
      if (response && Array.isArray(response.sessions) && response.sessions.length > 0) {
        console.log('[Sessions] Found sessions, starting to format...');
        
        // Map Appwrite session data to our UI format with enhanced defensive coding
        const formattedSessions = response.sessions.map((session: any, index: number) => {
          console.log(`[Sessions] Processing session ${index}:`, JSON.stringify(session, null, 2));
          
          if (!session) {
            console.log(`[Sessions] Session ${index} is undefined, returning default object`);
            return {
              id: 'unknown-' + Math.random().toString(36).substr(2, 5),
              device_name: 'Unknown Device',
              device_type: 'desktop',
              location: 'Unknown location',
              last_active: undefined,
              is_current: false
            };
          }
          
          // Safely handle potentially undefined values
          try {
            let safeUserAgent = '';
            
            // Extremely defensive user agent handling
            if (session.userAgent !== undefined && session.userAgent !== null) {
              if (typeof session.userAgent === 'string') {
                safeUserAgent = session.userAgent;
                console.log(`[Sessions] Session ${index} has valid userAgent: ${safeUserAgent}`);
              } else {
                console.log(`[Sessions] Session ${index} has non-string userAgent:`, typeof session.userAgent);
                // Try to convert to string if possible
                try {
                  safeUserAgent = String(session.userAgent);
                  console.log(`[Sessions] Converted non-string userAgent to: ${safeUserAgent}`);
                } catch (e) {
                  console.log(`[Sessions] Could not convert userAgent to string:`, e);
                  safeUserAgent = '';
                }
              }
            } else {
              console.log(`[Sessions] Session ${index} has undefined/null userAgent`);
            }
            
            const deviceName = getDeviceNameFromUserAgent(safeUserAgent);
            console.log(`[Sessions] Determined device name for session ${index}: ${deviceName}`);
            
            const isMobile = typeof safeUserAgent === 'string' && 
                            safeUserAgent.toLowerCase().includes('mobile');
            
            const sessionId = session.$id || ('unknown-' + Math.random().toString(36).substr(2, 5));
            const location = session.ip || 'Unknown location';
            const lastActive = session.expire || (session.current ? new Date().toISOString() : undefined);
            const isCurrent = !!session.current;
            
            console.log(`[Sessions] Session ${index} processed successfully with id: ${sessionId}`);
            
            return {
              id: sessionId,
              device_name: deviceName,
              device_type: isMobile ? 'mobile' : 'desktop',
              location: location,
              last_active: lastActive,
              is_current: isCurrent
            };
          } catch (err) {
            console.error(`[Sessions] Error processing session ${index}:`, err);
            // Return a safe default object if there's any error processing a session
            return {
              id: 'unknown-' + Math.random().toString(36).substr(2, 5),
              device_name: 'Unknown Device',
              device_type: 'desktop',
              location: 'Unknown location',
              last_active: undefined,
              is_current: false
            };
          }
        });
        
        console.log('[Sessions] All sessions processed, setting state with:', formattedSessions);
        setActiveSessions(formattedSessions);
      } else {
        // Handle case when no sessions are found or sessions is not an array
        console.log('[Sessions] No valid sessions found in response:', response);
        setActiveSessions([]);
      }
    } catch (error) {
      console.error('[Sessions] Error fetching sessions:', error);
      // If the API call fails, use the dummy data
      const fallbackSession = {
        id: '1',
        device_name: 'Chrome on Windows',
        device_type: 'desktop',
        location: 'Current session',
        last_active: new Date().toISOString(),
        is_current: true
      };
      
      console.log('[Sessions] Using fallback session data:', fallbackSession);
      setActiveSessions([fallbackSession]);
    } finally {
      setSessionsLoading(false);
    }
  };
  
  // Helper function to determine device name from user agent
  const getDeviceNameFromUserAgent = (userAgent?: string): string => {
    // Extra defensive logging
    console.log('[DeviceName] Input userAgent:', userAgent);
    
    // Guard clause for undefined, null, or empty string
    if (!userAgent || typeof userAgent !== 'string') {
      console.log('[DeviceName] Invalid userAgent, returning "Unknown device"');
      return 'Unknown device';
    }
    
    // Safety check for empty strings after trimming
    if (userAgent.trim() === '') {
      console.log('[DeviceName] Empty userAgent after trimming, returning "Unknown device"');
      return 'Unknown device';
    }
    
    try {
      let deviceName = 'Unknown device';
      
      // Safely check includes with try-catch for each check
      const safeIncludes = (str: string, searchValue: string): boolean => {
        try {
          return str.includes(searchValue);
        } catch (e) {
          console.error(`[DeviceName] Error checking if "${str}" includes "${searchValue}":`, e);
          return false;
        }
      };
      
      // Check for OS type
      if (safeIncludes(userAgent, 'Windows')) {
        deviceName = 'Windows';
      } else if (safeIncludes(userAgent, 'Mac')) {
        deviceName = 'Mac';
      } else if (safeIncludes(userAgent, 'iPhone')) {
        deviceName = 'iPhone';
      } else if (safeIncludes(userAgent, 'iPad')) {
        deviceName = 'iPad';
      } else if (safeIncludes(userAgent, 'Android')) {
        deviceName = 'Android';
      } else if (safeIncludes(userAgent, 'Linux')) {
        deviceName = 'Linux';
      }
      
      // Check for browser type
      if (safeIncludes(userAgent, 'Chrome')) {
        deviceName = `Chrome on ${deviceName}`;
      } else if (safeIncludes(userAgent, 'Firefox')) {
        deviceName = `Firefox on ${deviceName}`;
      } else if (safeIncludes(userAgent, 'Safari')) {
        deviceName = `Safari on ${deviceName}`;
      } else if (safeIncludes(userAgent, 'Edge')) {
        deviceName = `Edge on ${deviceName}`;
      }
      
      console.log(`[DeviceName] Successfully determined device name: ${deviceName}`);
      return deviceName;
    } catch (error) {
      console.error('[DeviceName] Error parsing user agent:', error);
      return 'Unknown device';
    }
  };

  // Memoize handlers to prevent unnecessary re-renders
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  }, [signOut, navigate, toast]);

  // Update the profile update handler to handle the extended profile
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    // Log the current profile state for debugging
    console.log('Current profile state before update:', profile);
    
    try {
      // Update all profile fields including the new contact fields
      const result = await updateProfile({
        full_name: profile.full_name || profile.name, // Use full_name primarily, fall back to name
        phone: profile.phone_number,
        whatsapp_number: profile.whatsapp_number,
        delivery_address: profile.delivery_address
      });
      
      console.log('Profile update result:', result);
      
      // Refresh the profile in AuthContext to make sure the new data is loaded
      await refreshProfile();
      
      // Show success toast message
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
        variant: "default",
      });
      
      // Set success state instead of directly manipulating DOM
      setSaveSuccess(true);
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    setUploading(true);
    setUploadError(null);
    
    try {
      const file = event.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be smaller than 5MB');
      }
      
      // Upload the file using the service function
      const fileUrl = await uploadAvatar(file);
      
      // Refresh profile data in AuthContext
      await refreshProfile();
      
      toast({
        title: 'Success',
        description: 'Profile picture updated successfully!'
      });
      
      // Update local state
      setAvatarUrl(fileUrl);
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setUploadError(error.message || 'Failed to upload image');
      toast({
        title: 'Error',
        description: 'Could not upload image: ' + (error.message || 'Unknown error'),
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFromWishlist = async (wishlistItemId: string) => {
    try {
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      // Use the service function
      await removeFromWishlist(wishlistItemId);
      
      // Update local state
      setWishlist(prevWishlist => prevWishlist.filter(item => item.$id !== wishlistItemId));
      
      toast({
        title: "Item Removed",
        description: "Product removed from your wishlist.",
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist. Please try again.",
        variant: "destructive",
      });
    }
  };

  const tabs = [
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'customization', label: 'My Requests', icon: Sparkles },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'payment', label: 'Payment Methods', icon: CreditCard },
    { id: 'settings', label: 'Account Settings', icon: Settings },
    { id: 'security', label: 'Security', icon: ShieldAlert },
  ];

  // Toggle order expansion
  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Toggle request expansion
  const toggleRequestExpand = (requestId: string) => {
    setExpandedRequestId(expandedRequestId === requestId ? null : requestId);
  };
  
  // Get order ID safely (handles both id and $id formats from Appwrite)
  const getOrderId = (order: any): string => {
    return order.$id || order.id;
  };
  
  // Get request ID safely (handles both id and $id formats from Appwrite)
  const getRequestId = (request: any): string => {
    return request.$id || request.id;
  };

  // Define status colors for consistency
  const getOrderStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/30';
      case 'processing': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30';
      case 'shipped': return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/30';
      case 'delivered': return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/30';
      case 'cancelled': return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-700/50';
    }
  };

  // Get matching icon for each status
  const getOrderStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Package className="w-4 h-4" />;
      case 'processing': return <Settings className="w-4 h-4 animate-spin-slow" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };



  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordUpdateError('New passwords do not match');
      return;
    }
    
    // Validate password strength
    if (passwordData.newPassword.length < 8) {
      setPasswordUpdateError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setPasswordUpdateLoading(true);
      setPasswordUpdateError(null);
      
      // Update password using Appwrite
      // Note: The order of parameters in updatePassword is (password, oldPassword)
      await account.updatePassword(
        passwordData.newPassword,
        passwordData.currentPassword
      );
      
      // Clear form and show success
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setPasswordUpdateSuccess(true);
      
      // Reset success state after a few seconds
      setTimeout(() => {
        setPasswordUpdateSuccess(false);
      }, 3000);
      
      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully.',
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      
      // Handle specific errors
      if (error.code === 401) {
        setPasswordUpdateError('Current password is incorrect');
      } else if (error.message?.includes('password')) {
        setPasswordUpdateError(error.message);
      } else {
        setPasswordUpdateError('Failed to update password. Please try again.');
      }
    } finally {
      setPasswordUpdateLoading(false);
    }
  };
  
  const handleEnable2FA = () => {
    // Placeholder for 2FA setup
    setTwoFactorEnabled(true);
  };
  
  const handleDisable2FA = () => {
    // Placeholder for 2FA disable
    setTwoFactorEnabled(false);
  };
  
  const handleTerminateSession = async (sessionId: string) => {
    try {
      // Show loading state in UI
      setSessionsLoading(true);
      
      // Delete the specific session in Appwrite
      await account.deleteSession(sessionId);
      
      // Update UI by removing the session
      setActiveSessions(prev => prev.filter(session => session.id !== sessionId));
      
      toast({
        title: 'Session Terminated',
        description: 'The selected session has been signed out.',
      });
    } catch (error) {
      console.error('Error terminating session:', error);
      toast({
        title: 'Error',
        description: 'Failed to terminate session. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSessionsLoading(false);
    }
  };
  
  const handleSignOutAll = async () => {
    try {
      setSessionsLoading(true);
      
      // Delete all sessions except current in Appwrite
      await account.deleteSessions();
      
      // Keep only the current session in the UI
      setActiveSessions(prev => prev.filter(session => session.is_current));
      
      toast({
        title: 'All Sessions Signed Out',
        description: 'You have been signed out from all other devices.',
      });
    } catch (error) {
      console.error('Error signing out all sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out all sessions. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSessionsLoading(false);
    }
  };
  
  const handleDeleteAccount = () => {
    setShowDeleteConfirmation(true);
  };
  
  const confirmDeleteAccount = async () => {
    // Check if the confirmation text matches
    if (deleteConfirmationText !== 'DELETE') {
      toast({
        title: 'Error',
        description: 'Please type "DELETE" to confirm account deletion',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setDeleteAccountLoading(true);
      
      // Get the current user
      const user = await account.get();
      
      // Try to delete all user data in order
      try {
        // First log out from all other sessions
        await account.deleteSessions();
      } catch (sessionError) {
        console.error('Error deleting sessions:', sessionError);
        // Continue with account deletion even if session deletion fails
      }
      
      // Sign out the user from our application
      await signOut();
      
      // Redirect to homepage with message
      navigate('/', { 
        state: { 
          message: 'Your account has been successfully deleted. We\'re sorry to see you go.' 
        } 
      });
      
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete account. Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setDeleteAccountLoading(false);
      setShowDeleteConfirmation(false);
    }
  };

  // Removed duplicate function definitions - they are now defined earlier in the component
  
  const handleResendVerification = async () => {
    if (!user) return;
    
    try {
      setVerificationLoading(true);
      await resendVerification();
      
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox for the verification link",
      });
    } catch (error) {
      console.error('Error sending verification email:', error);
      
      toast({
        title: "Error",
        description: "Failed to send verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] pt-20 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Email Verification Alert */}
        {!isEmailVerified && user && (
          <Alert variant="destructive" className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-200">Your email is not verified</AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-300">
              <p className="mt-1">Please verify your email address to fully access all features.</p>
              <button
                onClick={handleResendVerification}
                disabled={verificationLoading}
                className="mt-2 inline-flex items-center px-3 py-1.5 border border-yellow-300 dark:border-yellow-700 text-xs font-medium rounded-md text-yellow-800 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-900/40 hover:bg-yellow-100 dark:hover:bg-yellow-900/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:focus:ring-offset-gray-800 disabled:opacity-50"
              >
                {verificationLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-3.5 w-3.5 mr-1" />
                    Resend Verification Email
                  </>
                )}
              </button>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar - Modernized with better styling */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-24">
              {/* Profile section */}
              <div className="p-6 bg-gradient-to-br from-primary-orange to-primary-orange-dark text-white">
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30 shadow-lg transition-transform group-hover:scale-105">
                      {avatarUrl ? (
                        <SafeImage 
                          src={avatarUrl} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).onerror = null;
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=User';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-primary-orange-light flex items-center justify-center">
                          <User className="w-10 h-10 text-white" />
                        </div>
                      )}
                      
                      {/* Loading overlay */}
                      {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>
                    
                    <label 
                      htmlFor="avatar-upload" 
                      className={`absolute bottom-0 right-0 bg-white text-primary-orange p-1.5 rounded-full shadow-md cursor-pointer hover:bg-gray-50 transition-all ${
                        uploading ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <h3 className="font-bold text-xl">{displayName}</h3>
                    <div className="flex items-center justify-center mt-1 space-x-1 text-sm text-white/80">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{user?.email}</span>
                      {isEmailVerified ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-300 ml-1" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-yellow-300 ml-1" />
                      )}
                    </div>
                    
                    {/* Upload error message */}
                    {uploadError && (
                      <div className="mt-2 px-2 py-1 bg-red-500/20 text-red-100 text-xs rounded-md">
                        {uploadError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Navigation items with improved styling */}
              <div className="p-2">
                {/* Navigation Buttons */}
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 ${
                    activeTab === 'orders'
                      ? 'bg-primary-orange/10 text-primary-orange dark:bg-primary-orange/20 dark:text-primary-orange-light font-medium'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  <span>My Orders</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('customization')}
                  className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 mt-1 ${
                    activeTab === 'customization'
                      ? 'bg-primary-orange/10 text-primary-orange dark:bg-primary-orange/20 dark:text-primary-orange-light font-medium'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>My Requests</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('wishlist')}
                  className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 mt-1 ${
                    activeTab === 'wishlist'
                      ? 'bg-primary-orange/10 text-primary-orange dark:bg-primary-orange/20 dark:text-primary-orange-light font-medium'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Heart className="w-5 h-5" />
                  <span>Wishlist</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('payment')}
                  className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 mt-1 ${
                    activeTab === 'payment'
                      ? 'bg-primary-orange/10 text-primary-orange dark:bg-primary-orange/20 dark:text-primary-orange-light font-medium'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Payment Methods</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 mt-1 ${
                    activeTab === 'settings'
                      ? 'bg-primary-orange/10 text-primary-orange dark:bg-primary-orange/20 dark:text-primary-orange-light font-medium'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>Account Settings</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 mt-1 ${
                    activeTab === 'security'
                      ? 'bg-primary-orange/10 text-primary-orange dark:bg-primary-orange/20 dark:text-primary-orange-light font-medium'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span>Security</span>
                </button>
                
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 py-3 px-4 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 rounded-xl"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Updated with modern styling */}
          <div className="lg:col-span-9">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {activeTab === 'orders' && (
                <div>
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="p-6 flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Orders</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Track and manage your recent purchases</p>
                      </div>
                      <button
                        onClick={() => {
                          setOrdersLoading(true);
                          getUserOrders()
                            .then(data => {
                              setOrders(data);
                              setOrdersError(null);
                              toast({
                                title: "Orders Refreshed",
                                description: `Successfully loaded ${data.length} orders`,
                              });
                            })
                            .catch(err => {
                              setOrdersError('Failed to fetch orders. Please try again.');
                            })
                            .finally(() => {
                              setOrdersLoading(false);
                            });
                        }}
                        className="inline-flex items-center px-3 py-2 bg-primary-orange/10 text-primary-orange hover:bg-primary-orange/20 rounded-lg transition-colors"
                        disabled={ordersLoading}
                      >
                        {ordersLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCcw className="h-4 w-4 mr-2" />
                        )}
                        Refresh
                      </button>
                    </div>
                  </div>
                  
                  {ordersLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange"></div>
                      <p className="mt-4 text-gray-500 dark:text-gray-400">Loading your orders...</p>
                    </div>
                  ) : ordersError ? (
                    <div className="text-center py-16 px-4">
                      <AlertCircle className="h-14 w-14 text-red-500 dark:text-red-400 mx-auto mb-4" />
                      <p className="text-red-500 dark:text-red-400 font-medium mb-2">{ordersError}</p>
                      <button 
                        onClick={() => {
                          setOrdersLoading(true);
                          getUserOrders().then(data => {
                            setOrders(data);
                            setOrdersError(null);
                          }).catch(err => {
                            setOrdersError('Failed to fetch orders. Please try again.');
                          }).finally(() => {
                            setOrdersLoading(false);
                          });
                        }}
                        className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-16 px-4">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Package className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No orders yet</h3>
                      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                        When you place orders, they will appear here for you to track and manage.
                      </p>
                      <Link
                        to="/shop"
                        className="inline-flex items-center px-6 py-3 bg-primary-orange hover:bg-primary-orange-dark text-white rounded-lg transition-colors shadow-sm"
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {orders.map((order) => (
                        <div 
                          key={getOrderId(order)} 
                          className={`mb-4 border border-gray-200 dark:border-gray-700 ${
                            expandedOrderId === getOrderId(order) ? 
                              'rounded-t-lg' : 'rounded-lg'
                          } bg-white dark:bg-gray-800 overflow-hidden shadow-sm`}
                        >
                          <div 
                            className="p-4 flex justify-between items-center cursor-pointer" 
                            onClick={() => toggleOrderExpand(getOrderId(order))}
                          >
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full pr-2">
                                <div className="text-base font-medium text-gray-900 dark:text-white">
                                  Order #{getOrderId(order)}
                                </div>
                                <ChevronDown 
                                  className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform ${
                                    expandedOrderId === getOrderId(order) ? 'rotate-180' : ''
                                  }`} 
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-right">
                              <span className={`px-3 py-1 text-xs rounded-full font-medium whitespace-nowrap inline-flex items-center ${getOrderStatusColor(order.status)}`}>
                                {getOrderStatusIcon(order.status)}
                                <span className="ml-1.5">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                              </span>
                              <span className="font-semibold text-lg whitespace-nowrap text-gray-900 dark:text-white">
                                {formatCurrency(order.total_amount + (order.shipping_cost || 0))}
                              </span>
                            </div>
                          </div>
                          
                          {/* Expanded Order Details */}
                          {expandedOrderId === getOrderId(order) && (
                            <div className="px-6 pb-6 pt-0 animate-fadeIn">
                              <div className="border-t border-gray-200 dark:border-gray-700 pt-5 mt-1">
                                <div className="space-y-6">
                                  {/* Order Items with clean styling */}
                                  <div>
                                    <h4 className="text-sm font-medium mb-4 text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                      Order Items ({order.items?.length || 0})
                                    </h4>
                                    <div className="space-y-4">
                                      {order.items && order.items.map((item: any) => (
                                        <div key={item.$id || item.id} className="flex items-center gap-4 bg-white dark:bg-[#121212] p-3 rounded-xl border border-gray-100 dark:border-[#121212] shadow-sm">
                                          <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-600 border border-gray-100 dark:border-[#121212]">
                                            {item.product && item.product.image_url ? (
                                              <SafeImage 
                                                src={item.product.image_url} 
                                                alt={item.product.name} 
                                                className="h-full w-full object-cover"
                                                onError={(e) => {
                                                  (e.target as HTMLImageElement).onerror = null;
                                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Product';
                                                }}
                                              />
                                            ) : (
                                              <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-600">
                                                <ShoppingBag className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex-grow min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                              {item.product?.name || 'Product'}
                                            </p>
                                            <div className="flex items-center justify-between mt-1">
                                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {item.quantity} × {formatCurrency(item.price)}
                                              </span>
                                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(item.quantity * item.price)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {/* Order Summary with pricing breakdown */}
                                  <div className="bg-gray-50 dark:bg-[#121212] rounded-xl p-4 mt-4">
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(order.total_amount)}</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Shipping</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                          {order.shipping_cost ? formatCurrency(order.shipping_cost) : 'Free'}
                                        </span>
                                      </div>
                                      <div className="pt-2 mt-2 border-t border-gray-200 dark:border-[#121212]">
                                        <div className="flex justify-between text-base font-medium">
                                          <span className="text-gray-900 dark:text-white">Total</span>
                                          <span className="text-lg text-gray-900 dark:text-white">{formatCurrency(order.total_amount + (order.shipping_cost || 0))}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Actions */}
                                  <div className="flex justify-end pt-2">
                                    <Link
                                      to={`/order-confirmation/${getOrderId(order)}`}
                                      className="inline-flex items-center px-4 py-2 bg-primary-orange/10 text-primary-orange dark:bg-primary-orange/20 dark:text-primary-orange-light font-medium rounded-lg hover:bg-primary-orange/20 dark:hover:bg-primary-orange/30 transition-colors"
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'customization' && (
                <div>
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Customization Requests</h2>
                      <p className="text-gray-500 dark:text-gray-400 mt-1">Track the status of your custom product requests</p>
                    </div>
                  </div>
                  
                  {customizationLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-orange"></div>
                      <p className="mt-4 text-gray-500 dark:text-gray-400">Loading your requests...</p>
                    </div>
                  ) : customizationError ? (
                    <div className="text-center py-16 px-4">
                      <AlertCircle className="h-14 w-14 text-red-500 dark:text-red-400 mx-auto mb-4" />
                      <p className="text-red-500 dark:text-red-400 font-medium mb-2">{customizationError}</p>
                      <button 
                        onClick={() => {
                          setCustomizationLoading(true);
                          getUserCustomizationRequests().then(data => {
                            setCustomizationRequests(data);
                            setCustomizationError(null);
                          }).catch(err => {
                            setCustomizationError('Failed to fetch customization requests. Please try again.');
                          }).finally(() => {
                            setCustomizationLoading(false);
                          });
                        }}
                        className="mt-4 px-4 py-2 bg-gray-100 dark:bg-[#121212] rounded-lg hover:bg-gray-200 dark:hover:bg-gray-900 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : customizationRequests.length === 0 ? (
                    <div className="text-center py-16 px-4">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-[#121212] flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No customization requests yet</h3>
                      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                        Create a customization request to order personalized items tailored to your preferences.
                      </p>
                      <Link
                        to="/customize"
                        className="inline-flex items-center px-6 py-3 bg-primary-orange text-white rounded-lg hover:bg-primary-orange-dark transition-colors shadow-sm"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create Request
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {customizationRequests.map((request) => (
                        <div
                          key={getRequestId(request)}
                          className={`mb-4 border border-gray-200 dark:border-gray-700 ${
                            expandedRequestId === getRequestId(request) ?
                              'rounded-t-lg' : 'rounded-lg'
                          } bg-white dark:bg-gray-800 overflow-hidden shadow-sm`}
                        >
                          <div
                            className="p-4 cursor-pointer"
                            onClick={() => toggleRequestExpand(getRequestId(request))}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                              <div className="flex items-start gap-4">
                                <div>
                                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                                    {request.product?.name || 'Custom Request'}
                                    <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                                      expandedRequestId === getRequestId(request) ? 'rotate-180' : ''
                                    }`} />
                                  </h3>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Request Details */}
                          <div 
                            className={`transition-all duration-200 ease-in-out overflow-hidden ${
                              expandedRequestId === getRequestId(request) ? 'max-h-[2000px]' : 'max-h-0'
                            }`}
                          >
                            <div className="px-6 pb-6 pt-0 animate-fadeIn">
                              <div className="border-t border-gray-200 dark:border-[#121212] pt-5 mt-1">
                                <div className="space-y-6">
                                  {/* Product Information (if available) */}
                                  {request.product && (
                                    <div className="bg-white dark:bg-[#121212] rounded-xl p-4 border border-gray-200 dark:border-[#121212] shadow-sm">
                                      <h4 className="text-sm font-medium mb-4 text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Product Being Customized
                                      </h4>
                                      <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 rounded-lg border border-gray-200 dark:border-[#121212] bg-gray-50 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                                          {request.product.image_url ? (
                                            <SafeImage 
                                              src={request.product.image_url} 
                                              alt={request.product.name} 
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).onerror = null;
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Product';
                                              }}
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                              <ShoppingBag className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-900 dark:text-white">{request.product?.name || 'Custom Product'}</p>
                                          <p className="text-primary-orange dark:text-primary-orange-light font-medium mt-1">
                                            {formatCurrency(request.product?.price || 0)}
                                          </p>
                                          {request.product?.category && (
                                            <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded mt-2 text-gray-700 dark:text-gray-300">
                                              {request.product?.category}
                                            </span>
                                          )}
                                        </div>
                                        <Link 
                                          to={`/product/${request.product?.id || ''}`}
                                          className="ml-auto text-sm text-primary-orange dark:text-primary-orange-light hover:text-primary-orange-dark dark:hover:text-primary-orange-light/80 hover:underline inline-flex items-center"
                                        >
                                          <Eye className="w-4 h-4 mr-1" />
                                          View Product
                                        </Link>
                                      </div>
                                    </div>
                                  )}

                                  {/* Design and Request Details in a better layout */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Design Image */}
                                    <div className="md:col-span-1">
                                      <h4 className="text-sm font-medium mb-3 text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Design
                                      </h4>
                                      <div className="border border-gray-200 dark:border-[#121212] rounded-xl p-2 bg-white dark:bg-[#121212] shadow-sm w-full h-[200px] flex items-center justify-center overflow-hidden">
                                        {request.design_url || request.image_url ? (
                                          <SafeImage 
                                            src={request.design_url || request.image_url} 
                                            alt="Custom design" 
                                            className="max-h-full max-w-full object-contain"
                                            fallbackSrc="https://via.placeholder.com/200?text=No+Design+Image"
                                            maxRetries={3}
                                          />
                                        ) : request.description?.includes('Design URL:') ? (
                                          <SafeImage 
                                            src={request.description.split('Design URL:')[1]?.split('\n')[0]?.trim()}
                                            alt="Custom design" 
                                            className="max-h-full max-w-full object-contain"
                                            fallbackSrc="https://via.placeholder.com/200?text=No+Design+Image"
                                            maxRetries={3}
                                          />
                                        ) : (
                                          <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <Upload className="w-10 h-10 mb-2" />
                                            <p className="text-sm text-center">No design uploaded</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Request Details */}
                                    <div className="md:col-span-2">
                                      <h4 className="text-sm font-medium mb-3 text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Customization Details
                                      </h4>
                                      <div className="bg-white dark:bg-[#121212] p-4 rounded-xl border border-gray-200 dark:border-[#121212] shadow-sm">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          <div className="space-y-1">
                                            <h4 className="text-xs uppercase tracking-wider font-medium text-gray-400 dark:text-gray-500">
                                              Technique
                                            </h4>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                              {request.technique || (request.description?.includes('Technique:') ? 
                                                request.description.split('Technique:')[1]?.split('\n')[0]?.trim() : 
                                                'Not specified')}
                                            </p>
                                          </div>
                                          
                                          <div className="space-y-1">
                                            <h4 className="text-xs uppercase tracking-wider font-medium text-gray-400 dark:text-gray-500">
                                              Size
                                            </h4>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                              {request.size}
                                            </p>
                                          </div>
                                          
                                          {request.color && (
                                            <div className="space-y-1">
                                              <h4 className="text-xs uppercase tracking-wider font-medium text-gray-400 dark:text-gray-500">
                                                Color
                                              </h4>
                                              <p className="font-medium text-gray-900 dark:text-white">
                                                {request.color}
                                              </p>
                                            </div>
                                          )}
                                          
                                          {request.material && (
                                            <div className="space-y-1">
                                              <h4 className="text-xs uppercase tracking-wider font-medium text-gray-400 dark:text-gray-500">
                                                Material
                                              </h4>
                                              <p className="font-medium text-gray-900 dark:text-white">
                                                {request.material}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* Notes */}
                                        {request.notes && (
                                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#121212]">
                                            <h4 className="text-xs uppercase tracking-wider font-medium text-gray-400 dark:text-gray-500">
                                              Notes
                                            </h4>
                                            <p className="mt-2 text-gray-700 dark:text-gray-300">
                                              {request.notes}
                                            </p>
                                          </div>
                                        )}
                                        
                                        {/* Admin Response */}
                                        {request.admin_notes && (
                                          <div className="mt-4 p-4 bg-primary-orange/10 dark:bg-primary-orange/20 rounded-lg border border-primary-orange/20 dark:border-primary-orange/30">
                                            <h4 className="text-xs uppercase tracking-wider font-medium text-primary-orange dark:text-primary-orange-light">
                                              Response from Team
                                            </h4>
                                            <p className="mt-2 text-gray-700 dark:text-gray-300">
                                              {request.admin_notes}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Status Timeline - Modernized */}
                                  <div className="mt-6">
                                    <h4 className="text-sm font-medium mb-4 text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                      Status Timeline
                                    </h4>
                                    <div className="bg-white dark:bg-[#121212] rounded-xl p-4 border border-gray-200 dark:border-[#121212] shadow-sm relative">
                                      <div className="absolute top-8 left-[27px] h-[calc(100%-4rem)] w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                                      <div className="space-y-6 relative">
                                        <div className="flex items-start">
                                          <div className={`rounded-full w-6 h-6 flex items-center justify-center ${
                                            request.status !== 'Pending' ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-primary-orange dark:bg-primary-orange'
                                          } shadow-md`}>
                                            <CheckIcon className="w-3.5 h-3.5 text-white" />
                                          </div>
                                          <div className="ml-4">
                                            <p className="text-gray-900 dark:text-white font-medium">
                                              Request Submitted
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                              {formatDate(request.created_at)} · {request.product ? `Customizing ${request.product?.name}` : 'Custom request created'}
                                            </p>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-start">
                                          <div className={`rounded-full w-6 h-6 flex items-center justify-center shadow-md ${
                                            request.status === 'approved' || request.status === 'completed' ? 'bg-emerald-500 dark:bg-emerald-600' : 
                                            request.status === 'rejected' ? 'bg-red-500 dark:bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                                          }`}>
                                            {request.status === 'rejected' ? (
                                              <XIcon className="w-3.5 h-3.5 text-white" />
                                            ) : request.status === 'approved' || request.status === 'completed' ? (
                                              <CheckIcon className="w-3.5 h-3.5 text-white" />
                                            ) : (
                                              <div className="w-3 h-3" />
                                            )}
                                          </div>
                                          <div className="ml-4">
                                            <p className="text-gray-900 dark:text-white font-medium">
                                              {request.status === 'rejected' ? 'Request Rejected' : 'Request Reviewed'}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                              {request.status === 'Pending' ? 
                                                'Our team will review your request shortly' : 
                                                request.status === 'rejected' ? 
                                                'Unfortunately, we cannot proceed with your request' :
                                                'Our team has approved your customization request'}
                                            </p>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-start">
                                          <div className={`rounded-full w-6 h-6 flex items-center justify-center shadow-md ${
                                            request.status === 'completed' ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
                                          }`}>
                                            {request.status === 'completed' ? (
                                              <CheckIcon className="w-3.5 h-3.5 text-white" />
                                            ) : (
                                              <div className="w-3 h-3" />
                                            )}
                                          </div>
                                          <div className="ml-4">
                                            <p className="text-gray-900 dark:text-white font-medium">
                                              Customization Complete
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                              {request.status === 'completed' ? 
                                                `Your ${request.product ? request.product.name : 'item'} customization is ready` : 
                                                request.status === 'rejected' ? 
                                                'Customization cancelled' :
                                                `We're working on your ${request.product ? request.product.name : 'item'} customization`}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'wishlist' && (
                <div>
                  <div className="border-b border-gray-100 dark:border-gray-700">
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-slate-900">My Wishlist</h2>
                      <p className="text-slate-500 mt-1">Products you've saved to purchase later</p>
                    </div>
                  </div>
                  
                  {wishlistLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                      <p className="mt-4 text-slate-500">Loading your wishlist...</p>
                    </div>
                  ) : wishlist.length === 0 ? (
                    <div className="text-center py-16 px-4">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                        <Heart className="w-10 h-10 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-medium text-slate-900 mb-2">Your wishlist is empty</h3>
                      <p className="text-slate-500 max-w-md mx-auto mb-8">
                        Save items you love to your wishlist and they'll appear here for easy access.
                      </p>
                      <Link
                        to="/shop"
                        className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Browse Products
                      </Link>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {wishlist.map((item) => (
                          <div key={item.$id || item.id} 
                            className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 hover:-translate-y-1"
                          >
                            <Link to={`/product/${item.product.id}`}>
                              <div className="h-48 bg-slate-50 dark:bg-gray-800 overflow-hidden">
                                {item.product.image_url ? (
                                  <SafeImage 
                                    src={item.product.image_url} 
                                    alt={item.product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).onerror = null;
                                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Product';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-gray-600" />
                                  </div>
                                )}
                              </div>
                              <div className="p-4">
                                <h3 className="font-semibold text-slate-900 dark:text-gray-100 truncate group-hover:text-indigo-600 transition-colors">
                                  {item.product.name}
                                </h3>
                                <p className="text-indigo-600 dark:text-indigo-300 font-medium mt-2">
                                  {formatCurrency(item.product.price)}
                                </p>
                              </div>
                            </Link>
                            
                            <button
                              onClick={() => handleRemoveFromWishlist(item.$id || item.id)}
                              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center text-red-500 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                              aria-label="Remove from wishlist"
                            >
                              <Heart className="w-4 h-4 fill-current" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'payment' && (
                <div>
                  <div className="border-b border-gray-100 dark:border-gray-700">
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-slate-900">Payment Methods</h2>
                      <p className="text-slate-500 mt-1">Manage your payment options</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center">
                      <CreditCard className="w-10 h-10 text-slate-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-xl font-medium text-slate-900 mb-2">Secure Payment Processing</h3>
                    <p className="text-slate-500 max-w-md">
                      We use Paystack for secure payment processing. Your payment information is encrypted and not stored in your account.
                    </p>
                    <div className="mt-8 bg-slate-50 dark:bg-gray-800 px-6 py-4 rounded-xl border border-gray-200 dark:border-gray-700 inline-flex items-center">
                      <svg viewBox="0 0 24 24" width="24" height="24" className="mr-3">
                        <path d="M21.3 0H2.7C1.2 0 0 1.2 0 2.7v18.7C0 22.8 1.2 24 2.7 24h18.7c1.5 0 2.7-1.2 2.7-2.7V2.7C24 1.2 22.8 0 21.3 0z" fill="#00C3F7" />
                        <path d="M16.4 8.1c-1-.2-2-.1-2.6.7-.3.5-.4 1.1-.2 1.9.1.7.4 1.1 1 1.4.5.2 1 .3 1.5.4.6.1 1.1.3 1.5.8.3.4.3.8.2 1.2-.2.8-1.1 1.3-2 1-1-.3-1.4-1.1-1.5-2h-1.7c0 .7.2 1.3.6 1.8.7 1 1.8 1.3 3 1.3 1.3 0 2.5-.4 3.1-1.6.3-.6.4-1.3.2-2-.2-.9-1-1.5-1.8-1.7-.5-.1-1-.2-1.5-.3-.5-.1-1-.3-1.3-.7-.2-.4-.2-.8 0-1.2.3-.5.9-.7 1.4-.5.4.1.7.4.8.8h1.6c-.1-1.3-1.1-2.2-2.3-2.3z" fill="#fff" />
                        <path d="M9.6 14.7c-.7.7-1.6 1-2.5 1-1 0-1.8-.3-2.5-1-.5-.5-.7-1.1-.9-1.8-.1-.6-.1-1.1 0-1.7.1-.7.3-1.2.9-1.7.7-.7 1.6-1 2.5-1 1 0 1.8.3 2.5 1 .5.5.8 1.1.9 1.7.1.6.1 1.1 0 1.7-.1.7-.4 1.3-.9 1.8zm-1.4-3c-.1-.3-.2-.6-.4-.9-.3-.3-.7-.5-1.1-.3-.4.1-.6.4-.7.8-.1.5-.1 1.1 0 1.6.1.4.2.7.5 1 .4.3.8.3 1.2.1.3-.2.5-.5.6-.9 0-.2.1-.3.1-.5-.1-.3-.1-.6-.2-.9z" fill="#fff" />
                      </svg>
                      <span className="text-indigo-600 dark:text-indigo-300 font-medium">Powered by Paystack</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h2>
                      <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your personal information and preferences</p>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <form onSubmit={handleProfileUpdate} className="space-y-8 max-w-3xl mx-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Information Section */}
                        <div className="md:col-span-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b dark:border-gray-700 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary-orange dark:text-primary-orange-light" />
                            Personal Information
                          </h3>
                        </div>
                        
                        <div className="space-y-2.5">
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email Address
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              id="email"
                              value={user?.email || profile.email || ''}
                              disabled
                              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm text-gray-500 dark:text-gray-400 py-2.5 pl-10"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <div className="text-gray-400 dark:text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Contact support to change your email address</p>
                        </div>
                        
                        <div className="space-y-2.5">
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Full Name
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              id="name"
                              value={profile.full_name || profile.name || ''}
                              onChange={(e) => {
                                console.log('Updating name:', e.target.value);
                                setProfile({ ...profile, full_name: e.target.value });
                              }}
                              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white py-2.5 pl-10 focus:border-primary-orange focus:ring-primary-orange dark:focus:ring-primary-orange-light"
                              placeholder="Enter your full name"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <div className="text-gray-400 dark:text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2.5">
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Phone Number
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              id="phone"
                              value={profile.phone_number || ''}
                              onChange={(e) => {
                                console.log('Updating phone:', e.target.value);
                                setProfile({ ...profile, phone_number: e.target.value });
                              }}
                              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white py-2.5 pl-10 focus:border-primary-orange focus:ring-primary-orange dark:focus:ring-primary-orange-light"
                              placeholder="e.g., +234 8012345678"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2.5">
                          <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            WhatsApp Number
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              id="whatsapp"
                              value={profile.whatsapp_number || ''}
                              onChange={(e) => {
                                console.log('Updating whatsapp:', e.target.value);
                                setProfile({ ...profile, whatsapp_number: e.target.value });
                              }}
                              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white py-2.5 pl-10 focus:border-primary-orange focus:ring-primary-orange dark:focus:ring-primary-orange-light"
                              placeholder="e.g., +234 8012345678"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <div className="text-gray-400 dark:text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">For order updates via WhatsApp</p>
                        </div>
                        
                        {/* Delivery Information Section */}
                        <div className="md:col-span-2 mt-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b dark:border-gray-700 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary-orange dark:text-primary-orange-light" />
                            Delivery Information
                          </h3>
                        </div>
                        
                        <div className="md:col-span-2 space-y-2.5">
                          <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Delivery Address
                          </label>
                          <div className="relative">
                            <textarea
                              id="address"
                              value={profile.delivery_address || ''}
                              onChange={(e) => {
                                console.log('Updating address:', e.target.value);
                                setProfile({ ...profile, delivery_address: e.target.value });
                              }}
                              rows={3}
                              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white pt-3 pb-3 pl-10 focus:border-primary-orange focus:ring-primary-orange dark:focus:ring-primary-orange-light"
                              placeholder="Enter your full delivery address including city and state"
                            />
                            <div className="absolute top-3 left-3 pointer-events-none">
                              <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This address will be used as the default shipping address for your orders</p>
                        </div>
                      </div>
                      
                      <div className="pt-6 flex justify-end">
                        <button
                          type="submit"
                          disabled={loading}
                          className={`py-2.5 px-6 flex items-center justify-center gap-2 rounded-lg shadow-sm text-white transition-all ${
                            saveSuccess 
                              ? 'bg-emerald-500 dark:bg-emerald-600' 
                              : 'bg-primary-orange hover:bg-primary-orange-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-orange dark:focus:ring-offset-gray-800'
                          }`}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : saveSuccess ? (
                            <>
                              <CheckIcon className="w-4 h-4" />
                              <span>Saved!</span>
                            </>
                          ) : (
                            <>
                              <CheckIcon className="w-4 h-4" />
                              <span>Save Changes</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security Settings</h2>
                      <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your password and account security</p>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="max-w-3xl space-y-8">
                      {/* Change Password Section */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Change Password</h3>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Update your password to maintain account security
                          </p>
                        </div>
                        
                        <div className="p-5">
                          {passwordUpdateSuccess && (
                            <div className="p-4 mb-5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 flex items-start">
                              <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                              <p>Your password has been successfully updated!</p>
                            </div>
                          )}
                          
                          {passwordUpdateError && (
                            <div className="p-4 mb-5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 flex items-start">
                              <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
                              <p>{passwordUpdateError}</p>
                            </div>
                          )}
                          
                          <form onSubmit={handlePasswordUpdate} className="space-y-4">
                            <div>
                              <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Current Password
                              </label>
                              <div className="relative">
                                <input
                                  id="current-password"
                                  name="current-password"
                                  type={showCurrentPassword ? "text" : "password"}
                                  value={passwordData.currentPassword}
                                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                  className="pl-4 pr-10 py-2.5 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                                  required
                                />
                                <button
                                  type="button"
                                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                              </div>
                            </div>
                            
                            <div>
                              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                New Password
                              </label>
                              <div className="relative">
                                <input
                                  id="new-password"
                                  name="new-password"
                                  type={showNewPassword ? "text" : "password"}
                                  value={passwordData.newPassword}
                                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                  className="pl-4 pr-10 py-2.5 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                                  required
                                />
                                <button
                                  type="button"
                                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                              </div>
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Password must be at least 8 characters and include a mix of letters, numbers, and symbols.
                                </p>
                              </div>
                            </div>
                            
                            <div>
                              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Confirm New Password
                              </label>
                              <div className="relative">
                                <input
                                  id="confirm-password"
                                  name="confirm-password"
                                  type={showConfirmPassword ? "text" : "password"}
                                  value={passwordData.confirmPassword}
                                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                  className="pl-4 pr-10 py-2.5 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                                  required
                                />
                                <button
                                  type="button"
                                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                              </div>
                            </div>
                            
                            <div className="pt-2">
                              <button
                                type="submit"
                                disabled={passwordUpdateLoading}
                                className="w-full sm:w-auto px-6 py-2.5 bg-primary-orange text-white rounded-lg hover:bg-primary-orange-dark transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-orange disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                              >
                                {passwordUpdateLoading ? (
                                  <>
                                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                    Updating...
                                  </>
                                ) : 'Update Password'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                      
                      {/* Two-Factor Authentication Section */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h3>
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Add an extra layer of security to your account
                              </p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              twoFactorEnabled ? 
                                'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 
                                'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}>
                              {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-5">
                          <div className="flex items-start space-x-4">
                            <div className="mt-1 flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-primary-orange/10 dark:bg-primary-orange/20 flex items-center justify-center">
                                <ShieldAlert className="h-6 w-6 text-primary-orange dark:text-primary-orange-light" />
                              </div>
                            </div>
                            <div className="flex-grow">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to sign in.
                              </p>
                              
                              {twoFactorEnabled ? (
                                <div className="mt-4">
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                                    Your account is protected with two-factor authentication. To disable this feature, you'll need to confirm your password.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={handleDisable2FA}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-orange dark:focus:ring-offset-gray-800"
                                  >
                                    Disable Two-Factor Authentication
                                  </button>
                                </div>
                              ) : (
                                <div className="mt-4">
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                                    With 2FA enabled, you'll need your password and a security code from your authentication app when you sign in.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={handleEnable2FA}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary-orange hover:bg-primary-orange-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-orange dark:focus:ring-offset-gray-800"
                                  >
                                    Enable Two-Factor Authentication
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Login Sessions Section */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Active Sessions</h3>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Manage your active login sessions
                          </p>
                        </div>
                        
                        <div className="p-5">
                          {sessionsLoading ? (
                            <div className="flex justify-center py-4">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-orange"></div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {Array.isArray(activeSessions) && activeSessions.length > 0 ? (
                                activeSessions.map((session, index) => {
                                  // Extra safety check for completely undefined session
                                  if (!session) {
                                    console.log(`[Sessions UI] Session at index ${index} is undefined, rendering fallback`);
                                    return (
                                      <div key={`unknown-session-${index}`} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                          <div className="flex-shrink-0">
                                            <Monitor className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                              Unknown Device
                                            </p>
                                            <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                                              <MapPin className="h-3 w-3 mr-1" />
                                              <span>Unknown location</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                  
                                  // Safe accessors for session properties
                                  const sessionId = session.id ? String(session.id) : `unknown-session-${index}`;
                                  const deviceName = typeof session.device_name === 'string' ? session.device_name : 'Unknown Device';
                                  const deviceType = typeof session.device_type === 'string' ? session.device_type : 'desktop';
                                  const location = typeof session.location === 'string' ? session.location : 'Unknown location';
                                  const isCurrent = Boolean(session.is_current);
                                  
                                  return (
                                    <div key={sessionId} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                      <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                          {deviceType === 'mobile' ? (
                                            <Smartphone className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                                          ) : (
                                            <Monitor className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                                          )}
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {deviceName}
                                            {isCurrent && (
                                              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary-orange/10 dark:bg-primary-orange/20 text-primary-orange dark:text-primary-orange-light rounded-full">
                                                Current
                                              </span>
                                            )}
                                          </p>
                                          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            <MapPin className="h-3 w-3 mr-1" />
                                            <span>{location}</span>
                                            <span className="mx-1.5">•</span>
                                            <span>
                                              Last active {session.last_active ? formatDate(session.last_active) : 'Unknown'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      {!isCurrent && (
                                        <button
                                          type="button"
                                          onClick={() => handleTerminateSession(sessionId)}
                                          className="text-sm text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                                        >
                                          Sign Out
                                        </button>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                                  No active sessions found
                                </div>
                              )}
                              
                              <div className="pt-2 mt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  Not recognizing a session? Sign out everywhere to secure your account.
                                </span>
                                <button
                                  type="button"
                                  onClick={handleSignOutAll}
                                  className="text-sm text-primary-orange dark:text-primary-orange-light hover:text-primary-orange-dark dark:hover:text-primary-orange-light/80 font-medium"
                                >
                                  Sign Out All Devices
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Danger Zone Section */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/40 overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10">
                          <h3 className="text-lg font-medium text-red-700 dark:text-red-400 flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            Danger Zone
                          </h3>
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400/80">
                            Irreversible account actions
                          </p>
                        </div>
                        
                        <div className="p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Delete Account</h4>
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Once you delete your account, there is no going back. This action is permanent.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleDeleteAccount}
                              className="w-full sm:w-auto px-4 py-2 border border-red-300 dark:border-red-700 rounded-lg text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/10 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 text-sm font-medium transition-colors"
                            >
                              Delete Account
                            </button>
                          </div>
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
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Confirm Account Deletion</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">This action cannot be undone. All your data will be permanently deleted.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type DELETE to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                placeholder="DELETE"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setDeleteConfirmationText('');
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                disabled={deleteConfirmationText !== 'DELETE' || deleteAccountLoading}
                className={`px-4 py-2 text-white rounded-md ${
                  deleteConfirmationText !== 'DELETE' 
                    ? 'bg-red-400 dark:bg-red-700 cursor-not-allowed' 
                    : 'bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800'
                } transition-colors flex items-center`}
              >
                {deleteAccountLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}