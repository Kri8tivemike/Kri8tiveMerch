import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Mail, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeProvider';
import { useAppwrite } from '../../contexts/AppwriteContext';
import { useToast } from '../../hooks/use-toast';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  email?: string;
}

export function PasswordResetModal({ isOpen, onClose, onSuccess, email = '' }: PasswordResetModalProps) {
  const { theme } = useTheme();
  const [emailInput, setEmailInput] = useState(email);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const appwrite = useAppwrite();
  const { toast } = useToast();

  // Update email input when email prop changes
  useEffect(() => {
    if (email) {
      setEmailInput(email);
    }
  }, [email]);

  // Handle clicking outside the modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && !loading) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus the input when modal opens
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, loading]);

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setSuccess(false);
      setError('');
      // Don't reset email if it was provided as a prop
      if (!email) {
        setEmailInput('');
      }
    }
  }, [isOpen, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailInput.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Using Appwrite SDK to request password recovery
      const result = await appwrite.forgotPassword(emailInput.trim());
      
      if (result.success) {
        setSuccess(true);
        const successMessage = 'Password reset instructions have been sent to your email.';
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess(successMessage);
        }
        
        toast({
          title: "Reset Email Sent",
          description: successMessage,
        });
        
        // Close modal after a delay
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        throw new Error(result.error || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      const message = error instanceof Error ? error.message : 'An error occurred';
      
      setError(message);
      toast({
        title: "Password Reset Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
      >
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Reset your password
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-orange dark:focus:ring-offset-gray-800"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="p-4">
          {!success ? (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">{error}</div>
                </div>
              )}
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Enter your email address and we'll send you instructions to reset your password.
                </p>
                
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  
                  <input
                    ref={inputRef}
                    id="reset-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="pl-10 block w-full py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-primary-orange focus:border-primary-orange dark:focus:ring-primary-orange dark:focus:border-primary-orange sm:text-sm"
                    placeholder="you@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-orange dark:focus:ring-offset-gray-800"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-orange hover:bg-primary-orange-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-orange dark:focus:ring-offset-gray-800 border border-transparent rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="py-4">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500 dark:text-green-400" />
              </div>
              
              <h3 className="text-lg font-medium text-center text-gray-900 dark:text-gray-100 mb-2">
                Check your inbox
              </h3>
              
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                We've sent password reset instructions to:
                <br />
                <span className="font-medium text-gray-800 dark:text-gray-200">{emailInput}</span>
              </p>
              
              <p className="text-center text-xs text-gray-500 dark:text-gray-500">
                If you don't see the email, check your spam folder or try another email address.
              </p>
              
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-orange hover:bg-primary-orange-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-orange dark:focus:ring-offset-gray-800 border border-transparent rounded-md"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 