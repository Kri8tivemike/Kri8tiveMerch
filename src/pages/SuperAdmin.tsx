import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../hooks/use-toast';
import { account, databases, ID } from '../lib/appwrite';
import type { Models } from 'appwrite';

// Database and collection IDs
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
const CUSTOMERS_COLLECTION_ID = 'customers';
const SHOP_MANAGERS_COLLECTION_ID = 'shop_managers';
const SUPER_ADMINS_COLLECTION_ID = 'super_admins';
import { syncUserVerificationStatus } from '../services/user-verification.service';
import { permissionsService } from '../services/permissions.service';
import UserVerificationGuide from '../components/admin/UserVerificationGuide';
import PermissionConfigModal from '../components/admin/PermissionConfigModal';
import { 
  UserPlus,
  Edit2, 
  X, 
  Shield,
  Trash2,
  Settings,
  AlertTriangle,
  Loader2,
  UserCheck,
  CheckCircle,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { 
  ROLES, 
  RESOURCE_TYPES, 
  ROLE_LABELS 
} from '../constants/permissions';

// Collection IDs are now imported from appwrite-config

interface Profile extends Omit<Models.Document, '$permissions' | '$createdAt' | '$updatedAt'> {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string; // Using 'phone' to match database schema
  role: 'super_admin' | 'shop_manager' | 'user';
  account_status: 'Pending' | 'Verified' | 'Deactivated';
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  email_verified?: boolean;
  whatsapp_number?: string;
  delivery_address?: string;
  // Role-specific fields
  department?: string; // for shop_managers
  permissions?: string; // for shop_managers and super_admins
  security_clearance?: number; // for super_admins
  super_admin_level?: string; // for super_admins
  total_orders?: number; // for customers
  total_spent?: number; // for customers
  
  // Legacy fields for backward compatibility (will be mapped from full_name)
  first_name?: string;
  last_name?: string;
  status?: 'Pending' | 'Verified' | 'Deactivated';
  phone_number?: string; // Legacy field mapped from 'phone'
}

interface ManagerFormInput {
  full_name: string;
  email: string;
  phone: string; // Using 'phone' to match database schema
  role: 'shop_manager' | 'super_admin' | 'user';
  password: string;
}

interface Collection extends Models.Document {
  name: string;
  enabled: boolean;
  documentSecurity: boolean;
  attributes?: any[];
  indexes?: any[];
}

interface PermissionRule {
  role: 'shop_manager' | 'super_admin' | 'user';
  type: 'read' | 'write' | 'update' | 'delete';
  enabled: boolean;
}

interface PermissionsState {
  collections: Collection[];
  selectedCollection: Collection | null;
  loading: boolean;
  error: string | null;
  rules: PermissionRule[];
  permissionRules: PermissionRule[];
}

interface AdminState {
  managers: Profile[];
  loading: boolean;
  error: string | null;
  permissions: PermissionsState;
}

interface ThemeClasses {
  buttonBg: string;
  tableBg: string;
  inputBg: string;
  dangerButtonBg: string;
  borderColor: string;
  tableHeaderBg: string;
  cancelButtonBg: string;
  cardBg: string;
}

/**
 * Helper function to get the appropriate collection ID based on role
 */
const getCollectionIdForRole = (role: string): string => {
  switch (role) {
    case 'super_admin':
      return SUPER_ADMINS_COLLECTION_ID;
    case 'shop_manager':
      return SHOP_MANAGERS_COLLECTION_ID;
    case 'user':
      return CUSTOMERS_COLLECTION_ID;
    default:
      return CUSTOMERS_COLLECTION_ID;
  }
};

/**
 * Helper function to normalize profile data for display
 */
const normalizeProfileForDisplay = (profile: any): Profile => {
  // Ensure full_name is always a string
  const fullName = profile.full_name || profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User';
  
  // Map new schema to legacy fields for backward compatibility
  const normalized = {
    ...profile,
    full_name: fullName,
    first_name: profile.first_name || fullName.split(' ')[0] || '',
    last_name: profile.last_name || fullName.split(' ').slice(1).join(' ') || '',
    status: profile.status || 'Pending', // Use 'status' as primary field to match database
    phone: profile.phone || '', // Use 'phone' as primary field
    phone_number: profile.phone || '', // Legacy mapping
    email: profile.email || '',
    account_status: profile.status || 'Pending' // Map status to account_status for backward compatibility
  };
  
  return normalized;
};

/**
 * Helper function to check for and clean up duplicate users across collections
 */
const cleanupDuplicateUsers = async (userId: string, correctRole: string) => {
  const allCollections = [
    { id: SUPER_ADMINS_COLLECTION_ID, role: 'super_admin' },
    { id: SHOP_MANAGERS_COLLECTION_ID, role: 'shop_manager' },
    { id: CUSTOMERS_COLLECTION_ID, role: 'user' }
  ];
  
  console.log(`🧹 Checking for duplicates for user ${userId} (correct role: ${correctRole})`);
  
  for (const collection of allCollections) {
    if (collection.role !== correctRole) {
      try {
        const duplicateDoc = await databases.getDocument(DATABASE_ID, collection.id, userId);
        if (duplicateDoc) {
          console.log(`⚠️ Found duplicate user in ${collection.role} collection, removing...`);
          await databases.deleteDocument(DATABASE_ID, collection.id, duplicateDoc.$id);
          console.log(`✅ Removed duplicate from ${collection.role} collection`);
        }
      } catch (error: any) {
        // Document doesn't exist, which is expected
        if (error.code !== 404) {
          console.error(`Error checking ${collection.role} collection for duplicates:`, error);
        }
      }
    }
  }
};

/**
 * Helper function to create role-specific document data
 */
const createRoleSpecificData = (formInput: ManagerFormInput, userAccount: any) => {
  const baseData = {
    user_id: userAccount.$id,
    full_name: formInput.full_name,
    email: formInput.email,
    phone: formInput.phone, // Use 'phone' to match database schema
    email_verified: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: formInput.role === 'super_admin' ? 'Verified' : 'Pending' as const // Use 'status' to match database schema
  };

  switch (formInput.role) {
    case 'super_admin':
      return {
        ...baseData,
        first_name: formInput.full_name.split(' ')[0] || '',
        last_name: formInput.full_name.split(' ').slice(1).join(' ') || '',
        permissions: '["*"]',
        security_clearance: 5,
        two_factor_enabled: false,
        super_admin_level: 'Business',
        is_active: true
      };
    case 'shop_manager':
      return {
        ...baseData,
        first_name: formInput.full_name.split(' ')[0] || '',
        last_name: formInput.full_name.split(' ').slice(1).join(' ') || '',
        department: 'General',
        permissions: '["orders.read","products.manage","customers.read"]',
        assigned_shop_id: 'main_shop',
        hire_date: new Date().toISOString(),
        is_active: true
      };
    case 'user':
      return {
        ...baseData,
        first_name: formInput.full_name.split(' ')[0] || '',
        last_name: formInput.full_name.split(' ').slice(1).join(' ') || '',
        preferences: '',
        total_orders: 0,
        total_spent: 0
      };
    default:
      return baseData;
  }
};

const SuperAdmin: React.FC = () => {
  const { toast } = useToast();

  const [state, setState] = useState<AdminState>({
    managers: [],
    loading: false,
    error: null,
    permissions: {
      collections: [],
      loading: false,
      error: null,
      selectedCollection: null,
      rules: [],
      permissionRules: []
    }
  });

  const [formInput, setFormInput] = useState<ManagerFormInput>({
    full_name: '',
    email: '',
    phone: '', // Use 'phone' to match database schema
    role: 'shop_manager',
    password: ''
  });

  const [activeTab, setActiveTab] = useState<'managers' | 'permissions'>('managers');
  const [showAddManager, setShowAddManager] = useState(false);
  const [showEditManager, setShowEditManager] = useState(false);
  const [editingManager, setEditingManager] = useState<Profile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showVerificationGuide, setShowVerificationGuide] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showPermissionConfig, setShowPermissionConfig] = useState(false);

  const themeClasses = useMemo<ThemeClasses>(() => ({
    buttonBg: 'bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600',
    tableBg: 'bg-white dark:bg-gray-800',
    inputBg: 'bg-gray-50 dark:bg-gray-700',
    dangerButtonBg: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600',
    borderColor: 'border-gray-200 dark:border-gray-700',
    tableHeaderBg: 'bg-gray-50 dark:bg-gray-700',
    cancelButtonBg: 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500',
    cardBg: 'bg-white dark:bg-gray-800'
  }), []);

  const filteredManagers = useMemo(() => 
    state.managers.filter(manager =>
      (manager.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (manager.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    ), [state.managers, searchQuery]
  );

  const handleFormChange = useCallback((field: keyof ManagerFormInput, value: string) => {
    setFormInput(prev => ({ ...prev, [field]: value }));
  }, []);

  // Bulk selection handlers
  const handleSelectUser = useCallback((userId: string, isSelected: boolean) => {
    setSelectedUsers(prev => 
      isSelected 
        ? [...prev, userId]
        : prev.filter(id => id !== userId)
    );
  }, []);

  const handleSelectAll = useCallback((isSelected: boolean) => {
    setSelectedUsers(isSelected ? filteredManagers.map(m => m.$id) : []);
  }, [filteredManagers]);

  const handleBulkDelete = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Group users by their roles to delete from correct collections
      const usersByRole = new Map<string, string[]>();
      
      selectedUsers.forEach(userId => {
        const user = state.managers.find(m => m.$id === userId);
        if (user) {
          const role = user.role;
          if (!usersByRole.has(role)) {
            usersByRole.set(role, []);
          }
          usersByRole.get(role)!.push(userId);
        }
      });
      
      // Delete users from their respective collections
      const deletePromises: Promise<any>[] = [];
      
      usersByRole.forEach((userIds, role) => {
        const collectionId = getCollectionIdForRole(role);
        userIds.forEach(userId => {
          deletePromises.push(
            databases.deleteDocument(DATABASE_ID, collectionId, userId)
          );
        });
      });
      
      await Promise.all(deletePromises);
      
      setState(prev => ({
        ...prev,
        managers: prev.managers.filter(m => !selectedUsers.includes(m.$id)),
        loading: false
      }));
      
      setSelectedUsers([]);
      setShowBulkDeleteConfirm(false);
      
      toast({
        title: "Bulk Delete Successful",
        description: `Successfully deleted ${selectedUsers.length} user(s)`,
        variant: "default"
      });
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to delete users' 
      }));
      toast({
        title: "Bulk Delete Failed",
        description: error.message || "Failed to delete selected users",
        variant: "destructive"
      });
    }
  }, [selectedUsers, state.managers, toast]);

  const handleEditManager = useCallback((manager: Profile) => {
    setEditingManager(manager);
    setShowEditManager(true);
  }, []);

  /**
   * Handle role changes by moving user document between collections
   * This is necessary because roles are determined by which collection the document is stored in
   */
  const handleRoleChange = useCallback(async (
    managerId: string, 
    currentRole: string, 
    newRole: string, 
    manager: Profile, 
    additionalUpdates: Partial<Profile> = {}
  ) => {
    try {
      console.log(`🔄 Starting role change: ${currentRole} → ${newRole} for user ${manager.email}`);
      
      // First, check if user already exists in the target collection to prevent duplicates
      const newCollectionId = getCollectionIdForRole(newRole);
      const currentCollectionId = getCollectionIdForRole(currentRole);
      
      try {
        const existingDoc = await databases.getDocument(DATABASE_ID, newCollectionId, manager.user_id);
        if (existingDoc) {
          console.log(`⚠️ User already exists in ${newRole} collection. Cleaning up duplicate...`);
          // Delete the existing document in the target collection first
          await databases.deleteDocument(DATABASE_ID, newCollectionId, existingDoc.$id);
          console.log(`🗑️ Removed existing duplicate in ${newRole} collection`);
        }
      } catch (error: any) {
        // Document doesn't exist in target collection, which is expected
        if (error.code !== 404) {
          console.error('Error checking for existing document:', error);
        }
      }
      
      // Prepare the base data for the new collection
      const baseData = {
        user_id: manager.user_id,
        email: manager.email,
        first_name: manager.first_name || manager.full_name?.split(' ')[0] || '',
        last_name: manager.last_name || manager.full_name?.split(' ').slice(1).join(' ') || '',
        full_name: manager.full_name,
        phone: manager.phone,
        email_verified: manager.email_verified || false,
        created_at: manager.created_at,
        updated_at: new Date().toISOString(),
        status: additionalUpdates.status || manager.status || 'Pending'
      };
      
      // Add role-specific fields based on new role
      let newDocumentData: any = { ...baseData };
      
      if (newRole === 'super_admin') {
        newDocumentData = {
          ...baseData,
          permissions: manager.permissions || '["*"]',
          security_clearance: manager.security_clearance || 5,
          two_factor_enabled: false,
          super_admin_level: 'Business',
          is_active: true,
          avatar_url: manager.avatar_url
        };
      } else if (newRole === 'shop_manager') {
        newDocumentData = {
          ...baseData,
          department: manager.department || 'General',
          permissions: manager.permissions || '["orders.read","products.manage","customers.read"]',
          assigned_shop_id: 'main_shop',
          hire_date: new Date().toISOString(),
          is_active: true,
          avatar_url: manager.avatar_url
        };
      } else if (newRole === 'user') {
        newDocumentData = {
          ...baseData,
          preferences: '',
          total_orders: 0,
          total_spent: 0,
          whatsapp_number: manager.whatsapp_number,
          delivery_address: manager.delivery_address,
          avatar_url: manager.avatar_url
        };
      }
      
      // Apply any additional updates
      Object.assign(newDocumentData, additionalUpdates);
      
      console.log(`📝 Creating new document in ${newRole} collection...`);
      
      // Create new document in target collection with user_id as document ID for consistency
      const newDocument = await databases.createDocument(
        DATABASE_ID,
        newCollectionId,
        manager.user_id, // Use user_id as document ID for consistency
        newDocumentData
      );
      
      console.log(`✅ New document created with ID: ${newDocument.$id}`);
      console.log(`🗑️ Deleting old document from ${currentRole} collection...`);
      
      // Delete old document from current collection
      await databases.deleteDocument(DATABASE_ID, currentCollectionId, managerId);
      
      console.log(`✅ Role change completed successfully`);
      
      // Clear any stored role information for this user to force fresh role detection
      localStorage.removeItem(`user_role_${manager.user_id}`);
      console.log(`🧹 Cleared stored role for user ${manager.user_id}`);
      
      // Also check and clean up any other duplicates in other collections
      const allCollections = [
        { id: SUPER_ADMINS_COLLECTION_ID, role: 'super_admin' },
        { id: SHOP_MANAGERS_COLLECTION_ID, role: 'shop_manager' },
        { id: CUSTOMERS_COLLECTION_ID, role: 'user' }
      ];
      
      for (const collection of allCollections) {
        if (collection.role !== newRole) {
          try {
            // Check if user exists in this collection
            const duplicateDoc = await databases.getDocument(DATABASE_ID, collection.id, manager.user_id);
            if (duplicateDoc) {
              console.log(`🧹 Cleaning up duplicate in ${collection.role} collection...`);
              await databases.deleteDocument(DATABASE_ID, collection.id, duplicateDoc.$id);
              console.log(`✅ Removed duplicate from ${collection.role} collection`);
            }
          } catch (error: any) {
            // Document doesn't exist, which is expected
            if (error.code !== 404) {
              console.error(`Error checking ${collection.role} collection for duplicates:`, error);
            }
          }
        }
      }
      
      // Return the new document with role information
      return normalizeProfileForDisplay({ ...newDocument, role: newRole } as any);
    } catch (error: any) {
      console.error('❌ Role change error:', error);
      throw new Error(`Failed to change role: ${error.message}`);
    }
  }, []);

  const handleUpdateManager = useCallback(async (managerId: string, updates: Partial<Profile>) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Find the manager to get their current role
      const manager = state.managers.find(m => m.$id === managerId);
      if (!manager) {
        throw new Error('Manager not found');
      }
      
      const currentRole = manager.role;
      const newRole = updates.role;
      
      // Check if role is changing
      if (newRole && newRole !== currentRole) {
        console.log(`🔄 Role change detected: ${currentRole} → ${newRole}`);
        
        // Role change requires moving the document to a different collection
        const { role, ...otherUpdates } = updates;
        const updatedManager = await handleRoleChange(managerId, currentRole, newRole, manager, otherUpdates);
        
        // Update state with new document and role
        setState(prev => ({
          ...prev,
          managers: prev.managers.map(m => 
            m.$id === managerId ? updatedManager : m
          ),
          loading: false
        }));
        
        toast({
          title: "Role Updated Successfully",
          description: `User role changed from ${currentRole} to ${newRole}`,
          variant: "default"
        });
      } else {
        // No role change, just update the existing document
        const currentCollectionId = getCollectionIdForRole(currentRole);
        
        // Remove fields that shouldn't be in the database document
        const { role, account_status, phone_number, ...cleanUpdates } = updates;
        
        await databases.updateDocument(
          DATABASE_ID,
          currentCollectionId,
          managerId,
          {
            ...cleanUpdates,
            updated_at: new Date().toISOString()
          }
        );

        setState(prev => ({
          ...prev,
          managers: prev.managers.map(m => 
            m.$id === managerId ? { ...m, ...updates } : m
          ),
          loading: false
        }));
        
        toast({
          title: "Success",
          description: "User updated successfully",
          variant: "default"
        });
      }
      
      setShowEditManager(false);
      setEditingManager(null);
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to update user' 
      }));
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive"
      });
    }
  }, [state.managers, toast, handleRoleChange]);

  const handleDeleteManager = useCallback(async (managerId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Find the manager to get their role
      const manager = state.managers.find(m => m.$id === managerId);
      if (!manager) {
        throw new Error('Manager not found');
      }
      
      const collectionId = getCollectionIdForRole(manager.role);
      
      await databases.deleteDocument(
        DATABASE_ID,
        collectionId,
        managerId
      );
      
      setConfirmDelete(null);
      toast({
        title: "Success",
        description: "User deleted successfully",
        variant: "default"
      });
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to delete user' 
      }));
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      });
    }
  }, [state.managers, toast]);

  const handleAddManager = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Create user account
      const userAccount = await account.create(
        ID.unique(),
        formInput.email,
        formInput.password,
        formInput.full_name
      );

      // Create role-specific document data
      const documentData = createRoleSpecificData(formInput, userAccount);
      const collectionId = getCollectionIdForRole(formInput.role);

      // Create user profile in the appropriate role-based collection
      const manager = await databases.createDocument(
        DATABASE_ID,
        collectionId,
        ID.unique(),
        documentData
      ) as unknown as Profile;

      // Add role information for display
      const managerWithRole = {
        ...manager,
        role: formInput.role
      };

      setState(prev => ({
        ...prev,
        managers: [...prev.managers, managerWithRole],
        loading: false
      }));

      setFormInput({
        full_name: '',
        email: '',
        phone: '', // Use 'phone' to match database schema
        role: 'shop_manager',
        password: ''
      });

      setShowAddManager(false);
      
      // Show appropriate success message based on role
      const roleDisplay = formInput.role === 'shop_manager' ? 'Shop Manager' : 
                         formInput.role === 'super_admin' ? 'Super Admin' : 'Customer';
      const statusMessage = formInput.role === 'super_admin' ? 
        ' (Status: Verified)' : ' (Status: Pending - requires verification)';
      
      toast({ 
        title: 'Success', 
        description: `${roleDisplay} account created successfully${statusMessage}` 
      });
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to add user' 
      }));
      toast({
        title: "Error",
        description: error.message || "Failed to add user",
        variant: "destructive"
      });
    }
  }, [formInput, toast]);

  /**
   * Verify a pending user - changes status from 'Pending' to 'Verified'
   */
  const handleVerifyUser = useCallback(async (manager: Profile) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const collectionId = getCollectionIdForRole(manager.role);
      
      await databases.updateDocument(
        DATABASE_ID,
        collectionId,
        manager.$id,
        {
          status: 'Verified', // Use 'status' to match database schema
          updated_at: new Date().toISOString()
        }
      );

      setState(prev => ({
        ...prev,
        managers: prev.managers.map(m => 
          m.$id === manager.$id ? { ...m, status: 'Verified' as const } : m
        ),
        loading: false
      }));
      
      toast({
        title: "User Verified Successfully",
        description: `${manager.first_name} ${manager.last_name} has been verified and can now access the system`,
        variant: "default"
      });
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to verify user' 
      }));
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify user",
        variant: "destructive"
      });
    }
  }, [toast]);

  /**
   * Send verification email to user
   */
  const handleSendVerificationEmail = useCallback(async (manager: Profile) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Import the service functions
      const { sendVerificationEmailAsAdmin, sendVerificationEmail } = await import('../services/user-verification.service');
      
      let result = await sendVerificationEmailAsAdmin(manager.email, manager.user_id);
      
      if (!result.success && result.error === 'Client-side limitation') {
        setState(prev => ({ ...prev, loading: false }));
        toast({
          title: "⚠️ Admin Email Verification Limitation",
          description: result.message,
          variant: "default"
        });
        return;
      }
      
      if (!result.success) {
        console.log('Admin verification failed, trying regular verification...');
        result = await sendVerificationEmail(manager.email);
      }
      
      if (result.success) {
        if (result.message.includes('already verified in Appwrite Auth')) {
          const syncResult = await syncUserVerificationStatus(manager.user_id, manager.$id, true);
          
          setState(prev => ({ ...prev, loading: false }));
          
          if (syncResult.success) {
            // Refresh the managers list
            await fetchAllUsers();
            
            toast({
              title: "✅ User Already Verified",
              description: `${manager.email} is already verified in Appwrite Auth. Local database has been updated to match.`,
              variant: "default"
            });
          } else {
            toast({
              title: "⚠️ Already Verified in Auth",
              description: `${manager.email} is verified in Appwrite Auth but database sync failed. Please use the Sync button manually.`,
              variant: "default"
            });
          }
        } else {
          const collectionId = getCollectionIdForRole(manager.role);
          
          await databases.updateDocument(
            DATABASE_ID,
            collectionId,
            manager.$id,
            {
              status: 'Pending',
              updated_at: new Date().toISOString()
            }
          );

          setState(prev => ({ ...prev, loading: false }));
          
          toast({
            title: "✅ Verification Email Instructions",
            description: result.message,
            variant: "default"
          });
        }
      } else {
        setState(prev => ({ ...prev, loading: false }));
        
        if (result.error === 'SMTP not configured') {
          toast({
            title: "🚨 SMTP Configuration Required",
            description: "Email verification is not working because Appwrite email service is not configured. Please set up SMTP in your Appwrite console under Settings → SMTP.",
            variant: "destructive"
          });
        } else if (result.error === 'Not authenticated') {
          toast({
            title: "🔑 Authentication Required",
            description: "The user must be logged in to receive verification emails. Ask them to log in first.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "❌ Failed to Send Email",
            description: result.message,
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to send verification email' 
      }));
      toast({
        title: "❌ Email Send Failed",
        description: error.message || "Failed to send verification email. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  /**
   * Deactivate user account
   */
  const handleDeactivateUser = useCallback(async (manager: Profile) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const collectionId = getCollectionIdForRole(manager.role);
      
      await databases.updateDocument(
        DATABASE_ID,
        collectionId,
        manager.$id,
        {
          status: 'Deactivated',
          updated_at: new Date().toISOString()
        }
      );

      setState(prev => ({
        ...prev,
        managers: prev.managers.map(m => 
          m.$id === manager.$id ? { ...m, status: 'Deactivated' as const } : m
        ),
        loading: false
      }));
      
      toast({
        title: "User Deactivated",
        description: `${manager.first_name} ${manager.last_name} has been deactivated and cannot access the system`,
        variant: "default"
      });
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to deactivate user' 
      }));
      toast({
        title: "Deactivation Failed",
        description: error.message || "Failed to deactivate user",
        variant: "destructive"
      });
    }
  }, [toast]);

  /**
   * Reactivate deactivated user account
   */
  const handleReactivateUser = useCallback(async (manager: Profile) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const collectionId = getCollectionIdForRole(manager.role);
      
      await databases.updateDocument(
        DATABASE_ID,
        collectionId,
        manager.$id,
        {
          status: 'Verified',
          updated_at: new Date().toISOString()
        }
      );

      setState(prev => ({
        ...prev,
        managers: prev.managers.map(m => 
          m.$id === manager.$id ? { ...m, status: 'Verified' as const } : m
        ),
        loading: false
      }));
      
      toast({
        title: "User Reactivated",
        description: `${manager.first_name} ${manager.last_name} has been reactivated and can access the system`,
        variant: "default"
      });
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to reactivate user' 
      }));
      toast({
        title: "Reactivation Failed",
        description: error.message || "Failed to reactivate user",
        variant: "destructive"
      });
    }
  }, [toast]);

  /**
   * Sync user verification status between Appwrite Auth and local database
   */
  const handleSyncVerificationStatus = useCallback(async (manager: Profile) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      console.log(`🔄 Manual sync requested for user: ${manager.email}`);
      const result = await syncUserVerificationStatus(manager.user_id, manager.$id);
      
      if (result.success) {
        // Refresh the users list
        await fetchAllUsers();
        
        setState(prev => ({ ...prev, loading: false }));
        
        toast({
          title: "Sync Successful",
          description: result.message,
          variant: "default"
        });
      } else {
        setState(prev => ({ ...prev, loading: false }));
        toast({
          title: "Sync Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to sync verification status' 
      }));
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync verification status",
        variant: "destructive"
      });
    }
  }, [toast]);

  /**
   * Clean up duplicate users across all collections
   */
  const cleanupAllDuplicates = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      console.log('🧹 Starting comprehensive duplicate cleanup...');
      
      // Fetch from all role-based collections
      const [superAdminsResponse, shopManagersResponse, customersResponse] = await Promise.all([
        databases.listDocuments(DATABASE_ID, SUPER_ADMINS_COLLECTION_ID),
        databases.listDocuments(DATABASE_ID, SHOP_MANAGERS_COLLECTION_ID),
        databases.listDocuments(DATABASE_ID, CUSTOMERS_COLLECTION_ID)
      ]);
      
      // Create a map to track users by user_id and their collections
      const userCollectionMap = new Map<string, { collections: string[], docs: any[] }>();
      
      // Process super admins
      superAdminsResponse.documents.forEach(doc => {
        const userId = doc.user_id;
        if (!userCollectionMap.has(userId)) {
          userCollectionMap.set(userId, { collections: [], docs: [] });
        }
        userCollectionMap.get(userId)!.collections.push('super_admin');
        userCollectionMap.get(userId)!.docs.push({ ...doc, collection: 'super_admin' });
      });
      
      // Process shop managers
      shopManagersResponse.documents.forEach(doc => {
        const userId = doc.user_id;
        if (!userCollectionMap.has(userId)) {
          userCollectionMap.set(userId, { collections: [], docs: [] });
        }
        userCollectionMap.get(userId)!.collections.push('shop_manager');
        userCollectionMap.get(userId)!.docs.push({ ...doc, collection: 'shop_manager' });
      });
      
      // Process customers
      customersResponse.documents.forEach(doc => {
        const userId = doc.user_id;
        if (!userCollectionMap.has(userId)) {
          userCollectionMap.set(userId, { collections: [], docs: [] });
        }
        userCollectionMap.get(userId)!.collections.push('user');
        userCollectionMap.get(userId)!.docs.push({ ...doc, collection: 'user' });
      });
      
      // Find and clean up duplicates
      let duplicatesFound = 0;
      let duplicatesRemoved = 0;
      
      for (const [userId, userData] of userCollectionMap.entries()) {
        if (userData.collections.length > 1) {
          duplicatesFound++;
          console.log(`⚠️ User ${userId} found in multiple collections:`, userData.collections);
          
          // Determine the highest priority role (super_admin > shop_manager > user)
          let keepRole = 'user';
          if (userData.collections.includes('super_admin')) {
            keepRole = 'super_admin';
          } else if (userData.collections.includes('shop_manager')) {
            keepRole = 'shop_manager';
          }
          
          console.log(`📌 Keeping user ${userId} as ${keepRole}, removing from other collections`);
          
          // Remove from other collections
          for (const doc of userData.docs) {
            if (doc.collection !== keepRole) {
              try {
                const collectionId = getCollectionIdForRole(doc.collection);
                await databases.deleteDocument(DATABASE_ID, collectionId, doc.$id);
                duplicatesRemoved++;
                console.log(`🗑️ Removed user ${userId} from ${doc.collection} collection`);
              } catch (error: any) {
                console.error(`Error removing duplicate from ${doc.collection}:`, error);
              }
            }
          }
        }
      }
      
      console.log(`✅ Duplicate cleanup completed. Found: ${duplicatesFound}, Removed: ${duplicatesRemoved}`);
      
      // Refresh the user list
      await fetchAllUsers();
      
      toast({
        title: "Cleanup Complete",
        description: `Found ${duplicatesFound} duplicate users, removed ${duplicatesRemoved} duplicate entries`,
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error during duplicate cleanup:', error);
      setState(prev => ({ ...prev, loading: false }));
      toast({
        title: "Cleanup Failed",
        description: error.message || "Failed to clean up duplicates",
        variant: "destructive"
      });
    }
  }, [toast]);

  /**
   * Fetch all users from role-based collections
   */
  const fetchAllUsers = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Fetch from all role-based collections
      const [superAdminsResponse, shopManagersResponse, customersResponse] = await Promise.all([
        databases.listDocuments(DATABASE_ID, SUPER_ADMINS_COLLECTION_ID),
        databases.listDocuments(DATABASE_ID, SHOP_MANAGERS_COLLECTION_ID),
        databases.listDocuments(DATABASE_ID, CUSTOMERS_COLLECTION_ID)
      ]);
      
             // Combine all users and add role information with proper field mapping
       const allUsers: Profile[] = [
         ...superAdminsResponse.documents.map(doc => normalizeProfileForDisplay({ ...doc, role: 'super_admin' })),
         ...shopManagersResponse.documents.map(doc => normalizeProfileForDisplay({ ...doc, role: 'shop_manager' })),
         ...customersResponse.documents.map(doc => normalizeProfileForDisplay({ ...doc, role: 'user' }))
       ];
       
       // Remove duplicates based on user_id (keep the highest priority role)
       const uniqueUsers = new Map<string, Profile>();
       const rolePriority = { 'super_admin': 3, 'shop_manager': 2, 'user': 1 };
       
       allUsers.forEach(user => {
         const existingUser = uniqueUsers.get(user.user_id);
         if (!existingUser || rolePriority[user.role] > rolePriority[existingUser.role]) {
           uniqueUsers.set(user.user_id, user);
         }
       });
       
              const deduplicatedUsers = Array.from(uniqueUsers.values());
       
       // Log if duplicates were found and removed
       if (allUsers.length !== deduplicatedUsers.length) {
         console.log(`🔍 Found and removed ${allUsers.length - deduplicatedUsers.length} duplicate users from display`);
       }
       
      setState(prev => ({
        ...prev,
        managers: deduplicatedUsers,
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
    }
  }, []);

  // Fetch all users on component mount
  useEffect(() => {
    fetchAllUsers();
    // Initialize permissions service
    permissionsService.initialize().catch(console.error);
  }, [fetchAllUsers]);

  const { buttonBg, tableBg, inputBg, dangerButtonBg, borderColor, tableHeaderBg, cancelButtonBg, cardBg } = themeClasses;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage administrators and system permissions
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
        <button
                onClick={() => setActiveTab('managers')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'managers'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
                <UserPlus className="inline-block w-4 h-4 mr-2" />
                Manage Users
        </button>
        <button
                onClick={() => setActiveTab('permissions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'permissions'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
                <Shield className="inline-block w-4 h-4 mr-2" />
                Permissions
        </button>
            </nav>
          </div>
      </div>

        {/* Content */}
        {activeTab === 'managers' && (
          <div className={`${cardBg} rounded-lg shadow p-6`}>
            {/* Managers Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  User Account Management
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Manage all user accounts with simplified status system: Pending (needs verification), Verified (active access), and Deactivated (blocked access).
                </p>
              </div>
              <button
                onClick={() => setShowAddManager(true)}
                className={`${buttonBg} text-white px-4 py-2 rounded-lg flex items-center gap-2`}
              >
                <UserPlus className="w-4 h-4" />
                Add User
              </button>
            </div>

            {/* Search and Bulk Actions */}
            <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${inputBg} ${borderColor} border rounded-lg px-4 py-2 w-full max-w-md`}
              />
              
              {/* Bulk Actions */}
              <div className="flex gap-2">
                {selectedUsers.length > 0 && (
                  <div className="flex items-center gap-2 mr-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedUsers.length} selected
                    </span>
                    <button
                      onClick={() => setShowBulkDeleteConfirm(true)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
                      title="Delete Selected Users"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Selected
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowVerificationGuide(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
                  title="View User Verification Guide"
                >
                  <HelpCircle className="w-4 h-4" />
                  Guide
                </button>
                <button
                  onClick={async () => {
                    setState(prev => ({ ...prev, loading: true }));
                    try {
                      // Refresh all users using the new function
                      await fetchAllUsers();
                      toast({
                        title: "Refreshed",
                        description: "User list has been refreshed",
                        variant: "default"
                      });
                    } catch (error: any) {
                      setState(prev => ({ ...prev, loading: false }));
                      toast({
                        title: "Refresh Failed",
                        description: error.message || "Failed to refresh user list",
                        variant: "destructive"
                      });
                    }
                  }}
                  className={`${buttonBg} text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <button
                  onClick={cleanupAllDuplicates}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
                  title="Clean up duplicate users across collections"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Clean Duplicates
                </button>
              </div>
            </div>

            {/* Managers Table */}
            {state.loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : state.error ? (
              <div className="text-red-600 dark:text-red-400 py-4">
                Error: {state.error}
              </div>
            ) : (
            <div className="overflow-x-auto">
                <table className={`min-w-full ${tableBg}`}>
                  <thead className={tableHeaderBg}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredManagers.length && filteredManagers.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                  </tr>
                </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredManagers.map((manager) => (
                      <tr key={`${manager.$id}-${manager.role}`} className={selectedUsers.includes(manager.$id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(manager.$id)}
                            onChange={(e) => handleSelectUser(manager.$id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {manager.full_name || `${manager.first_name || ''} ${manager.last_name || ''}`.trim() || 'Unknown User'}
                          </div>
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {manager.email || 'No email'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            (manager.role || 'user') === 'super_admin' 
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                              : (manager.role || 'user') === 'shop_manager'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                          {(manager.role || 'user') === 'user' ? 'Customer' : manager.role === 'super_admin' ? 'Super Admin' : manager.role === 'shop_manager' ? 'Shop Manager' : manager.role}
                        </span>
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            manager.status === 'Verified' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : manager.status === 'Pending'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                              : manager.status === 'Deactivated'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                          {manager.status || 'Pending'}
                        </span>
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            {/* Verify Pending User Button */}
                            {manager.status === 'Pending' && (
                              <button
                                onClick={() => handleVerifyUser(manager)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                title="Verify User"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            
                            {/* Deactivate Verified User Button */}
                            {manager.status === 'Verified' && (
                              <button
                                onClick={() => handleDeactivateUser(manager)}
                                className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                                title="Deactivate User"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                            
                            {/* Reactivate Deactivated User Button */}
                            {manager.status === 'Deactivated' && (
                              <button
                                onClick={() => handleReactivateUser(manager)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                title="Reactivate User"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            )}
                             
                             {/* Sync Verification Status */}
                             <button
                               onClick={() => handleSyncVerificationStatus(manager)}
                               className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                               title="Sync Verification Status with Auth"
                             >
                               <RefreshCw className="w-4 h-4" />
                             </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => handleEditManager(manager)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Edit User"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            
                            {/* Delete Button */}
                            <button
                              onClick={() => setConfirmDelete(manager.$id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        )}
      </div>
        )}

        {/* Permissions Content */}
        {activeTab === 'permissions' && (
          <div className={`${cardBg} rounded-lg shadow p-6`}>
            {/* Permissions Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                System Permissions
              </h2>
              <button
                onClick={() => setShowPermissionConfig(true)}
                className={`${themeClasses.buttonBg} text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:shadow-lg transition-all`}
              >
                <Settings className="w-4 h-4" />
                Configure Permissions
              </button>
            </div>

            {/* Permissions Overview */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Role Cards */}
                {Object.values(ROLES).map((role) => {
                  const count = state.managers.filter(m => m.role === role).length;
                  const colorConfig = role === ROLES.SUPER_ADMIN 
                    ? { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' }
                    : role === ROLES.SHOP_MANAGER 
                    ? { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' }
                    : { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' };
                  
                  return (
                    <div key={role} className={`${themeClasses.cardBg} border ${themeClasses.borderColor} rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer`}
                         onClick={() => setShowPermissionConfig(true)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {ROLE_LABELS[role]}
                          </h3>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {count}
                          </p>
                        </div>
                        <div className={`p-2 rounded-full ${colorConfig.bg}`}>
                          <Shield className={`w-5 h-5 ${colorConfig.text}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Permission Matrix Preview */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Permission Overview</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Current permission structure (read-only preview)
                  </p>
                </div>
                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Products
                          </th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Orders
                          </th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Users
                          </th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Analytics
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {Object.values(ROLES).map((role, index) => {
                          const summary = permissionsService.getPermissionSummary(role);
                          const roleColor = role === ROLES.SUPER_ADMIN 
                            ? 'text-purple-600 dark:text-purple-400'
                            : role === ROLES.SHOP_MANAGER 
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-green-600 dark:text-green-400';
                          
                          return (
                            <tr key={role}>
                              <td className={`py-2 px-3 text-sm font-medium ${roleColor}`}>
                                {ROLE_LABELS[role]}
                              </td>
                              <td className="py-2 px-3 text-sm text-gray-900 dark:text-white">
                                {summary[RESOURCE_TYPES.PRODUCTS]}
                              </td>
                              <td className="py-2 px-3 text-sm text-gray-900 dark:text-white">
                                {summary[RESOURCE_TYPES.ORDERS]}
                              </td>
                              <td className="py-2 px-3 text-sm text-gray-900 dark:text-white">
                                {summary[RESOURCE_TYPES.USERS]}
                              </td>
                              <td className="py-2 px-3 text-sm text-gray-900 dark:text-white">
                                {summary[RESOURCE_TYPES.ANALYTICS]}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Live Permission Status */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                      Live Permission System
                    </h3>
                    <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                      <p>
                        The permission system is now active and enforcing role-based access control across all system resources.
                        Use the "Configure Permissions" button above to modify role permissions in real-time.
                      </p>
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>• Real-time permission enforcement</li>
                        <li>• Role-based access control (RBAC)</li>
                        <li>• Granular resource permissions</li>
                        <li>• Instant permission updates</li>
                      </ul>
                    </div>
                    <div className="mt-4">
                      <div className="-mx-2 -my-1.5 flex gap-2">
                        <button 
                          type="button" 
                          className="bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-md text-sm font-medium text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          onClick={() => setShowPermissionConfig(true)}
                        >
                          Configure Now
                        </button>
                        <button 
                          type="button" 
                          className="bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-md text-sm font-medium text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          onClick={async () => {
                            await permissionsService.initialize();
                            toast({
                              title: "Permissions Refreshed",
                              description: "Permission system has been reloaded successfully.",
                              variant: "default"
                            });
                          }}
                        >
                          Refresh System
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Manager Modal */}
        {showEditManager && editingManager && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${cardBg} rounded-lg p-6 w-full max-w-md mx-4`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Edit User
                </h3>
                <button
                  onClick={() => {
                    setShowEditManager(false);
                    setEditingManager(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                handleUpdateManager(editingManager.$id, {
                  first_name: editingManager.first_name,
                  last_name: editingManager.last_name,
                  full_name: editingManager.full_name,
                  email: editingManager.email,
                  phone: editingManager.phone, // Use 'phone' to match database schema
                  role: editingManager.role, // Re-enabled - role changes now properly handled
                  status: editingManager.status,
                  updated_at: new Date().toISOString()
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editingManager.full_name || ''}
                      onChange={(e) => setEditingManager(prev => prev ? {...prev, full_name: e.target.value} : null)}
                      className={`${inputBg} ${borderColor} border rounded-lg px-3 py-2 w-full`}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editingManager.email || ''}
                      onChange={(e) => setEditingManager(prev => prev ? {...prev, email: e.target.value} : null)}
                      className={`${inputBg} ${borderColor} border rounded-lg px-3 py-2 w-full`}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editingManager.phone || ''}
                      onChange={(e) => setEditingManager(prev => prev ? {...prev, phone: e.target.value} : null)}
                      className={`${inputBg} ${borderColor} border rounded-lg px-3 py-2 w-full`}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role
                    </label>
                    <select
                      value={editingManager.role}
                      onChange={(e) => setEditingManager(prev => prev ? {...prev, role: e.target.value as any} : null)}
                      className={`${inputBg} ${borderColor} border rounded-lg px-3 py-2 w-full`}
                    >
                      <option value="shop_manager">Shop Manager</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="user">Customer</option>
                    </select>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      ℹ️ Role changes will move the user between database collections
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={editingManager.status || 'Pending'}
                      onChange={(e) => setEditingManager(prev => prev ? {...prev, status: e.target.value as any} : null)}
                      className={`${inputBg} ${borderColor} border rounded-lg px-3 py-2 w-full`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Verified">Verified</option>
                      <option value="Deactivated">Deactivated</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={state.loading}
                    className={`${buttonBg} text-white px-4 py-2 rounded-lg flex-1 disabled:opacity-50`}
                  >
                    {state.loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Update User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditManager(false);
                      setEditingManager(null);
                    }}
                    className={`${cancelButtonBg} text-white px-4 py-2 rounded-lg flex-1`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Manager Modal */}
      {showAddManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${cardBg} rounded-lg p-6 w-full max-w-md mx-4`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add User
                </h3>
              <button
                onClick={() => setShowAddManager(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
              
              <form onSubmit={handleAddManager}>
                <div className="space-y-4">
                      <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                      value={formInput.full_name}
                      onChange={(e) => handleFormChange('full_name', e.target.value)}
                      className={`${inputBg} ${borderColor} border rounded-lg px-3 py-2 w-full`}
                  required
                  placeholder="Enter full name"
                />
              </div>
                  
              <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                      value={formInput.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      className={`${inputBg} ${borderColor} border rounded-lg px-3 py-2 w-full`}
                  required
                />
              </div>
                  
              <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                      value={formInput.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                      className={`${inputBg} ${borderColor} border rounded-lg px-3 py-2 w-full`}
                  required
                    />
              </div>
                  
              <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                      value={formInput.role}
                      onChange={(e) => handleFormChange('role', e.target.value)}
                      className={`${inputBg} ${borderColor} border rounded-lg px-3 py-2 w-full`}
                >
                  <option value="shop_manager">Shop Manager</option>
                      <option value="super_admin">Super Admin</option>
                  <option value="user">Customer</option>
                </select>
              </div>
                  
              <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password
                </label>
                <input
                      type="password"
                      value={formInput.password}
                      onChange={(e) => handleFormChange('password', e.target.value)}
                      className={`${inputBg} ${borderColor} border rounded-lg px-3 py-2 w-full`}
                  required
                      minLength={8}
                />
              </div>
              </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={state.loading}
                    className={`${buttonBg} text-white px-4 py-2 rounded-lg flex-1 disabled:opacity-50`}
                  >
                    {state.loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Add User'}
                  </button>
                <button
                  type="button"
                    onClick={() => setShowAddManager(false)}
                    className={`${cancelButtonBg} text-white px-4 py-2 rounded-lg flex-1`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${cardBg} rounded-lg p-6 w-full max-w-md mx-4`}>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Confirm Delete
                </h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
          <button 
                  onClick={() => handleDeleteManager(confirmDelete)}
                  disabled={state.loading}
                  className={`${dangerButtonBg} text-white px-4 py-2 rounded-lg flex-1 disabled:opacity-50`}
                >
                  {state.loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className={`${cancelButtonBg} text-white px-4 py-2 rounded-lg flex-1`}
                >
                  Cancel
          </button>
              </div>
            </div>
        </div>
      )}

        {/* User Verification Guide Modal */}
        {showVerificationGuide && (
          <UserVerificationGuide onClose={() => setShowVerificationGuide(false)} />
        )}

        {/* Permission Configuration Modal */}
        <PermissionConfigModal
          isOpen={showPermissionConfig}
          onClose={() => setShowPermissionConfig(false)}
        />

        {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${cardBg} rounded-lg p-6 w-full max-w-md mx-4`}>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Confirm Bulk Delete
                </h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete {selectedUsers.length} selected user(s)? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleBulkDelete}
                  disabled={state.loading}
                  className={`${dangerButtonBg} text-white px-4 py-2 rounded-lg flex-1 disabled:opacity-50`}
                >
                  {state.loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Delete ${selectedUsers.length} Users`}
                </button>
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className={`${cancelButtonBg} text-white px-4 py-2 rounded-lg flex-1`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdmin;
