import { Client, Account, Databases, Storage, Teams, ID, Avatars, Functions, Query } from 'appwrite';

/**
 * Appwrite Client Configuration
 * 
 * Note: When using cloud.appwrite.io, sessions are stored in localStorage by default.
 * For production deployments, it's recommended to:
 * 1. Set up a custom domain for your Appwrite instance
 * 2. Configure proper CORS and cookie policies
 * 3. Use HTTP-only cookies for session management
 * 
 * @see https://appwrite.io/docs/advanced/platform/custom-domains
 */

// Add this before the client initialization
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID);

// Initialize Appwrite services
export const account = new Account(client);
export const storage = new Storage(client);
export const databases = new Databases(client);
export const avatars = new Avatars(client);
export const functions = new Functions(client);
export const teams = new Teams(client);
export { Query, ID };

// Function to create storage bucket automatically
export const createProductImagesBucket = async () => {
  try {
    const bucketId = 'product-images';
    const bucketName = 'Product Images';
    
    // Check if bucket exists first
    try {
      await storage.listFiles(bucketId);
      console.log('✅ Product images bucket already exists');
      return true;
    } catch (error: any) {
      // If error is not 404, bucket might exist but there's another issue
      if (error?.code !== 404) {
        console.warn('⚠️ Error checking bucket:', error);
        return false;
      }
      
      // If 404, bucket doesn't exist, try to create it
      console.log('Creating product-images bucket...');
      
      try {
        // Note: this requires API key with proper permissions
        const permissions = ['read("any")', 'write("users")', 'delete("users")'];
        
        // Check if we have API key configured
        if (!import.meta.env.VITE_APPWRITE_API_KEY) {
          console.error('❌ No API key configured. Cannot create bucket automatically.');
          throw new Error('Missing API key');
        }
        
        // Create bucket using direct API call since client SDK requires server privileges
        const response = await fetch(
          `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Appwrite-Project': import.meta.env.VITE_APPWRITE_PROJECT_ID,
              'X-Appwrite-Key': import.meta.env.VITE_APPWRITE_API_KEY
            },
            body: JSON.stringify({
              bucketId,
              name: bucketName,
              permissions
            })
          }
        );
        
        const result = await response.json();
        
        if (response.ok) {
          console.log('✅ Successfully created product-images bucket!', result);
          return true;
        } else {
          throw new Error(`Failed to create bucket: ${result.message}`);
        }
      } catch (createError: any) {
        console.error('❌ Failed to create bucket:', createError);
        
        // Show manual instructions
        console.log(`
┌─────────────────────────────────────────────────────────────────┐
│               APPWRITE STORAGE BUCKET SETUP                     │
├─────────────────────────────────────────────────────────────────┤
│ Please follow these steps to create the bucket in Appwrite:     │
│                                                                 │
│ 1. Log in to your Appwrite Console at:                          │
│    ${import.meta.env.VITE_APPWRITE_ENDPOINT.replace('/v1', '')} │
│                                                                 │
│ 2. Go to your project: ${import.meta.env.VITE_APPWRITE_PROJECT_ID}│
│                                                                 │
│ 3. Navigate to "Storage" in the left sidebar                    │
│                                                                 │
│ 4. Click "Create Bucket"                                        │
│                                                                 │
│ 5. Use these settings:                                          │
│    • Bucket ID: ${bucketId}                                     │
│    • Name: ${bucketName}                                        │
│    • Permissions:                                               │
│      - Add "read('any')" to allow public image viewing          │
│      - Add "write('users')" to allow logged-in users to upload  │
│      - Add "delete('users')" to allow logged-in users to delete │
│                                                                 │
│ 6. Click "Create" and refresh the application                   │
└─────────────────────────────────────────────────────────────────┘
        `);
        return false;
      }
    }
  } catch (error) {
    console.error('Error in createProductImagesBucket:', error);
    return false;
  }
};

// Helper to get the current user
export const getCurrentUser = async () => {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    // Don't log error for unauthenticated users
    if ((error as any)?.code !== 401) {
      console.error('Error getting current user:', error);
    }
    return null;
  }
};

// Test connection function
export const testConnection = async () => {
    console.log('Testing Appwrite connection...');
    try {
        // Try to get a document - this will fail with a 404 if the collection doesn't exist,
        // but that still means the connection is working
        await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
          'test'
        );
        console.log('Appwrite connection successful');
        return true;
    } catch (error: any) {
        // If we get a 404, that means the connection worked but the document wasn't found
        if (error?.code === 404) {
            console.log('Appwrite connection successful (expected 404)');
            return true;
        }
        console.error('Appwrite connection failed:', error);
        return false;
    }
};

// Expose a debugging helper for checking permissions
const appwriteDebug = {
    // Method to help diagnose collection permission issues
    fixWishlistPermissions: async () => {
        try {
            console.log('Attempting to diagnose collection permissions...');
            const user = await account.get();
            if (!user) {
                console.log('❌ Not logged in. Please log in first.');
                return false;
            }
            
            console.log('✅ Logged in as:', user.email);
            
            const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
            const wishlistCollectionId = import.meta.env.VITE_APPWRITE_WISHLIST_COLLECTION_ID || '';
            
            if (!databaseId || !wishlistCollectionId) {
                console.log('❌ Missing database or collection IDs in environment variables.');
                return false;
            }
            
            console.log(`
Instructions to fix this issue:

1. Log into Appwrite Console
2. Go to Databases > "${databaseId}" > Collections > "${wishlistCollectionId}"
3. Click on "Settings" tab
4. Under "Permissions", add these permissions:
   - For READ operations: ["user:${user.$id}", "role:all"]
   - For CREATE operations: ["user:${user.$id}", "role:all"]
   - For UPDATE operations: ["user:${user.$id}"]
   - For DELETE operations: ["user:${user.$id}"]
5. Click "Update" to save changes

This will allow your user to read/create/update/delete their own wishlist items.
`);
            return true;
        } catch (error) {
            console.error('Error diagnosing permissions:', error);
            return false;
        }
    }
};

// Add to window for console access
if (typeof window !== 'undefined') {
    (window as any).appwriteDebug = {
        ...appwriteDebug,
        
        // Email verification diagnostics
        checkEmailVerificationSetup: async () => {
            try {
                console.log('🔍 Checking Email Verification Setup...');
                console.log('==========================================');
                
                // Check environment
                const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.includes('localhost');
                console.log(`🏠 Environment: ${isDevelopment ? 'Development' : 'Production'}`);
                console.log(`📡 Appwrite Endpoint: ${import.meta.env.VITE_APPWRITE_ENDPOINT}`);
                
                // Check if user is authenticated
                let currentUser;
                try {
                    currentUser = await account.get();
                    console.log(`✅ User authenticated: ${currentUser.email}`);
                    console.log(`📧 Email verified in Auth: ${currentUser.emailVerification}`);
                } catch (authError) {
                    console.log('❌ No authenticated user found');
                    console.log('   → Log in first to test email verification');
                    return false;
                }
                
                // Check development mode specific features
                if (isDevelopment) {
                    console.log('\n🛠️ DEVELOPMENT MODE DETECTED');
                    console.log('   → Appwrite should provide built-in email service');
                    console.log('   → No SMTP configuration should be required');
                    console.log('   → Emails should appear in Appwrite Console logs');
                }
                
                // Try to send a test verification email
                console.log('\n📧 Testing email verification...');
                try {
                    await account.createVerification(window.location.origin + '/verify-email');
                    console.log('✅ Verification email API call successful');
                    
                    if (isDevelopment) {
                        console.log('📋 DEVELOPMENT MODE - Check these locations for the email:');
                        console.log('   1. Appwrite Console → Logs');
                        console.log('   2. Browser Developer Tools → Network tab');
                        console.log('   3. Your actual email inbox (if real email)');
                        console.log('   4. Console logs for verification URL');
                    } else {
                        console.log('   → SMTP appears to be configured correctly');
                        console.log('   → Check your email inbox for the verification link');
                    }
                    return true;
                } catch (emailError: any) {
                    console.log('❌ Verification email failed:', emailError.message);
                    console.log('📋 Error details:', emailError);
                    
                    if (emailError.code === 500) {
                        if (isDevelopment) {
                            console.log('\n🚨 DEVELOPMENT MODE ISSUE:');
                            console.log('   → This should work in development mode');
                            console.log('   → Check Appwrite Console for error logs');
                            console.log('   → Verify Appwrite project configuration');
                        } else {
                            console.log('\n🚨 SMTP CONFIGURATION ISSUE DETECTED:');
                            console.log('   → Appwrite SMTP service is not configured');
                            console.log('   → Go to Appwrite Console → Settings → SMTP');
                            console.log('   → Configure your email provider (Gmail, SendGrid, etc.)');
                        }
                        
                        // Try to open relevant settings
                        const shouldOpen = confirm('Would you like to open the Appwrite Console?');
                        if (shouldOpen) {
                            const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT?.replace('/v1', '') || 'https://cloud.appwrite.io';
                            window.open(`${endpoint}/console/project-${import.meta.env.VITE_APPWRITE_PROJECT_ID}`, '_blank');
                        }
                    } else if (emailError.message.includes('already verified')) {
                        console.log('✅ User email is already verified!');
                        console.log('   → No action needed for this user');
                        return true;
                    } else if (emailError.code === 429) {
                        console.log('⚠️ Rate limited - too many verification requests');
                        console.log('   → Wait a few minutes before trying again');
                    } else if (emailError.code === 401) {
                        console.log('🔑 Authentication issue');
                        console.log('   → Try logging out and logging back in');
                    }
                    
                    return false;
                }
                
            } catch (error) {
                console.error('❌ Email verification diagnostic failed:', error);
                return false;
            }
        },
        
        // SMTP Configuration Guide
        showSmtpGuide: () => {
            console.log('📧 SMTP Configuration Guide');
            console.log('============================');
            console.log('');
            console.log('To set up email verification:');
            console.log('');
            console.log('1. 🏠 Go to your Appwrite Console');
            console.log('   https://cloud.appwrite.io');
            console.log('');
            console.log('2. 🎯 Navigate to your project');
            console.log(`   Project ID: ${import.meta.env.VITE_APPWRITE_PROJECT_ID}`);
            console.log('');
            console.log('3. ⚙️ Go to Settings → SMTP');
            console.log('');
            console.log('4. 📮 Configure your email provider:');
            console.log('');
            console.log('   Gmail SMTP:');
            console.log('   - Host: smtp.gmail.com');
            console.log('   - Port: 587');
            console.log('   - Username: your-email@gmail.com');
            console.log('   - Password: Use App Password (not regular password)');
            console.log('');
            console.log('   SendGrid:');
            console.log('   - Host: smtp.sendgrid.net');
            console.log('   - Port: 587');
            console.log('   - Username: apikey');
            console.log('   - Password: Your SendGrid API Key');
            console.log('');
            console.log('5. 🧪 Test the configuration');
            console.log('');
            console.log('6. ✅ Save and try sending verification emails again');
            console.log('');
            
            // Offer to open the settings page
            const shouldOpen = confirm('Would you like to open the SMTP settings page now?');
            if (shouldOpen) {
                const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT?.replace('/v1', '') || 'https://cloud.appwrite.io';
                window.open(`${endpoint}/console/project-${import.meta.env.VITE_APPWRITE_PROJECT_ID}/settings/smtp`, '_blank');
            }
        },
        
        // Create storage bucket for product images
        createStorageBucket: async () => {
            try {
                console.log('Attempting to create product-images bucket...');
                
                // Check if user is admin
                const user = await account.get();
                if (!user) {
                    console.error('❌ You must be logged in to create a bucket');
                    return false;
                }
                
                console.log('✅ Logged in as:', user.email);
                
                // Define the bucket settings
                const bucketId = 'product-images';
                const bucketName = 'Product Images';
                
                // First try to create the bucket through SDK
                try {
                    // First check if it already exists by trying to list files
                    try {
                        await storage.listFiles(bucketId);
                        console.log('✅ Bucket already exists!');
                        return true;
                    } catch (error: any) {
                        // If error is not 404, bucket might exist but there's another issue
                        if (error?.code !== 404) {
                            console.warn('⚠️ Error checking bucket:', error);
                        }
                    }
                    
                    console.log('The SDK method may not work without admin API key. Providing manual instructions instead:');
                    console.log(`
┌─────────────────────────────────────────────────────────────────┐
│               APPWRITE STORAGE BUCKET SETUP                     │
├─────────────────────────────────────────────────────────────────┤
│ Please follow these steps to create the bucket in Appwrite:     │
│                                                                 │
│ 1. Log in to your Appwrite Console at:                          │
│    ${import.meta.env.VITE_APPWRITE_ENDPOINT.replace('/v1', '')} │
│                                                                 │
│ 2. Go to your project: ${import.meta.env.VITE_APPWRITE_PROJECT_ID}│
│                                                                 │
│ 3. Navigate to "Storage" in the left sidebar                    │
│                                                                 │
│ 4. Click "Create Bucket"                                        │
│                                                                 │
│ 5. Use these settings:                                          │
│    • Bucket ID: ${bucketId}                                     │
│    • Name: ${bucketName}                                        │
│    • Permissions:                                               │
│      - Add "read('any')" to allow public image viewing          │
│      - Add "write('users')" to allow logged-in users to upload  │
│      - Add "delete('users')" to allow logged-in users to delete │
│                                                                 │
│ 6. Click "Create" and refresh the application                   │
└─────────────────────────────────────────────────────────────────┘
                    `);
                    
                    // Open the Appwrite console in a new tab
                    const shouldOpen = confirm('Would you like to open the Appwrite console now?');
                    
                    if (shouldOpen) {
                        window.open(import.meta.env.VITE_APPWRITE_ENDPOINT.replace('/v1', ''), '_blank');
                    }
                    
                    return true;
                } catch (error) {
                    console.error('❌ Error creating bucket:', error);
                    return false;
                }
            } catch (error) {
                console.error('❌ Error in createStorageBucket:', error);
                return false;
            }
        },
        
        // Initialize product system
        initializeProductSystem: async () => {
            try {
                console.log('🔍 Checking Appwrite product system setup...');
                
                // Step 1: Check if storage bucket exists
                let allOk = true;
                console.log('Step 1: Checking product images storage bucket...');
                const bucketResult = await createProductImagesBucket();
                
                if (bucketResult) {
                    console.log('✅ Storage bucket check completed');
                } else {
                    console.log('⚠️ Storage bucket issues detected');
                    allOk = false;
                }
                
                // Step 2: Check if product attributes exist
                console.log('Step 2: Checking product attributes...');
                const attributesResult = await createMissingProductAttributes();
                
                if (attributesResult) {
                    console.log('✅ Product attributes check completed');
                } else {
                    console.log('⚠️ Product attributes issues detected');
                    allOk = false;
                }
                
                if (allOk) {
                    console.log('✅ Product system is correctly set up and ready to use!');
                    return true;
                } else {
                    console.log('⚠️ Product system setup has some issues that need attention');
                    return false;
                }
            } catch (error) {
                console.error('❌ Error checking product system:', error);
                return false;
            }
        }
    };
}

// Utility ID generator
export const generateId = () => ID.unique();

// Debug utility
export const logAppwriteConfig = () => {
  console.log('Appwrite Configuration:');
  console.log('- Endpoint:', import.meta.env.VITE_APPWRITE_ENDPOINT || 'not set');
  console.log('- Project ID:', import.meta.env.VITE_APPWRITE_PROJECT_ID || 'not set');
  console.log('- Database ID:', DATABASE_ID);
  console.log('Collections:');
  console.log('- Role-based Collections: customers, shop_managers, super_admins');
  console.log('- Products Collection:', import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID || 'not set');
  console.log('- Wishlist Collection:', import.meta.env.VITE_APPWRITE_WISHLIST_COLLECTION_ID || 'not set');
};

// Create missing product attributes in Appwrite database
export const createMissingProductAttributes = async () => {
  try {
    console.log('Checking for missing product attributes...');
    
    const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const productsCollectionId = import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID;
    
    if (!databaseId || !productsCollectionId) {
      console.error('Missing database or collection IDs in environment variables');
      return false;
    }
    
    // Check if API key is available
    if (!import.meta.env.VITE_APPWRITE_API_KEY) {
      console.warn('No API key configured. Skipping automatic attribute creation.');
      console.log('💡 To enable automatic attribute creation, add VITE_APPWRITE_API_KEY to your .env file');
      return false;
    }
    
    // First, get existing attributes to avoid unnecessary API calls
    let existingAttributes: string[] = [];
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APPWRITE_ENDPOINT}/databases/${databaseId}/collections/${productsCollectionId}/attributes`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': import.meta.env.VITE_APPWRITE_PROJECT_ID,
            'X-Appwrite-Key': import.meta.env.VITE_APPWRITE_API_KEY
          }
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        existingAttributes = result.attributes?.map((attr: any) => attr.key) || [];
        console.log('📋 Existing attributes:', existingAttributes);
      }
    } catch (error) {
      console.warn('Could not fetch existing attributes, will proceed with creation attempts');
    }
    
    // Required attributes for products collection
    const requiredAttributes = [
      { name: 'stock_quantity', type: 'integer', required: false, default: 0, min: 0 },
      { name: 'gallery_images', type: 'string[]', required: false, default: [] },
      { name: 'customizable', type: 'boolean', required: false, default: false }
    ];
    
    let success = true;
    
    // Create each missing attribute
    for (const attr of requiredAttributes) {
      try {
        console.log(`Checking attribute: ${attr.name}`);
        
        // Skip if attribute already exists
        if (existingAttributes.includes(attr.name)) {
          console.log(`✅ Attribute ${attr.name} already exists`);
          continue;
        }
        
        console.log(`🔧 Creating missing attribute: ${attr.name}`);
        
        // Endpoint depends on attribute type
        let endpoint = '';
        let body = {};
        
        if (attr.type === 'integer') {
          endpoint = `${import.meta.env.VITE_APPWRITE_ENDPOINT}/databases/${databaseId}/collections/${productsCollectionId}/attributes/integer`;
          body = {
            key: attr.name,
            required: attr.required,
            min: attr.min,
            default: attr.default
          };
        } else if (attr.type === 'string[]') {
          endpoint = `${import.meta.env.VITE_APPWRITE_ENDPOINT}/databases/${databaseId}/collections/${productsCollectionId}/attributes/string`;
          body = {
            key: attr.name,
            required: attr.required,
            array: true,
            size: 255
          };
        } else if (attr.type === 'boolean') {
          endpoint = `${import.meta.env.VITE_APPWRITE_ENDPOINT}/databases/${databaseId}/collections/${productsCollectionId}/attributes/boolean`;
          body = {
            key: attr.name,
            required: attr.required,
            default: attr.default
          };
        }
        
        if (!endpoint) {
          console.warn(`Unsupported attribute type: ${attr.type}`);
          continue;
        }
        
        // Make API call to create the attribute
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': import.meta.env.VITE_APPWRITE_PROJECT_ID,
            'X-Appwrite-Key': import.meta.env.VITE_APPWRITE_API_KEY
          },
          body: JSON.stringify(body)
        });
        
        const result = await response.json();
        
        if (response.ok) {
          console.log(`✅ Successfully created ${attr.name} attribute`);
        } else {
          // If error is because field already exists, that's still okay
          if (result.code === 409) {
            console.log(`✅ Attribute ${attr.name} already exists (confirmed by API)`);
          } else {
            console.error(`❌ Error creating ${attr.name} attribute:`, result);
            success = false;
          }
        }
        
      } catch (error) {
        console.error(`Failed to create attribute ${attr.name}:`, error);
        success = false;
      }
    }
    
    if (success) {
      console.log('✅ All required product attributes are available');
      return true;
    } else {
      console.log('⚠️ Some attributes could not be created automatically');
      return false;
    }
  } catch (error) {
    console.error('Error creating product attributes:', error);
    return false;
  }
};

