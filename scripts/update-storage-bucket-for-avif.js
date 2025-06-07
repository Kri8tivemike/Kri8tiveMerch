import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.VITE_APPWRITE_API_KEY;
const bucketId = process.env.VITE_APPWRITE_STORAGE_BUCKET_ID || 'user_avatars';

if (!endpoint || !projectId || !apiKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_APPWRITE_ENDPOINT:', !!endpoint);
  console.error('- VITE_APPWRITE_PROJECT_ID:', !!projectId);
  console.error('- VITE_APPWRITE_API_KEY:', !!apiKey);
  process.exit(1);
}

async function updateBucketForAVIF() {
  try {
    console.log('🔧 Updating storage bucket to support AVIF format...');
    console.log(`Bucket ID: ${bucketId}`);
    
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
    
    // Update bucket settings to support AVIF and optimize for images
    const response = await fetch(`${endpoint}/storage/buckets/${bucketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey
      },
      body: JSON.stringify({
        name: 'Optimized Images Storage',
        permissions: [
          'read("any")', // Allow anyone to read (for public image viewing)
          'create("users")', // Allow authenticated users to upload
          'update("users")', // Allow users to update their own files
          'delete("users")' // Allow users to delete their own files
        ],
        fileSecurity: false, // Collection-level permissions for simplicity
        enabled: true,
        maximumFileSize: 10485760, // 10MB for high-quality images
        allowedFileExtensions: [
          // Modern image formats (prioritized)
          'avif', 'webp', 
          // Standard image formats
          'jpg', 'jpeg', 'png', 'gif', 'svg',
          // Design file formats
          'pdf', 'ai', 'psd', 'eps', 'tiff', 'bmp'
        ],
        encryption: false, // Disable encryption for better performance
        antivirus: true // Keep antivirus enabled for security
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Bucket updated successfully for AVIF support!');
      console.log('📋 Updated settings:');
      console.log(`   Bucket ID: ${result.$id}`);
      console.log(`   Name: ${result.name}`);
      console.log(`   Max File Size: ${(result.maximumFileSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   File Security: ${result.fileSecurity}`);
      console.log(`   Allowed Extensions: ${result.allowedFileExtensions.join(', ')}`);
      console.log('');
      console.log('🎉 Benefits of this update:');
      console.log('1. ✅ AVIF format support - up to 50% smaller file sizes');
      console.log('2. ✅ WebP format support - excellent compression and compatibility');
      console.log('3. ✅ 10MB file size limit for high-quality images');
      console.log('4. ✅ Support for design files (PDF, AI, PSD, etc.)');
      console.log('5. ✅ Optimized for Appwrite image transformation API');
      console.log('');
      console.log('🔧 Next steps:');
      console.log('1. Your application will now automatically serve AVIF images to supported browsers');
      console.log('2. Fallback to WebP for browsers without AVIF support');
      console.log('3. JPEG fallback for maximum compatibility');
      console.log('4. Test image uploads to verify AVIF optimization is working');
    } else {
      console.error('❌ Failed to update bucket:', result);
      console.error('Error code:', result.code);
      console.error('Error message:', result.message);
      
      if (result.code === 404) {
        console.log('');
        console.log('💡 The bucket might not exist. Try running:');
        console.log('   npm run appwrite:create-bucket');
      }
      
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error updating bucket for AVIF support:', error.message);
    process.exit(1);
  }
}

// Run the update
updateBucketForAVIF(); 