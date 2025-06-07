/**
 * Permission Configuration Modal
 * Allows Super Admins to configure role-based permissions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, RotateCcw, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { permissionsService, type RolePermissions } from '../../services/permissions.service';
import {
  ROLES,
  RESOURCE_TYPES,
  PERMISSION_LEVELS,
  PERMISSION_LABELS,
  RESOURCE_LABELS,
  ROLE_LABELS,
  type RoleType,
  type ResourceType,
  type PermissionLevel
} from '../../constants/permissions';

interface PermissionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PermissionChange {
  role: RoleType;
  resource: ResourceType;
  oldLevel: PermissionLevel;
  newLevel: PermissionLevel;
}

const PermissionConfigModal: React.FC<PermissionConfigModalProps> = ({
  isOpen,
  onClose
}) => {
  const { toast } = useToast();
  
  // State management
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([]);
  const [originalPermissions, setOriginalPermissions] = useState<RolePermissions[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleType>(ROLES.SHOP_MANAGER);

  /**
   * Load current permissions
   */
  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      await permissionsService.initialize();
      const permissions = permissionsService.getAllRolePermissions();
      setRolePermissions(permissions);
      setOriginalPermissions(JSON.parse(JSON.stringify(permissions))); // Deep copy
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to load permissions:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load current permissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Handle permission level change
   */
  const handlePermissionChange = useCallback((
    role: RoleType,
    resource: ResourceType,
    newLevel: PermissionLevel
  ) => {
    setRolePermissions(prev => {
      const updated = prev.map(roleData => {
        if (roleData.role === role) {
          return {
            ...roleData,
            permissions: {
              ...roleData.permissions,
              [resource]: newLevel
            }
          };
        }
        return roleData;
      });
      
      // Check if there are changes
      const hasChanges = JSON.stringify(updated) !== JSON.stringify(originalPermissions);
      setHasChanges(hasChanges);
      
      return updated;
    });
  }, [originalPermissions]);

  /**
   * Save permissions
   */
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      
      // Save each role's permissions
      for (const roleData of rolePermissions) {
        await permissionsService.updateRolePermissions(roleData.role, roleData.permissions);
      }
      
      setOriginalPermissions(JSON.parse(JSON.stringify(rolePermissions)));
      setHasChanges(false);
      
      toast({
        title: "Permissions Saved",
        description: "Role permissions have been updated successfully",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Failed to save permissions:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save permission changes",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [rolePermissions, toast]);

  /**
   * Reset to defaults
   */
  const handleResetToDefaults = useCallback(async () => {
    try {
      setSaving(true);
      await permissionsService.resetToDefaults();
      await loadPermissions();
      
      toast({
        title: "Permissions Reset",
        description: "All permissions have been reset to default values",
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to reset permissions:', error);
      toast({
        title: "Reset Failed",
        description: "Failed to reset permissions to defaults",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [loadPermissions, toast]);

  /**
   * Discard changes
   */
  const handleDiscardChanges = useCallback(() => {
    setRolePermissions(JSON.parse(JSON.stringify(originalPermissions)));
    setHasChanges(false);
  }, [originalPermissions]);

  /**
   * Get permission level color
   */
  const getPermissionLevelColor = (level: PermissionLevel): string => {
    switch (level) {
      case PERMISSION_LEVELS.FULL:
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case PERMISSION_LEVELS.MANAGE:
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      case PERMISSION_LEVELS.LIMITED:
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case PERMISSION_LEVELS.READ:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
      default:
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
    }
  };

  /**
   * Get changes summary
   */
  const getChangesSummary = (): PermissionChange[] => {
    const changes: PermissionChange[] = [];
    
    rolePermissions.forEach(roleData => {
      const original = originalPermissions.find(orig => orig.role === roleData.role);
      if (original) {
        Object.keys(roleData.permissions).forEach(resource => {
          const resourceKey = resource as ResourceType;
          const oldLevel = original.permissions[resourceKey];
          const newLevel = roleData.permissions[resourceKey];
          
          if (oldLevel !== newLevel) {
            changes.push({
              role: roleData.role,
              resource: resourceKey,
              oldLevel,
              newLevel
            });
          }
        });
      }
    });
    
    return changes;
  };

  // Load permissions when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPermissions();
    }
  }, [isOpen, loadPermissions]);

  if (!isOpen) return null;

  const selectedRoleData = rolePermissions.find(r => r.role === selectedRole);
  const changes = getChangesSummary();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Permission Configuration
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure role-based access permissions for system resources
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Role Selection Sidebar */}
          <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Select Role
            </h3>
            <div className="space-y-2">
              {Object.values(ROLES).map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedRole === role
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>

            {/* Changes Summary */}
            {hasChanges && (
              <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    Unsaved Changes
                  </span>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  {changes.length} permission{changes.length !== 1 ? 's' : ''} modified
                </p>
              </div>
            )}
          </div>

          {/* Permission Configuration */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading permissions...</p>
                </div>
              </div>
            ) : selectedRoleData ? (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {ROLE_LABELS[selectedRole]} Permissions
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configure what this role can access and modify
                  </p>
                </div>

                {/* Permission Grid */}
                <div className="space-y-4">
                  {Object.values(RESOURCE_TYPES).map(resource => (
                    <div
                      key={resource}
                      className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {RESOURCE_LABELS[resource]}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Access level for {RESOURCE_LABELS[resource].toLowerCase()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            getPermissionLevelColor(selectedRoleData.permissions[resource])
                          }`}>
                            {PERMISSION_LABELS[selectedRoleData.permissions[resource]]}
                          </span>
                          <select
                            value={selectedRoleData.permissions[resource]}
                            onChange={(e) => handlePermissionChange(
                              selectedRole,
                              resource,
                              e.target.value as PermissionLevel
                            )}
                            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            {Object.values(PERMISSION_LEVELS).map(level => (
                              <option key={level} value={level}>
                                {PERMISSION_LABELS[level]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetToDefaults}
              disabled={saving}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
            {hasChanges && (
              <button
                onClick={handleDiscardChanges}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Discard Changes
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionConfigModal; 