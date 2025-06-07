import { storage, ID } from '../lib/appwrite';
import { processImages, getBestSupportedFormat } from './imageOptimizer.service';

// Create a toast helper that works without hooks
let showToastFn: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;

export const setToastFunction = (toastFn: (message: string, type: any) => void) => {
  showToastFn = toastFn;
};

const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  if (showToastFn) {
    showToastFn(message, type);
  } else {
    // Fallback to console
    console.log(`[Toast - ${type}]: ${message}`);
  }
};

// Storage configuration 
const STORAGE_CONFIG = {
  bucketId: 'user_avatars', // Using the existing optimized images storage bucket
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
};

const STORAGE_BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID || 'user_avatars';

/**
 * Show bucket setup instructions
 */
const showBucketSetupInstructions = (): void => {
  console.log(`
┌─────────────────────────────────────────────────────────────────┐
│               APPWRITE STORAGE BUCKET SETUP                     │
├─────────────────────────────────────────────────────────────────┤
│ The application needs a storage bucket for image uploads.       │
│ Please follow these steps to create it in Appwrite console:     │
│                                                                 │
│ 1. Log in to your Appwrite Console at:                          │
│    ${import.meta.env.VITE_APPWRITE_ENDPOINT.replace('/v1', '')} │
│                                                                 │
│ 2. Go to your project: ${import.meta.env.VITE_APPWRITE_PROJECT_ID}│
│                                                                 │
│ 3. Navigate to "Storage" in the left sidebar                    │
│                                                                 │
│ 4. Click "Create Bucket"                                        │
│                                                                 │
│ 5. Use these settings:                                          │
│    • Bucket ID: ${STORAGE_CONFIG.bucketId}                      │
│    • Name: Product Images                                       │
│    • Permissions:                                               │
│      - Add "read('any')" to allow public image viewing          │
│      - Add "write('users')" to allow logged-in users to upload  │
│      - Add "delete('users')" to allow logged-in users to delete │
│                                                                 │
│ 6. Click "Create" and refresh this application                  │
└─────────────────────────────────────────────────────────────────┘
  `);

  // Show UI toast with instructions
  showToast(
    'Storage bucket not found. Check console for setup instructions.',
    'error'
  );
  
  // Add to window for convenience
  if (typeof window !== 'undefined') {
    (window as any).showBucketSetup = showBucketSetupInstructions;
    console.log('Tip: Run showBucketSetup() in the console to see these instructions again');
    console.log('Admin users can also run appwriteDebug.createStorageBucket() to get interactive setup help');
  }
};

/**
 * Check if the bucket exists
 */
const checkBucketExists = async (): Promise<boolean> => {
  try {
    // Try to list files in the bucket
    await storage.listFiles(STORAGE_CONFIG.bucketId, []);
    console.log(`Bucket ${STORAGE_CONFIG.bucketId} exists and is accessible`);
    return true;
  } catch (error: any) {
    // If we get a not found error, the bucket doesn't exist
    if (error?.code === 404) {
      console.log(`Bucket ${STORAGE_CONFIG.bucketId} not found`);
      return false;
    }
    
    // For permission errors, assume the bucket might exist but user can't list files
    if (error?.code === 401) {
      console.log(`Permission error checking bucket ${STORAGE_CONFIG.bucketId}, will try to use it anyway`);
      return true;
    }
    
    // For all other errors, log and assume the bucket might exist
    console.warn('Error checking bucket, will try to use it anyway:', error);
    return true;
  }
};

// Track if we've already shown the setup instructions to avoid spamming
let setupInstructionsShown = false;

/**
 * Helper function to validate URLs
 */
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Upload an image file to Appwrite storage
 */
export const uploadImage = async (file: File): Promise<string> => {
  try {
    // Use the configured bucket ID
    const bucketId = STORAGE_CONFIG.bucketId;
    
    const response = await storage.createFile(
      bucketId,
      ID.unique(),
      file
    );
    
    // Return the file URL
    const fileUrl = storage.getFileView(bucketId, response.$id);
    return fileUrl.toString();
  } catch (error) {
    console.error('Upload error:', error);
    
    // If bucket doesn't exist, show setup instructions
    if ((error as any)?.code === 404) {
      if (!setupInstructionsShown) {
        showBucketSetupInstructions();
        setupInstructionsShown = true;
      }
    }
    
    throw new Error('Failed to upload image');
  }
};

/**
 * Upload a design file to the storage bucket
 * @param file The design file to upload
 * @param onProgress Optional progress callback
 * @returns Promise resolving to the file URL
 */
export const uploadDesignFile = async (
  file: File, 
  onProgress?: (progress: number) => void
): Promise<{ url: string; fileId: string }> => {
  try {
    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf', 'image/tiff', 'image/bmp'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload an image or design file (JPG, PNG, GIF, WebP, SVG, PDF, TIFF, BMP)');
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File too large. Please upload a file smaller than 10MB');
    }

    // Simulate progress if callback provided
    if (onProgress) {
      onProgress(10);
    }

    // Upload file to Appwrite storage
    const bucketId = STORAGE_CONFIG.bucketId;
    const response = await storage.createFile(
      bucketId,
      ID.unique(),
      file
    );

    if (onProgress) {
      onProgress(90);
    }

    // Get the file URL
    const fileUrl = storage.getFileView(bucketId, response.$id);
    
    if (onProgress) {
      onProgress(100);
    }

    return {
      url: fileUrl.toString(),
      fileId: response.$id
    };
  } catch (error) {
    console.error('Design file upload error:', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Failed to upload design file. Please try again.');
    }
  }
};

