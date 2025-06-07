import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.VITE_APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_APPWRITE_ENDPOINT:', !!endpoint);
  console.error('- VITE_APPWRITE_PROJECT_ID:', !!projectId);
  console.error('- VITE_APPWRITE_API_KEY:', !!apiKey);
  process.exit(1);
}

async function listStorageBuckets() {
  try {
    console.log('📦 Listing existing storage buckets...\n');
    
    const response = await fetch(`${endpoint}/storage/buckets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`Found ${result.total} storage bucket(s):\n`);
      
      result.buckets.forEach((bucket, index) => {
        console.log(`${index + 1}. Bucket ID: ${bucket.$id}`);
        console.log(`   Name: ${bucket.name}`);
        console.log(`   Enabled: ${bucket.enabled}`);
        console.log(`   Max File Size: ${bucket.maximumFileSize} bytes (${(bucket.maximumFileSize / 1024 / 1024).toFixed(2)} MB)`);
        console.log(`   File Security: ${bucket.fileSecurity}`);
        console.log(`   Allowed Extensions: ${bucket.allowedFileExtensions.join(', ')}`);
        console.log(`   Permissions: ${bucket.permissions ? bucket.permissions.join(', ') : 'N/A'}`);
        console.log(`   Created: ${bucket.$createdAt}`);
        console.log('   ---');
      });
      
      console.log('\n💡 Suggestions:');
      console.log('1. You can reuse an existing bucket for client designs');
      console.log('2. Consider using the "user_avatars" bucket if it supports design file types');
      console.log('3. Or upgrade your Appwrite plan to create more buckets');
      console.log('4. Alternatively, modify an existing bucket to support design uploads');
      
    } else {
      console.error('❌ Failed to list buckets:', result);
      console.error('Error code:', result.code);
      console.error('Error message:', result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error listing storage buckets:', error.message);
    process.exit(1);
  }
}

// Run the bucket listing
listStorageBuckets(); 