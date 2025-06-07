import { databases, account, ID, Query } from '../lib/appwrite';

// Database and collection IDs
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
const CUSTOMERS_COLLECTION_ID = 'customers';
const SHOP_MANAGERS_COLLECTION_ID = 'shop_managers';
const SUPER_ADMINS_COLLECTION_ID = 'super_admins';

// Type definitions for each user role
export interface Customer {
  $id?: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone?: string;
  whatsapp_number?: string;
  delivery_address?: string;
  avatar_url?: string;
  status: 'Pending' | 'Verified' | 'Deactivated';
  email_verified?: boolean;
  preferences?: string; // JSON string
  total_orders?: number;
  total_spent?: number;
  created_at: string;
  updated_at: string;
}

export interface ShopManager {
  $id?: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  status: 'Pending' | 'Verified' | 'Deactivated';
  email_verified?: boolean;
  department?: string;
  permissions?: string; // JSON string
  assigned_shop_id?: string;
  hire_date?: string;
  last_login?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SuperAdmin {
  $id?: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  status: 'Pending' | 'Verified' | 'Deactivated';
  email_verified?: boolean;
  super_admin_level: 'System' | 'Business' | 'Technical';
  permissions?: string; // JSON string
  security_clearance?: number;
  two_factor_enabled?: boolean;
  last_login?: string;
  last_password_change?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Customer Management Functions
 */
export const customerService = {
  /**
   * Create a new customer profile
   */
  async create(customerData: Omit<Customer, '$id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    try {
      const now = new Date().toISOString();
      const customer = await databases.createDocument(
        DATABASE_ID,
        CUSTOMERS_COLLECTION_ID,
        ID.unique(),
        {
          ...customerData,
          full_name: customerData.full_name || `${customerData.first_name} ${customerData.last_name}`,
          total_orders: customerData.total_orders || 0,
          total_spent: customerData.total_spent || 0,
          email_verified: customerData.email_verified || false,
          created_at: now,
          updated_at: now
        }
      );
      return customer as Customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  /**
   * Get customer by user ID
   */
  async getByUserId(userId: string): Promise<Customer | null> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        CUSTOMERS_COLLECTION_ID,
        [Query.equal('user_id', userId)]
      );
      return result.documents.length > 0 ? result.documents[0] as Customer : null;
    } catch (error) {
      console.error('Error getting customer by user ID:', error);
      throw error;
    }
  },

  /**
   * Update customer profile
   */
  async update(customerId: string, updates: Partial<Customer>): Promise<Customer> {
    try {
      const customer = await databases.updateDocument(
        DATABASE_ID,
        CUSTOMERS_COLLECTION_ID,
        customerId,
        {
          ...updates,
          updated_at: new Date().toISOString()
        }
      );
      return customer as Customer;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  /**
   * List all customers with pagination
   */
  async list(limit = 25, offset = 0): Promise<{ customers: Customer[]; total: number }> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        CUSTOMERS_COLLECTION_ID,
        [Query.limit(limit), Query.offset(offset), Query.orderDesc('created_at')]
      );
      return {
        customers: result.documents as Customer[],
        total: result.total
      };
    } catch (error) {
      console.error('Error listing customers:', error);
      throw error;
    }
  },

  /**
   * Update customer order statistics
   */
  async updateOrderStats(userId: string, orderAmount: number): Promise<void> {
    try {
      const customer = await this.getByUserId(userId);
      if (customer) {
        await this.update(customer.$id!, {
          total_orders: (customer.total_orders || 0) + 1,
          total_spent: (customer.total_spent || 0) + orderAmount
        });
      }
    } catch (error) {
      console.error('Error updating customer order stats:', error);
      throw error;
    }
  }
};

/**
 * Shop Manager Management Functions
 */
