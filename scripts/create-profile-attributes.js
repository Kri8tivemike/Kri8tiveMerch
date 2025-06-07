import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

/**
 * This script creates or updates the necessary attributes for user profiles
 * to support profile, whatsapp_number and delivery_address storage
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
  
  console.log('Configuring profile attributes...');
  console.log(`Database ID: ${databaseId}`);
  console.log(`Profiles Collection ID: ${profilesCollectionId}`);
  
  if (!databaseId || !profilesCollectionId) {
    console.error('Missing required environment variables.');
    process.exit(1);
  }
  
  try {
    // Check collection exists
    try {
      const collection = await databases.getCollection(databaseId, profilesCollectionId);
      console.log(`Found profiles collection: ${collection.name}`);
    } catch (error) {
      console.error('Error accessing profiles collection:', error);
      process.exit(1);
    }
    
    // Create or check for mandatory attributes
    const requiredAttributes = [
      {
        key: 'whatsapp_number',
        type: 'string',
        size: 30,
        required: false,
        operation: 'createStringAttribute'
      },
      {
        key: 'delivery_address', 
        type: 'string',
        size: 1000,
        required: false,
        operation: 'createStringAttribute'
      },
      {
        key: 'phone_number',
        type: 'string',
        size: 30,
        required: false,
        operation: 'createStringAttribute'
      }
    ];
    
    // Get existing attributes
    let existingAttributes = [];
    try {
      const response = await databases.listAttributes(databaseId, profilesCollectionId);
      existingAttributes = response.attributes || [];
      console.log('Existing attributes:', existingAttributes.map(attr => attr.key));
    } catch (error) {
      console.error('Error getting existing attributes:', error);
    }
    
    // Create missing attributes
    for (const attribute of requiredAttributes) {
      const exists = existingAttributes.some(attr => attr.key === attribute.key);
      
      if (!exists) {
        console.log(`Creating attribute: ${attribute.key} (${attribute.type})`);
        try {
          switch (attribute.operation) {
            case 'createStringAttribute':
              await databases.createStringAttribute(
                databaseId,
                profilesCollectionId,
                attribute.key,
                attribute.size,
                attribute.required,
                null, // default value
                false // array
              );
              break;
              
            // Add more cases for other attribute types if needed
            
            default:
              console.warn(`Unknown operation: ${attribute.operation}`);
          }
          console.log(`  - Created successfully`);
        } catch (error) {
          // If attribute already exists (code 409) or other errors, log but continue
          console.warn(`  - Error creating attribute ${attribute.key}:`, error.message);
        }
      } else {
        console.log(`Attribute ${attribute.key} already exists`);
      }
    }
    
    // Create attribute for first_name
    await createStringAttribute(databases, databaseId, profilesCollectionId, 'first_name', 100);
    console.log('✅ first_name attribute created or exists');

    // Create attribute for last_name
    await createStringAttribute(databases, databaseId, profilesCollectionId, 'last_name', 100);
    console.log('✅ last_name attribute created or exists');

    // Create attribute for email
    await createEmailAttribute(databases, databaseId, profilesCollectionId, 'email');
    console.log('✅ email attribute created or exists');

    // Create attribute for role
    await createStringAttribute(databases, databaseId, profilesCollectionId, 'role', 50);
    console.log('✅ role attribute created or exists');
    
    // Create attribute for status
    await createStringAttribute(databases, databaseId, profilesCollectionId, 'status', 50);
    console.log('✅ status attribute created or exists');

    // Create attribute for bio
    await createStringAttribute(databases, databaseId, profilesCollectionId, 'bio', 2000, false);
    console.log('✅ bio attribute created or exists');
    
    console.log('Profile attributes configured successfully!');
    
  } catch (error) {
    console.error('Error configuring profile attributes:', error);
    process.exit(1);
  }
}

/**
 * Helper function to create a string attribute
 */
async function createStringAttribute(databases, databaseId, collectionId, key, size, required = true) {
  try {
    await databases.createStringAttribute(
      databaseId,
      collectionId,
      key,
      size,
      required,
      null, // default value
      false // array
    );
  } catch (error) {
    // If attribute already exists (code 409), this is fine
    if (error.code !== 409) {
      console.warn(`  - Error creating string attribute ${key}:`, error.message);
    }
  }
}

/**
 * Helper function to create an email attribute
 */
async function createEmailAttribute(databases, databaseId, collectionId, key, required = true) {
  try {
    await databases.createEmailAttribute(
      databaseId,
      collectionId,
      key,
      required,
      null, // default value
      false // array
    );
  } catch (error) {
    // If attribute already exists (code 409), this is fine
    if (error.code !== 409) {
      console.warn(`  - Error creating email attribute ${key}:`, error.message);
    }
  }
}

main(); 