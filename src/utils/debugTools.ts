import { account, databases } from '../lib/appwrite';

/**
 * Debug utilities for Appwrite that can be accessed from the browser console
 */
export const appwriteDebug = {
  /**
   * Diagnoses common Appwrite connection issues
   */
  diagnoseAppwrite: async () => {
    console.log('🔍 Running Appwrite diagnostics...');
    
    try {
      // Check environment variables
      const envChecks = {
        endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || null,
        projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || null,
        databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || null,
        productsCollection: import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID || null,
        wishlistCollection: import.meta.env.VITE_APPWRITE_WISHLIST_COLLECTION_ID || null,
        // Role-based collections (no longer using profiles collection)
    customersCollection: 'customers',
    shopManagersCollection: 'shop_managers',
    superAdminsCollection: 'super_admins',
      };
      
      console.log('Environment variables:', envChecks);
      
      const missingVars = Object.entries(envChecks)
        .filter(([_, value]) => !value)
        .map(([key]) => key);
        
      if (missingVars.length > 0) {
        console.error(`❌ Missing environment variables: ${missingVars.join(', ')}`);
      } else {
        console.log('✅ All required environment variables are set');
      }
      
      // Check authentication
      try {
        const user = await account.get();
        console.log('✅ You are logged in as:', user.email);
      } catch (error: any) {
        if (error.code === 401) {
          console.warn('❗ You are not logged in. Some tests will be skipped.');
        } else {
          console.error('❌ Error checking authentication:', error);
        }
      }
      
      // Check if we can read the products collection
      try {
        const response = await databases.listDocuments(
          envChecks.databaseId as string,
          envChecks.productsCollection as string,
          []
        );
        console.log(`✅ Successfully connected to products collection (${response.documents.length} products found)`);
      } catch (error: any) {
        console.error('❌ Error connecting to products collection:', error.message);
      }
      
      console.log('🔍 Diagnostics completed');
      return true;
    } catch (error) {
      console.error('❌ Error running diagnostics:', error);
      return false;
    }
  },
  
  /**
   * Helps fix common permission issues with Appwrite
   */
  fixPermissionIssues: async () => {
    console.log('🔧 Checking for permission issues...');
    
    try {
      const user = await account.get();
      if (!user) {
        console.log('❌ Not logged in. Please log in first to fix permission issues.');
        return;
      }
      
      console.log('✅ Logged in as:', user.email);
      
      const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
      const wishlistCollectionId = import.meta.env.VITE_APPWRITE_WISHLIST_COLLECTION_ID || '';
      
      if (!databaseId || !wishlistCollectionId) {
        console.log('❌ Missing database or collection IDs in environment variables.');
        return;
      }
      
      console.log(`
Instructions to fix wishlist permissions:

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
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
    }
  },
  
  /**
   * Get collection permissions guide
   */
  getCollectionPermissionGuide: async () => {
    try {
      const user = await account.get();
      if (!user) {
        console.log('❌ Not logged in. Please log in first.');
        return;
      }
      
      console.log(`
Appwrite Collection Permissions Guide:

1. Document Security:
   - Always enable "Document Security" for collections with user data
   
2. Common Permission Patterns:
   
   a) Public Read, Authenticated Create:
      - READ: ["role:all"]
      - CREATE: ["role:member"]
      - UPDATE: ["user:$id"]
      - DELETE: ["user:$id"]
   
   b) Private User Data:
      - READ: ["user:${user.$id}"]
      - CREATE: ["user:${user.$id}"]
      - UPDATE: ["user:${user.$id}"]
      - DELETE: ["user:${user.$id}"]
   
   c) Shop Manager-Only Collection:
      - READ: ["role:shop_manager"]
      - CREATE: ["role:shop_manager"]
      - UPDATE: ["role:shop_manager"]
      - DELETE: ["role:shop_manager"]

3. For your wishlist collection, use:
   - READ: ["user:${user.$id}"]
   - CREATE: ["user:${user.$id}"]
   - UPDATE: ["user:${user.$id}"]
   - DELETE: ["user:${user.$id}"]
`);
    } catch (error) {
      console.error('Error generating permissions guide:', error);
    }
  },

  /**
   * Inspect the schema of an Appwrite collection
   */
  inspectCollection: async (collectionId: string) => {
    console.log(`🔍 Inspecting collection: ${collectionId}`);
    
    try {
      const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
      if (!databaseId) {
        console.error('❌ Missing database ID in environment variables');
        return false;
      }
      
      try {
        // Try to fetch attributes for the collection
        const response = await databases.listAttributes(
          databaseId,
          collectionId
        );
        
        console.log(`✅ Collection ${collectionId} exists and has these attributes:`);
        const attributes = response.attributes || [];
        
        if (attributes.length === 0) {
          console.warn('⚠️ No attributes found in collection');
        } else {
          // Create a formatted table of attributes
          console.table(attributes.map(attr => ({
            key: attr.key,
            type: attr.type,
            required: attr.required,
            array: attr.array,
            status: attr.status
          })));
        }
        
        return true;
      } catch (error: any) {
        if (error.code === 404) {
          console.error(`❌ Collection ${collectionId} does not exist`);
        } else {
          console.error(`❌ Error inspecting collection ${collectionId}:`, error);
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Error inspecting collection:', error);
      return false;
    }
  },

  /**
   * Add missing attributes to the profiles collection
   */
  setupProfileCollection: async () => {
    try {
      const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
      // Using role-based collections instead of deprecated profiles collection
  const collections = ['customers', 'shop_managers', 'super_admins'];
      
      console.log(`Setting up profile collection. Database ID: ${databaseId}, Collection ID: ${profilesCollectionId}`);
      
      if (!databaseId || !profilesCollectionId) {
        console.error('Database or collection ID is missing in environment variables');
        return;
      }
      
      try {
        // First check if collection exists
        const collection = await databases.getCollection(
          databaseId,
          profilesCollectionId
        );
        
        console.log('Collection exists:', collection.name);
        
        // Get existing attributes
        const attributesResponse = await databases.listAttributes(
          databaseId,
          profilesCollectionId
        );
        
        const attributes = attributesResponse.attributes || [];
        console.log('Current attributes:', attributes.map(attr => attr.key));
        
        // Define required attributes
        const requiredAttributes = [
          { key: 'email', type: 'email', required: true },
          { key: 'firstName', type: 'string', size: 255, required: true },
          { key: 'lastName', type: 'string', size: 255, required: true },
          { key: 'phone', type: 'string', size: 50, required: false },
          { key: 'avatar_url', type: 'string', size: 1024, required: false },
          { key: 'whatsapp_number', type: 'string', size: 50, required: false },
          { key: 'delivery_address', type: 'string', size: 1024, required: false },
          { key: 'role', type: 'string', size: 50, required: true },
          { key: 'user_id', type: 'string', size: 255, required: true }
        ];
        
        // Check each required attribute and create if missing
        for (const attr of requiredAttributes) {
          try {
            // Check if attribute exists
            const attrExists = attributes.some(a => a.key === attr.key);
            
            if (!attrExists) {
              console.log(`Creating attribute: ${attr.key} (${attr.type})`);
              
              // Create the attribute based on type
              if (attr.type === 'string') {
                await databases.createStringAttribute(
                  databaseId,
                  profilesCollectionId,
                  attr.key,
                  attr.size,
                  attr.required
                );
                console.log(`Created string attribute: ${attr.key}`);
              } else if (attr.type === 'email') {
                await databases.createEmailAttribute(
                  databaseId,
                  profilesCollectionId,
                  attr.key,
                  attr.required
                );
                console.log(`Created email attribute: ${attr.key}`);
              }
              
              // Wait a moment to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 500));
            } else {
              console.log(`Attribute already exists: ${attr.key}`);
            }
          } catch (error) {
            console.error(`Error creating attribute ${attr.key}:`, error);
          }
        }
        
        console.log('Profile collection setup complete');
      } catch (error: any) {
        if (error.code === 404) {
          console.error('Collection not found. Please create the collection first.');
        } else {
          console.error('Error setting up profile collection:', error);
        }
      }
    } catch (error) {
      console.error('Error in setupProfileCollection:', error);
    }
  }
};

// Add debug tools to window for console access
if (typeof window !== 'undefined') {
  (window as any).appwriteDebug = appwriteDebug;
  console.log('Appwrite debug tools loaded. Available in console:');
  console.log('appwriteDebug.diagnoseAppwrite() - Run connection diagnostics');
  console.log('appwriteDebug.fixPermissionIssues() - Get help fixing permission issues');
  console.log('appwriteDebug.getCollectionPermissionGuide() - Get permissions guide');
}

export default appwriteDebug; 