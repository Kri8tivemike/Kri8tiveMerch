/**
 * usePermissions Hook
 * Provides easy access to permission checking functionality
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { permissionsService } from '../services/permissions.service';
import {
  RESOURCE_TYPES,
  PERMISSION_TYPES,
  PERMISSION_LEVELS,
  type ResourceType,
  type PermissionType,
  type PermissionLevel,
  type RoleType
} from '../constants/permissions';

/**
 * Permission checking hook
 * Provides methods to check if current user has specific permissions
 */
export const usePermissions = () => {
  const { user, profile } = useAuth();

  // Get current user's role
  const userRole = useMemo(() => {
    return (profile?.role || 'user') as RoleType;
  }, [profile?.role]);

  /**
   * Check if user has permission for specific action on resource
   */
  const hasPermission = useCallback((
    resource: ResourceType,
    action: PermissionType,
    requiredLevel?: PermissionLevel
  ): boolean => {
    if (!userRole) return false;
    return permissionsService.canPerform(userRole, resource, action);
  }, [userRole]);

  /**
   * Get user's permission level for a resource
   */
  const getPermissionLevel = useCallback((resource: ResourceType): PermissionLevel => {
    if (!userRole) return PERMISSION_LEVELS.NONE;
    return permissionsService.getPermissionLevel(userRole, resource);
  }, [userRole]);

  /**
   * Check if user can create resources
   */
  const canCreate = useCallback((resource: ResourceType): boolean => {
    return hasPermission(resource, PERMISSION_TYPES.CREATE);
  }, [hasPermission]);

  /**
   * Check if user can read/view resources
   */
  const canRead = useCallback((resource: ResourceType): boolean => {
    return hasPermission(resource, PERMISSION_TYPES.READ);
  }, [hasPermission]);

  /**
   * Check if user can update resources
   */
  const canUpdate = useCallback((resource: ResourceType): boolean => {
    return hasPermission(resource, PERMISSION_TYPES.UPDATE);
  }, [hasPermission]);

  /**
   * Check if user can delete resources
   */
  const canDelete = useCallback((resource: ResourceType): boolean => {
    return hasPermission(resource, PERMISSION_TYPES.DELETE);
  }, [hasPermission]);

  /**
   * Check if user has manage permissions (full CRUD)
   */
  const canManage = useCallback((resource: ResourceType): boolean => {
    return hasPermission(resource, PERMISSION_TYPES.MANAGE);
  }, [hasPermission]);

  /**
   * Check if user is admin (Super Admin)
   */
  const isAdmin = useCallback((): boolean => {
    return permissionsService.isAdmin(userRole);
  }, [userRole]);

  /**
   * Check if user is manager or above
   */
  const isManagerOrAbove = useCallback((): boolean => {
    return permissionsService.isManagerOrAbove(userRole);
  }, [userRole]);

  /**
   * Specific permission checks for common use cases
   */
  const permissions = useMemo(() => ({
    // Product permissions
    products: {
      canView: canRead(RESOURCE_TYPES.PRODUCTS),
      canCreate: canCreate(RESOURCE_TYPES.PRODUCTS),
      canEdit: canUpdate(RESOURCE_TYPES.PRODUCTS),
      canDelete: canDelete(RESOURCE_TYPES.PRODUCTS),
      canManage: canManage(RESOURCE_TYPES.PRODUCTS)
    },

    // Order permissions
    orders: {
      canView: canRead(RESOURCE_TYPES.ORDERS),
      canCreate: canCreate(RESOURCE_TYPES.ORDERS),
      canEdit: canUpdate(RESOURCE_TYPES.ORDERS),
      canDelete: canDelete(RESOURCE_TYPES.ORDERS),
      canManage: canManage(RESOURCE_TYPES.ORDERS)
    },

    // User permissions
    users: {
      canView: canRead(RESOURCE_TYPES.USERS),
      canCreate: canCreate(RESOURCE_TYPES.USERS),
      canEdit: canUpdate(RESOURCE_TYPES.USERS),
      canDelete: canDelete(RESOURCE_TYPES.USERS),
      canManage: canManage(RESOURCE_TYPES.USERS)
    },

    // Analytics permissions
    analytics: {
      canView: canRead(RESOURCE_TYPES.ANALYTICS),
      canManage: canManage(RESOURCE_TYPES.ANALYTICS)
    },

    // System permissions
    system: {
      canManage: canManage(RESOURCE_TYPES.SYSTEM),
      canConfigurePermissions: isAdmin()
    },

    // Customization permissions
    customizations: {
      canView: canRead(RESOURCE_TYPES.CUSTOMIZATIONS),
      canCreate: canCreate(RESOURCE_TYPES.CUSTOMIZATIONS),
      canEdit: canUpdate(RESOURCE_TYPES.CUSTOMIZATIONS),
      canDelete: canDelete(RESOURCE_TYPES.CUSTOMIZATIONS),
      canManage: canManage(RESOURCE_TYPES.CUSTOMIZATIONS)
    }
  }), [canRead, canCreate, canUpdate, canDelete, canManage, isAdmin]);

  /**
   * Get detailed permission info
   */
  const getPermissionInfo = useCallback((
    resource: ResourceType,
    action: PermissionType
  ) => {
    return permissionsService.hasPermission(userRole, resource, action);
  }, [userRole]);

  return {
    // Basic permission checks
    hasPermission,
    getPermissionLevel,
    getPermissionInfo,

    // CRUD operations
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canManage,

    // Role checks
    isAdmin,
    isManagerOrAbove,
    userRole,

    // Structured permissions
    permissions,

    // User info
    isAuthenticated: !!user,
    userId: user?.id,
    userEmail: user?.email
  };
};

export default usePermissions; 