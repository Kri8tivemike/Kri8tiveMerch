import { storage } from '../lib/appwrite';

/**
 * Storage Setup Helper
 * Run these functions in the browser console to diagnose storage issues
 */

export const storageHelper = {
  /**
   * Check if all required buckets exist
   */
  async checkBuckets() {
    const requiredBuckets = ['product-images', 'user_avatars']; // Using existing buckets
    const results: Record<string, { exists: boolean; error?: string }> = {};

    console.log('🔍 Checking storage buckets...\n');

    for (const bucketId of requiredBuckets) {
      try {
        await storage.listFiles(bucketId, []); // Just check if bucket exists
        results[bucketId] = { exists: true };
        console.log(`✅ ${bucketId}: EXISTS`);
      } catch (error: any) {
        results[bucketId] = { exists: false, error: error.message };
        if (error.code === 404) {
          console.log(`❌ ${bucketId}: NOT FOUND`);
        } else {
          console.log(`⚠️ ${bucketId}: ERROR - ${error.message}`);
        }
      }
    }

    console.log('\n📋 Summary:');
    const missing = Object.entries(results)
      .filter(([_, result]) => !result.exists)
      .map(([bucket]) => bucket);

    if (missing.length === 0) {
      console.log('🎉 All required buckets exist!');
    } else {
      console.log(`❌ Missing buckets: ${missing.join(', ')}`);
      console.log('\n🔧 To fix this:');
      console.log('1. Go to Appwrite Console > Storage');
      console.log('2. Create the missing buckets with exact IDs shown above');
      console.log('3. Run storageHelper.checkBuckets() again to verify');
    }

    return results;
  },

  /**
   * Test uploading a small file to design-canvas bucket
   */
  async testUpload() {
    try {
      console.log('🧪 Testing upload to design-canvas bucket...');
      
      // Create a small test blob
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
      
      const result = await storage.createFile('user_avatars', 'test-upload', testFile);
      console.log('✅ Upload test successful!', result);
      
      // Clean up test file
      await storage.deleteFile('user_avatars', 'test-upload');
      console.log('🧹 Test file cleaned up');
      
      return true;
    } catch (error: any) {
      console.error('❌ Upload test failed:', error.message);
      if (error.code === 404) {
        console.log('💡 Bucket not found. Check if user_avatars bucket exists.');
      }
      return false;
    }
  },

  /**
   * Show setup instructions
   */
  showInstructions() {
    console.log(`
┌─────────────────────────────────────────────────────────────────┐
│                 APPWRITE STORAGE SETUP GUIDE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 🌐 Appwrite Console: https://cloud.appwrite.io/console          │
│ 📁 Navigate to: Storage > Create Bucket                         │
│                                                                 │
│ Using Existing Buckets:                                         │
│ ├─ product-images: For product catalog images                   │
│ ├─ user_avatars: For design canvas uploads                      │
│ ├─ Permissions:                                                 │
│ │  ├─ read("any")                                               │
│ │  ├─ create("users")                                           │
│ │  ├─ update("users")                                           │
│ │  └─ delete("users")                                           │
│ ├─ File Security: Enabled                                       │
│ ├─ Max File Size: 10485760 (10MB)                              │
│ └─ Extensions: png,jpg,jpeg                                     │
│                                                                 │
│ 🔧 After creating, run: storageHelper.checkBuckets()            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
    `);
  },

  /**
   * Get current project info
   */
  getProjectInfo() {
    const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
    const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
    
    console.log('📋 Current Appwrite Configuration:');
    console.log(`Project ID: ${projectId}`);
    console.log(`Endpoint: ${endpoint}`);
    console.log(`Console URL: ${endpoint.replace('/v1', '')}/console/project-${projectId}`);
  }
};

// Make it available globally for console access
declare global {
  interface Window {
    storageHelper: typeof storageHelper;
  }
}

if (typeof window !== 'undefined') {
  window.storageHelper = storageHelper;
} 