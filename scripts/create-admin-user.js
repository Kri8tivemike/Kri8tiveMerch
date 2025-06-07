import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

/**
 * This script creates or updates a user to have super_admin role
 * It's meant for initial setup of the system
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
  
  console.log('Super Admin Account Setup Tool');
  console.log('=============================');
  console.log('This tool helps you set up or update a super admin account');
  console.log('Database ID:', databaseId);
  console.log('Profiles Collection ID:', profilesCollectionId);
  
  if (!databaseId || !profilesCollectionId) {
    console.error('Missing required environment variables.');
    process.exit(1);
  }
  
  // Create interface for user input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Prompt user for email to search
  const userEmail = await new Promise(resolve => {
    rl.question('\nEnter the email address of the user to make super_admin: ', (answer) => {
      resolve(answer.trim());
    });
  });
  
  if (!userEmail) {
    console.error('Email address is required.');
    rl.close();
    process.exit(1);
  }
  
  try {
    // Search for user profile by email
    const userProfiles = await databases.listDocuments(
      databaseId,
      profilesCollectionId,
      [
        Query.equal('email', userEmail)
      ]
    );
    
    if (userProfiles.total === 0) {
      console.log('\nNo user found with that email address.');
      console.log('The user must first register through the normal sign-up process and verify their email.');
      rl.close();
      process.exit(1);
    }
    
    // Get the first matching profile
    const userProfile = userProfiles.documents[0];
    console.log('\nFound user:', `${userProfile.first_name} ${userProfile.last_name}`);
    console.log('Current role:', userProfile.role || 'user');
    console.log('Current status:', userProfile.status || 'not set (will be updated to active)');
    
    const confirmUpdate = await new Promise(resolve => {
      rl.question('\nDo you want to make this user a super_admin? (yes/no): ', (answer) => {
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      });
    });
    
    if (!confirmUpdate) {
      console.log('Operation cancelled.');
      rl.close();
      process.exit(0);
    }
    
    // Update the user profile
    await databases.updateDocument(
      databaseId,
      profilesCollectionId,
      userProfile.$id,
      {
        role: 'super_admin',
        status: 'active'
      }
    );
    
    console.log('\n✅ Success! User has been updated to super_admin role with active status.');
    console.log('They can now log in at /admin-login with their credentials.');
    
  } catch (error) {
    console.error('\nError updating user:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main(); 