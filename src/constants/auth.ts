/**
 * Authentication Constants
 * Centralized constants for authentication error messages and statuses
 */

export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'invalid login',
  INVALID_EMAIL_PASSWORD: 'invalid credentials',
  EMAIL_NOT_VERIFIED: 'email not confirmed',
  NOT_VERIFIED: 'not verified',
  SESSION_ACTIVE: 'session is active',
  SESSION_PROHIBITED: 'prohibited when a session',
  NETWORK_ERROR: 'network error',
  OFFLINE: 'offline'
} as const;

export const AUTH_ERROR_CODES = {
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429
} as const;

export const USER_ROLES = {
  CUSTOMER: 'user',
  SHOP_MANAGER: 'shop_manager',
  SUPER_ADMIN: 'super_admin'
} as const;

// Simplified status system - only three statuses (using capitalized values to match database)
export const USER_STATUS = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  DEACTIVATED: 'Deactivated'
} as const;

export const ROLE_HIERARCHY = {
  [USER_ROLES.CUSTOMER]: 1,
  [USER_ROLES.SHOP_MANAGER]: 2,
  [USER_ROLES.SUPER_ADMIN]: 3
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [USER_ROLES.CUSTOMER]: ['read:own_profile', 'update:own_profile', 'read:products'],
  [USER_ROLES.SHOP_MANAGER]: [
    'read:own_profile', 
    'update:own_profile', 
    'read:products', 
    'write:products', 
    'read:orders', 
    'update:orders',
    'read:users_limited'
  ],
  [USER_ROLES.SUPER_ADMIN]: [
    'read:*', 
    'write:*', 
    'delete:*', 
    'admin:users', 
    'admin:system'
  ]
}; 