#!/usr/bin/env node

/**
 * Appwrite Storage Setup Script
 * 
 * This script helps set up the required storage buckets for the Kri8tiveBlanks application.
 * It provides instructions and can optionally create buckets if API key is provided.
 */

const REQUIRED_BUCKETS = {
  'product-images': {
    name: 'Product Images',
    description: 'Store product catalog images and thumbnails',
    permissions: ['read("any")'], // Public read access
    fileSecurity: false,
    enabled: true,
    maximumFileSize: 10485760, // 10MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    compression: 'gzip',
    encryption: false,
    antivirus: true,
  },
  'design-canvas': {
    name: 'Design Canvas',
    description: 'Store user-generated designs and canvas exports',
    permissions: ['read("any")', 'create("users")', 'update("users")', 'delete("users")'],
    fileSecurity: true, // User-specific access
    enabled: true,
    maximumFileSize: 10485760, // 10MB
    allowedFileExtensions: ['png', 'jpg', 'jpeg'],
    compression: 'gzip',
    encryption: false,
    antivirus: true,
  },
  'user-uploads': {
    name: 'User Uploads',
    description: 'Store temporary user uploads and design assets',
    permissions: ['read("any")', 'create("users")', 'update("users")', 'delete("users")'],
    fileSecurity: true,
    enabled: true,
    maximumFileSize: 10485760, // 10MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    compression: 'gzip',
    encryption: false,
    antivirus: true,
  },
};

function printInstructions() {
  console.log(`
┌─────────────────────────────────────────────────────────────────┐
│                APPWRITE STORAGE SETUP INSTRUCTIONS              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Please create the following storage buckets in your Appwrite    │
│ console to enable image upload and management functionality:    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

🌐 Appwrite Console: https://cloud.appwrite.io/console
📁 Navigate to: Storage > Create Bucket

Required Buckets:
`);

  Object.entries(REQUIRED_BUCKETS).forEach(([bucketId, config]) => {
    console.log(`
📦 Bucket ID: ${bucketId}
   Name: ${config.name}
   Description: ${config.description}
   
   Settings:
   ├─ File Security: ${config.fileSecurity ? 'Enabled' : 'Disabled'}
   ├─ Maximum File Size: ${(config.maximumFileSize / 1024 / 1024).toFixed(0)}MB
   ├─ Allowed Extensions: ${config.allowedFileExtensions.join(', ')}
   ├─ Compression: ${config.compression}
   ├─ Encryption: ${config.encryption ? 'Enabled' : 'Disabled'}
   └─ Antivirus: ${config.antivirus ? 'Enabled' : 'Disabled'}
   
   Permissions:
   ${config.permissions.map(p => `   ├─ ${p}`).join('\n')}
`);
  });

  console.log(`
┌─────────────────────────────────────────────────────────────────┐
│                        STEP-BY-STEP GUIDE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ For each bucket above:                                          │
│                                                                 │
│ 1. Click "Create Bucket" in Appwrite Console                    │
│ 2. Enter the Bucket ID exactly as shown                         │
│ 3. Enter the Name as shown                                      │
│ 4. Configure the settings as listed                             │
│ 5. Add the permissions as listed                                │
│ 6. Click "Create"                                               │
│                                                                 │
│ 💡 Tip: Copy the Bucket ID exactly - case sensitive!            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

✅ After creating all buckets, your application will be able to:
   • Upload and store product images
   • Save user-generated designs
   • Handle temporary file uploads
   • Serve images with proper permissions

🔧 Need help? Check the documentation or create an issue on GitHub.
`);
}

async function checkBuckets() {
  // This would require server-side implementation with API key
  console.log('🔍 Bucket verification requires server-side implementation.');
  console.log('   For now, please manually verify buckets exist in Appwrite Console.');
}

function main() {
  console.log('🚀 Kri8tiveBlanks - Appwrite Storage Setup\n');
  
  printInstructions();
  
  // Future enhancement: Add automatic bucket creation with API key
  console.log('\n📋 Manual setup required - automatic creation coming soon!');
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 