export const shopManagerService = {
  /**
   * Create a new shop manager profile
   */
  async create(managerData: Omit<ShopManager, '$id' | 'created_at' | 'updated_at'>): Promise<ShopManager> {
    try {
      const now = new Date().toISOString();
      const manager = await databases.createDocument(
        DATABASE_ID,
        SHOP_MANAGERS_COLLECTION_ID,
        ID.unique(),
        {
          ...managerData,
          full_name: managerData.full_name || `${managerData.first_name} ${managerData.last_name}`,
          email_verified: managerData.email_verified || false,
          is_active: managerData.is_active !== undefined ? managerData.is_active : true,
          created_at: now,
          updated_at: now
        }
      );
      return manager as ShopManager;
    } catch (error) {
      console.error('Error creating shop manager:', error);
      throw error;
    }
  },

  /**
   * Get shop manager by user ID
   */
  async getByUserId(userId: string): Promise<ShopManager | null> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        SHOP_MANAGERS_COLLECTION_ID,
        [Query.equal('user_id', userId)]
      );
      return result.documents.length > 0 ? result.documents[0] as ShopManager : null;
    } catch (error) {
      console.error('Error getting shop manager by user ID:', error);
      throw error;
    }
  },

  /**
   * Update shop manager profile
   */
  async update(managerId: string, updates: Partial<ShopManager>): Promise<ShopManager> {
    try {
      const manager = await databases.updateDocument(
        DATABASE_ID,
        SHOP_MANAGERS_COLLECTION_ID,
        managerId,
        {
          ...updates,
          updated_at: new Date().toISOString()
        }
      );
      return manager as ShopManager;
    } catch (error) {
      console.error('Error updating shop manager:', error);
      throw error;
    }
  },

  /**
   * List all shop managers with pagination
   */
  async list(limit = 25, offset = 0): Promise<{ managers: ShopManager[]; total: number }> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        SHOP_MANAGERS_COLLECTION_ID,
        [Query.limit(limit), Query.offset(offset), Query.orderDesc('created_at')]
      );
      return {
        managers: result.documents as ShopManager[],
        total: result.total
      };
    } catch (error) {
      console.error('Error listing shop managers:', error);
      throw error;
    }
  },

  /**
   * Update last login time
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      const manager = await this.getByUserId(userId);
      if (manager) {
        await this.update(manager.$id!, {
          last_login: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating shop manager last login:', error);
      throw error;
    }
  }
};

/**
 * Super Admin Management Functions
 */
export const superAdminService = {
  /**
   * Create a new super admin profile
   */
  async create(adminData: Omit<SuperAdmin, '$id' | 'created_at' | 'updated_at'>): Promise<SuperAdmin> {
    try {
      const now = new Date().toISOString();
      const admin = await databases.createDocument(
        DATABASE_ID,
        SUPER_ADMINS_COLLECTION_ID,
        ID.unique(),
        {
          ...adminData,
          full_name: adminData.full_name || `${adminData.first_name} ${adminData.last_name}`,
          email_verified: adminData.email_verified !== undefined ? adminData.email_verified : true,
          security_clearance: adminData.security_clearance || 5,
          two_factor_enabled: adminData.two_factor_enabled !== undefined ? adminData.two_factor_enabled : true,
          is_active: adminData.is_active !== undefined ? adminData.is_active : true,
          created_at: now,
          updated_at: now
        }
      );
      return admin as SuperAdmin;
    } catch (error) {
      console.error('Error creating super admin:', error);
      throw error;
    }
  },

  /**
   * Get super admin by user ID
   */
  async getByUserId(userId: string): Promise<SuperAdmin | null> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        SUPER_ADMINS_COLLECTION_ID,
        [Query.equal('user_id', userId)]
      );
      return result.documents.length > 0 ? result.documents[0] as SuperAdmin : null;
    } catch (error) {
      console.error('Error getting super admin by user ID:', error);
      throw error;
    }
  },

  /**
   * Update super admin profile
   */
  async update(adminId: string, updates: Partial<SuperAdmin>): Promise<SuperAdmin> {
    try {
      const admin = await databases.updateDocument(
        DATABASE_ID,
        SUPER_ADMINS_COLLECTION_ID,
        adminId,
        {
          ...updates,
          updated_at: new Date().toISOString()
        }
      );
      return admin as SuperAdmin;
    } catch (error) {
      console.error('Error updating super admin:', error);
      throw error;
    }
  },

  /**
   * List all super admins with pagination
   */
  async list(limit = 25, offset = 0): Promise<{ admins: SuperAdmin[]; total: number }> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        SUPER_ADMINS_COLLECTION_ID,
        [Query.limit(limit), Query.offset(offset), Query.orderDesc('created_at')]
      );
      return {
        admins: result.documents as SuperAdmin[],
        total: result.total
      };
    } catch (error) {
      console.error('Error listing super admins:', error);
      throw error;
    }
  },

  /**
   * Update last login and password change times
   */
  async updateSecurityInfo(userId: string, type: 'login' | 'password'): Promise<void> {
    try {
      const admin = await this.getByUserId(userId);
      if (admin) {
        const updates: Partial<SuperAdmin> = {};
        if (type === 'login') {
          updates.last_login = new Date().toISOString();
        } else if (type === 'password') {
          updates.last_password_change = new Date().toISOString();
        }
        
        await this.update(admin.$id!, updates);
      }
    } catch (error) {
      console.error('Error updating super admin security info:', error);
      throw error;
    }
  }
};

