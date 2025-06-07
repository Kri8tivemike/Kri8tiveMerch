import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, Mail, User, Lock, Store, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { handleAuthError, formatErrorForUser, ErrorContext } from '../../utils/errorHandler';
import { InputHTMLAttributes, ReactNode } from 'react';
import { useToast } from '../../contexts/ToastContext';

// Define role type
type SignUpRole = 'user' | 'shop_manager';

interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: SignUpRole;
}

// Custom Password Input component that includes show/hide toggle
interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: ReactNode;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function PasswordInput({ 
  label, 
  error,
  icon = <Lock className="h-4 w-4 text-gray-400 dark:text-gray-500" />,
  name,
  value,
  onChange,
  ...props 
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const id = name;
  
  return (
    <div className="space-y-2 w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className={`block w-full px-3 py-2.5 border ${
            error 
              ? 'border-red-300 text-red-900 focus:outline-none focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 dark:border-gray-600 focus:ring-primary-orange focus:border-primary-orange focus:outline-none dark:bg-gray-700 dark:text-white'
          } rounded-md shadow-sm pl-10 pr-10`}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 focus:outline-none"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}



export function SignUpForm() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showError, setShowError] = useState(false);
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'user',
  });
  
  // Field-specific errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Handle cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cooldown > 0) {
      setError(`Please wait ${cooldown} seconds before trying again`);
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    // setError(null); // Keep previous error visible until explicitly closed or new error replaces it
    // setShowError(false); // Don't hide on new submit, only on close or if success
    setSuccess(false);

    try {
      await signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        role: formData.role
      });

      // Set success state
      setSuccess(true);
      
      // Store the email for use in the success page
      const userEmail = formData.email.trim().toLowerCase();
      
      // Redirect to the registration success page with the email
      navigate('/registration-success', { 
        state: { 
          email: userEmail,
          role: formData.role 
        },
        replace: true
      });
      
    } catch (error: any) {
      // Log the error with our error handler
      const errorContext: ErrorContext = {
        component: 'SignUpForm',
        action: 'signUp',
        additionalData: { 
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role
        }
      };
      
      handleAuthError(error, errorContext);
      
      // Format the error message for user display
      const userFriendlyMessage = formatErrorForUser(error.message || 'An unexpected error occurred during sign up');
      
      // Check for common registration errors and provide more specific messages
      if (error.message?.includes('already exists')) {
        setFieldErrors(prev => ({ ...prev, email: 'This email is already registered' }));
        setError(userFriendlyMessage); // Show the user-friendly message
        setShowError(true); // Show the alert
        
        // Show prominent toast notification
        showToast("Email Already Registered: This email is already registered. Please use a different email or try signing in.", "error");
      } else if (error.message?.includes('password')) {
        setFieldErrors(prev => ({ ...prev, password: 'Invalid password' }));
        setError(userFriendlyMessage);
        setShowError(true);
        
        showToast(userFriendlyMessage, "error");
      } else if (error.message?.toLowerCase().includes('account type') || error.message?.toLowerCase().includes('role')) {
        // Role validation errors
        setError(error.message);
        setShowError(true);
        
        showToast(error.message, "error");
      } else if (error.message?.toLowerCase().includes('shop manager') && error.message?.toLowerCase().includes('approval')) {
        // Shop manager approval related errors
        setError(error.message);
        setShowError(true);
        
        showToast(error.message, "warning");
      } else if (error.message?.toLowerCase().includes('rate limit') || error.message?.toLowerCase().includes('too many requests')) {
        // Rate limit error
        const rateLimitMessage = "Too many registration attempts. Please wait a minute before trying again.";
        setError(rateLimitMessage);
        setShowError(true);
        setCooldown(60); // Set a 60-second cooldown
        showToast(rateLimitMessage, "error");
      } else {
        // For all other errors, show the user-friendly message
        setError(userFriendlyMessage);
        setShowError(true);
        
        showToast(userFriendlyMessage, "error");
      }
      
      setSuccess(false);
      setCooldown(5);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field-specific error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Don't clear the error alert automatically - only clear on manual close
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
      {error && showError && (
        <div className="p-4 rounded-md border border-gray-600 relative" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5" style={{ color: '#ffffff' }} aria-hidden="true" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium" style={{ color: '#ffffff' }}>
                Registration failed
              </h3>
              <div className="mt-1 text-sm" style={{ color: '#ffffff' }}>
                {error}
              </div>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowError(false)}
                className="inline-flex rounded-md p-1.5 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black transition-colors"
                style={{ color: '#ffffff' }}
                aria-label="Close alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-md bg-green-50 dark:bg-green-900/60 border border-green-200 dark:border-green-600">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-300" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-100">
                Registration successful
              </h3>
              <div className="mt-1 text-sm text-green-700 dark:text-green-200">
                Please check your email for a verification link.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            disabled={loading}
            error={fieldErrors.firstName}
            icon={<User className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
          />
          
          <Input
            label="Last Name"
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            disabled={loading}
            error={fieldErrors.lastName}
            icon={<User className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
          />
        </div>

        <Input
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={loading}
          error={fieldErrors.email}
          icon={<Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
        />

        {/* Role Toggle Buttons */}
        <div className="space-y-3">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Account Type
            </h3>
          </div>
          <div className="flex justify-center space-x-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, role: 'user' }))}
              disabled={loading}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 min-w-[140px] justify-center disabled:opacity-50
                ${formData.role === 'user' 
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105 ring-2 ring-blue-500 ring-opacity-50' 
                  : `bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md`}
              `}
            >
              <Users className="w-4 h-4" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, role: 'shop_manager' }))}
              disabled={loading}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 min-w-[140px] justify-center disabled:opacity-50
                ${formData.role === 'shop_manager' 
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
              {formData.role === 'user' 
                ? 'Create an account to browse and purchase products' 
                : 'Create an account to manage products and orders (requires approval)'}
            </p>
          </div>
        </div>

        <PasswordInput
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={loading}
          error={fieldErrors.password}
        />

        <PasswordInput
          label="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          disabled={loading}
          error={fieldErrors.confirmPassword}
        />

        {formData.role === 'shop_manager' && (
          <div className="p-4 rounded-md bg-amber-50 dark:bg-amber-900/60 border border-amber-200 dark:border-amber-600">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-300" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-100">
                  Shop Manager Account
                </h3>
                <div className="mt-1 text-sm text-amber-700 dark:text-amber-200">
                  Your account will need to be approved by an administrator before you can access shop management features.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <Button
          type="submit"
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-orange hover:bg-primary-orange-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-orange dark:focus:ring-offset-gray-800"
          disabled={loading || cooldown > 0}
        >
          {loading ? (
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              <span>Creating {formData.role === 'user' ? 'Customer' : 'Shop Manager'} Account...</span>
            </div>
          ) : cooldown > 0 ? (
            `Try again in ${cooldown}s`
          ) : (
            <div className="flex items-center justify-center">
              {formData.role === 'user' ? <Users className="h-5 w-5 mr-2" /> : <Store className="h-5 w-5 mr-2" />}
              <span>Create {formData.role === 'user' ? 'Customer' : 'Shop Manager'} Account</span>
            </div>
          )}
        </Button>
      </div>

      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-primary-orange hover:text-primary-orange-dark dark:text-primary-orange-light dark:hover:text-primary-orange transition-colors"
        >
          Sign in
        </Link>
      </div>
    </form>
  );
}
