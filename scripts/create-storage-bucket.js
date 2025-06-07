const fetch = require('node-fetch');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.VITE_APPWRITE_API_KEY;
const bucketId = process.env.VITE_APPWRITE_STORAGE_BUCKET_ID;

if (!endpoint || !projectId || !apiKey || !bucketId) {
  console.error('Missing required environment variables');
  process.exit(1);
}

async function createBucket() {
  try {
    console.log(`Creating bucket '${bucketId}'...`);
    
    const response = await fetch(`${endpoint}/storage/buckets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey
      },
      body: JSON.stringify({
        bucketId: bucketId,
        name: 'User Avatars',
        permissions: [
          'read("any")',
          'create("users")',
          'update("users")',
          'delete("users")'
        ],
        fileSecurity: false,
        enabled: true,
        maximumFileSize: 5242880,
        allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Bucket created successfully:', result.$id);
    } else {
      if (result.code === 409) {
        console.log('Bucket already exists. Updating settings...');
        
        // Update bucket
        const updateResponse = await fetch(`${endpoint}/storage/buckets/${bucketId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': projectId,
            'X-Appwrite-Key': apiKey
          },
          body: JSON.stringify({
            name: 'User Avatars',
            permissions: [
              'read("any")',
              'create("users")',
              'update("users")',
              'delete("users")'
            ],
            fileSecurity: false,
            enabled: true,
            maximumFileSize: 5242880,
            allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
          })
        });
        
        const updateResult = await updateResponse.json();
        
        if (updateResponse.ok) {
          console.log('Bucket updated successfully:', updateResult.$id);
        } else {
          console.error('Failed to update bucket:', updateResult);
          process.exit(1);
        }
      } else {
        console.error('Failed to create bucket:', result);
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('Error creating or updating bucket:', error);
    process.exit(1);
  }
}

createBucket(); 