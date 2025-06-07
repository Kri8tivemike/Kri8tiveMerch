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

// Use existing user_avatars bucket but expand it for design uploads
const bucketId = 'user_avatars';
const bucketName = 'User Avatars & Design Uploads';

if (!endpoint || !projectId || !apiKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_APPWRITE_ENDPOINT:', !!endpoint);
  console.error('- VITE_APPWRITE_PROJECT_ID:', !!projectId);
  console.error('- VITE_APPWRITE_API_KEY:', !!apiKey);
  process.exit(1);
}

async function updateBucketForDesigns() {
  try {
    console.log(`🔧 Updating bucket '${bucketId}' to support client design uploads...`);
    
    // First, get current bucket settings
    const getCurrentResponse = await fetch(`${endpoint}/storage/buckets/${bucketId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey
      }
    });
    
    const currentBucket = await getCurrentResponse.json();
    
    if (!getCurrentResponse.ok) {
      console.error('❌ Failed to get current bucket settings:', currentBucket);
      process.exit(1);
    }
    
    console.log('📋 Current bucket settings:');
    console.log(`   Name: ${currentBucket.name}`);
    console.log(`   Max File Size: ${currentBucket.maximumFileSize} bytes (${(currentBucket.maximumFileSize / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`   Allowed Extensions: ${currentBucket.allowedFileExtensions.join(', ')}`);
    console.log('');
    
    // Update bucket settings to support design uploads
    const updateResponse = await fetch(`${endpoint}/storage/buckets/${bucketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey
      },
      body: JSON.stringify({
        name: bucketName,
        permissions: [
          'read("any")', // Allow anyone to read (for previews)
          'create("users")', // Allow authenticated users to upload
          'update("users")', // Allow users to update their own files
          'delete("users")' // Allow users to delete their own files
        ],
        fileSecurity: true, // Enable file-level security for better control
        enabled: true,
        maximumFileSize: 10485760, // Increase to 10MB for design files
        allowedFileExtensions: [
          // Keep existing image formats
          'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
          // Add design file formats
          'pdf', 'ai', 'psd', 'eps', 'tiff', 'bmp'
        ],
        encryption: false,
        antivirus: true
      })
    });
    
    const updateResult = await updateResponse.json();
    
    if (updateResponse.ok) {
      console.log('✅ Bucket updated successfully for design uploads!');
      console.log('📋 New bucket settings:');
      console.log(`   Bucket ID: ${updateResult.$id}`);
      console.log(`   Name: ${updateResult.name}`);
      console.log(`   Max File Size: ${updateResult.maximumFileSize} bytes (${(updateResult.maximumFileSize / 1024 / 1024).toFixed(2)} MB)`);
      console.log(`   File Security: ${updateResult.fileSecurity}`);
      console.log(`   Allowed Extensions: ${updateResult.allowedFileExtensions.join(', ')}`);
      console.log('');
      console.log('🔧 Next steps:');
      console.log('1. The existing VITE_APPWRITE_STORAGE_BUCKET_ID can be used for design uploads');
      console.log('2. Update YourItemCustomizationForm.tsx to use this bucket for uploads');
      console.log('3. The bucket now supports both user avatars and client design files');
      console.log('4. File size limit increased from 5MB to 10MB');
      console.log('5. Added support for design file formats (PDF, AI, PSD, EPS, TIFF, BMP)');
    } else {
      console.error('❌ Failed to update bucket:', updateResult);
      console.error('Error code:', updateResult.code);
      console.error('Error message:', updateResult.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error updating bucket for design uploads:', error.message);
    process.exit(1);
  }
}

// Run the bucket update
updateBucketForDesigns(); 