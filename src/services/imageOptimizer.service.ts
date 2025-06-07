/**
 * Enhanced Image Optimizer Service with AVIF Support
 * Provides functions for image optimization including AVIF, WebP conversion and resizing
 */

/**
 * Configuration for image optimization
 */
const IMAGE_OPTIMIZER_CONFIG = {
  quality: 0.8, // Quality for image conversion (0-1)
  maxWidth: 1600, // Maximum width for product images
  maxThumbnailWidth: 400, // Maximum width for thumbnails
  acceptedInputTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'],
  // Preferred format order (AVIF first for best compression)
  preferredFormats: ['image/avif', 'image/webp', 'image/jpeg'] as const
};

/**
 * Check browser support for image formats
 */
export const checkImageFormatSupport = (): { avif: boolean; webp: boolean } => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return {
    avif: canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0,
    webp: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  };
};

/**
 * Get the best supported image format for the browser
 */
export const getBestSupportedFormat = (): 'image/avif' | 'image/webp' | 'image/jpeg' => {
  const support = checkImageFormatSupport();
  
  if (support.avif) return 'image/avif';
  if (support.webp) return 'image/webp';
  return 'image/jpeg';
};

/**
 * Convert an image file to the best supported format (AVIF preferred)
 * @param file Original image file
 * @param options Configuration options
 * @returns Promise resolving to a File object in the best format
 */
export const convertToOptimalFormat = async (
  file: File, 
  options: { 
    quality?: number;
    maxWidth?: number;
    generateThumbnail?: boolean;
    forceFormat?: 'image/avif' | 'image/webp' | 'image/jpeg';
  } = {}
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Set default options
    const quality = options.quality || IMAGE_OPTIMIZER_CONFIG.quality;
    const maxWidth = options.maxWidth || IMAGE_OPTIMIZER_CONFIG.maxWidth;
    const targetFormat = options.forceFormat || getBestSupportedFormat();

    // Skip conversion if already in target format and no resizing needed
    if (file.type === targetFormat && !options.maxWidth && !options.generateThumbnail) {
      console.log(`Image already in ${targetFormat} format and no resize needed, skipping conversion`);
      resolve(file);
      return;
    }

    // Check if file type is supported
    if (!IMAGE_OPTIMIZER_CONFIG.acceptedInputTypes.includes(file.type)) {
      console.warn(`Image type ${file.type} not supported for optimization, returning original`);
      resolve(file);
      return;
    }

    // Create image object to load the file
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      // Create canvas for the image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Draw and convert the image
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not get canvas context for image conversion'));
        return;
      }
      
      // Draw the image on the canvas
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert the canvas to target format
      canvas.toBlob((blob) => {
        if (!blob) {
          URL.revokeObjectURL(url);
          reject(new Error(`Failed to convert image to ${targetFormat}`));
          return;
        }
        
        // Calculate size reduction
        const originalSize = file.size;
        const newSize = blob.size;
        const reduction = (1 - (newSize / originalSize)) * 100;
        
        console.log(`Image optimized to ${targetFormat}: ${originalSize} bytes → ${newSize} bytes (${reduction.toFixed(1)}% reduction)`);
        
        // Get file extension for the target format
        const extension = targetFormat.split('/')[1];
        
        // Create a new File object
        const optimizedFile = new File(
          [blob], 
          `${file.name.split('.')[0]}.${extension}`, 
          { type: targetFormat }
        );
        
        // Clean up
        URL.revokeObjectURL(url);
        resolve(optimizedFile);
      }, targetFormat, quality);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image for ${targetFormat} conversion`));
    };
    
    img.src = url;
  });
};

/**
 * Legacy function for backward compatibility
 */
export const convertToWebP = (file: File, options: any = {}) => {
  return convertToOptimalFormat(file, { ...options, forceFormat: 'image/webp' });
};

/**
 * Process multiple images, converting them to optimal format
 * @param files Array of image files to process
 * @param options Configuration options
 * @returns Promise resolving to an array of optimized File objects
 */
export const processImages = async (
  files: File[], 
  options: { 
    quality?: number;
    maxWidth?: number;
    generateThumbnail?: boolean;
    forceFormat?: 'image/avif' | 'image/webp' | 'image/jpeg';
  } = {}
): Promise<File[]> => {
  try {
    // Process all files concurrently
    const promises = files.map(file => convertToOptimalFormat(file, options));
    return await Promise.all(promises);
  } catch (error) {
    console.error('Error processing images:', error);
    throw error;
  }
};

/**
 * Generate responsive image URLs using Appwrite's transformation API
 * @param baseUrl The base image URL from Appwrite storage
 * @param options Transformation options
 * @returns Object with different format URLs
 */
export const generateResponsiveImageUrls = (
  baseUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}
) => {
  if (!baseUrl) return null;

  const { width, height, quality = 80 } = options;
  
  // Build query parameters for Appwrite image transformation
  const params = new URLSearchParams();
  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  params.append('quality', quality.toString());
  
  const baseParams = params.toString();
  
  // Note: Appwrite's image transformation API may not support format conversion
  // For now, we'll use the same URL with different parameters
  // In the future, this could be enhanced when Appwrite adds format conversion support
  return {
    // For now, all formats use the same optimized URL
    avif: baseUrl + (baseParams ? `?${baseParams}` : ''),
    webp: baseUrl + (baseParams ? `?${baseParams}` : ''),
    jpeg: baseUrl + (baseParams ? `?${baseParams}` : ''),
    original: baseUrl
  };
};

/**
 * Get optimized image URL with size and quality parameters
 * @param baseUrl The base image URL from Appwrite storage
 * @param options Transformation options
 * @returns Optimized image URL
 */
export const getOptimizedImageUrl = (
  baseUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}
): string => {
  if (!baseUrl) return '';

  // Check if it's an Appwrite URL that supports transformations
  const isAppwriteUrl = baseUrl.includes('/storage/buckets/') || baseUrl.includes('appwrite');
  
  if (!isAppwriteUrl) {
    return baseUrl; // Return original URL for non-Appwrite images
  }

  const { width, height, quality = 80 } = options;
  
  // Build query parameters for Appwrite image transformation
  const params = new URLSearchParams();
  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  params.append('quality', quality.toString());
  
  const queryString = params.toString();
  
  // Add parameters to the URL
  if (queryString) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}${queryString}`;
  }
  
  return baseUrl;
}; 