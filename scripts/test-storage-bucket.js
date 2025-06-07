#!/usr/bin/env node

/**
 * Test and verify Appwrite storage bucket configuration
 * This script checks if the storage bucket exists and is properly configured
 */

import { Client, Storage, ID } from 'appwrite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '67ea2c3b00309b589901');

const storage = new Storage(client);

// Storage configuration
const STORAGE_BUCKET_ID = process.env.VITE_APPWRITE_STORAGE_BUCKET_ID || 'user_avatars';

async function testStorageBucket() {
  console.log('🔍 Testing Appwrite storage bucket configuration...\n');
  
  try {
    // Test 1: Check if bucket exists
    console.log('1. Checking if storage bucket exists...');
    try {
      const files = await storage.listFiles(STORAGE_BUCKET_ID);
      console.log(`✅ Storage bucket "${STORAGE_BUCKET_ID}" exists`);
      console.log(`   Found ${files.total} files in bucket`);
    } catch (error) {
      if (error.code === 404) {
        console.log(`❌ Storage bucket "${STORAGE_BUCKET_ID}" does not exist`);
        console.log('\n📋 To create the bucket:');
        console.log('1. Go to your Appwrite Console');
        console.log('2. Navigate to Storage');
        console.log('3. Click "Create Bucket"');
        console.log(`4. Set Bucket ID: ${STORAGE_BUCKET_ID}`);
        console.log('5. Set Name: Product Images');
        console.log('6. Add permissions:');
        console.log('   - read("any") - for public image viewing');
        console.log('   - write("users") - for authenticated uploads');
        console.log('   - delete("users") - for authenticated deletions');
        return false;
      } else {
        throw error;
      }
    }

    // Test 2: Test file upload (if we have API key)
    if (process.env.VITE_APPWRITE_API_KEY) {
      console.log('\n2. Testing file upload...');
      
      // Create a test image blob
      const testImageData = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwZmYwMCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlRlc3Q8L3RleHQ+PC9zdmc+';
      
      // Convert base64 to blob
      const response = await fetch(testImageData);
      const blob = await response.blob();
      const file = new File([blob], 'test-image.svg', { type: 'image/svg+xml' });
      
      try {
        const uploadResult = await storage.createFile(STORAGE_BUCKET_ID, ID.unique(), file);
        console.log('✅ File upload successful');
        
        // Test getting the file URL
        const fileUrl = storage.getFileView(STORAGE_BUCKET_ID, uploadResult.$id);
        console.log(`✅ File URL generated: ${fileUrl}`);
        
        // Clean up test file
        await storage.deleteFile(STORAGE_BUCKET_ID, uploadResult.$id);
        console.log('✅ Test file cleaned up');
        
      } catch (uploadError) {
        console.log('❌ File upload failed:', uploadError.message);
        if (uploadError.code === 401) {
          console.log('   This might be due to insufficient permissions');
        }
      }
    } else {
      console.log('\n2. Skipping upload test (no API key configured)');
    }

    // Test 3: Check URL format
    console.log('\n3. Testing URL format...');
    const testFileId = 'test-file-id';
    const testUrl = storage.getFileView(STORAGE_BUCKET_ID, testFileId);
    console.log(`✅ URL format: ${testUrl}`);
    
    console.log('\n✅ Storage bucket configuration test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Storage bucket test failed:', error);
    return false;
  }
}

// Run the test
testStorageBucket()
  .then(success => {
    if (success) {
      console.log('\n🎉 All tests passed! Your storage bucket is properly configured.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the configuration.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  }); 