import { useEffect, useState } from 'react';
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from './use-toast';
import { hasRoleOrHigher, isUserActive, needsApproval, getDefaultRouteForRole } from '../utils/roleUtils';
import { USER_ROLES, USER_STATUS } from '../constants/auth';

export interface AuthGuardOptions {
  allowedRoles?: string[];
  requireEmailVerification?: boolean;
  redirectTo?: string;
  showToasts?: boolean;
}

export interface AuthGuardResult {
  isAuthenticated: boolean;
  hasPermission: boolean;
  isLoading: boolean;
  user: any;
  profile: any;
  userRole: string;
  userStatus: string;
  needsVerification: boolean;
  isPending: boolean;
}

/**
 * Custom hook for authentication and authorization checks
 * Provides a clean API for components to check auth status
 */
export const useAuthGuard = (options: AuthGuardOptions = {}): AuthGuardResult => {
  const {
    allowedRoles = [],
    requireEmailVerification = false,
    redirectTo,
    showToasts = true
  } = options;

  const { user, profile, loading, isEmailVerified } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Extract user info with safe defaults
  const userRole = (profile?.role as string) || USER_ROLES.CUSTOMER;
  const userStatus = (profile?.status as string) || USER_STATUS.ACTIVE;
  
  // Calculate auth states
  const isAuthenticated = !!user;
  const userIsActive = isUserActive(userStatus as any);
  const isPending = needsApproval(userRole as any, userStatus as any);
  const needsVerification = requireEmailVerification && !isEmailVerified;
  
  // Check if user has required role
  const hasRequiredRole = allowedRoles.length === 0 || allowedRoles.some(role => 
    hasRoleOrHigher(userRole as any, role as any)
  );
  
  const hasPermission = isAuthenticated && userIsActive && hasRequiredRole && !needsVerification && !isPending;

  // Handle authentication redirects
  useEffect(() => {
    if (loading || hasCheckedAuth) return;

    const handleAuthRedirect = () => {
      if (!isAuthenticated) {
        const redirectUrl = redirectTo || "/login";
        navigate(redirectUrl, { 
          state: { returnTo: location.pathname },
          replace: true 
        });
        return;
      }

      if (needsVerification && showToasts) {
        toast({
          title: "Email Verification Required",
          description: "Please verify your email address to continue",
          variant: "destructive"
        });
        navigate('/verify-email', { replace: true });
        return;
      }

      if (isPending && showToasts) {
        toast({
          title: "Account Pending Approval",
          description: "Your account is awaiting approval. You'll be notified when it's activated.",
          variant: "destructive"
        });
        navigate('/account', { replace: true });
        return;
      }

      if (!hasRequiredRole && showToasts) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page",
          variant: "destructive"
        });
        
        const fallbackRoute = getDefaultRouteForRole(userRole as any);
        navigate(fallbackRoute, { replace: true });
        return;
      }

      setHasCheckedAuth(true);
    };

    handleAuthRedirect();
  }, [
    loading, 
    isAuthenticated, 
    hasRequiredRole, 
    needsVerification, 
    isPending, 
    userRole,
    hasCheckedAuth,
    navigate,
    location.pathname,
    redirectTo,
    showToasts,
    toast
  ]);

  return {
    isAuthenticated,
    hasPermission,
    isLoading: loading || !hasCheckedAuth,
    user,
    profile,
    userRole,
    userStatus,
    needsVerification,
    isPending
  };
};

/**
 * Higher-order component version of useAuthGuard
 */
export function withAuthGuard(options: AuthGuardOptions) {
  return function AuthGuardWrapper(Component: React.ComponentType<any>) {
    const AuthGuardedComponent = (props: any) => {
      const authResult = useAuthGuard(options);

      if (authResult.isLoading) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        );
      }

      if (!authResult.hasPermission) {
        // Redirects are handled by the hook
        return null;
      }

      return <Component {...props} />;
    };

    return AuthGuardedComponent;
  };
} 