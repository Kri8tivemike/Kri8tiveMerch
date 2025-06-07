import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { CheckCircle, Mail, ArrowLeft, RefreshCw, Store } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/use-toast';

export default function RegistrationSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const role = location.state?.role || 'user';
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { toast } = useToast();
  
  // If no email is provided, redirect to register page
  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true });
    }
  }, [email, navigate]);

  // Handle cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Function to handle resend verification email
  const handleResendVerification = async () => {
    if (resending || cooldown > 0) return;
    
    setResending(true);
    try {
      // Import the verification service
      const { sendVerificationEmail } = await import('../services/user-verification.service');
      
      // Try to send verification email using the service
      const result = await sendVerificationEmail(email);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
          variant: "default"
        });
        
        // Set a default cooldown of 60 seconds after successful send
        setCooldown(60);
      } else {
        // Handle specific error cases
        if (result.error === 'Not authenticated') {
          // Redirect to login with state to trigger verification resend after login
          navigate('/login', { 
            state: { 
              email,
              resendVerification: true 
            },
            replace: true 
          });
          return;
        }
        
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
        
        // Set cooldown for rate limit errors
        if (result.error?.includes('Too many requests') || result.error?.includes('rate limit')) {
          setCooldown(60);
        }
      }
    } catch (error: any) {
      console.error('Error resending verification:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to resend verification email",
        variant: "destructive"
      });
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return null; // Will redirect via useEffect
  }

  const isShopManager = role === 'shop_manager';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" aria-hidden="true" />
          </div>
        </div>
        
        <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Registration Successful!
        </h1>
        
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <div className="rounded-full bg-green-50 dark:bg-green-900/30 w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Mail className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Verify Your Email
              </h2>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We've sent a verification email to:
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-md py-3 px-4 mb-6 inline-block">
                <p className="font-medium text-gray-900 dark:text-gray-100">{email}</p>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Please check your inbox and click on the verification link to activate your account.
                If you don't see the email, check your spam folder.
              </p>

              {isShopManager && (
                <div className="mb-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-md p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Store className="h-5 w-5 text-amber-400 dark:text-amber-300" aria-hidden="true" />
                    </div>
                    <div className="ml-3 text-left">
                      <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        Shop Manager Account
                      </h3>
                      <div className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                        After verifying your email, your account will need to be approved by an administrator before you can access shop management features. You'll be notified when your account is approved.
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <Button 
                  onClick={handleResendVerification}
                  variant="outline"
                  className="w-full flex items-center justify-center"
                  disabled={resending || cooldown > 0}
                >
                  {resending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : cooldown > 0 ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend in {cooldown}s
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
                
                <Link to="/login">
                  <Button 
                    variant="primary"
                    className="w-full flex items-center justify-center"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Need help? <a href="/contact" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">Contact Support</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 