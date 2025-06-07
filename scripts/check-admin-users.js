import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

/**
 * This script lists all users in the system and their roles
 * Useful for checking user accounts during setup
 */
async function main() {
  // Initialize the Appwrite SDK
  const client = new Client();
  const databases = new Databases(client);
  
  // Set API configuration from environment variables
  client
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.VITE_APPWRITE_API_KEY);
  
  const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
  const profilesCollectionId = process.env.VITE_APPWRITE_PROFILES_COLLECTION_ID;
  
  console.log('User Accounts Listing Tool');
  console.log('==========================');
  console.log('Database ID:', databaseId);
  console.log('Profiles Collection ID:', profilesCollectionId);
  
  if (!databaseId || !profilesCollectionId) {
    console.error('Missing required environment variables.');
    process.exit(1);
  }
  
  try {
    // List all user profiles
    const userProfiles = await databases.listDocuments(
      databaseId,
      profilesCollectionId
    );
    
    if (userProfiles.total === 0) {
      console.log('\nNo user accounts found in the database.');
      process.exit(0);
    }
    
    console.log(`\nFound ${userProfiles.total} user accounts:\n`);
    
    // Display user information in a table format
    console.log('--------------------------------------------------------------');
    console.log('| ID                | Email              | Role       | Status    |');
    console.log('--------------------------------------------------------------');
    
    userProfiles.documents.forEach(profile => {
      // Format strings to fixed width
      const id = profile.$id.substring(0, 18).padEnd(18);
      const email = (profile.email || '').substring(0, 18).padEnd(18);
      const role = (profile.role || 'user').padEnd(10);
      const status = (profile.status || 'unknown').padEnd(10);
      
      console.log(`| ${id} | ${email} | ${role} | ${status} |`);
    });
    
    console.log('--------------------------------------------------------------');
    
    // Show some helpful guidance
    console.log('\nTo promote a user to super_admin, run:');
    console.log('npm run appwrite:create-admin');
    
  } catch (error) {
    console.error('\nError listing users:', error);
    process.exit(1);
  }
}

main(); 