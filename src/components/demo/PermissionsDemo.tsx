/**
 * Permissions Demo Component
 * Demonstrates how to use the permissions system in components
 */

import React from 'react';
import { Shield, CheckCircle, XCircle } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { RESOURCE_TYPES } from '../../constants/permissions';

const PermissionsDemo: React.FC = () => {
  const {
    permissions,
    userRole,
    isAdmin,
    isManagerOrAbove,
    hasPermission,
    getPermissionLevel
  } = usePermissions();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Permissions System Demo
          </h2>
        </div>

        {/* User Role Info */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Current User Role
          </h3>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm font-medium">
              {userRole}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Admin: {isAdmin() ? '✅' : '❌'} | Manager+: {isManagerOrAbove() ? '✅' : '❌'}
            </span>
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Products */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Products
            </h4>
            <div className="space-y-2 text-sm">
              <PermissionItem 
                label="View" 
                allowed={permissions.products.canView} 
              />
              <PermissionItem 
                label="Create" 
                allowed={permissions.products.canCreate} 
              />
              <PermissionItem 
                label="Edit" 
                allowed={permissions.products.canEdit} 
              />
              <PermissionItem 
                label="Delete" 
                allowed={permissions.products.canDelete} 
              />
              <PermissionItem 
                label="Manage" 
                allowed={permissions.products.canManage} 
              />
            </div>
          </div>

          {/* Orders */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Orders
            </h4>
            <div className="space-y-2 text-sm">
              <PermissionItem 
                label="View" 
                allowed={permissions.orders.canView} 
              />
              <PermissionItem 
                label="Create" 
                allowed={permissions.orders.canCreate} 
              />
              <PermissionItem 
                label="Edit" 
                allowed={permissions.orders.canEdit} 
              />
              <PermissionItem 
                label="Delete" 
                allowed={permissions.orders.canDelete} 
              />
              <PermissionItem 
                label="Manage" 
                allowed={permissions.orders.canManage} 
              />
            </div>
          </div>

          {/* Users */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Users
            </h4>
            <div className="space-y-2 text-sm">
              <PermissionItem 
                label="View" 
                allowed={permissions.users.canView} 
              />
              <PermissionItem 
                label="Create" 
                allowed={permissions.users.canCreate} 
              />
              <PermissionItem 
                label="Edit" 
                allowed={permissions.users.canEdit} 
              />
              <PermissionItem 
                label="Delete" 
                allowed={permissions.users.canDelete} 
              />
              <PermissionItem 
                label="Manage" 
                allowed={permissions.users.canManage} 
              />
            </div>
          </div>
        </div>

        {/* Permission Levels */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Permission Levels by Resource
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.values(RESOURCE_TYPES).map(resource => (
              <div key={resource} className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {resource}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {getPermissionLevel(resource)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Example Usage */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">
            Example Usage in Components
          </h3>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <div className="font-mono bg-blue-100 dark:bg-blue-900/40 p-2 rounded">
              {`const { permissions } = usePermissions();`}
            </div>
            <div className="font-mono bg-blue-100 dark:bg-blue-900/40 p-2 rounded">
              {`{permissions.products.canCreate && <CreateProductButton />}`}
            </div>
            <div className="font-mono bg-blue-100 dark:bg-blue-900/40 p-2 rounded">
              {`{isAdmin() && <AdminPanel />}`}
            </div>
            <div className="font-mono bg-blue-100 dark:bg-blue-900/40 p-2 rounded">
              {`{hasPermission(RESOURCE_TYPES.USERS, PERMISSION_TYPES.DELETE) && <DeleteButton />}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for permission items
const PermissionItem: React.FC<{ label: string; allowed: boolean }> = ({ label, allowed }) => (
  <div className="flex items-center justify-between">
    <span className="text-gray-700 dark:text-gray-300">{label}</span>
    {allowed ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    )}
  </div>
);

export default PermissionsDemo; 