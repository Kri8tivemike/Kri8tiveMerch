import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Mail, Lock, X, CheckCircle, AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { isOnline, diagnoseNetworkIssues } from '../../lib/network-utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login' }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  
  const { signIn, signUp, networkError, checkConnection } = useAuth();
  const { toast } = useToast();

  // Add effect to respond to changes in initialMode prop
  useEffect(() => {
    setIsLogin(initialMode === 'login');
  }, [initialMode]);

  // Handle modal click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, loading]);

  // Check connection status when retryCount changes
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

  // Focus password field when email is entered
  useEffect(() => {
    if (email && !password && passwordRef.current) {
      passwordRef.current.focus();
    }
  }, [email, password]);

  // Focus trapping for the modal
  useEffect(() => {
    if (!isOpen) return;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
        return;
      }
      
      if (e.key !== 'Tab') return;
      
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) || [];
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      if (e.shiftKey && document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    };
    
    document.addEventListener('keydown', handleTabKey);
    
    // Focus first input on open
    const firstInput = modalRef.current?.querySelector('input') as HTMLInputElement;
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 50);
    }
    
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen, loading, onClose]);

  // Network error handler for both login and signup
  const handleNetworkError = async (error: any) => {
    const isFetchError = error instanceof TypeError && 
      error.message.includes('Failed to fetch');
    
    const isTimeoutError = error instanceof Error && 
      (error.message.includes('timeout') || error.message.includes('timed out'));
    
    const isNetworkError = isFetchError || isTimeoutError || 
      (error instanceof Error && error.message.includes('network'));
    
    if (isNetworkError) {
      console.warn('Network error during authentication:', error);
      
      // Diagnose network issues
      const appwriteEndpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || '';
      const diagnosticMessage = await diagnoseNetworkIssues(appwriteEndpoint);
      
      // Set appropriate error message
      if (isFetchError) {
        setErrorMessage(`Connection failed. ${diagnosticMessage}`);
      } else if (isTimeoutError) {
        setErrorMessage(`Authentication timed out. ${diagnosticMessage}`);
      } else {
        setErrorMessage(`Network error: ${error.message}. ${diagnosticMessage}`);
      }
      
      // Show toast
      toast({
        title: "Connection Problem",
        description: diagnosticMessage,
        variant: "destructive",
      });
      
      // Clear field errors for network issues
      setEmailError(false);
      setPasswordError(false);
      setNameError(false);
      
      return true; // Error was handled
    }
    
    return false; // Error wasn't handled
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setEmailError(false);
    setPasswordError(false);
    setErrorMessage('');
    setSuccessMessage('');
    
    // Check if browser is online
    if (!isOnline()) {
      setErrorMessage('Your device appears to be offline. Please check your internet connection.');
      toast({
        title: "Connection Error",
        description: "Your device appears to be offline. Please check your internet connection.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate form
    if (!email.trim()) {
      setEmailError(true);
      setErrorMessage('Please enter your email address');
      return;
    }
    
    if (!password) {
      setPasswordError(true);
      setErrorMessage('Please enter your password');
      return;
    }
    
    setLoading(true);
    
    try {
      await signIn(email.trim(), password);
      
      setSuccessMessage('Login successful!');
      toast({
        title: "Login Successful",
        description: "You have been successfully logged in",
      });
      
      // Short delay before closing modal and notifying parent
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 500);
    } catch (error) {
      console.error('Login error:', error);
      
      // Check for network errors
      const networkErrorHandled = await handleNetworkError(error);
      if (networkErrorHandled) {
        setLoading(false);
        return;
      }
      
      // Handle other errors
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      setErrorMessage(message);
      
      // Set specific field errors based on the error message
      if (message.toLowerCase().includes('email')) {
        setEmailError(true);
      }
      
      if (message.toLowerCase().includes('password')) {
        setPasswordError(true);
      }
      
      // If no specific field error is identified, highlight both fields
      if (!message.toLowerCase().includes('email') && !message.toLowerCase().includes('password')) {
        setEmailError(true);
        setPasswordError(true);
      }
      
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setEmailError(false);
    setPasswordError(false);
    setNameError(false);
    setErrorMessage('');
    setSuccessMessage('');
    
    // Check if browser is online
    if (!isOnline()) {
      setErrorMessage('Your device appears to be offline. Please check your internet connection.');
      toast({
        title: "Connection Error",
        description: "Your device appears to be offline. Please check your internet connection.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate form
    if (!email.trim()) {
      setEmailError(true);
      setErrorMessage('Please enter your email address');
      return;
    }
    
    if (!password || password.length < 6) {
      setPasswordError(true);
      setErrorMessage('Please enter a password (at least 6 characters)');
      return;
    }
    
    if (!firstName.trim() || !lastName.trim()) {
      setNameError(true);
      setErrorMessage('Please enter your first and last name');
      return;
    }
    
    setLoading(true);
    
    try {
      await signUp({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim()
      });
      
      setSuccessMessage('Account created successfully! Please check your email to verify your account.');
      toast({
        title: "Registration Successful",
        description: "Please check your email to verify your account",
      });
      
      // Switch to login view after signup
      setTimeout(() => {
        setIsLogin(true);
        setPassword('');
        setErrorMessage('');
      }, 3000);
    } catch (error) {
      console.error('Signup error:', error);
      
      // Check for network errors
      const networkErrorHandled = await handleNetworkError(error);
      if (networkErrorHandled) {
        setLoading(false);
        return;
      }
      
      // Handle other errors
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      setErrorMessage(message);
      
      // Set specific field errors based on the error message
      if (message.toLowerCase().includes('email')) {
        setEmailError(true);
      }
      
      if (message.toLowerCase().includes('password')) {
        setPasswordError(true);
      }
      
      if (message.toLowerCase().includes('name')) {
        setNameError(true);
      }
      
      toast({
        title: "Registration Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetryConnection = () => {
    setRetryCount(prev => prev + 1);
    toast({
      title: "Retrying Connection",
      description: "Checking connection to our services...",
    });
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setErrorMessage('');
    setSuccessMessage('');
    setEmailError(false);
    setPasswordError(false);
    setNameError(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Connection Error Alert */}
          {networkError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <div className="flex items-start">
                <WifiOff className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Connection Issue</p>
                  <p className="text-sm mt-1">
                    We're having trouble connecting to our services. This might be a temporary issue.
                  </p>
                  <button 
                    onClick={handleRetryConnection}
                    className="mt-2 inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Retry Connection
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Error Message */}
          {errorMessage && !networkError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{isLogin ? 'Login Failed' : 'Registration Failed'}</p>
                <p className="text-sm">{errorMessage}</p>
              </div>
            </div>
          )}
          
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Success</p>
                <p className="text-sm">{successMessage}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={isLogin ? handleLoginSubmit : handleSignupSubmit} className="space-y-6">
            {/* Sign Up Fields */}
            {!isLogin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    className={`mt-1 px-3 py-3 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      nameError ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={networkError || loading}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    className={`mt-1 px-3 py-3 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      nameError ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={networkError || loading}
                  />
                </div>
              </div>
            )}
            
            {/* Email Field */}
            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`pl-10 pr-10 py-3 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    emailError ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={networkError || loading}
                />
                {emailError && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Password Field */}
            <div>
              <label htmlFor="auth-password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="auth-password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  className={`pl-10 pr-10 py-3 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    passwordError ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  ref={passwordRef}
                  disabled={networkError || loading}
                />
                {passwordError && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {!isLogin && (
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 6 characters long.
                </p>
              )}
            </div>
            
            {/* Remember Me (Login only) */}
            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={networkError || loading}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
              </div>
            )}
            
            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading || networkError}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                  </div>
                ) : networkError ? (
                  <div className="flex items-center justify-center">
                    <WifiOff className="h-5 w-5 mr-2" />
                    <span>Can't connect</span>
                  </div>
                ) : (
                  <span>{isLogin ? 'Sign in' : 'Create account'}</span>
                )}
              </button>
            </div>
            
            {/* Toggle between login/signup */}
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={toggleAuthMode}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium focus:outline-none focus:underline"
                disabled={loading}
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 