/**
 * Delete a file from storage
 * @param fileId The ID of the file to delete
 */
export const deleteFile = async (fileId: string): Promise<void> => {
  try {
    const bucketId = STORAGE_CONFIG.bucketId;
    await storage.deleteFile(bucketId, fileId);
  } catch (error) {
    console.error('Delete file error:', error);
    throw new Error('Failed to delete file');
  }
};

/**
 * Delete an image from storage
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    // Only try to delete if we have a URL
    if (!imageUrl) {
      console.log('No image URL provided for deletion');
      return;
    }
    
    // Try to parse URL to determine storage provider
    try {
      const url = new URL(imageUrl);
      
      // Extract the file ID from Appwrite URL
      const fileIdMatch = url.pathname.match(/\/files\/([^\/]+)\/([^\/]+)/);
      
      if (!fileIdMatch || fileIdMatch.length < 3) {
        console.warn('Could not extract file ID from URL:', imageUrl);
        return;
      }
      
      const bucketId = fileIdMatch[1];
      const fileId = fileIdMatch[2];
      
      // Verify this is our bucket
      if (bucketId !== STORAGE_CONFIG.bucketId) {
        console.warn(`URL points to different bucket (${bucketId}), expected ${STORAGE_CONFIG.bucketId}`);
        return;
      }
      
      console.log('Deleting Appwrite file:', fileId);
      
      // Delete the file
      await storage.deleteFile(STORAGE_CONFIG.bucketId, fileId);
      console.log('Appwrite file deleted successfully');
    } catch (urlError) {
      console.error('Failed to parse image URL for deletion:', urlError);
      throw urlError;
    }
  } catch (error) {
    console.error('Failed to delete image:', error);
    throw error;
  }
};

/**
 * Upload multiple images for a product gallery
 * @param files Array of image files to upload
 * @returns Array of public URLs for the uploaded images
 */
export const uploadGalleryImages = async (files: File[]): Promise<string[]> => {
  try {
    if (!files.length) return [];
    
    console.log(`Starting gallery upload with ${files.length} images`);
    
    // Optimize all images before uploading (prefer AVIF for best compression)
    let optimizedFiles: File[];
    try {
      showToast('Optimizing images to AVIF/WebP format...', 'info');
      const bestFormat = getBestSupportedFormat();
      console.log(`Using ${bestFormat} format for optimization`);
      
      optimizedFiles = await processImages(files, { 
        quality: 0.8, 
        maxWidth: 1200,
        forceFormat: bestFormat
      });
      console.log(`Successfully optimized ${optimizedFiles.length} images for gallery`);
    } catch (optimizationError) {
      console.warn('Image optimization failed, using original files:', optimizationError);
      optimizedFiles = files;
    }
    
    // Upload files with error handling for each file individually
    const urls: string[] = [];
    let failedCount = 0;
    
    // Process files sequentially to avoid overwhelming the server
    for (const file of optimizedFiles) {
      try {
        const url = await uploadImage(file);
        urls.push(url);
      } catch (uploadError) {
        console.error(`Failed to upload image ${file.name}:`, uploadError);
        failedCount++;
      }
    }
    
    // Notify about partial failures
    if (failedCount > 0) {
      const successCount = urls.length;
      if (successCount > 0) {
        showToast(`Uploaded ${successCount} images successfully. ${failedCount} images failed.`, 'warning');
      } else {
        showToast(`All ${failedCount} images failed to upload.`, 'error');
      }
    } else {
      showToast(`Successfully uploaded ${urls.length} images in optimized format.`, 'success');
    }
    
    console.log('Gallery upload complete:', urls);
    return urls;
  } catch (error) {
    console.error('Failed to upload gallery images:', error);
    throw error;
  }
};

/**
 * Delete multiple images from a product gallery
 * @param imageUrls Array of image URLs to delete
 */
export const deleteGalleryImages = async (imageUrls: string[]): Promise<void> => {
  try {
    if (!imageUrls.length) return;
    
    console.log(`Starting deletion of ${imageUrls.length} gallery images`);
    
    // Delete images with individual error handling
    let successCount = 0;
    let failedCount = 0;
    
    for (const url of imageUrls) {
      try {
        await deleteImage(url);
        successCount++;
      } catch (deleteError) {
        console.error(`Failed to delete image ${url}:`, deleteError);
        failedCount++;
      }
    }
    
    // Notify about results
    if (failedCount > 0) {
      if (successCount > 0) {
        showToast(`Deleted ${successCount} images. ${failedCount} images could not be deleted.`, 'warning');
      } else {
        showToast(`Failed to delete all ${failedCount} images.`, 'error');
      }
    } else {
      showToast(`Successfully deleted ${successCount} images.`, 'success');
    }
    
    console.log('Gallery images deletion complete');
  } catch (error) {
    console.error('Failed to delete gallery images:', error);
    throw error;
  }
};
