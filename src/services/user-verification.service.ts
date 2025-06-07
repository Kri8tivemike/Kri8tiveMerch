import { account, databases } from '../lib/appwrite';

// Database and collection IDs
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
const CUSTOMERS_COLLECTION_ID = 'customers';
const SHOP_MANAGERS_COLLECTION_ID = 'shop_managers';
const SUPER_ADMINS_COLLECTION_ID = 'super_admins';

/**
 * User Verification Service
 * Handles verification of users in both Appwrite Auth and local database
 */

interface VerificationResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Helper function to find user profile in role-based collections
 */
async function findUserProfile(userId: string): Promise<{ collection: string; document: any } | null> {
  const collections = [
    { id: SUPER_ADMINS_COLLECTION_ID, name: 'super_admins' },
    { id: SHOP_MANAGERS_COLLECTION_ID, name: 'shop_managers' },
    { id: CUSTOMERS_COLLECTION_ID, name: 'customers' }
  ];

  for (const collection of collections) {
    try {
      const document = await databases.getDocument(DATABASE_ID, collection.id, userId);
      if (document) {
        return { collection: collection.id, document };
      }
    } catch (error: any) {
      if (error.code !== 404) {
        console.warn(`Error checking ${collection.name} collection:`, error);
      }
    }
  }

  return null;
}

/**
 * Helper function to update user profile in the correct collection
 */
