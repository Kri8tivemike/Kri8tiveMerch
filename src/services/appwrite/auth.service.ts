import { account, ID } from '../../lib/appwrite';

export const authService = {
  // Create a new account
  createAccount: async (email: string, password: string, name: string) => {
    try {
      // First create the account
      const newAccount = await account.create(
        ID.unique(),
        email,
        password,
        name
      );
      
      if (newAccount.$id) {
        // For verification, use our dedicated route
        const verificationRedirect = `${window.location.origin}/verify-email`;
        
        // Try to send verification email
        try {
          // Log in first to get session permissions
          const session = await account.createEmailPasswordSession(email, password);
          
          if (session.$id) {
            // After login, try to create verification with proper session
            await account.createVerification(verificationRedirect);
            console.log('✅ Verification email sent successfully');
          }
        } catch (verificationError) {
          console.error('Failed to send verification email:', verificationError);
          // Continue anyway since account was created
        }
      }
      
      return { success: true, data: newAccount };
    } catch (error) {
      return { success: false, error };
    }
  },

  // Rate limit handling
  rateLimitState: {
    attempts: 0,
    lastAttempt: 0,
    backoffTime: 0,
    isLocked: false
  },

  // Reset rate limit state
  resetRateLimit: () => {
    authService.rateLimitState = {
      attempts: 0,
      lastAttempt: 0,
      backoffTime: 0,
      isLocked: false
    };
  },

  // Check if rate limited
  checkRateLimit: () => {
    const now = Date.now();
    const { attempts, lastAttempt, backoffTime, isLocked } = authService.rateLimitState;

    // If locked, check if backoff time has passed
    if (isLocked) {
      if (now - lastAttempt >= backoffTime) {
        authService.resetRateLimit();
        return { limited: false, waitTime: 0 };
      }
      return { limited: true, waitTime: Math.ceil((backoffTime - (now - lastAttempt)) / 1000) };
    }

    // Reset attempts if more than 60 seconds have passed
    if (now - lastAttempt > 60000) {
      authService.resetRateLimit();
      return { limited: false, waitTime: 0 };
    }

    return { limited: false, waitTime: 0 };
  },

  // Handle rate limit error
  handleRateLimit: () => {
    const now = Date.now();
    authService.rateLimitState.attempts++;
    authService.rateLimitState.lastAttempt = now;
    
    // Exponential backoff: 2^n seconds (max 5 minutes)
    const backoffTime = Math.min(Math.pow(2, authService.rateLimitState.attempts) * 1000, 300000);
    authService.rateLimitState.backoffTime = backoffTime;
    authService.rateLimitState.isLocked = true;

    return Math.ceil(backoffTime / 1000);
  },

  // Sign in with email and password
  signIn: async (email: string, password: string): Promise<{ success: boolean; error?: Error }> => {
    // Check rate limit before attempting
    const rateLimitCheck = authService.checkRateLimit();
    if (rateLimitCheck.limited) {
      return { 
        success: false, 
        error: new Error(`Rate limit in effect. Please wait ${rateLimitCheck.waitTime} seconds before trying again.`)
      };
    }

    try {
      const session = await account.createEmailPasswordSession(email, password);
      // Reset rate limit on successful login
      authService.resetRateLimit();
      return { success: true };
    } catch (error: any) {
      // Handle rate limit errors
      if (error?.code === 429 || (error?.message && (
          error.message.includes('rate limit') || 
          error.message.includes('too many requests')
      ))) {
        const waitTime = authService.handleRateLimit();
        return { 
          success: false, 
          error: new Error(`Too many login attempts. Please wait ${waitTime} seconds before trying again.`)
        };
      }
      
      // Handle other errors
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await account.deleteSession('current');
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const user = await account.get();
      return { success: true, data: user };
    } catch (error) {
      return { success: false, data: null };
    }
  },

  // Check if email is verified
  isEmailVerified: async () => {
    try {
      const user = await account.get();
      // Return whether email_verification is true in the user object
      return { 
        success: true, 
        verified: user.emailVerification 
      };
    } catch (error) {
      return { success: false, verified: false };
    }
  },

  // Get current session
  getSession: async () => {
    try {
      const session = await account.getSession('current');
      return { success: true, data: session };
    } catch (error) {
      return { success: false, data: null };
    }
  },

  // Update user's name
  updateName: async (name: string) => {
    try {
      const user = await account.updateName(name);
      return { success: true, data: user };
    } catch (error) {
      return { success: false, error };
    }
  },

  // Update user's email
  updateEmail: async (email: string, password: string) => {
    try {
      const user = await account.updateEmail(email, password);
      return { success: true, data: user };
    } catch (error) {
      return { success: false, error };
    }
  },

  // Update user's password
  updatePassword: async (password: string, oldPassword: string) => {
    try {
      const user = await account.updatePassword(password, oldPassword);
      return { success: true, data: user };
    } catch (error) {
      return { success: false, error };
    }
  },

  // Send password reset email
  forgotPassword: async (email: string) => {
    try {
      const resetUrl = `${window.location.origin}/reset-password`;
      await account.createRecovery(email, resetUrl);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  },

  // Complete password reset
  completePasswordRecovery: async (userId: string, secret: string, password: string) => {
    try {
      await account.updateRecovery(userId, secret, password);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  },

  // Verify email 
  verifyEmail: async (userId: string, secret: string) => {
    try {
      // Try to sign out first to prevent "session already active" error
      try {
        await account.deleteSession('current');
      } catch (signOutError) {
        // Ignore error - user may not be signed in
        console.log("No active session to delete before verification");
      }

      // Now confirm the verification
      await account.updateVerification(userId, secret);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  },
  
  // Send verification email again
  resendVerification: async () => {
    try {
      const verificationRedirect = `${window.location.origin}/verify-email`;
      await account.createVerification(verificationRedirect);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }
};

/**
 * Check if current user is an admin based on email
 * @returns Promise<boolean> - True if user is admin
 */
export const checkIfUserIsAdmin = async (): Promise<boolean> => {
  try {
    const user = await account.get();
    
    // If no user, not an admin
    if (!user) {
      localStorage.setItem('isAdmin', 'false');
      return false;
    }
    
    // Check if email ends with specific admin domain(s)
    // Add your admin email domains here
    const adminDomains = ['@admin.com', '@yourdomain.com'];
    const isAdmin = adminDomains.some(domain => user.email?.endsWith(domain));
    
    // Store admin status in localStorage for quick reference
    localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');
    
    return isAdmin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}; 