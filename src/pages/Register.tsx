import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeProvider';
import { SignUpForm } from '../components/auth/SignUpForm';

export default function Register() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className={`flex min-h-screen items-center justify-center px-4 py-12 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className={`w-full max-w-md space-y-8 rounded-xl p-8 shadow-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div>
          <h2 className={`mt-6 text-center text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <SignUpForm />
        
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} text-gray-500 dark:text-gray-400`}>
                By signing up, you agree to our
              </span>
            </div>
          </div>

          <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
            <Link to="/terms" className="hover:text-gray-900 dark:hover:text-gray-200 underline">
              Terms of Service
            </Link>
            {' and '}
            <Link to="/privacy" className="hover:text-gray-900 dark:hover:text-gray-200 underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}