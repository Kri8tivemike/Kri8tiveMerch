import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { getDefaultRouteForRole } from '../../utils/roleUtils';

interface GuestOnlyRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * GuestOnlyRoute Component
 * Protects login/signup pages from authenticated users
 * Redirects authenticated users to their appropriate dashboard
 */
export function GuestOnlyRoute({ children, redirectTo }: GuestOnlyRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Don't show loading spinner on login/signup pages during authentication attempts
  // This prevents the component from unmounting during login, which would lose error state
  const isAuthPage = ['/login', '/register', '/reset-password', '/verify-email'].includes(location.pathname);
  
  // Show loading spinner while checking authentication, but not on auth pages during login
  if (loading && !isAuthPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect them to appropriate page
  if (user && profile) {
    const userRole = profile.role || 'user';
    
    // Use custom redirect or determine based on role
    const redirectPath = redirectTo || getDefaultRouteForRole(userRole as any);
    
    // Preserve any return URL from the location state
    const returnTo = (location.state as any)?.returnTo;
    const finalRedirect = returnTo || redirectPath;
    
    console.log(`🔄 Authenticated user (${userRole}) trying to access ${location.pathname}, redirecting to ${finalRedirect}`);
    
    return <Navigate to={finalRedirect} replace />;
  }

  // User is not authenticated, show the login/signup page
  return <>{children}</>;
} 