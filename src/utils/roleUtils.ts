import { USER_ROLES, USER_STATUS, ROLE_HIERARCHY, ROLE_PERMISSIONS } from '../constants/auth';

/**
 * Role Management Utilities
 * Centralized functions for role checking, permission validation, and status management
 */

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];

/**
 * Check if a user has a specific role or higher
 */
export const hasRoleOrHigher = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
};

/**
 * Check if a user has permission for a specific action
 */
export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  
  // Check for wildcard permissions (super admin)
  if (userPermissions.includes('read:*') || userPermissions.includes('write:*') || userPermissions.includes('delete:*')) {
    return true;
  }
  
  return userPermissions.includes(permission);
};

/**
 * Check if user can access specific roles (for admin interfaces)
 */
export const canManageRole = (managerRole: UserRole, targetRole: UserRole): boolean => {
  // Super admin can manage all roles
  if (managerRole === USER_ROLES.SUPER_ADMIN) {
    return true;
  }
  
  // Shop managers can only manage customers
  if (managerRole === USER_ROLES.SHOP_MANAGER && targetRole === USER_ROLES.CUSTOMER) {
    return true;
  }
  
  return false;
};

/**
 * Get the appropriate redirect path for a user based on their role
 */
export const getDefaultRouteForRole = (role: UserRole): string => {
  switch (role) {
    case USER_ROLES.SUPER_ADMIN:
      return '/super-admin';
    case USER_ROLES.SHOP_MANAGER:
      return '/shop-manager';
    case USER_ROLES.CUSTOMER:
      return '/account';
    default:
      return '/';
  }
};

/**
 * Check if user status allows access (updated for simplified status system)
 */
export const isUserActive = (status: UserStatus): boolean => {
  return status === USER_STATUS.VERIFIED;
};

/**
 * Check if user needs approval (for shop managers)
 */
export const needsApproval = (role: UserRole, status: UserStatus): boolean => {
  return role === USER_ROLES.SHOP_MANAGER && status === USER_STATUS.PENDING;
};

/**
 * Get user-friendly role display name
 */
export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case USER_ROLES.SUPER_ADMIN:
      return 'Super Admin';
    case USER_ROLES.SHOP_MANAGER:
      return 'Shop Manager';
    case USER_ROLES.CUSTOMER:
      return 'Customer';
    default:
      return 'User';
  }
};

/**
 * Get user-friendly status display name (updated for simplified status system)
 */
export const getStatusDisplayName = (status: UserStatus): string => {
  switch (status) {
    case USER_STATUS.VERIFIED:
      return 'Verified';
    case USER_STATUS.PENDING:
      return 'Pending';
    case USER_STATUS.DEACTIVATED:
      return 'Deactivated';
    default:
      return 'Unknown';
  }
};

/**
 * Get status color for UI display (updated for simplified status system)
 */
export const getStatusColor = (status: UserStatus): { bg: string; text: string } => {
  switch (status) {
    case USER_STATUS.VERIFIED:
      return { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-200' };
    case USER_STATUS.PENDING:
      return { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-800 dark:text-orange-200' };
    case USER_STATUS.DEACTIVATED:
      return { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-200' };
    default:
      return { bg: 'bg-gray-100 dark:bg-gray-900/20', text: 'text-gray-800 dark:text-gray-200' };
  }
};

/**
 * Get role color for UI display
 */
export const getRoleColor = (role: UserRole): { bg: string; text: string } => {
  switch (role) {
    case USER_ROLES.SUPER_ADMIN:
      return { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-800 dark:text-purple-200' };
    case USER_ROLES.SHOP_MANAGER:
      return { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-800 dark:text-blue-200' };
    case USER_ROLES.CUSTOMER:
      return { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-200' };
    default:
      return { bg: 'bg-gray-100 dark:bg-gray-900/20', text: 'text-gray-800 dark:text-gray-200' };
  }
};

/**
 * Validate role assignment permissions
 */
export const canAssignRole = (assigner: UserRole, targetRole: UserRole): boolean => {
  // Super admin can assign any role
  if (assigner === USER_ROLES.SUPER_ADMIN) {
    return true;
  }
  
  // Shop manager can only assign customer role
  if (assigner === USER_ROLES.SHOP_MANAGER && targetRole === USER_ROLES.CUSTOMER) {
    return true;
  }
  
  return false;
}; 