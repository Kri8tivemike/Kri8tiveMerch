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

// ClientDesigns bucket configuration
const bucketId = 'ClientDesigns';
const bucketName = 'Client Design Uploads';

if (!endpoint || !projectId || !apiKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_APPWRITE_ENDPOINT:', !!endpoint);
  console.error('- VITE_APPWRITE_PROJECT_ID:', !!projectId);
  console.error('- VITE_APPWRITE_API_KEY:', !!apiKey);
  process.exit(1);
}

async function createClientDesignsBucket() {
  try {
    console.log(`Creating bucket '${bucketId}' for client design uploads...`);
    
    const response = await fetch(`${endpoint}/storage/buckets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey
      },
      body: JSON.stringify({
        bucketId: bucketId,
        name: bucketName,
        permissions: [
          'read("any")', // Allow anyone to read (for previews)
          'create("users")', // Allow authenticated users to upload
          'update("users")', // Allow users to update their own files
          'delete("users")' // Allow users to delete their own files
        ],
        fileSecurity: true, // Enable file-level security
        enabled: true,
        maximumFileSize: 10485760, // 10MB limit for design files
        allowedFileExtensions: [
          'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 
          'pdf', 'ai', 'psd', 'eps', 'tiff', 'bmp'
        ], // Support various design file formats
        encryption: false, // No encryption needed for design files
        antivirus: true // Enable antivirus scanning
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ ClientDesigns bucket created successfully!');
      console.log('Bucket ID:', result.$id);
      console.log('Bucket Name:', result.name);
      console.log('Max File Size:', result.maximumFileSize, 'bytes (10MB)');
      console.log('Allowed Extensions:', result.allowedFileExtensions.join(', '));
      console.log('');
      console.log('🔧 Next steps:');
      console.log('1. Add this to your .env file:');
      console.log(`   VITE_APPWRITE_CLIENT_DESIGNS_BUCKET_ID=${bucketId}`);
      console.log('2. Update YourItemCustomizationForm.tsx to use this bucket for uploads');
      console.log('3. Test file uploads in the customization form');
    } else {
      if (result.code === 409) {
        console.log('⚠️  Bucket already exists. Updating settings...');
        
        // Update bucket settings
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
              'read("any")',
              'create("users")',
              'update("users")',
              'delete("users")'
            ],
            fileSecurity: true,
            enabled: true,
            maximumFileSize: 10485760,
            allowedFileExtensions: [
              'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
              'pdf', 'ai', 'psd', 'eps', 'tiff', 'bmp'
            ],
            encryption: false,
            antivirus: true
          })
        });
        
        const updateResult = await updateResponse.json();
        
        if (updateResponse.ok) {
          console.log('✅ ClientDesigns bucket updated successfully!');
          console.log('Bucket ID:', updateResult.$id);
          console.log('Updated settings applied.');
        } else {
          console.error('❌ Failed to update bucket:', updateResult);
          process.exit(1);
        }
      } else {
        console.error('❌ Failed to create bucket:', result);
        console.error('Error code:', result.code);
        console.error('Error message:', result.message);
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('❌ Error creating or updating ClientDesigns bucket:', error.message);
    process.exit(1);
  }
}

// Run the bucket creation
createClientDesignsBucket(); 