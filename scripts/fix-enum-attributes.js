import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment variables
const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID || '67ea2c3b00309b589901';
const apiKey = process.env.VITE_APPWRITE_API_KEY;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

/**
 * Fix missing enum attributes
 */
async function fixEnumAttributes() {
  console.log('🔧 Fixing missing enum attributes...');

  try {
    // Fix status attribute for customers
    try {
      await databases.createEnumAttribute(
        databaseId,
        'customers',
        'status',
        ['Pending', 'Verified', 'Deactivated'],
        true, // required
        null, // no default for required enum
        false // not array
      );
      console.log('✓ Added status attribute to customers');
    } catch (error) {
      console.log('⚠️  Status attribute already exists in customers or other error:', error.message);
    }

    // Fix status attribute for shop_managers
    try {
      await databases.createEnumAttribute(
        databaseId,
        'shop_managers',
        'status',
        ['Pending', 'Verified', 'Deactivated'],
        true, // required
        null, // no default for required enum
        false // not array
      );
      console.log('✓ Added status attribute to shop_managers');
    } catch (error) {
      console.log('⚠️  Status attribute already exists in shop_managers or other error:', error.message);
    }

    // Fix status attribute for super_admins
    try {
      await databases.createEnumAttribute(
        databaseId,
        'super_admins',
        'status',
        ['Pending', 'Verified', 'Deactivated'],
        true, // required
        null, // no default for required enum
        false // not array
      );
      console.log('✓ Added status attribute to super_admins');
    } catch (error) {
      console.log('⚠️  Status attribute already exists in super_admins or other error:', error.message);
    }

    // Fix super_admin_level attribute for super_admins
    try {
      await databases.createEnumAttribute(
        databaseId,
        'super_admins',
        'super_admin_level',
        ['System', 'Business', 'Technical'],
        true, // required
        null, // no default for required enum
        false // not array
      );
      console.log('✓ Added super_admin_level attribute to super_admins');
    } catch (error) {
      console.log('⚠️  super_admin_level attribute already exists in super_admins or other error:', error.message);
    }

    // Wait a bit for attributes to be ready
    console.log('\n⏳ Waiting for attributes to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Add missing indexes
    console.log('\n🔍 Adding missing indexes...');

    // Status indexes
    const collections = ['customers', 'shop_managers', 'super_admins'];
    for (const collectionId of collections) {
      try {
        await databases.createIndex(
          databaseId,
          collectionId,
          'status_index',
          'key',
          ['status'],
          ['ASC']
        );
        console.log(`✓ Added status_index to ${collectionId}`);
      } catch (error) {
        console.log(`⚠️  status_index already exists in ${collectionId} or other error:`, error.message);
      }
    }

    // Super admin level index
    try {
      await databases.createIndex(
        databaseId,
        'super_admins',
        'super_admin_level_index',
        'key',
        ['super_admin_level'],
        ['ASC']
      );
      console.log('✓ Added super_admin_level_index to super_admins');
    } catch (error) {
      console.log('⚠️  super_admin_level_index already exists in super_admins or other error:', error.message);
    }

    console.log('\n✅ Enum attributes and indexes fixed!');

  } catch (error) {
    console.error('❌ Failed to fix enum attributes:', error.message);
  }
}

// Run the script
const isMainModule = import.meta.url.endsWith('fix-enum-attributes.js');
if (isMainModule) {
  if (!projectId || !apiKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   VITE_APPWRITE_PROJECT_ID');
    console.error('   VITE_APPWRITE_API_KEY');
    process.exit(1);
  }

  fixEnumAttributes();
}

export { fixEnumAttributes }; 