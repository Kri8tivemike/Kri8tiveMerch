import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeProvider';
import { useToast } from '../hooks/use-toast';
import { Loader2, Mail, Lock, AlertCircle, CheckCircle, WifiOff, User, Store, X } from 'lucide-react';
import { PasswordResetModal } from '../components/auth/PasswordResetModal';
import { isOnline } from '../lib/network-utils';
// Import account directly

// Define role type
type LoginRole = 'customer' | 'shop_manager';

// Global rate limiting tracker
let lastLoginAttempt = 0;
let loginAttemptCount = 0;
let isLoginInProgress = false;
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_ATTEMPTS_PER_WINDOW = 3;

export default function Login() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginAsRole, setLoginAsRole] = useState<LoginRole>('customer'); // New state for role selection
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [handlingVerification, setHandlingVerification] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(MAX_ATTEMPTS_PER_WINDOW);
  const [retryTimer, setRetryTimer] = useState(0);
  const [invalidCredentials, setInvalidCredentials] = useState(false);
  const [loginErrorState, setLoginErrorState] = useState<{
    show: boolean;
    attemptsRemaining: number;
  }>({ show: false, attemptsRemaining: MAX_ATTEMPTS_PER_WINDOW });
  const [showLoginErrorAlert, setShowLoginErrorAlert] = useState(false);
  
  const passwordRef = useRef<HTMLInputElement>(null);
  
  const { signIn, signOut, networkError, checkConnection, user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Track component lifecycle for debugging
  useEffect(() => {
    const componentId = Math.random().toString(36).substring(7);
    console.log(`🔍 Login component mounted with ID: ${componentId}`);
    
    return () => {
      console.log(`🔍 Login component unmounting with ID: ${componentId}`);
    };
  }, []);

  // Track user/profile changes that might cause redirects
  useEffect(() => {
    console.log('🔍 User/profile state changed:', { 
      user: user ? 'exists' : 'null', 
      profile: profile ? 'exists' : 'null',
      userEmail: user?.email,
      profileRole: profile?.role 
    });
    
    // Check if user is authenticated and should be redirected
    if (user && profile) {
      console.log('🔍 User is authenticated, checking if redirect should happen...');
      console.log('🔍 This could cause GuestOnlyRoute to redirect and unmount Login component');
      // Don't automatically redirect here - let the AuthContext handle it
      // This is just for debugging
    }
    
    // Also track when only user exists but no profile (intermediate state)
    if (user && !profile) {
      console.log('🔍 User exists but no profile yet - intermediate authentication state');
    }
  }, [user, profile]);

  // Check for verification parameters in URL
  useEffect(() => {
    // Look for verification parameters in URL (userId and secret)
    const params = new URLSearchParams(location.search);
    const userId = params.get('userId');
    const secret = params.get('secret');

    if (userId && secret) {
      // Redirect to verification page with the same parameters
      navigate(`/verify-email${location.search}`, { replace: true });
      return;
    }
  }, [location.search, navigate]);

  // Check connection status on mount and when retryCount changes
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (retryCount > 0) {
        try {
          // Use the checkConnection from AuthContext
          const connected = await checkConnection();
          
          if (connected) {
            toast({
              title: "Connection Restored",
              description: "Connection to our services has been restored. You can now log in.",
            });
            setErrorMessage('');
          }
        } catch (error) {
          console.error("Connection check error:", error);
        }
      }
    };
    
    checkConnectionStatus();
  }, [retryCount, toast, checkConnection]);

  // Check if we need to resend verification email
  useEffect(() => {
    const resendVerification = location.state?.resendVerification;
    const emailFromState = location.state?.email;
    
    if (resendVerification && emailFromState) {
      // Set the email in the form
      setEmail(emailFromState);
      
      // Show a toast notification
      toast({
        title: "Verification Required",
        description: "Please verify your email to activate your account",
      });
      
      // Open the password reset modal to resend verification
      setTimeout(() => {
        setIsResetModalOpen(true);
      }, 500);
    }
  }, [location.state, toast]);

  // Handle cooldown timer
  useEffect(() => {
    if (resetCooldown > 0) {
      const timer = setTimeout(() => setResetCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resetCooldown]);

  // Handle retry timer countdown
  useEffect(() => {
    if (retryTimer > 0) {
      const timer = setTimeout(() => setRetryTimer(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (retryTimer === 0 && rateLimited) {
      // Timer finished, reset rate limiting
      setRateLimited(false);
      resetRateLimitIfExpired();
    }
  }, [retryTimer, rateLimited]);

  // Focus password field when email is entered
  useEffect(() => {
    if (email && !password && passwordRef.current) {
      passwordRef.current.focus();
    }
  }, [email, password]);

  // Clear rate limiting state on successful authentication
  useEffect(() => {
    if (user && profile) {
      // User is authenticated, reset rate limiting
      loginAttemptCount = 0;
      lastLoginAttempt = 0;
      isLoginInProgress = false;
      setRateLimited(false);
      setAttemptsRemaining(MAX_ATTEMPTS_PER_WINDOW);
      setRetryTimer(0);
      setInvalidCredentials(false);
    }
  }, [user, profile]);

  // Debug effect to track state changes
  useEffect(() => {
    // console.log('🔍 State changed - errorMessage:', errorMessage, 'showLoginErrorAlert:', showLoginErrorAlert, 'attemptsRemaining:', attemptsRemaining, 'invalidCredentials:', invalidCredentials, 'loginErrorState:', loginErrorState, 'retryTimer:', retryTimer);
  }, [errorMessage, showLoginErrorAlert, attemptsRemaining, invalidCredentials, loginErrorState, retryTimer]);

  // Expose rate limiting reset function to window for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).clearLoginRateLimit = () => {
        loginAttemptCount = 0;
        lastLoginAttempt = 0;
        isLoginInProgress = false;
        setRateLimited(false);
        setAttemptsRemaining(MAX_ATTEMPTS_PER_WINDOW);
        setRetryTimer(0);
        setInvalidCredentials(false);
        setErrorMessage('');
        console.log('✅ Login rate limiting has been cleared');
        toast({
          title: "Rate Limit Cleared",
          description: "You can now attempt to log in again.",
          variant: "default",
          duration: 3000,
        });
      };
    }
  }, [toast]);

  // Function to reset rate limiting when window has passed
  const resetRateLimitIfExpired = (): boolean => {
    const now = Date.now();
    
    // Check if rate limit window has passed
    if (now - lastLoginAttempt > RATE_LIMIT_WINDOW) {
      loginAttemptCount = 0;
      setAttemptsRemaining(MAX_ATTEMPTS_PER_WINDOW);
      // Note: Don't reset invalidCredentials here - let it persist until user tries again
      return true; // Rate limit was reset
    }
    
    return false; // Still within rate limit window
  };

  // Function to record a login attempt
  const recordLoginAttempt = () => {
    const now = Date.now();
    lastLoginAttempt = now;
    loginAttemptCount++;
    console.log('🔍 Recorded login attempt. Count:', loginAttemptCount, 'Remaining:', MAX_ATTEMPTS_PER_WINDOW - loginAttemptCount);
    setAttemptsRemaining(Math.max(0, MAX_ATTEMPTS_PER_WINDOW - loginAttemptCount));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is already authenticated - if so, don't process login
    if (user && profile) {
      console.log('User is already authenticated, skipping login submission');
      return;
    }

    // Check if another login is already in progress
    if (isLoginInProgress) {
      console.log('Login already in progress, skipping duplicate attempt');
      return;
    }

    // Clear previous errors and messages
    setEmailError(false);
    setPasswordError(false);
    setSuccessMessage('');
    
    // Check if browser is online
    if (!isOnline()) {
      setErrorMessage('Your device appears to be offline. Please check your internet connection.');
      setShowLoginErrorAlert(true);
      toast({
        title: "Connection Error",
        description: "Your device appears to be offline. Please check your internet connection.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate inputs
    if (!email.trim()) {
      setEmailError(true);
      setErrorMessage('Please enter your email address');
      setShowLoginErrorAlert(true);
      return;
    }
    
    if (!password) {
      setPasswordError(true);
      setErrorMessage('Please enter your password');
      setShowLoginErrorAlert(true);
      return;
    }
    
    // Validate password length (Appwrite requirement: 8-256 characters)
    if (password.length < 8 || password.length > 256) {
      setPasswordError(true);
      setErrorMessage('Password must be between 8 and 256 characters long');
      setShowLoginErrorAlert(true);
      return;
    }
    
    // Mark login as in progress
    isLoginInProgress = true;
    setLoading(true);

    try {
      console.log('🔍 Calling signIn with:', { email, loginAsRole });
      const result = await signIn(email, password, loginAsRole);
      console.log('🔍 signIn result:', result);
      
      if (!result.success) {
        console.log('🔍 Result indicates failure, handling error...');
        const error = result.error;
        console.error('Login error:', error);
        
        // Extract the error message
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        
        // Record login attempt for rate limiting
        recordLoginAttempt();
        
        // Handle rate limit errors
        if (message.toLowerCase().includes('rate limit') || message.toLowerCase().includes('too many requests')) {
          // Extract wait time from message if available
          const waitTimeMatch = message.match(/wait (\d+) seconds/);
          const waitTime = waitTimeMatch ? parseInt(waitTimeMatch[1]) : 120; // Default to 2 minutes if no time specified
          
          setRateLimited(true);
          setRetryTimer(waitTime);
          
          toast({
            title: "⏳ Rate Limit Exceeded",
            description: message,
            variant: "destructive",
            duration: 10000,
          });
          
          // Set up the timer to re-enable the form
          setTimeout(() => {
            setErrorMessage('');
            setRateLimited(false);
            setRetryTimer(0);
            loginAttemptCount = 0;
            setAttemptsRemaining(MAX_ATTEMPTS_PER_WINDOW);
            toast({
              title: "✅ Ready to Try Again",
              description: "You can now attempt to log in again.",
              variant: "default",
              duration: 5000,
            });
          }, waitTime * 1000);
          
          return;
        }
        
        // Record login attempt for rate limiting
        recordLoginAttempt();
        
        // Handle specific error types
        if (message.toLowerCase().includes('invalid credentials') || 
            message.toLowerCase().includes('invalid email or password') ||
            message.toLowerCase().includes('incorrect password')) {
          setInvalidCredentials(true);
          setEmailError(true);
          setPasswordError(true);
          setLoginErrorState({ 
            show: true, 
            attemptsRemaining: Math.max(0, MAX_ATTEMPTS_PER_WINDOW - loginAttemptCount) 
          });
          
          // Show the in-form alert for invalid credentials
          const errorMsg = "Invalid credentials. Please check your email and password.";
          console.log('🔍 About to set error message:', errorMsg);
          console.log('🔍 Current errorMessage before update:', errorMessage);
          console.log('🔍 Current showLoginErrorAlert before update:', showLoginErrorAlert);
          
          setErrorMessage(errorMsg);
          console.log('🔍 Called setErrorMessage with:', errorMsg);
          
          setShowLoginErrorAlert(true);
          console.log('🔍 Called setShowLoginErrorAlert(true)');
          
          // Check state immediately after setters
          setTimeout(() => {
            console.log('🔍 State check 100ms after setters:', {
              errorMessage,
              showLoginErrorAlert,
              invalidCredentials,
              loginErrorState
            });
          }, 100);
          
          // Force a second check after 500ms
          setTimeout(() => {
            console.log('🔍 State check 500ms after setters:', {
              currentErrorMessage: errorMessage,
              currentShowLoginErrorAlert: showLoginErrorAlert,
              currentInvalidCredentials: invalidCredentials,
              currentLoginErrorState: loginErrorState
            });
          }, 500);
          
          toast({
            title: "❌ Invalid Credentials",
            description: "Please check your email and password, then try again.",
            variant: "destructive",
            duration: 8000,
          });
        } else if (message.toLowerCase().includes('email not confirmed') || 
                   message.toLowerCase().includes('email not verified')) {
          setEmailError(true);
          
          // Show the in-form alert for email verification
          setErrorMessage("Email not verified. Please check your inbox for a verification email.");
          setShowLoginErrorAlert(true);
          
          toast({
            title: "📧 Email Not Verified",
            description: "Please verify your email address before signing in.",
            variant: "destructive",
            duration: 10000,
          });
        } else if (message.toLowerCase().includes('role mismatch')) {
          // Show the in-form alert for role mismatch
          setErrorMessage(message);
          setShowLoginErrorAlert(true);
          
          toast({
            title: "⚠️ Account Type Mismatch",
            description: message,
            variant: "destructive",
            duration: 12000,
          });
        } else if (message.toLowerCase().includes('network') || 
                   message.toLowerCase().includes('connection') ||
                   message.toLowerCase().includes('fetch')) {
          // Show the in-form alert for network errors
          setErrorMessage("Connection error. Please check your internet connection and try again.");
          setShowLoginErrorAlert(true);
          
          toast({
            title: "🌐 Connection Error",
            description: "Please check your internet connection and try again.",
            variant: "destructive",
            duration: 8000,
          });
        } else {
          // Generic error handling - show the in-form alert
          setErrorMessage(message);
          setShowLoginErrorAlert(true);
          
          toast({
            title: "❌ Login Failed",
            description: message,
            variant: "destructive",
            duration: 10000,
          });
        }
        
        // Check if we should trigger rate limiting
        if (loginAttemptCount >= MAX_ATTEMPTS_PER_WINDOW) {
          setRateLimited(true);
          setRetryTimer(RATE_LIMIT_WINDOW / 1000); // Convert to seconds
          
          toast({
            title: "🔒 Account Temporarily Locked",
            description: "Too many failed attempts. Please wait before trying again.",
            variant: "destructive",
            duration: 15000,
          });
        }
      } else {
        console.log('🔍 signIn result indicates success, but we still got an error somehow');
        // This shouldn't happen if there was a login error
      }
    } catch (error) {
      console.error('Unexpected login error:', error);
      console.log('🔍 Catch block reached - setting error state');
      
      // Handle unexpected errors
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      console.log('🔍 Setting error message:', message);
      console.log('🔍 Current state before catch block updates:', {
        errorMessage,
        showLoginErrorAlert,
        loading,
        isLoginInProgress
      });
      
      setErrorMessage(message);
      setShowLoginErrorAlert(true);
      console.log('🔍 Set showLoginErrorAlert to true in catch block');
      
      // Record attempt for rate limiting
      recordLoginAttempt();
      
      toast({
        title: "❌ Login Failed",
        description: "An unexpected error occurred. Please try again later or contact support if the problem persists.",
        variant: "destructive",
        duration: 10000,
      });
      
      // Check if we should trigger rate limiting
      if (loginAttemptCount >= MAX_ATTEMPTS_PER_WINDOW) {
        setRateLimited(true);
        setRetryTimer(RATE_LIMIT_WINDOW / 1000);
        
        toast({
          title: "🔒 Account Temporarily Locked",
          description: "Too many failed attempts. Please wait before trying again.",
          variant: "destructive",
          duration: 15000,
        });
      }
    } finally {
      console.log('🔍 Finally block - setting loading to false and isLoginInProgress to false');
      console.log('🔍 Final state check in finally block:', {
        aboutToSetLoadingToFalse: true,
        currentErrorMessage: errorMessage,
        currentShowLoginErrorAlert: showLoginErrorAlert,
        currentLoading: loading
      });
      setLoading(false);
      isLoginInProgress = false;
    }
  };

  const handleResetSuccess = (message: string) => {
    setSuccessMessage(message);
    setResetCooldown(60); // Set cooldown after successful reset
  };

  const handleRetryConnection = async () => {
    setRetryCount(prev => prev + 1);
    
    toast({
      title: "Retrying Connection",
      description: "Checking connection to our services...",
    });
    
    try {
      const connected = await checkConnection();
      
      if (connected) {
        toast({
          title: "Connection Restored",
          description: "Connection to our services has been restored. You can now log in.",
        });
        setErrorMessage('');
      } else {
        toast({
          title: "Connection Failed",
          description: "We're still having trouble connecting to our services.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Connection check error:", error);
      toast({
        title: "Connection Failed",
        description: "We're still having trouble connecting to our services.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`flex min-h-screen items-center justify-center px-4 py-12 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className={`w-full max-w-md space-y-8 rounded-xl p-8 shadow-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div>
          <h2 className={`mt-6 text-center text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{'	'}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              create a new account
            </Link>
          </p>
        </div>

        {/* Role Toggle Buttons */}
        <div className="space-y-3 mb-6">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Account Type
            </h3>
          </div>
          <div className="flex justify-center space-x-3">
            <button
              type="button"
              onClick={() => setLoginAsRole('customer')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 min-w-[140px] justify-center
                ${loginAsRole === 'customer' 
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105 ring-2 ring-blue-500 ring-opacity-50' 
                  : `bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md`}
              `}
            >
              <User className="w-4 h-4" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              onClick={() => setLoginAsRole('shop_manager')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 min-w-[140px] justify-center
                ${loginAsRole === 'shop_manager' 
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105 ring-2 ring-blue-500 ring-opacity-50' 
                  : `bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md`}
              `}
            >
              <Store className="w-4 h-4" />
              <span>Shop Manager</span>
            </button>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {loginAsRole === 'customer' 
                ? 'Access your account, orders, and purchase history' 
                : 'Manage products, orders, and customer accounts'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              💡 Select the account type that matches your registration
            </p>
          </div>
        </div>

        {/* Enhanced Error Alert */}
        {(() => {
          const shouldShow = (errorMessage && errorMessage.length > 0) || retryTimer > 0 || loginErrorState.show;
          console.log('🔍 Alert visibility check:', {
            errorMessage,
            errorMessageLength: errorMessage?.length,
            retryTimer,
            loginErrorStateShow: loginErrorState.show,
            showLoginErrorAlert,
            shouldShow,
            simplifiedCheck: (errorMessage && errorMessage.length > 0)
          });
          return shouldShow;
        })() ? (
          <div className="mb-6 animate-in slide-in-from-top-2 duration-300">
            <div className={`rounded-lg border-l-4 p-4 shadow-lg ${
              retryTimer > 0 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-400' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-400'
            }`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 bg-red-100 dark:bg-red-800/50 rounded-full">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-base font-semibold text-red-800 dark:text-red-200">
                    {retryTimer > 0 ? '🔒 Account Temporarily Locked' : '❌ Login Failed'}
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    {retryTimer > 0 ? (
                      <div className="space-y-2">
                        <p>Too many failed login attempts detected.</p>
                        <p className="font-medium">
                          Please wait {Math.floor(retryTimer / 60)}:{(retryTimer % 60).toString().padStart(2, '0')} before trying again.
                        </p>
                        <div className="mt-3 p-2 bg-red-100 dark:bg-red-800/30 rounded border-l-4 border-red-400">
                          <p className="text-xs">
                            💡 <strong>Tip:</strong> Make sure you're using the correct email, password, and account type before your next attempt.
                          </p>
                        </div>
                      </div>
                    ) : loginErrorState.show && !rateLimited ? (
                      <div className="space-y-2">
                        <p>Please check your email, password, and selected account type.</p>
                        <p className="font-medium">
                          {loginErrorState.attemptsRemaining} attempt{loginErrorState.attemptsRemaining !== 1 ? 's' : ''} remaining before temporary lockout.
                        </p>
                        <div className="mt-3 p-2 bg-red-100 dark:bg-red-800/30 rounded border-l-4 border-red-400">
                          <p className="text-xs">
                            💡 <strong>Common issues:</strong> Wrong account type selected, caps lock enabled, or email not verified.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p>{errorMessage}</p>
                        {invalidCredentials && attemptsRemaining < MAX_ATTEMPTS_PER_WINDOW && (
                          <p className="font-medium">
                            {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining.
                          </p>
                        )}
                        {errorMessage.toLowerCase().includes('invalid credentials') && (
                          <div className="mt-3 p-2 bg-red-100 dark:bg-red-800/30 rounded border-l-4 border-red-400">
                            <p className="text-xs">
                              💡 <strong>Double-check:</strong> Email spelling, password, and account type selection above.
                            </p>
                          </div>
                        )}
                        {errorMessage.toLowerCase().includes('email not confirmed') && (
                          <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-800/30 rounded border-l-4 border-blue-400">
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              📧 <strong>Next step:</strong> Check your inbox for a verification email, or click "Forgot your password?" to resend.
                            </p>
                          </div>
                        )}
                                                 {errorMessage.toLowerCase().includes('role mismatch') && (
                           <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-800/30 rounded border-l-4 border-yellow-400">
                             <p className="text-xs text-yellow-700 dark:text-yellow-300">
                               ⚠️ <strong>Account type mismatch:</strong> Select the correct account type above that matches your registration.
                             </p>
                           </div>
                         )}
                         {!errorMessage.toLowerCase().includes('invalid credentials') && 
                          !errorMessage.toLowerCase().includes('email not confirmed') && 
                          !errorMessage.toLowerCase().includes('role mismatch') && 
                          !errorMessage.toLowerCase().includes('rate limit') && 
                          !errorMessage.toLowerCase().includes('network') && 
                          !errorMessage.toLowerCase().includes('connection') && (
                           <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-800/30 rounded border-l-4 border-gray-400">
                             <p className="text-xs text-gray-700 dark:text-gray-300">
                               🔧 <strong>Need help?</strong> Try refreshing the page, checking your internet connection, or contact support if the issue persists.
                             </p>
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginErrorAlert(false);
                      setErrorMessage('');
                      setLoginErrorState({ show: false, attemptsRemaining: MAX_ATTEMPTS_PER_WINDOW });
                      setEmailError(false);
                      setPasswordError(false);
                      setInvalidCredentials(false);
                      
                      toast({
                        title: "✅ Error Dismissed",
                        description: "You can now try logging in again.",
                        variant: "default",
                        duration: 2000,
                      });
                    }}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-800/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-50 dark:focus:ring-offset-red-900 transition-all duration-200 hover:scale-110"
                    aria-label="Close alert"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {successMessage && (
            <div className="bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-md flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Success</p>
                <p className="text-sm">{successMessage}</p>
              </div>
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`pl-10 block w-full py-3 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-primary-orange focus:border-primary-orange dark:focus:ring-primary-orange dark:focus:border-primary-orange sm:text-sm ${
                  emailError ? 'border-red-300 dark:border-red-700 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-500 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-500 dark:focus:border-red-700' : ''
                }`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(false);
                  
                  // Clear invalid credentials error when user starts typing
                  if (invalidCredentials && e.target.value !== email) {
                    setInvalidCredentials(false);
                    // Don't auto-hide the top banner - let user close it manually
                  }
                }}
                aria-invalid={emailError}
                aria-describedby={emailError ? "email-error" : undefined}
                disabled={networkError || rateLimited}
              />
              {emailError && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                </div>
              )}
            </div>
            {emailError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400" id="email-error">
                Please enter a valid email address
              </p>
            )}
          </div>

          <div className="mt-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`pl-10 block w-full py-3 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-primary-orange focus:border-primary-orange dark:focus:ring-primary-orange dark:focus:border-primary-orange sm:text-sm ${
                  passwordError ? 'border-red-300 dark:border-red-700 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-500 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-500 dark:focus:border-red-700' : ''
                }`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(false);
                  
                  // Clear invalid credentials error when user starts typing
                  if (invalidCredentials && e.target.value !== password) {
                    setInvalidCredentials(false);
                    // Don't auto-hide the top banner - let user close it manually
                  }
                }}
                ref={passwordRef}
                aria-invalid={passwordError}
                aria-describedby={passwordError ? "password-error" : undefined}
                disabled={networkError || rateLimited}
              />
              {passwordError && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                </div>
              )}
            </div>
            {passwordError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400" id="password-error">
                Please enter a valid password
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-5 w-5 text-primary-orange focus:ring-primary-orange-light dark:focus:ring-primary-orange-dark dark:bg-gray-700 dark:border-gray-600 border-gray-300 rounded"
                disabled={networkError || rateLimited}
              />
              <label htmlFor="remember-me" className="ml-3 block text-sm text-gray-900 dark:text-gray-300">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                disabled={resetCooldown > 0 || networkError || rateLimited}
                className="font-medium text-primary-orange hover:text-primary-orange-dark dark:text-primary-orange dark:hover:text-primary-orange-light focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Forgot your password?
                {resetCooldown > 0 && ` (${resetCooldown}s)`}
              </button>
            </div>
          </div>

          <div className="mt-8">
                          <button
                type="submit"
                disabled={loading || networkError || rateLimited}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-orange hover:bg-primary-orange-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-orange dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-busy={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin h-5 w-5 mr-2" aria-hidden="true" />
                    <span>Signing in as {loginAsRole === 'customer' ? 'Customer' : 'Shop Manager'}...</span>
                  </div>
                ) : networkError ? (
                  <div className="flex items-center justify-center">
                    <WifiOff className="h-5 w-5 mr-2" />
                    <span>Can't connect</span>
                  </div>
                ) : rateLimited ? (
                  <div className="flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>Please wait before trying again</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    {loginAsRole === 'customer' ? <User className="h-5 w-5 mr-2" /> : <Store className="h-5 w-5 mr-2" />}
                    <span>Sign in as {loginAsRole === 'customer' ? 'Customer' : 'Shop Manager'}</span>
                  </div>
                )}
              </button>
          </div>
        </form>
      </div>
      
      {/* Password Reset Modal */}
      <PasswordResetModal 
        isOpen={isResetModalOpen} 
        onClose={() => setIsResetModalOpen(false)}
        onSuccess={handleResetSuccess}
        email={email}
      />
    </div>
  );
}