import { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { useAppwrite } from './AppwriteContext';
import { authService } from '../services/appwrite';
import { databases, Query } from '../lib/appwrite';
import { cleanupWishlist } from '../services/profile.service';

// Define the User and Profile types to match the old Supabase format
interface User {
  id: string;
  email: string;
}

interface Profile {
  id: string;
  email?: string;
  name?: string;
  full_name?: string;
  role?: string;
  status?: string;
  phone?: string;
  avatar_url?: string;
  whatsapp_number?: string;
  delivery_address?: string;
  emailVerified?: boolean;
  user_id?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  networkError: boolean;
  isEmailVerified: boolean;
  checkEmailVerification: () => Promise<boolean>;
  signIn: (email: string, password: string, role?: string) => Promise<{ success: boolean; error?: Error }>;
  signUp: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  resendVerification: () => Promise<void>;
  checkConnection: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Use Appwrite context internally
  const appwrite = useAppwrite();
  // Add email verification state
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  // Add profile state
  const [profileData, setProfileData] = useState<Profile | null>(null);
  // Add profile loading state
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Map Appwrite user to User format
  const user: User | null = appwrite.user ? {
    id: appwrite.user.$id,
    email: appwrite.user.email || '',
  } : null;
  
  // Load profile data when user changes
  useEffect(() => {
    if (user) {
      loadProfileData();
    } else {
      setProfileData(null);
    }
  }, [appwrite.user]);

  // Function to get profile data directly from role-based collections (used for role validation)
  const getProfileDataDirect = useCallback(async (): Promise<Profile | null> => {
    if (!appwrite.user) {
      console.log('🚫 getProfileDataDirect: No user available');
      return null;
    }
    
    console.log(`🔍 getProfileDataDirect: Checking role for user ${appwrite.user.email} (ID: ${appwrite.user.$id})`);
    
    try {
      // Get database ID from environment variables
      const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
      
      if (!databaseId) {
        console.error('Database ID is missing in environment variables');
        return null;
      }

      let profile = null;
      let userRole = 'user';
      
      // Check super_admins collection first
      try {
        console.log('🔍 Checking super_admins collection...');
        const superAdminQuery = await databases.listDocuments(
          databaseId,
          'super_admins',
          [Query.equal('user_id', appwrite.user.$id)]
        );
        if (superAdminQuery.documents.length > 0) {
          profile = superAdminQuery.documents[0];
          userRole = 'super_admin';
          console.log('✅ Found user in super_admins collection');
        } else {
          console.log('❌ User not found in super_admins collection');
        }
      } catch (error: any) {
        console.error('Error checking super_admins collection:', error);
      }
      
      // If not found in super_admins, check shop_managers collection
      if (!profile) {
        try {
          console.log('🔍 Checking shop_managers collection...');
          const shopManagerQuery = await databases.listDocuments(
            databaseId,
            'shop_managers',
            [Query.equal('user_id', appwrite.user.$id)]
          );
          if (shopManagerQuery.documents.length > 0) {
            profile = shopManagerQuery.documents[0];
            userRole = 'shop_manager';
            console.log('✅ Found user in shop_managers collection');
          } else {
            console.log('❌ User not found in shop_managers collection');
          }
        } catch (error: any) {
          console.error('Error checking shop_managers collection:', error);
        }
      }
      
      // If not found in shop_managers, check customers collection
      if (!profile) {
        try {
          console.log('🔍 Checking customers collection...');
          const customerQuery = await databases.listDocuments(
            databaseId,
            'customers',
            [Query.equal('user_id', appwrite.user.$id)]
          );
          if (customerQuery.documents.length > 0) {
            profile = customerQuery.documents[0];
            userRole = 'user';
            console.log('✅ Found user in customers collection');
          } else {
            console.log('❌ User not found in customers collection');
          }
        } catch (error: any) {
          console.error('Error checking customers collection:', error);
        }
      }

      if (profile) {
        console.log(`✅ getProfileDataDirect: Found profile with role '${userRole}' for user ${appwrite.user.email}`);
        // Return consistent profile data structure
        return {
          id: profile.$id,
          email: profile.email || appwrite.user.email || '',
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || appwrite.user.email?.split('@')[0] || 'User',
          full_name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || appwrite.user.email?.split('@')[0] || 'User',
          role: userRole,
          status: profile.status || 'Verified',
          phone: profile.phone || '',
          avatar_url: profile.avatar_url || '',
          whatsapp_number: profile.whatsapp_number || profile.phone || '',
          delivery_address: profile.delivery_address || '',
          emailVerified: appwrite.user?.emailVerification || false,
          user_id: appwrite.user.$id,
        };
      } else {
        console.log(`❌ getProfileDataDirect: No profile found for user ${appwrite.user.email} in any collection`);
        // No profile found in any collection
        return null;
      }
    } catch (error) {
      console.error('Error getting profile data directly:', error);
      return null;
    }
  }, [appwrite.user]);

  // Function to get profile data directly with a specific user object (used during role validation)
  const getProfileDataDirectWithUser = useCallback(async (user: any): Promise<Profile | null> => {
    if (!user) {
      console.log('🚫 getProfileDataDirectWithUser: No user provided');
      return null;
    }
    
    console.log(`🔍 getProfileDataDirectWithUser: Checking role for user ${user.email} (ID: ${user.$id})`);
    
    try {
      // Get database ID from environment variables
      const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
      
      if (!databaseId) {
        console.error('Database ID is missing in environment variables');
        return null;
      }

      let profile = null;
      let userRole = 'user';
      
      // Check super_admins collection first
      try {
        console.log('🔍 Checking super_admins collection...');
        const superAdminQuery = await databases.listDocuments(
          databaseId,
          'super_admins',
          [Query.equal('user_id', user.$id)]
        );
        if (superAdminQuery.documents.length > 0) {
          profile = superAdminQuery.documents[0];
          userRole = 'super_admin';
          console.log('✅ Found user in super_admins collection');
        } else {
          console.log('❌ User not found in super_admins collection');
        }
      } catch (error: any) {
        console.error('Error checking super_admins collection:', error);
      }
      
      // If not found in super_admins, check shop_managers collection
      if (!profile) {
        try {
          console.log('🔍 Checking shop_managers collection...');
          const shopManagerQuery = await databases.listDocuments(
            databaseId,
            'shop_managers',
            [Query.equal('user_id', user.$id)]
          );
          if (shopManagerQuery.documents.length > 0) {
            profile = shopManagerQuery.documents[0];
            userRole = 'shop_manager';
            console.log('✅ Found user in shop_managers collection');
          } else {
            console.log('❌ User not found in shop_managers collection');
          }
        } catch (error: any) {
          console.error('Error checking shop_managers collection:', error);
        }
      }
      
      // If not found in shop_managers, check customers collection
      if (!profile) {
        try {
          console.log('🔍 Checking customers collection...');
          const customerQuery = await databases.listDocuments(
            databaseId,
            'customers',
            [Query.equal('user_id', user.$id)]
          );
          if (customerQuery.documents.length > 0) {
            profile = customerQuery.documents[0];
            userRole = 'user';
            console.log('✅ Found user in customers collection');
          } else {
            console.log('❌ User not found in customers collection');
          }
        } catch (error: any) {
          console.error('Error checking customers collection:', error);
        }
      }

      if (profile) {
        console.log(`✅ getProfileDataDirectWithUser: Found profile with role '${userRole}' for user ${user.email}`);
        // Return consistent profile data structure
        return {
          id: profile.$id,
          email: profile.email || user.email || '',
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email?.split('@')[0] || 'User',
          full_name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email?.split('@')[0] || 'User',
          role: userRole,
          status: profile.status || 'Verified',
          phone: profile.phone || '',
          avatar_url: profile.avatar_url || '',
          whatsapp_number: profile.whatsapp_number || profile.phone || '',
          delivery_address: profile.delivery_address || '',
          emailVerified: user?.emailVerification || false,
          user_id: user.$id,
        };
      } else {
        console.log(`❌ getProfileDataDirectWithUser: No profile found for user ${user.email} in any collection`);
        // No profile found in any collection
        return null;
      }
    } catch (error) {
      console.error('Error getting profile data directly with user:', error);
      return null;
    }
  }, []);

  // Function to load profile data from role-based collections
  const loadProfileData = useCallback(async () => {
    if (!appwrite.user) return;
    
    setProfileLoading(true);
    
    try {
      // Get database ID from environment variables
      const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
      
      if (!databaseId) {
        console.error('Database ID is missing in environment variables');
        setProfileLoading(false);
        return;
      }

      let profile = null;
      let userRole = 'user';
      
      // Check super_admins collection first
      try {
        const superAdminQuery = await databases.listDocuments(
          databaseId,
          'super_admins',
          [Query.equal('user_id', appwrite.user.$id)]
        );
        if (superAdminQuery.documents.length > 0) {
          profile = superAdminQuery.documents[0];
          userRole = 'super_admin';
          console.log('Found user profile in super_admins collection');
        }
      } catch (error: any) {
        console.error('Error checking super_admins collection:', error);
      }
      
      // If not found in super_admins, check shop_managers collection
      if (!profile) {
        try {
          const shopManagerQuery = await databases.listDocuments(
            databaseId,
            'shop_managers',
            [Query.equal('user_id', appwrite.user.$id)]
          );
          if (shopManagerQuery.documents.length > 0) {
            profile = shopManagerQuery.documents[0];
            userRole = 'shop_manager';
            console.log('Found user profile in shop_managers collection');
          }
        } catch (error: any) {
          console.error('Error checking shop_managers collection:', error);
        }
      }
      
      // If not found in shop_managers, check customers collection
      if (!profile) {
        try {
          const customerQuery = await databases.listDocuments(
            databaseId,
            'customers',
            [Query.equal('user_id', appwrite.user.$id)]
          );
          if (customerQuery.documents.length > 0) {
            profile = customerQuery.documents[0];
            userRole = 'user';
            console.log('Found user profile in customers collection');
          }
        } catch (error: any) {
          console.error('Error checking customers collection:', error);
        }
      }

      if (profile) {
        // Profile found in one of the role-based collections
        console.log('Retrieved profile document:', profile);
        
        // Ensure consistent profile data structure
        setProfileData({
          id: profile.$id,
          email: profile.email || appwrite.user.email || '',
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || appwrite.user.email?.split('@')[0] || 'User',
          full_name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || appwrite.user.email?.split('@')[0] || 'User',
          role: userRole,
          status: profile.status || 'Verified',
          phone: profile.phone || '',
          avatar_url: profile.avatar_url || '',
          whatsapp_number: profile.whatsapp_number || profile.phone || '',
          delivery_address: profile.delivery_address || '',
          emailVerified: appwrite.user?.emailVerification || false,
          user_id: appwrite.user.$id,
        });
      } else {
        // Profile not found in any collection, create a default customer profile
        console.log(`No profile found for user_id: ${appwrite.user.$id}. Creating default customer profile.`);
        
        try {
          // Determine name parts
          const userName = appwrite.user?.name || '';
          const nameParts = userName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
          
          // Create default customer profile data
          const profileData = {
            user_id: appwrite.user.$id,
            email: appwrite.user?.email || '',
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`.trim() || appwrite.user?.email?.split('@')[0] || 'User',
            preferences: '',
            total_orders: 0,
            total_spent: 0,
            status: 'Verified',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          console.log('Attempting to create customer profile with data:', profileData);
          
          const newProfile = await databases.createDocument(
            databaseId,
            'customers',
            appwrite.user.$id, // Use user ID as document ID
            profileData
          );
          
          console.log('Successfully created customer profile:', newProfile);
          
          // Set profile data with new profile
          setProfileData({
            id: newProfile.$id,
            email: newProfile.email || appwrite.user.email || '',
            name: `${newProfile.first_name || ''} ${newProfile.last_name || ''}`.trim() || appwrite.user.email?.split('@')[0] || 'User',
            full_name: newProfile.full_name || `${newProfile.first_name || ''} ${newProfile.last_name || ''}`.trim() || appwrite.user.email?.split('@')[0] || 'User',
            role: 'user',
            status: newProfile.status || 'Verified',
            emailVerified: appwrite.user?.emailVerification || false,
            user_id: appwrite.user.$id,
          });
        } catch (createError) {
          console.error('Error creating customer profile:', createError);
          // Set a minimal fallback profile to prevent crashes
          setProfileData({
            id: appwrite.user.$id,
            email: appwrite.user?.email || '',
            name: appwrite.user?.name || 'User',
            full_name: appwrite.user?.name || 'User',
            role: 'user',
            status: 'Verified',
            emailVerified: false,
            user_id: appwrite.user.$id,
          });
        }
      }
    } catch (error) {
      console.error('Error in loadProfileData:', error);
      // Set a minimal fallback profile to prevent crashes
      setProfileData({
        id: appwrite.user.$id,
        email: appwrite.user?.email || '',
        name: appwrite.user?.name || 'User',
        full_name: appwrite.user?.name || 'User',
        role: 'user',
        status: 'Verified',
        emailVerified: false,
        user_id: appwrite.user.$id,
      });
    } finally {
      setProfileLoading(false);
    }
  }, [appwrite.user]); // Add dependency for useCallback
  
  // Function to manually refresh profile data
  const refreshProfile = useCallback(async () => {
    await loadProfileData();
  }, [loadProfileData]);

  // Function to check if email is verified
  const checkEmailVerification = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { success, verified } = await authService.isEmailVerified();
      setIsEmailVerified(!!verified);
      return !!verified;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    }
  }, [user]);

  // Check email verification status when user changes
  useEffect(() => {
    if (user) {
      checkEmailVerification();
    } else {
      setIsEmailVerified(false);
    }
  }, [user, checkEmailVerification]);

  // Sign in wrapper
  const signIn = useCallback(async (email: string, password: string, role?: string) => {
    const result = await appwrite.signIn(email, password);
    if (!result.success) {
      // Ensure error is always an Error object
      const error = result.error instanceof Error ? result.error : new Error(String(result.error));
      return { success: false, error };
    }
    
    // If role validation is required, check user's actual role
    if (role) {
      // Get current user directly from the auth service instead of waiting for context state
      let currentUser = appwrite.user;
      
      // If user is not immediately available in context, get it directly from auth service
      if (!currentUser) {
        console.log('🔍 User not available in context, fetching directly from auth service...');
        try {
          const userResult = await authService.getCurrentUser();
          if (userResult.success && userResult.data) {
            currentUser = userResult.data;
            console.log('✅ Successfully fetched user from auth service:', currentUser.email);
          } else {
            console.error('❌ Failed to get user from auth service after successful login');
            console.log('⚠️ Skipping role validation due to auth service issue - user will be validated on next request');
            return { success: false, error: new Error('User data not available after authentication') };
          }
        } catch (authError) {
          console.error('❌ Error fetching user from auth service:', authError);
          console.log('⚠️ Skipping role validation due to auth service error - user will be validated on next request');
          return { success: false, error: authError };
        }
      }
      
      if (!currentUser) {
        console.error('❌ User data not available after authentication - skipping role validation');
        console.log('⚠️ Skipping role validation due to timing issue - user will be validated on next request');
        return { success: false, error: new Error('User data not available after authentication') };
      }
      
      console.log(`🔍 Role validation for user: ${currentUser.email} (ID: ${currentUser.$id})`);
      
      // Get fresh profile data directly after successful authentication using the current user
      const freshProfileData = await getProfileDataDirectWithUser(currentUser);
      
      // Check if the user's actual role matches the expected role
      let userActualRole = freshProfileData?.role || 'user';
      
      // If we couldn't get fresh profile data, try to determine role from stored data
      if (!freshProfileData) {
        console.log('Could not get fresh profile data, checking stored role information...');
        
        // Try to get the user's role from localStorage as a fallback
        const userId = currentUser?.$id;
        const storedUserRole = userId ? localStorage.getItem(`user_role_${userId}`) : null;
        if (storedUserRole) {
          userActualRole = storedUserRole;
          console.log('Using stored role:', userActualRole);
        } else {
          // As a last resort, try to query the collections directly with a more permissive approach
          try {
            if (userId) {
              // Check each collection to determine the user's role
              const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
              
              // Try shop_managers first since that's what they're trying to access
              try {
                const shopManagerQuery = await databases.listDocuments(
                  databaseId,
                  'shop_managers',
                  [Query.equal('user_id', userId)]
                );
                if (shopManagerQuery.documents.length > 0) {
                  userActualRole = 'shop_manager';
                  console.log('Found user in shop_managers collection via direct query');
                }
              } catch (error) {
                console.log('Could not query shop_managers collection:', error);
              }
              
              // If not found in shop_managers, check super_admins
              if (userActualRole === 'user') {
                try {
                  const superAdminQuery = await databases.listDocuments(
                    databaseId,
                    'super_admins',
                    [Query.equal('user_id', userId)]
                  );
                  if (superAdminQuery.documents.length > 0) {
                    userActualRole = 'super_admin';
                    console.log('Found user in super_admins collection via direct query');
                  }
                } catch (error) {
                  console.log('Could not query super_admins collection:', error);
                }
              }
              
              // Store the determined role for future use
              localStorage.setItem(`user_role_${userId}`, userActualRole);
            }
          } catch (error) {
            console.error('Error determining user role:', error);
          }
        }
      } else {
        // Store the role for future use
        const userId = currentUser?.$id;
        if (userId) {
          localStorage.setItem(`user_role_${userId}`, userActualRole);
        }
      }
      
      // Map expected role from UI to database values
      let mappedExpectedRole = role;
      if (role === 'customer') {
        mappedExpectedRole = 'user';
      }
      
      console.log('Role validation:', {
        expectedRole: role,
        mappedExpectedRole,
        userActualRole,
        freshProfileData: freshProfileData ? 'Found' : 'Not found',
        userId: currentUser?.$id
      });
      
      // Validate role match - but allow for auto-correction in the UI
      if (userActualRole !== mappedExpectedRole) {
        // Create a more descriptive error message
        const actualRoleDisplay = userActualRole === 'user' ? 'Customer' : 
                                 userActualRole === 'shop_manager' ? 'Shop Manager' :
                                 userActualRole === 'super_admin' ? 'Super Admin' : 'Unknown';
        const expectedRoleDisplay = mappedExpectedRole === 'user' ? 'Customer' : 
                                   mappedExpectedRole === 'shop_manager' ? 'Shop Manager' :
                                   mappedExpectedRole === 'super_admin' ? 'Super Admin' : 'Unknown';
        
        // Don't sign out the user - let the Login component handle role switching
        // This prevents rate limiting from multiple rapid login attempts
        console.log(`⚠️ Role mismatch detected: Expected ${expectedRoleDisplay}, but user is ${actualRoleDisplay}`);
        
        return { success: false, error: new Error(`Role mismatch: This account is registered as a ${actualRoleDisplay}, but you're trying to sign in as a ${expectedRoleDisplay}. Please select "${actualRoleDisplay}" to log in, or contact an administrator to upgrade your account to ${expectedRoleDisplay}.`) };
      }
      
      // Additional validation for shop manager accounts
      if (userActualRole === 'shop_manager') {
        const userStatus = freshProfileData?.status || 'Verified';
        if (userStatus === 'Pending') {
          throw new Error('Your Shop Manager account is pending approval. Please contact an administrator to activate your account.');
        }
        if (userStatus === 'Deactivated') {
          throw new Error('Your Shop Manager account has been deactivated. Please contact an administrator for assistance.');
        }
        if (userStatus !== 'Verified') {
          throw new Error(`Your Shop Manager account status is ${userStatus}. Please contact an administrator for assistance.`);
        }
      }
    }
    
    // Check verification status after login
    checkEmailVerification();
    
    // Clean up the wishlist in the background
    setTimeout(() => {
      cleanupWishlist().catch(err => {
        console.warn('Background wishlist cleanup failed during sign in:', err);
      });
    }, 2000);

    return { success: true };
  }, [appwrite, getProfileDataDirect, getProfileDataDirectWithUser, checkEmailVerification]);

  // Sign up wrapper
  const signUp = useCallback(async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) => {
    // Validate role selection
    if (!data.role) {
      throw new Error('Please select an account type (Customer or Shop Manager)');
    }

    // Ensure valid role values
    const validRoles = ['user', 'shop_manager'];
    if (!validRoles.includes(data.role)) {
      throw new Error('Invalid account type selected. Please choose Customer or Shop Manager.');
    }

    const name = `${data.firstName} ${data.lastName}`;
    const result = await appwrite.createAccount(data.email, data.password, name);
    if (!result.success) {
      throw result.error || new Error('Sign up failed');
    }
    
    // Store the role information in the appropriate role-based collection
    try {
      // Get database ID from environment variables
      const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
      
      if (databaseId) {
        // Try to get the user ID from the result or from current user
        const userId = result.success ? await getUserId() : null;
        
        if (userId) {
          // Map the frontend role value to database role and collection
          let dbRole = 'user';
          let accountStatus = 'Verified'; // Use new status system
          let collectionId = 'customers';
          
          if (data.role === 'shop_manager') {
            dbRole = 'shop_manager';
            accountStatus = 'Pending'; // Shop managers need approval
            collectionId = 'shop_managers';
          }
          
          // Create profile data based on the role
          let profileData: any = {
            user_id: userId,
            email: data.email,
            first_name: data.firstName,
            last_name: data.lastName,
            full_name: `${data.firstName} ${data.lastName}`,
            status: accountStatus,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          // Add role-specific fields
          if (data.role === 'shop_manager') {
            profileData = {
              ...profileData,
              department: '',
              permissions: '[]',
              is_active: accountStatus === 'Verified',
              last_activity: new Date().toISOString(),
            };
          } else {
            // Customer profile
            profileData = {
              ...profileData,
              preferences: '',
              total_orders: 0,
              total_spent: 0,
            };
          }
          
          // Create entry in the appropriate role-based collection
          await databases.createDocument(
            databaseId,
            collectionId,
            userId, // Use user ID as document ID
            profileData
          );
          
          console.log(`Created ${dbRole} profile with status:`, accountStatus);
        }
      }
    } catch (profileError) {
      console.error('Error creating profile with role:', profileError);
      // Continue even if profile creation failed - it will be created on login
    }
  }, [appwrite]);

  // Helper function to get the current user ID
  const getUserId = useCallback(async (): Promise<string | null> => {
    try {
      // First, check if we already have the user in the Appwrite context
      if (appwrite.user && appwrite.user.$id) {
        return appwrite.user.$id;
      }
      
      // Fall back to the auth service if needed
      const { success, data } = await authService.getCurrentUser();
      return success && data ? data.$id : null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }, [appwrite.user]);

  // Sign out wrapper
  const signOut = useCallback(async () => {
    const result = await appwrite.signOut();
    if (!result.success) {
      throw result.error || new Error('Sign out failed');
    }
    setIsEmailVerified(false);
    setProfileData(null);
  }, [appwrite]);

  // Resend verification email
  const resendVerification = useCallback(async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const result = await authService.resendVerification();
    if (!result.success) {
      throw result.error || new Error('Failed to resend verification email');
    }
  }, [user]);

  // Check connection wrapper
  const checkConnection = useCallback(async (): Promise<boolean> => {
    // Simple check - if we are not in an error state, consider the connection good
    return !appwrite.error;
  }, [appwrite.error]);

  const value = {
    user,
    profile: profileData,
    loading: appwrite.loading || profileLoading,
    error: appwrite.error ? appwrite.error.message : null,
    networkError: appwrite.error?.message.includes('network') || false,
    isEmailVerified,
    checkEmailVerification,
    signIn,
    signUp,
    signOut,
    resendVerification,
    checkConnection,
    refreshProfile
  };

  // Expose refreshProfile to window for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshProfile = refreshProfile;
      // Also expose a function to clear stored roles
      (window as any).clearStoredRoles = () => {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('user_role_')) {
            localStorage.removeItem(key);
          }
        });
        console.log('✅ Cleared all stored user roles');
      };
    }
  }, [refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
