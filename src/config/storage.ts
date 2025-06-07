/**
 * Appwrite Storage Configuration
 * Defines bucket IDs and storage settings for the application
 */

export const STORAGE_CONFIG = {
  // Bucket IDs - using existing buckets due to plan limitations
  BUCKETS: {
    PRODUCT_IMAGES: 'product-images', // Existing bucket for product images
    DESIGN_CANVAS: 'user_avatars', // Reusing existing bucket for design uploads
    USER_UPLOADS: 'user_avatars', // Reusing existing bucket for user uploads
  },
  
  // File size limits (in bytes)
  LIMITS: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_IMAGE_DIMENSION: 4096, // 4K resolution
  },
  
  // Allowed file types
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif',
  ],
  
  // Default image transformations
  TRANSFORMATIONS: {
    THUMBNAIL: {
      width: 200,
      height: 200,
      quality: 80,
      gravity: 'center',
    },
    PREVIEW: {
      width: 800,
      height: 600,
      quality: 90,
      gravity: 'center',
    },
    PRODUCT_IMAGE: {
      width: 1200,
      height: 1200,
      quality: 85,
      gravity: 'center',
    },
  },
} as const;

/**
 * Generate Appwrite file URL
 */
export const getAppwriteFileUrl = (bucketId: string, fileId: string): string => {
  const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '67ea2c3b00309b589901';
  return `https://cloud.appwrite.io/v1/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
};

/**
 * Generate Appwrite preview URL with transformations
 */
export const getAppwritePreviewUrl = (
  bucketId: string, 
  fileId: string, 
  options: {
    width?: number;
    height?: number;
    quality?: number;
    gravity?: string;
  } = {}
): string => {
  const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '67ea2c3b00309b589901';
  const params = new URLSearchParams({
    project: projectId,
    width: (options.width || 400).toString(),
    height: (options.height || 400).toString(),
    quality: (options.quality || 80).toString(),
    gravity: options.gravity || 'center',
  });
  
  return `https://cloud.appwrite.io/v1/storage/buckets/${bucketId}/files/${fileId}/preview?${params.toString()}`;
};

/**
 * Validate image file before upload
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  if (!STORAGE_CONFIG.ALLOWED_TYPES.includes(file.type as any)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${STORAGE_CONFIG.ALLOWED_TYPES.join(', ')}`,
    };
  }

  if (file.size > STORAGE_CONFIG.LIMITS.MAX_FILE_SIZE) {
    const maxSizeMB = STORAGE_CONFIG.LIMITS.MAX_FILE_SIZE / (1024 * 1024);
    return {
      isValid: false,
      error: `File size too large. Maximum size: ${maxSizeMB}MB`,
    };
  }

  return { isValid: true };
};

/**
 * Instructions for setting up Appwrite storage buckets
 */
export const BUCKET_SETUP_INSTRUCTIONS = {
  'product-images': {
    name: 'Product Images',
    description: 'Store product catalog images and thumbnails',
    permissions: ['read("any")'], // Public read access
    fileSecurity: false,
    enabled: true,
    maximumFileSize: STORAGE_CONFIG.LIMITS.MAX_FILE_SIZE,
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
    maximumFileSize: STORAGE_CONFIG.LIMITS.MAX_FILE_SIZE,
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
    maximumFileSize: STORAGE_CONFIG.LIMITS.MAX_FILE_SIZE,
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    compression: 'gzip',
    encryption: false,
    antivirus: true,
  },
} as const; 