async function updateUserProfile(userId: string, data: any): Promise<boolean> {
  const profile = await findUserProfile(userId);
  if (!profile) {
    console.warn('No profile found for user:', userId);
    return false;
  }

  try {
    await databases.updateDocument(DATABASE_ID, profile.collection, userId, data);
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
}

/**
 * Get the appropriate verification URL based on environment
 */
const getVerificationUrl = (): string => {
  // Use current window location to construct proper URL
  const baseUrl = window.location.origin;
  return `${baseUrl}/verify-email`;
};

/**
 * Verify a user by updating their status in the database
 * In a real implementation, this would also sync with Appwrite Auth
 */
export const verifyUser = async (userId: string, userDocumentId: string): Promise<VerificationResult> => {
  try {
    // Update the user profile status in the database using role-based collections
    const success = await updateUserProfile(userId, {
      status: 'Verified', // Use capitalized status
      updated_at: new Date().toISOString()
    });

    if (!success) {
      return {
        success: false,
        message: 'Failed to find user profile in any collection',
        error: 'User profile not found'
      };
    }

    // In a real implementation, you would also call Appwrite's user verification API
    // For example: await users.updateEmailVerification(userId, true);
    // Note: This requires server-side implementation with admin SDK

    return {
      success: true,
      message: 'User verified successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to verify user',
      error: error.message
    };
  }
};

/**
 * Send verification email to user
 * This triggers Appwrite's built-in email verification system
 */
export const sendVerificationEmail = async (email: string): Promise<VerificationResult> => {
  try {
    // Check if we're in development mode
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.includes('localhost');
    
    // Check if user is currently authenticated
    let currentUser;
    try {
      currentUser = await account.get();
    } catch (authError) {
      console.log('❌ No authenticated user found');
      return {
        success: false,
        message: 'Please log in to resend the verification email.',
        error: 'Not authenticated'
      };
    }

    // Verify the email belongs to the current user (security check)
    if (currentUser.email !== email) {
      console.log('❌ Email mismatch - security check failed');
      return {
        success: false,
        message: 'Please log in with the correct account to resend the verification email.',
        error: 'Email mismatch'
      };
    }

    // Get dynamic verification URL
    const verificationUrl = `${window.location.origin}/verify-email`;
    
    // Create verification email using Appwrite's account service
    console.log(`📧 Attempting to send verification email to: ${email}`);
    console.log(`🔗 Verification redirect URL: ${verificationUrl}`);
    
    if (isDevelopment) {
      console.log(`🛠️ Development mode detected - email should work without SMTP config`);
    }
    
    await account.createVerification(verificationUrl);
    console.log(`✅ Verification email sent successfully to: ${email}`);
    
    if (isDevelopment) {
      return {
        success: true,
        message: `Verification email sent! Since you're in development mode, check:
1. Your email inbox
2. Appwrite Console → Logs
3. Browser Network tab`
      };
    } else {
      return {
        success: true,
        message: 'Verification email sent! Please check your inbox (including spam folder).'
      };
    }
  } catch (error: any) {
    console.error('❌ Failed to send verification email:', error);
    
    // Handle specific error cases
    if (error.code === 401) {
      return {
        success: false,
        message: 'Please log in to resend the verification email.',
        error: 'Not authenticated'
      };
    }
    
    if (error.code === 429) {
      return {
        success: false,
        message: 'Please wait a moment before requesting another verification email.',
        error: 'Too many requests'
      };
    }
    
    if (error.message?.toLowerCase().includes('already verified')) {
      return {
        success: true,
        message: 'Your email is already verified. You can proceed to login.'
      };
    }
    
    // Default error case
    return {
      success: false,
      message: error.message || 'Failed to send verification email. Please try again.',
      error: error.message
    };
  }
};

/**
 * Send verification email for admin-managed users
 * This version handles cases where admin is sending verification emails for other users
 */
export const sendVerificationEmailAsAdmin = async (
  targetEmail: string, 
  targetUserId: string
): Promise<VerificationResult> => {
  try {
    console.log(`📧 Admin attempting to send verification email to: ${targetEmail} (User ID: ${targetUserId})`);
    
    // Get current admin user
    let currentUser;
    try {
      currentUser = await account.get();
    } catch (authError) {
      return {
        success: false,
        message: 'Admin authentication required.',
        error: 'Not authenticated'
      };
    }

    // Check if current user has admin privileges using role-based collections
    const adminProfile = await findUserProfile(currentUser.$id);

    if (!adminProfile || 
        !['super_admin', 'shop_manager'].includes(adminProfile.document.role)) {
      return {
        success: false,
        message: 'Admin privileges required to send verification emails for other users.',
        error: 'Insufficient privileges'
      };
    }

    // For admin-managed verification, we need to handle this differently
    // Since we can't directly send verification emails for other users from client-side,
    // we'll provide instructions for the admin
    return {
      success: false,
      message: `⚠️ Admin Limitation: Cannot send verification emails for other users from client-side. 
      
      Options:
      1. Ask the user (${targetEmail}) to log in and request verification themselves
      2. Manually verify the user using the "Verify User" button
      3. Set up server-side admin functions for sending verification emails
      
      Alternative: Use the manual "Verify User" action to bypass email verification.`,
      error: 'Client-side limitation'
    };

  } catch (error: any) {
    console.error('❌ Admin verification email failed:', error);
    return {
      success: false,
      message: 'Failed to send admin verification email.',
      error: error.message
    };
  }
};

/**
 * Toggle user active status
 */
export const toggleUserStatus = async (
  userDocumentId: string, 
  currentStatus: string
): Promise<VerificationResult> => {
  try {
    const newStatus = currentStatus === 'Verified' ? 'Deactivated' : 'Verified';
    
    const success = await updateUserProfile(userDocumentId, {
      status: newStatus,
      updated_at: new Date().toISOString()
    });

    if (!success) {
      return {
        success: false,
        message: 'Failed to find user profile in any collection',
        error: 'User profile not found'
      };
    }

    return {
      success: true,
      message: `User ${newStatus === 'Verified' ? 'Verified' : 'deactivated'} successfully`
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to update user status',
      error: error.message
    };
  }
};

/**
 * Get user verification status from Appwrite Auth
 * This checks the actual Appwrite Auth user status
 */
export const getUserVerificationStatus = async (userId: string): Promise<{
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}> => {
  try {
    // Try to get the current user (if it's the same user)
    // Note: This only works for the currently logged-in user
    const currentUser = await account.get();
    
    if (currentUser.$id === userId) {
      return {
        isEmailVerified: currentUser.emailVerification || false,
        isPhoneVerified: currentUser.phoneVerification || false
      };
    }
    
         // For other users, we can't check their verification status from client-side
     // This would require server-side implementation with admin SDK
     console.log(`ℹ️ Note: Cannot check verification status for other users from client-side (user: ${userId}). Returning default status.`);
    
    // Return conservative defaults
    return {
      isEmailVerified: false,
      isPhoneVerified: false
    };
  } catch (error) {
    console.error('Failed to get user verification status:', error);
    return {
      isEmailVerified: false,
      isPhoneVerified: false
    };
  }
};

/**
 * Sync user verification status between Appwrite Auth and local database
 * This ensures both systems are in sync
 */
export const syncUserVerificationStatus = async (
  userId: string, 
  userDocumentId: string,
  knownVerificationStatus?: boolean
): Promise<VerificationResult> => {
  try {
    let dbStatus: string;
    
    // If we already know the verification status (e.g., from "already verified" error), use it
    if (knownVerificationStatus !== undefined) {
      dbStatus = knownVerificationStatus ? 'Verified' : 'Pending';
      console.log(`✅ Using known verification status: ${dbStatus} (skipping Auth check)`);
    } else {
      // Try to get status from Appwrite Auth only if we don't know the status
      console.log(`Checking verification status from Appwrite Auth for user: ${userId}`);
      const authStatus = await getUserVerificationStatus(userId);
      dbStatus = authStatus.isEmailVerified ? 'Verified' : 'Pending';
      console.log(`Got verification status from Auth: ${dbStatus}`);
    }
    
    // Update local database to match Auth status
    console.log(`Updating database status to: ${dbStatus}`);
    const success = await updateUserProfile(userDocumentId, {
      status: dbStatus === 'Verified' ? 'Verified' : 'Pending', // Use capitalized status values
      updated_at: new Date().toISOString()
    });

    if (!success) {
      return {
        success: false,
        message: 'Failed to find user profile in any collection',
        error: 'User profile not found'
      };
    }

    console.log(`✅ Database updated successfully with status: ${dbStatus}`);
    return {
      success: true,
      message: `User verification status synced successfully - status set to: ${dbStatus}`
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to sync user verification status',
      error: error.message
    };
  }
}; 