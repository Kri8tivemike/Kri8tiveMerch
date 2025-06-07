import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

/**
 * This script handles role permissions for users in the database
 * It specifically marks shop manager accounts as pending and sends notifications
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
  
  console.log('Checking user roles...');
  console.log(`Database ID: ${databaseId}`);
  console.log(`Profiles Collection ID: ${profilesCollectionId}`);
  
  if (!databaseId || !profilesCollectionId) {
    console.error('Missing required environment variables.');
    process.exit(1);
  }
  
  try {
    // Check for pending shop manager accounts
    const pendingManagers = await databases.listDocuments(
      databaseId,
      profilesCollectionId,
      [
        Query.equal('role', 'shop_manager'),
        Query.equal('status', 'pending')
      ]
    );
    
    console.log(`Found ${pendingManagers.total} pending shop manager accounts.`);
    
    // List the pending accounts
    if (pendingManagers.total > 0) {
      console.log('Pending shop manager accounts:');
      pendingManagers.documents.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.first_name} ${profile.last_name} (${profile.email})`);
      });
      console.log('\nRun this script with --approve <user_id> to approve a pending account');
    }
    
    // Check for argument to approve a user
    const approveArg = process.argv.indexOf('--approve');
    if (approveArg !== -1 && process.argv.length > approveArg + 1) {
      const userId = process.argv[approveArg + 1];
      console.log(`Attempting to approve user with ID: ${userId}`);
      
      try {
        // Get the user profile
        const profile = await databases.getDocument(
          databaseId,
          profilesCollectionId,
          userId
        );
        
        if (profile.role === 'shop_manager' && profile.status === 'pending') {
          // Update the profile status to active
          await databases.updateDocument(
            databaseId,
            profilesCollectionId,
            userId,
            {
              status: 'active'
            }
          );
          
          console.log(`Successfully approved shop manager account for ${profile.first_name} ${profile.last_name}`);
        } else {
          console.log(`User is not a pending shop manager. Role: ${profile.role}, Status: ${profile.status}`);
        }
      } catch (error) {
        console.error(`Error approving user ${userId}:`, error);
      }
    }
    
  } catch (error) {
    console.error('Error checking user roles:', error);
    process.exit(1);
  }
}

main(); 