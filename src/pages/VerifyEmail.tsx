import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { account, databases } from '../lib/appwrite';

// Database and collection IDs
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
const CUSTOMERS_COLLECTION_ID = 'customers';
const SHOP_MANAGERS_COLLECTION_ID = 'shop_managers';
const SUPER_ADMINS_COLLECTION_ID = 'super_admins';
import { useToast } from '../hooks/use-toast';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Email Verification Page
 * Handles the email verification process when users click the link from their email
 */
const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get verification parameters from URL
        const userId = searchParams.get('userId');
        const secret = searchParams.get('secret');

        if (!userId || !secret) {
          setVerificationStatus('error');
          setMessage('Invalid verification link. Please request a new verification email.');
          return;
        }

        // Confirm email verification with Appwrite
        await account.updateVerification(userId, secret);

        // Update user profile status in database
        try {
          // Get current user account to find their profile
          const user = await account.get();
          
          // Try to find and update user profile in role-based collections
          const collections = [
            { id: SUPER_ADMINS_COLLECTION_ID, name: 'super_admins' },
            { id: SHOP_MANAGERS_COLLECTION_ID, name: 'shop_managers' },
            { id: CUSTOMERS_COLLECTION_ID, name: 'customers' }
          ];
          
          let profileUpdated = false;
          
          for (const collection of collections) {
            try {
              // Try to get the profile directly using user ID as document ID
              const profile = await databases.getDocument(
                DATABASE_ID,
                collection.id,
                user.$id
              );
              
              if (profile) {
                // Update profile status to Verified (capitalized)
                await databases.updateDocument(
                  DATABASE_ID,
                  collection.id,
                  profile.$id,
                  {
                    status: 'Verified',
                    updated_at: new Date().toISOString()
                  }
                );
                
                console.log(`Updated profile status in ${collection.name} collection`);
                profileUpdated = true;
                break;
              }
            } catch (error: any) {
              if (error.code !== 404) {
                console.warn(`Error checking ${collection.name} collection:`, error);
              }
            }
          }
          
          if (!profileUpdated) {
            console.warn('No profile found in any role-based collection for user:', user.$id);
          }
        } catch (dbError) {
          console.warn('Failed to update profile status in database:', dbError);
          // Don't fail the entire verification for database update issues
        }

        setVerificationStatus('success');
        setMessage('Your email has been successfully verified! You can now access all features.');
        
        toast({
          title: "✅ Email Verified Successfully",
          description: "Your account is now verified and active.",
          variant: "default"
        });

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);

      } catch (error: any) {
        console.error('Email verification failed:', error);
        setVerificationStatus('error');
        
        if (error.code === 400) {
          setMessage('This verification link has expired or is invalid. Please request a new verification email.');
        } else if (error.code === 401) {
          setMessage('Verification failed. Please try logging in again and request a new verification email.');
        } else {
          setMessage('Email verification failed. Please try again or contact support.');
        }
        
        toast({
          title: "❌ Verification Failed",
          description: error.message || "Email verification failed.",
          variant: "destructive"
        });
      }
    };

    verifyEmail();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="mb-6">
          {verificationStatus === 'loading' && (
            <Loader2 className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto animate-spin" />
          )}
          {verificationStatus === 'success' && (
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto" />
          )}
          {verificationStatus === 'error' && (
            <AlertCircle className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto" />
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {verificationStatus === 'loading' && 'Verifying Email...'}
          {verificationStatus === 'success' && 'Email Verified!'}
          {verificationStatus === 'error' && 'Verification Failed'}
        </h1>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          {verificationStatus === 'success' && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting to dashboard in 3 seconds...
            </div>
          )}
          
          {verificationStatus === 'error' && (
            <div className="space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Contact Support
              </button>
            </div>
          )}
          
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 