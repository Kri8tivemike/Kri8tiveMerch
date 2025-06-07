import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppwrite } from '../contexts/AppwriteContext';
import { useTheme } from '../contexts/ThemeProvider';
import { useToast } from '../hooks/use-toast';
import { Loader2, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter';
import { validatePassword } from '../utils/passwordUtils';

export default function ResetPassword() {
  const { theme } = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const appwrite = useAppwrite();

  // Parse the query parameters to extract userId and secret
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userIdParam = params.get('userId');
    const secretParam = params.get('secret');
    
    if (userIdParam && secretParam) {
      setUserId(userIdParam);
      setSecret(secretParam);
    } else {
      setTokenExpired(true);
      toast({
        title: "Invalid Link",
        description: "Invalid password reset link. Please request a new password reset.",
        variant: "destructive",
      });
      // Don't navigate away immediately to allow the user to see the message
      setTimeout(() => navigate('/login'), 5000);
    }
  }, [location, navigate, toast]);

  // Check if passwords match whenever either password changes
  useEffect(() => {
    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordsMatch(false);
    } else {
      setPasswordsMatch(true);
    }
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please ensure both passwords match",
        variant: "destructive",
      });
      setPasswordsMatch(false);
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      toast({
        title: "Password Too Weak",
        description: passwordValidation.feedback,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // If we have userId and secret, use them to complete the password recovery
      if (userId && secret) {
        const result = await appwrite.completePasswordRecovery(userId, secret, newPassword);
        
        if (!result.success) {
          setTokenExpired(true);
          throw new Error('Your password reset link has expired. Please request a new one.');
        }
      
        // Show success state
        setResetSuccess(true);
        
        toast({
          title: "Success",
          description: "Your password has been successfully reset",
          variant: "default",
        });
        
        // Redirect to login page after a short delay
        setTimeout(() => navigate('/login'), 3000);
      } else {
        throw new Error('Missing required parameters for password reset');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      
      // Handle specific error cases
      let errorMessage = "Failed to reset password";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for specific error types
        if (errorMessage.includes('expired')) {
          setTokenExpired(true);
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // If token is expired or reset was successful, show appropriate message
  if (tokenExpired) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] pt-24 transition-colors duration-200">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Link Expired</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Your password reset link has expired or is invalid. Please request a new one.
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center items-center bg-primary-orange hover:bg-primary-orange-dark"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] pt-24 transition-colors duration-200">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 dark:text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Password Reset Successful</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center items-center bg-primary-orange hover:bg-primary-orange-dark"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] pt-24 transition-colors duration-200">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Reset Your Password</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative mt-1">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-orange focus:ring-primary-orange dark:focus:border-primary-orange dark:focus:ring-primary-orange sm:text-sm pr-10"
                  aria-describedby="password-requirements"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  )}
                </button>
              </div>
              
              {/* Password strength meter */}
              {newPassword && <PasswordStrengthMeter password={newPassword} />}
            </div>

            <div className="relative">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative mt-1">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className={`block w-full rounded-md shadow-sm focus:ring-primary-orange sm:text-sm pr-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    !passwordsMatch && confirmPassword 
                      ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500 dark:focus:border-red-700 dark:focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:border-primary-orange dark:focus:border-primary-orange'
                  }`}
                  aria-invalid={!passwordsMatch}
                  aria-describedby={!passwordsMatch ? "password-match-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  )}
                </button>
              </div>
              {!passwordsMatch && confirmPassword && (
                <p id="password-match-error" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Passwords do not match
                </p>
              )}
            </div>

            <div className="mt-6">
              <Button
                type="submit"
                className="w-full flex justify-center py-3 px-4 bg-primary-orange hover:bg-primary-orange-dark text-base"
                disabled={loading || !newPassword || !confirmPassword || !passwordsMatch}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </div>
            
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-orange dark:hover:text-primary-orange focus:outline-none focus:underline transition-colors"
              >
                Return to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 