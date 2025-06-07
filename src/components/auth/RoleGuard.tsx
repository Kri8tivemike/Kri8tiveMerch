import { ReactNode, useEffect, memo } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { USER_ROLES, USER_STATUS } from '../../constants/auth';
import { getDefaultRouteForRole, isUserActive, needsApproval } from '../../utils/roleUtils';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

// Use Appwrite's profile structure which might differ from Supabase
type AppwriteUser = {
  $id: string;
  email: string;
  name?: string;
  labels?: string[];
};

function RoleGuardComponent({ children, allowedRoles, redirectTo }: RoleGuardProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Determine the user's role based on profile with proper type checking
  const userRole = (profile?.role as any) || USER_ROLES.CUSTOMER; // Default role
  const accountStatus = (profile?.status as any) || USER_STATUS.ACTIVE;
  
  // Check if user needs approval (shop managers with pending status)
  const isPendingApproval = needsApproval(userRole, accountStatus);
  
  // Check if user is active (active or verified status)
  const userIsActive = isUserActive(accountStatus);

  useEffect(() => {
    // Show access denied message when user has wrong role
    if (!loading && user && !allowedRoles.includes(userRole)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
    }
    
    // Show pending approval message for shop manager accounts
    if (!loading && user && userRole === 'shop_manager' && isPendingApproval) {
      toast({
        title: "Account Pending Approval",
        description: "Your Shop Manager account is pending approval. You'll be notified when it's activated.",
        variant: "destructive",
        duration: 6000,
      });
    }
  }, [user, userRole, loading, allowedRoles, isPendingApproval, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Save the attempted URL to redirect back after login
    const redirectUrl = redirectTo || "/login";
    return (
      <Navigate 
        to={redirectUrl}
        state={{ returnTo: location.pathname }}
        replace 
      />
    );
  }

  // If shop manager account but status is pending, redirect to account page
  if (userRole === 'shop_manager' && isPendingApproval) {
    toast({
      title: "Account Pending Approval",
      description: "Your Shop Manager account is awaiting approval. You'll be notified when it's activated.",
      variant: "destructive",
    });
    return <Navigate to="/account" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    // Determine redirect based on role hierarchy using utility function
    const redirectPath = redirectTo || getDefaultRouteForRole(userRole);

    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

// Use memo to prevent unnecessary re-renders
export const RoleGuard = memo(RoleGuardComponent);
