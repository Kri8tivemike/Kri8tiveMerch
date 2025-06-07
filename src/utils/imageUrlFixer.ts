/**
 * Image URL fixing utilities
 * Helps fix common image URL issues in the application
 */

import { storage } from '../lib/appwrite';

/**
 * Fix common image URL issues
 */
export const fixImageUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Remove any extra whitespace
  url = url.trim();

  // If it's already a valid URL, return as-is
  try {
    new URL(url);
    return url;
  } catch {
    // Not a valid URL, continue with fixes
  }

  // If it's a relative path or file ID, try to construct the full URL
  if (url.length > 0 && !url.startsWith('http')) {
    // Assume it's a file ID and construct the full Appwrite URL
    const bucketId = 'user_avatars'; // Use the correct bucket
    return storage.getFileView(bucketId, url).toString();
  }

  return url;
};

/**
 * Validate if an image URL is properly formatted
 */
export const validateImageUrl = (url: string): { isValid: boolean; error?: string } => {
  if (!url) {
    return { isValid: false, error: 'URL is empty' };
  }

  try {
    const urlObj = new URL(url);
    
    // Check if it's an Appwrite URL
    if (urlObj.hostname.includes('appwrite')) {
      // Validate Appwrite URL structure
      if (!urlObj.pathname.includes('/storage/buckets/')) {
        return { isValid: false, error: 'Invalid Appwrite storage URL structure' };
      }
      
      // Check if it has the required project parameter
      if (!urlObj.searchParams.get('project') && !urlObj.pathname.includes('project=')) {
        return { isValid: false, error: 'Missing project parameter in Appwrite URL' };
      }
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: `Invalid URL format: ${error}` };
  }
};

/**
 * Fix product image URLs in bulk
 */
export const fixProductImageUrls = (products: any[]): any[] => {
  return products.map(product => ({
    ...product,
    image_url: fixImageUrl(product.image_url),
    colors: product.colors?.map((color: any) => ({
      ...color,
      image_url: fixImageUrl(color.image_url)
    })) || [],
    gallery_images: product.gallery_images?.map((url: string) => fixImageUrl(url)) || []
  }));
};

/**
 * Debug image URL issues
 */
export const debugImageUrl = (url: string) => {
  console.group(`🔍 Debugging image URL: ${url}`);
  
  const validation = validateImageUrl(url);
  console.log('Validation result:', validation);
  
  if (validation.isValid) {
    console.log('✅ URL is valid');
    
    // Test if the image is accessible
    const img = new Image();
    img.onload = () => {
      console.log('✅ Image loads successfully');
      console.groupEnd();
    };
    img.onerror = (error) => {
      console.log('❌ Image failed to load:', error);
      console.groupEnd();
    };
    img.src = url;
  } else {
    console.log('❌ URL validation failed:', validation.error);
    
    // Try to fix the URL
    const fixedUrl = fixImageUrl(url);
    if (fixedUrl !== url) {
      console.log('🔧 Suggested fix:', fixedUrl);
      debugImageUrl(fixedUrl); // Recursively debug the fixed URL
    }
    console.groupEnd();
  }
};

// Add to window for debugging
if (typeof window !== 'undefined') {
  (window as any).imageUrlFixer = {
    fixImageUrl,
    validateImageUrl,
    fixProductImageUrls,
    debugImageUrl
  };
  
  console.log('🔧 Image URL fixer tools available:');
  console.log('- imageUrlFixer.fixImageUrl(url) - Fix a single image URL');
  console.log('- imageUrlFixer.validateImageUrl(url) - Validate an image URL');
  console.log('- imageUrlFixer.fixProductImageUrls(products) - Fix all product image URLs');
  console.log('- imageUrlFixer.debugImageUrl(url) - Debug an image URL');
} 