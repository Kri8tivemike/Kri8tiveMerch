#!/usr/bin/env node

import { Client, Storage, Query } from 'node-appwrite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.VITE_APPWRITE_API_KEY;

// Use the user_avatars bucket
const bucketId = 'user_avatars';

if (!endpoint || !projectId || !apiKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- VITE_APPWRITE_ENDPOINT:', !!endpoint);
  console.error('- VITE_APPWRITE_PROJECT_ID:', !!projectId);
  console.error('- VITE_APPWRITE_API_KEY:', !!apiKey);
  process.exit(1);
}

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const storage = new Storage(client);

async function deleteOldDesigns() {
  try {
    console.log(`🔍 Scanning files in '${bucketId}' bucket for old uploads...`);
    
    // Calculate the cutoff date (January 2nd, 2025)
    const cutoffDate = new Date('2025-01-02T00:00:00Z');
    const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000);
    
    console.log(`📅 Cutoff date: ${cutoffDate.toISOString()}`);
    console.log(`📅 Cutoff timestamp: ${cutoffTimestamp}`);
    
    // List all files in the bucket
    let allFiles = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;
    
    while (hasMore) {
      try {
        const response = await storage.listFiles(bucketId, [], '', limit, offset);
        
        if (response.files && response.files.length > 0) {
          allFiles = allFiles.concat(response.files);
          offset += response.files.length;
          
          console.log(`📄 Retrieved ${response.files.length} files (total: ${allFiles.length})`);
          
          // Check if we have more files
          hasMore = response.files.length === limit;
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error('❌ Error listing files:', error.message);
        break;
      }
    }
    
    console.log(`📊 Total files found: ${allFiles.length}`);
    
    if (allFiles.length === 0) {
      console.log('✅ No files found in the bucket.');
      return;
    }
    
    // Filter files uploaded before January 2nd, 2025
    const oldFiles = allFiles.filter(file => {
      // Parse the $createdAt timestamp
      const createdAt = new Date(file.$createdAt);
      const fileTimestamp = Math.floor(createdAt.getTime() / 1000);
      
      return fileTimestamp < cutoffTimestamp;
    });
    
    console.log(`🗂️  Files to delete: ${oldFiles.length}`);
    
    if (oldFiles.length === 0) {
      console.log('✅ No old files found to delete.');
      return;
    }
    
    // Show files that will be deleted
    console.log('\n📋 Files scheduled for deletion:');
    oldFiles.forEach((file, index) => {
      const createdAt = new Date(file.$createdAt);
      console.log(`${index + 1}. ${file.$id} - ${file.name || 'Unnamed'} (${createdAt.toISOString()})`);
    });
    
    // Ask for confirmation
    console.log(`\n⚠️  About to delete ${oldFiles.length} files. This action cannot be undone.`);
    
    // Delete files
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const file of oldFiles) {
      try {
        await storage.deleteFile(bucketId, file.$id);
        deletedCount++;
        console.log(`✅ Deleted: ${file.$id} - ${file.name || 'Unnamed'}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to delete ${file.$id}: ${error.message}`);
      }
    }
    
    console.log('\n📊 Deletion Summary:');
    console.log(`✅ Successfully deleted: ${deletedCount} files`);
    console.log(`❌ Failed to delete: ${errorCount} files`);
    console.log(`📁 Total files processed: ${oldFiles.length}`);
    
    if (deletedCount > 0) {
      console.log('\n🎉 Old design uploads cleanup completed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup process:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
deleteOldDesigns(); 