/**
 * Permissions Service
 * Handles all permission-related operations including role checking,
 * permission validation, and permission management
 */


// Database ID
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
import { 
  ROLES, 
  PERMISSION_LEVELS,
  DEFAULT_PERMISSIONS,
  ACTION_PERMISSIONS,
  type RoleType,
  type ResourceType,
  type PermissionType,
  type PermissionLevel
} from '../constants/permissions';

// Permission interfaces
export interface UserPermission {
  role: RoleType;
  resource: ResourceType;
  permission: PermissionLevel;
  actions: PermissionType[];
}

export interface RolePermissions {
  role: RoleType;
  permissions: Record<ResourceType, PermissionLevel>;
}

export interface PermissionCheck {
  hasPermission: boolean;
  level: PermissionLevel;
  requiredLevel?: PermissionLevel;
  message?: string;
}

export interface SystemPermissions {
  roles: RolePermissions[];
  lastUpdated: string;
  version: string;
}

/**
 * Permission Service Class
 * Centralized permission management system
 */
export class PermissionsService {
  private static instance: PermissionsService;
  private systemPermissions: SystemPermissions | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): PermissionsService {
    if (!PermissionsService.instance) {
      PermissionsService.instance = new PermissionsService();
    }
    return PermissionsService.instance;
  }

  /**
   * Initialize permissions system
   */
  public async initialize(): Promise<void> {
    try {
      await this.loadSystemPermissions();
    } catch (error) {
      console.warn('Failed to load system permissions, using defaults:', error);
      this.systemPermissions = this.getDefaultSystemPermissions();
    }
  }

  /**
   * Check if user has specific permission
   */
  public hasPermission(
    userRole: RoleType,
    resource: ResourceType,
    action: PermissionType,
    requiredLevel?: PermissionLevel
  ): PermissionCheck {
    const userPermissions = this.getUserPermissions(userRole);
    const resourcePermission = userPermissions.permissions[resource];
    const allowedActions = this.getAllowedActions(userRole, resource);

    // Check if user has the specific action permission
    const hasAction = allowedActions.includes(action);
    
    // Check permission level if specified
    const hasRequiredLevel = requiredLevel 
      ? this.comparePermissionLevels(resourcePermission, requiredLevel) 
      : true;

    const hasPermission = hasAction && hasRequiredLevel;

    return {
      hasPermission,
      level: resourcePermission,
      requiredLevel,
      message: hasPermission 
        ? 'Permission granted' 
        : `Insufficient permissions. Required: ${requiredLevel || action}, Current: ${resourcePermission}`
    };
  }

  /**
   * Check if user can perform action on resource
   */
  public canPerform(
    userRole: RoleType,
    resource: ResourceType,
    action: PermissionType
  ): boolean {
    return this.hasPermission(userRole, resource, action).hasPermission;
  }

  /**
   * Get user's permission level for a resource
   */
  public getPermissionLevel(userRole: RoleType, resource: ResourceType): PermissionLevel {
    const userPermissions = this.getUserPermissions(userRole);
    return userPermissions.permissions[resource];
  }

  /**
   * Get all permissions for a role
   */
  public getUserPermissions(role: RoleType): RolePermissions {
    if (this.systemPermissions) {
      const rolePermissions = this.systemPermissions.roles.find(r => r.role === role);
      if (rolePermissions) {
        return rolePermissions;
      }
    }

    // Fallback to default permissions
    return {
      role,
      permissions: DEFAULT_PERMISSIONS[role]
    };
  }

  /**
   * Get allowed actions for role and resource
   */
  public getAllowedActions(role: RoleType, resource: ResourceType): PermissionType[] {
    const actionPermissions = ACTION_PERMISSIONS[role];
    if (actionPermissions && resource in actionPermissions) {
      return [...(actionPermissions[resource as keyof typeof actionPermissions] || [])];
    }
    return [];
  }

  /**
   * Update role permissions
   */
  public async updateRolePermissions(
    role: RoleType,
    permissions: Record<ResourceType, PermissionLevel>
  ): Promise<void> {
    try {
      if (!this.systemPermissions) {
        this.systemPermissions = this.getDefaultSystemPermissions();
      }

      // Update role permissions
      const roleIndex = this.systemPermissions.roles.findIndex(r => r.role === role);
      if (roleIndex >= 0) {
        this.systemPermissions.roles[roleIndex].permissions = permissions;
      } else {
        this.systemPermissions.roles.push({ role, permissions });
      }

      this.systemPermissions.lastUpdated = new Date().toISOString();

      // Save to database (implement based on your storage strategy)
      await this.saveSystemPermissions();

    } catch (error) {
      console.error('Failed to update role permissions:', error);
      throw new Error('Failed to update permissions');
    }
  }

  /**
   * Reset permissions to default
   */
  public async resetToDefaults(): Promise<void> {
    this.systemPermissions = this.getDefaultSystemPermissions();
    await this.saveSystemPermissions();
  }

  /**
   * Get all roles with their permissions
   */
  public getAllRolePermissions(): RolePermissions[] {
    if (this.systemPermissions) {
      return this.systemPermissions.roles;
    }

    return Object.keys(DEFAULT_PERMISSIONS).map(role => ({
      role: role as RoleType,
      permissions: DEFAULT_PERMISSIONS[role as RoleType]
    }));
  }

  /**
   * Validate permission level hierarchy
   */
  private comparePermissionLevels(
    current: PermissionLevel,
    required: PermissionLevel
  ): boolean {
    const levels = [
      PERMISSION_LEVELS.NONE,
      PERMISSION_LEVELS.READ,
      PERMISSION_LEVELS.LIMITED,
      PERMISSION_LEVELS.MANAGE,
      PERMISSION_LEVELS.FULL
    ];

    const currentIndex = levels.indexOf(current);
    const requiredIndex = levels.indexOf(required);

    return currentIndex >= requiredIndex;
  }

  /**
   * Load system permissions from storage
   */
  private async loadSystemPermissions(): Promise<void> {
    // Note: In a real implementation, you might store this in a dedicated collection
    // For now, we'll use the default permissions
    this.systemPermissions = this.getDefaultSystemPermissions();
  }

  /**
   * Save system permissions to storage
   */
  private async saveSystemPermissions(): Promise<void> {
    // Note: In a real implementation, you would save to a dedicated permissions collection
    // For now, we'll just log the operation
    console.log('Permissions saved:', this.systemPermissions);
  }

  /**
   * Get default system permissions
   */
  private getDefaultSystemPermissions(): SystemPermissions {
    return {
      roles: Object.keys(DEFAULT_PERMISSIONS).map(role => ({
        role: role as RoleType,
        permissions: DEFAULT_PERMISSIONS[role as RoleType]
      })),
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Utility method to check if user is admin
   */
  public isAdmin(role: RoleType): boolean {
    return role === ROLES.SUPER_ADMIN;
  }

  /**
   * Utility method to check if user is manager or above
   */
  public isManagerOrAbove(role: RoleType): boolean {
    return role === ROLES.SUPER_ADMIN || role === ROLES.SHOP_MANAGER;
  }

  /**
   * Get permission summary for UI display
   */
  public getPermissionSummary(role: RoleType): Record<ResourceType, string> {
    const permissions = this.getUserPermissions(role).permissions;
    const summary: Record<string, string> = {};

    Object.entries(permissions).forEach(([resource, level]) => {
      switch (level) {
        case PERMISSION_LEVELS.FULL:
          summary[resource] = 'Full';
          break;
        case PERMISSION_LEVELS.MANAGE:
          summary[resource] = 'Manage';
          break;
        case PERMISSION_LEVELS.LIMITED:
          summary[resource] = 'Limited';
          break;
        case PERMISSION_LEVELS.READ:
          summary[resource] = 'View';
          break;
        default:
          summary[resource] = 'None';
      }
    });

    return summary as Record<ResourceType, string>;
  }
}

// Create and export singleton instance
export const permissionsService = PermissionsService.getInstance(); 