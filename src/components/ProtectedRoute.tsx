import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireSuperAdmin = false 
}: ProtectedRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [roleCheckLoading, setRoleCheckLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [user, profile]);

  const checkAuth = async () => {
    // If auth context is still loading, wait for it
    if (authLoading) {
      setRoleCheckLoading(true);
      return;
    }

    // If no user after auth loading is complete, redirect to login
    if (!user) {
      navigate('/login', {
        replace: true,
        state: { 
          message: 'Please log in to access this page.',
          returnTo: location.pathname
        }
      });
      return;
    }

    try {
      // If we need to check admin/superadmin status
      if (requireAdmin || requireSuperAdmin) {
        // Wait for profile to be loaded
        if (!profile) {
          // Profile is still loading, wait a bit more
          setRoleCheckLoading(true);
          return;
        }

        if (requireSuperAdmin && profile.role !== 'super_admin') {
          toast({
            title: "Access Denied",
            description: "You need super admin privileges to access this page",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        if (requireAdmin && !['shop_manager', 'super_admin'].includes(profile.role || '')) {
          toast({
            title: "Access Denied",
            description: "You need shop manager privileges to access this page",
            variant: "destructive",
          });
          navigate('/');
          return;
        }
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication Error",
        description: "Please try logging in again",
        variant: "destructive",
      });
      navigate('/login', { 
        replace: true,
        state: { returnTo: location.pathname }
      });
    } finally {
      setRoleCheckLoading(false);
    }
  };

  // Show loading while auth context is loading or role check is in progress
  if (authLoading || roleCheckLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}