// Utility function to verify role-based collections are set up correctly
export const verifyRoleBasedCollections = async () => {
  try {
    const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
    
    if (!databaseId) {
      console.error('Missing database ID in environment variables');
      return false;
    }
    
    console.log('🔍 Verifying role-based collections are accessible');
    
    const collections = ['customers', 'shop_managers', 'super_admins'];
    let allAccessible = true;
    
    for (const collectionId of collections) {
      try {
        // Try to list documents from each collection to verify access
        const response = await databases.listDocuments(databaseId, collectionId, []);
        console.log(`✅ ${collectionId} collection is accessible (${response.documents.length} documents)`);
      } catch (error: any) {
        if (error.code === 404) {
          console.error(`❌ ${collectionId} collection not found`);
          allAccessible = false;
        } else {
          console.warn(`⚠️ ${collectionId} collection access issue:`, error.message);
        }
      }
    }
    
    if (allAccessible) {
      console.log('✅ All role-based collections are accessible');
    } else {
      console.log('⚠️ Some role-based collections are not accessible');
    }
    
    return allAccessible;
  } catch (error) {
    console.error('❌ Error verifying role-based collections:', error);
    return false;
  }
};

export default client;

// Export configuration constants for reuse in other services
export { DATABASE_ID, PROJECT_ID, ENDPOINT }; 