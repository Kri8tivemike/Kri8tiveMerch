/**
 * Fix missing Appwrite collections and fields
 * Run with: node scripts/fix-collections.cjs
 */

const { Client, Databases, ID, Permission, Role } = require('node-appwrite');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;

// Collection IDs from .env
const usersCollectionId = process.env.VITE_APPWRITE_USERS_COLLECTION_ID;
const profilesCollectionId = process.env.VITE_APPWRITE_PROFILES_COLLECTION_ID;
const ordersCollectionId = process.env.VITE_APPWRITE_ORDERS_COLLECTION_ID;
const productsCollectionId = process.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID;
const customizationCollectionId = process.env.VITE_APPWRITE_CUSTOMIZATION_COLLECTION_ID;

async function fixMissingCollections() {
  console.log(`🔧 Fixing missing collections in database: ${databaseId}`);
  
  try {
    // 1. Check if users collection exists, create if missing
    try {
      console.log(`Checking if users collection exists (${usersCollectionId})...`);
      await databases.getCollection(databaseId, usersCollectionId);
      console.log('✅ Users collection exists.');
    } catch (error) {
      if (error.code === 404) {
        console.log('⚠️ Users collection missing. Creating...');
        await databases.createCollection(
          databaseId,
          usersCollectionId,
          'Users',
          [
            Permission.read(Role.any()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users())
          ]
        );
        
        // Add required attributes
        await databases.createStringAttribute(databaseId, usersCollectionId, 'name', 255, true);
        await databases.createEmailAttribute(databaseId, usersCollectionId, 'email', true);
        await databases.createStringAttribute(databaseId, usersCollectionId, 'user_id', 36, true);
        await databases.createStringAttribute(databaseId, usersCollectionId, 'phone_number', 20, false);
        await databases.createDatetimeAttribute(databaseId, usersCollectionId, 'created_at', false);
        
        console.log('✅ Users collection created with required attributes.');
      } else {
        console.error('Error checking users collection:', error);
      }
    }
    
    // 2. Check if customization_requests collection exists, create if missing
    try {
      console.log(`Checking if customization requests collection exists (${customizationCollectionId})...`);
      await databases.getCollection(databaseId, customizationCollectionId);
      console.log('✅ Customization requests collection exists.');
    } catch (error) {
      if (error.code === 404) {
        console.log('⚠️ Customization requests collection missing. Creating...');
        await databases.createCollection(
          databaseId,
          customizationCollectionId,
          'Customization Requests',
          [
            Permission.read(Role.any()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users())
          ]
        );
        
        // Add required attributes
        await databases.createStringAttribute(databaseId, customizationCollectionId, 'user_id', 36, true);
        await databases.createStringAttribute(databaseId, customizationCollectionId, 'product_id', 36, true);
        await databases.createStringAttribute(databaseId, customizationCollectionId, 'details', 5000, true);
        await databases.createStringAttribute(databaseId, customizationCollectionId, 'status', 50, true);
        await databases.createStringAttribute(databaseId, customizationCollectionId, 'phone_number', 20, false);
        await databases.createStringAttribute(databaseId, customizationCollectionId, 'whatsapp_number', 20, false);
        await databases.createStringAttribute(databaseId, customizationCollectionId, 'delivery_address', 500, false);
        await databases.createDatetimeAttribute(databaseId, customizationCollectionId, 'created_at', false);
        
        console.log('✅ Customization requests collection created with required attributes.');
      } else {
        console.error('Error checking customization requests collection:', error);
      }
    }
    
    // 3. Add customizable field to products collection
    try {
      console.log('Checking if customizable field exists in products collection...');
      
      // Get collection attributes
      const attributes = await databases.listAttributes(databaseId, productsCollectionId);
      
      // Check if customizable exists
      const hasCustomizable = attributes.attributes.some(attr => attr.key === 'customizable');
      
      if (!hasCustomizable) {
        console.log('⚠️ Customizable field missing. Adding to products collection...');
        await databases.createBooleanAttribute(
          databaseId,
          productsCollectionId,
          'customizable',
          false,  // not required
          false   // default value is false
        );
        console.log('✅ Customizable field added to products collection.');
      } else {
        console.log('✅ Customizable field already exists.');
      }
    } catch (error) {
      console.error('Error checking or adding customizable field:', error);
    }
    
    // 4. Add sizes field to products collection
    try {
      console.log('Checking if sizes field exists in products collection...');
      
      // Get collection attributes
      const attributes = await databases.listAttributes(databaseId, productsCollectionId);
      
      // Check if sizes exists
      const hasSizes = attributes.attributes.some(attr => attr.key === 'sizes');
      
      if (!hasSizes) {
        console.log('⚠️ Sizes field missing. Adding to products collection...');
        await databases.createStringAttribute(
          databaseId,
          productsCollectionId,
          'sizes',
          255,   // size
          false, // not required
          null,  // default value
          true   // is array
        );
        console.log('✅ Sizes field added to products collection.');
      } else {
        console.log('✅ Sizes field already exists.');
      }
    } catch (error) {
      console.error('Error checking or adding sizes field:', error);
    }
    
    console.log('🎉 Collection fixes completed!');
    
  } catch (error) {
    console.error('❌ Error fixing collections:', error);
  }
}

// Run the fix function
fixMissingCollections(); 