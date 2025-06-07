// ImageKit configuration
export const imagekitConfig = {
  publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || 'public_5z5TQ72XO/wfUYDSFSGbwGLV3U0=',
  urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/Kri8tive',
  privateKey: import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY || 'private_6VnBi8vMwakaL4eabz3MBCbaI0o=', // Only for server-side
};

// Note: We don't initialize ImageKit here for client-side usage
// Instead, we'll use the ImageKit Upload API directly in the service

// Validation function to check if ImageKit is properly configured
export const isImageKitConfigured = (): boolean => {
  return !!(imagekitConfig.publicKey && imagekitConfig.urlEndpoint);
};

// Default transformation options for design canvas images
export const defaultTransformations = {
  quality: 90,
  format: 'auto',
  progressive: true,
};

// Canvas-specific transformation presets
export const canvasTransformations = {
  thumbnail: {
    width: 150,
    height: 150,
    crop: 'maintain_ratio',
    quality: 80,
  },
  preview: {
    width: 600,
    height: 400,
    crop: 'maintain_ratio',
    quality: 90,
  },
  export: {
    width: 1200,
    height: 800,
    crop: 'maintain_ratio',
    quality: 95,
  },
}; 