import { account, databases, ID } from '../lib/appwrite';

/**
 * Utility to create a shop manager account for testing
 * This can be used in the browser console for quick testing
 */
export const createTestShopManager = async (email: string, password: string) => {
  try {
    console.log('🏪 Creating test shop manager account...');
    
    // Step 1: Create the account in Appwrite Auth
    const authResult = await account.create(
      ID.unique(),
      email,
      password,
      'Test Shop Manager'
    );
    
    console.log('✅ Auth account created:', authResult);
    
    // Step 2: Login with the new account
    await account.createSession(email, password);
    console.log('✅ Logged in successfully');
    
    // Step 3: Create profile in shop_managers collection
    const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    
    const profileData = {
      email: email,
      first_name: 'Test',
      last_name: 'Manager',
      full_name: 'Test Shop Manager',
      status: 'Verified', // Use standard status value
      user_id: authResult.$id,
      phone: null,
      whatsapp_number: null,
      delivery_address: null,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const profile = await databases.createDocument(
      databaseId,
      'shop_managers', // Use role-based collection directly
      ID.unique(),
      profileData
    );
    
    console.log('✅ Shop manager profile created:', profile);
    
    console.log('🎉 Shop Manager account created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🎯 Now you can navigate to /shop-manager or refresh the page');
    
    return {
      success: true,
      authResult,
      profile,
      message: 'Shop manager account created successfully'
    };
    
  } catch (error: any) {
    console.error('❌ Error creating shop manager:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to create shop manager account'
    };
  }
};

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).createTestShopManager = createTestShopManager;
} 