/**
 * Image debugging utilities
 * Helps diagnose image loading issues in the application
 */

import { storage } from '../lib/appwrite';
import { getOptimizedImageUrl } from '../services/imageOptimizer.service';

export interface ImageDebugInfo {
  originalUrl: string;
  optimizedUrl?: string;
  isAppwriteUrl: boolean;
  bucketId?: string;
  fileId?: string;
  isAccessible: boolean;
  error?: string;
}

/**
 * Extract bucket and file ID from Appwrite URL
 */
export const parseAppwriteUrl = (url: string): { bucketId?: string; fileId?: string } => {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/storage\/buckets\/([^\/]+)\/files\/([^\/]+)/);
    
    if (pathMatch && pathMatch.length >= 3) {
      return {
        bucketId: pathMatch[1],
        fileId: pathMatch[2]
      };
    }
  } catch (error) {
    console.warn('Failed to parse Appwrite URL:', error);
  }
  
  return {};
};

/**
 * Check if an image URL is accessible
 */
export const checkImageAccessibility = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('Image accessibility check failed:', error);
    return false;
  }
};

/**
 * Debug a single image URL
 */
export const debugImageUrl = async (url: string): Promise<ImageDebugInfo> => {
  const info: ImageDebugInfo = {
    originalUrl: url,
    isAppwriteUrl: url.includes('/storage/buckets/') || url.includes('appwrite'),
    isAccessible: false
  };

  // Parse Appwrite URL if applicable
  if (info.isAppwriteUrl) {
    const parsed = parseAppwriteUrl(url);
    info.bucketId = parsed.bucketId;
    info.fileId = parsed.fileId;
    
    // Generate optimized URL
    try {
      info.optimizedUrl = getOptimizedImageUrl(url, {
        width: 400,
        height: 400,
        quality: 85
      });
    } catch (error) {
      info.error = `Failed to generate optimized URL: ${error}`;
    }
  }

  // Check accessibility
  try {
    info.isAccessible = await checkImageAccessibility(url);
  } catch (error) {
    info.error = `Accessibility check failed: ${error}`;
  }

  return info;
};

/**
 * Debug all product images
 */
export const debugProductImages = async (products: any[]): Promise<ImageDebugInfo[]> => {
  const results: ImageDebugInfo[] = [];
  
  for (const product of products) {
    if (product.image_url) {
      const info = await debugImageUrl(product.image_url);
      results.push({
        ...info,
        originalUrl: `${product.name}: ${info.originalUrl}`
      });
    }
    
    // Check color images
    if (product.colors) {
      for (const color of product.colors) {
        if (color.image_url) {
          const info = await debugImageUrl(color.image_url);
          results.push({
            ...info,
            originalUrl: `${product.name} (${color.name}): ${info.originalUrl}`
          });
        }
      }
    }
    
    // Check gallery images
    if (product.gallery_images) {
      for (let i = 0; i < product.gallery_images.length; i++) {
        const galleryUrl = product.gallery_images[i];
        if (galleryUrl) {
          const info = await debugImageUrl(galleryUrl);
          results.push({
            ...info,
            originalUrl: `${product.name} (gallery ${i + 1}): ${info.originalUrl}`
          });
        }
      }
    }
  }
  
  return results;
};

/**
 * Test storage bucket configuration
 */
export const testStorageBucket = async (bucketId: string = 'user_avatars') => {
  try {
    console.log(`🔍 Testing storage bucket: ${bucketId}`);
    
    // Try to list files
    const files = await storage.listFiles(bucketId);
    console.log(`✅ Bucket exists with ${files.total} files`);
    
    // Test URL generation
    if (files.files.length > 0) {
      const firstFile = files.files[0];
      const url = storage.getFileView(bucketId, firstFile.$id);
      console.log(`✅ Sample URL: ${url}`);
      
      // Test accessibility
      const isAccessible = await checkImageAccessibility(url.toString());
      console.log(`${isAccessible ? '✅' : '❌'} URL accessibility: ${isAccessible}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Storage bucket test failed:`, error);
    return false;
  }
};

// Add to window for debugging
if (typeof window !== 'undefined') {
  (window as any).imageDebug = {
    debugImageUrl,
    debugProductImages,
    testStorageBucket,
    parseAppwriteUrl,
    checkImageAccessibility
  };
  
  console.log('🔧 Image debugging tools available:');
  console.log('- imageDebug.debugImageUrl(url) - Debug a single image URL');
  console.log('- imageDebug.debugProductImages(products) - Debug all product images');
  console.log('- imageDebug.testStorageBucket() - Test storage bucket');
  console.log('- imageDebug.parseAppwriteUrl(url) - Parse Appwrite URL');
  console.log('- imageDebug.checkImageAccessibility(url) - Check if image is accessible');
} 