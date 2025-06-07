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
 * Verify that collections are properly set up
 */
async function verifyCollections() {
  console.log('🔍 Verifying user role collections...');
  console.log(`📊 Database: ${databaseId}`);
  console.log(`📦 Project: ${projectId}\n`);

  try {
    const collections = ['customers', 'shop_managers', 'super_admins'];
    
    for (const collectionId of collections) {
      try {
        // Get collection info
        const collection = await databases.getCollection(databaseId, collectionId);
        console.log(`✅ Collection: ${collection.name} (${collection.$id})`);
        
        // Get document count
        const documents = await databases.listDocuments(databaseId, collectionId);
        console.log(`   📄 Documents: ${documents.total}`);
        
        // Show sample document if exists
        if (documents.documents.length > 0) {
          const sample = documents.documents[0];
          console.log(`   👤 Sample: ${sample.first_name} ${sample.last_name} (${sample.email})`);
          console.log(`   📋 Status: ${sample.status}`);
          if (sample.super_admin_level) {
            console.log(`   🛡️  Admin Level: ${sample.super_admin_level}`);
          }
          if (sample.department) {
            console.log(`   🏢 Department: ${sample.department}`);
          }
        }
        console.log('');
        
      } catch (error) {
        console.error(`❌ Failed to verify collection ${collectionId}:`, error.message);
      }
    }

    // Summary
    console.log('📊 Summary:');
    const totalDocs = await Promise.all(
      collections.map(async (id) => {
        try {
          const result = await databases.listDocuments(databaseId, id);
          return result.total;
        } catch {
          return 0;
        }
      })
    );

    console.log(`   👥 Total Customers: ${totalDocs[0]}`);
    console.log(`   🏪 Total Shop Managers: ${totalDocs[1]}`);
    console.log(`   🛡️  Total Super Admins: ${totalDocs[2]}`);
    console.log(`   📈 Total Users: ${totalDocs.reduce((a, b) => a + b, 0)}`);

    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Run the script
const isMainModule = import.meta.url.endsWith('verify-collections.js');
if (isMainModule) {
  if (!projectId || !apiKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   VITE_APPWRITE_PROJECT_ID');
    console.error('   VITE_APPWRITE_API_KEY');
    process.exit(1);
  }

  verifyCollections();
}

export { verifyCollections }; 