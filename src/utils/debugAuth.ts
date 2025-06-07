import { account, databases, Query } from '../lib/appwrite';

/**
 * Debug authentication and role issues
 */
export const debugAuthState = async () => {
  try {
    console.log('🔍 Debugging Authentication State...');
    console.log('==========================================');
    
    // Step 1: Check Appwrite Auth session
    let currentUser;
    try {
      currentUser = await account.get();
      console.log('✅ Appwrite Auth User:', {
        id: currentUser.$id,
        email: currentUser.email,
        name: currentUser.name,
        emailVerification: currentUser.emailVerification,
        status: currentUser.status
      });
    } catch (authError) {
      console.log('❌ Not authenticated in Appwrite Auth:', authError);
      return false;
    }
    
    // Step 2: Check database profile in role-based collections
    const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const collections = ['customers', 'shop_managers', 'super_admins'];
    
    let profile = null;
    let foundInCollection = '';
    
    try {
      // Try to find profile in role-based collections
      for (const collectionId of collections) {
        try {
          const profilesQuery = await databases.listDocuments(
            databaseId,
            collectionId,
            [Query.equal('user_id', currentUser.$id)]
          );
          
          if (profilesQuery.documents.length > 0) {
            profile = profilesQuery.documents[0];
            foundInCollection = collectionId;
            break;
          }
        } catch (collectionError) {
          console.warn(`Could not check ${collectionId} collection:`, collectionError);
        }
      }
      
      if (profile) {
        console.log('✅ Database Profile Found:', {
          id: profile.$id,
          collection: foundInCollection,
          email: profile.email,
          full_name: profile.full_name,
          status: profile.status,
          user_id: profile.user_id
        });
        
        // Step 3: Check what AuthContext thinks
        console.log('\n🧠 Checking AuthContext state...');
        
        // Try to access window.AuthContext if available
        if (typeof window !== 'undefined' && (window as any).authContextDebug) {
          const contextState = (window as any).authContextDebug();
          console.log('📱 AuthContext state:', contextState);
        } else {
          console.log('⚠️ AuthContext debug not available');
        }
        
        // Step 4: Check RoleGuard requirements
        console.log('\n🔐 Shop Manager Access Requirements:');
        console.log('   Required collections: [\'shop_managers\', \'super_admins\']');
        console.log('   Your collection:', foundInCollection);
        console.log('   Your status:', profile.status);
        console.log('   Access granted:', ['shop_managers', 'super_admins'].includes(foundInCollection) && profile.status === 'Verified');
        
        // Step 5: Recommend actions
        if (!['shop_managers', 'super_admins'].includes(foundInCollection)) {
          console.log('\n❌ ISSUE: User is not in shop_managers or super_admins collection');
          console.log('   Solution: Move user to appropriate role-based collection');
        } else if (profile.status !== 'Verified') {
          console.log('\n❌ ISSUE: Status is not Verified');
          console.log('   Solution: Verify account in Super Admin dashboard');
        } else {
          console.log('\n✅ Profile looks correct for shop manager access');
          console.log('\n🔄 SOLUTION: Try refreshing AuthContext:');
          console.log('   1. Sign out and sign back in');
          console.log('   2. Or run: refreshAuthContext() in console');
          console.log('   3. Or hard refresh the page (Ctrl+F5)');
        }
        
        return true;
      } else {
        console.log('❌ No profile found in database for user ID:', currentUser.$id);
        console.log('\n🔄 SOLUTION: Create profile or check user_id mapping');
        return false;
      }
    } catch (profileError) {
      console.log('❌ Error fetching profile:', profileError);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return false;
  }
};

/**
 * Force refresh of AuthContext
 */
export const refreshAuthContext = async () => {
  try {
    console.log('🔄 Refreshing AuthContext...');
    
    // Try to trigger a refresh if the function is available
    if (typeof window !== 'undefined' && (window as any).refreshProfile) {
      await (window as any).refreshProfile();
      console.log('✅ AuthContext refreshed');
    } else {
      console.log('⚠️ refreshProfile not available, try signing out and back in');
    }
  } catch (error) {
    console.error('❌ Error refreshing AuthContext:', error);
  }
};

/**
 * Quick shop manager access test
 */
export const testShopManagerAccess = async () => {
  try {
    console.log('🏪 Testing Shop Manager Access...');
    
    const authOk = await debugAuthState();
    if (!authOk) return false;
    
    // Try to navigate to shop manager
    if (typeof window !== 'undefined') {
      console.log('🎯 Attempting to navigate to /shop-manager...');
      window.location.href = '/shop-manager';
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).debugAuthState = debugAuthState;
  (window as any).refreshAuthContext = refreshAuthContext;
  (window as any).testShopManagerAccess = testShopManagerAccess;
} 