/**
 * Universal User Role Service
 * Determines user role and routes to appropriate service
 */
export const userRoleService = {
  /**
   * Get user role and profile from any collection
   */
  async getUserRoleAndProfile(userId: string): Promise<{
    role: 'customer' | 'shop_manager' | 'super_admin' | null;
    profile: Customer | ShopManager | SuperAdmin | null;
  }> {
    try {
      // Check super admin first (highest priority)
      const superAdmin = await superAdminService.getByUserId(userId);
      if (superAdmin) {
        return { role: 'super_admin', profile: superAdmin };
      }

      // Check shop manager
      const shopManager = await shopManagerService.getByUserId(userId);
      if (shopManager) {
        return { role: 'shop_manager', profile: shopManager };
      }

      // Check customer
      const customer = await customerService.getByUserId(userId);
      if (customer) {
        return { role: 'customer', profile: customer };
      }

      return { role: null, profile: null };
    } catch (error) {
      console.error('Error getting user role and profile:', error);
      throw error;
    }
  },

  /**
   * Create user profile in appropriate collection based on role
   */
  async createUserProfile(
    userData: {
      user_id: string;
      email: string;
      first_name: string;
      last_name: string;
      phone?: string;
    },
    role: 'customer' | 'shop_manager' | 'super_admin',
    additionalData: any = {}
  ): Promise<Customer | ShopManager | SuperAdmin> {
    try {
      const baseData = {
        user_id: userData.user_id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        status: 'Pending' as const,
        ...additionalData
      };

      switch (role) {
        case 'customer':
          return await customerService.create(baseData);
        case 'shop_manager':
          return await shopManagerService.create(baseData);
        case 'super_admin':
          return await superAdminService.create({
            ...baseData,
            super_admin_level: additionalData.super_admin_level || 'Business',
            status: 'Verified' as const
          });
        default:
          throw new Error(`Unknown role: ${role}`);
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  /**
   * Get current user's role and profile
   */
  async getCurrentUserRoleAndProfile(): Promise<{
    role: 'customer' | 'shop_manager' | 'super_admin' | null;
    profile: Customer | ShopManager | SuperAdmin | null;
  }> {
    try {
      const user = await account.get();
      return await this.getUserRoleAndProfile(user.$id);
    } catch (error) {
      console.error('Error getting current user role and profile:', error);
      return { role: null, profile: null };
    }
  }
};

// Export individual services and types
export {
  customerService as customers,
  shopManagerService as shopManagers,
  superAdminService as superAdmins,
  userRoleService as userRoles
}; 