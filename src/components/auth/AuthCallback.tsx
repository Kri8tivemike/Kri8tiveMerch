import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { account } from '../../lib/appwrite';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        // Get URL parameters for Appwrite OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        const secret = urlParams.get('secret');
        
        if (userId && secret) {
          // Complete OAuth session with Appwrite
          await account.createSession(userId, secret);
          
          // Get the current user to verify authentication
          const user = await account.get();
          
          if (user) {
            // Check if this is email verification
            if (user.emailVerification) {
              navigate('/', { 
                replace: true,
                state: { 
                  message: 'Email verified successfully! Welcome to Kri8tive Store.',
                  type: 'success'
                }
              });
            } else {
              navigate('/account', { 
                replace: true,
                state: { 
                  message: 'Successfully logged in!',
                  type: 'success'
                }
              });
            }
          } else {
            throw new Error('Authentication failed');
          }
        } else {
          // Handle email verification callback
          const urlHash = window.location.hash;
          if (urlHash.includes('verification')) {
            navigate('/', {
              replace: true,
              state: {
                message: 'Email verification completed successfully!',
                type: 'success'
              }
            });
          } else {
            throw new Error('Invalid authentication callback');
          }
        }
      } catch (error) {
        console.error('Error during auth callback:', error);
        navigate('/login', {
          replace: true,
          state: { 
            error: error instanceof Error ? error.message : 'Authentication failed. Please try again.',
            type: 'error'
          }
        });
      }
    }

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}