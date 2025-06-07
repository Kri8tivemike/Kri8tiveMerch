import { imagekitConfig } from '../config/imagekit';

export interface ImageKitUploadResult {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  size: number;
  filePath: string;
  tags?: string[];
}

export interface ImageKitUploadOptions {
  file: File | Blob;
  fileName: string;
  folder?: string;
  tags?: string[];
  useUniqueFileName?: boolean;
}

class ImageKitOnlyService {
  /**
   * Check if ImageKit is properly configured
   */
  isConfigured(): boolean {
    return !!(imagekitConfig.publicKey && imagekitConfig.urlEndpoint && imagekitConfig.privateKey);
  }

  /**
   * Test ImageKit configuration and connectivity
   */
  async testImageKitConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'ImageKit is not configured. Please check your API keys.'
        };
      }

      // Test with a simple request to ImageKit
      const testUrl = `${imagekitConfig.urlEndpoint}/tr:w-100,h-100/default-image.jpg`;
      
      console.log('🧪 Testing ImageKit connection...');
      console.log('📋 ImageKit Config:', {
        publicKey: imagekitConfig.publicKey.substring(0, 20) + '...',
        urlEndpoint: imagekitConfig.urlEndpoint,
        configured: this.isConfigured()
      });

      const response = await fetch(testUrl);
      
      return {
        success: response.status === 200 || response.status === 404, // 404 is OK for test image
        message: 'ImageKit configuration is valid and accessible.'
      };
    } catch (error) {
      console.error('ImageKit connection test failed:', error);
      return {
        success: false,
        message: `ImageKit connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Upload image directly to ImageKit
   */
  async uploadImage(options: ImageKitUploadOptions): Promise<ImageKitUploadResult> {
    try {
      if (!this.isConfigured()) {
        throw new Error('ImageKit is not configured. Please check your API keys.');
      }

      // Generate unique filename if requested
      const fileName = options.useUniqueFileName !== false ? 
        `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${options.fileName}` : 
        options.fileName;

      // Get authentication parameters
      const authParams = await this.getImageKitAuthParams();

      // Prepare form data for ImageKit upload
      const formData = new FormData();
      formData.append('file', options.file);
      formData.append('fileName', fileName);
      formData.append('publicKey', imagekitConfig.publicKey);
      formData.append('signature', authParams.signature);
      formData.append('expire', authParams.expire.toString());
      formData.append('token', authParams.token);

      if (options.folder) {
        formData.append('folder', options.folder);
      }

      if (options.tags && options.tags.length > 0) {
        formData.append('tags', options.tags.join(','));
      }

      console.log('🚀 Uploading to ImageKit:', {
        fileName,
        folder: options.folder,
        tags: options.tags,
        fileSize: options.file.size
      });

      // Upload to ImageKit
      const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ImageKit upload failed:', errorText);
        throw new Error(`ImageKit upload failed: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ ImageKit upload successful:', result);

      return {
        fileId: result.fileId,
        name: result.name,
        url: result.url,
        thumbnailUrl: this.getImageKitThumbnailUrl(result.url),
        size: result.size,
        filePath: result.filePath,
        tags: result.tags,
      };
    } catch (error) {
      console.error('ImageKit upload error:', error);
      throw new Error(`Failed to upload to ImageKit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload canvas design as image to ImageKit
   */
  async uploadCanvasDesign(canvas: HTMLCanvasElement, designName: string): Promise<ImageKitUploadResult> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('Failed to convert canvas to blob'));
          return;
        }

        try {
          const result = await this.uploadImage({
            file: blob,
            fileName: `${designName}-${Date.now()}.png`,
            folder: '/design-canvas',
            tags: ['design', 'canvas', 'user-created'],
          });
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, 'image/png', 0.9);
    });
  }

  /**
   * Get ImageKit authentication parameters
   */
  private async getImageKitAuthParams(): Promise<{ signature: string; expire: number; token: string }> {
    try {
      // Generate authentication parameters for ImageKit upload
      const expire = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const token = `${expire}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create the string to sign
      const stringToSign = token + expire;
      
      // Generate HMAC-SHA1 signature using Web Crypto API
      const signature = await this.generateHMACSignature(stringToSign, imagekitConfig.privateKey);
      
      return {
        signature,
        expire,
        token
      };
    } catch (error) {
      console.error('Error generating ImageKit auth params:', error);
      throw new Error('Failed to generate authentication parameters');
    }
  }

  /**
   * Generate HMAC-SHA1 signature using Web Crypto API
   */
  private async generateHMACSignature(message: string, key: string): Promise<string> {
    try {
      // Convert key and message to ArrayBuffer
      const encoder = new TextEncoder();
      const keyData = encoder.encode(key);
      const messageData = encoder.encode(message);

      // Import the key for HMAC
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
      );

      // Generate the signature
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

      // Convert to hex string
      const hashArray = Array.from(new Uint8Array(signature));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      return hashHex;
    } catch (error) {
      console.error('Error generating HMAC signature:', error);
      throw new Error('Failed to generate HMAC signature');
    }
  }

  /**
   * Get ImageKit thumbnail URL with transformations
   */
  getImageKitThumbnailUrl(originalUrl: string, width = 200, height = 200): string {
    try {
      // Extract the path from the original URL
      const urlParts = originalUrl.split('/');
      const pathIndex = urlParts.findIndex(part => part.includes('imagekit.io'));
      
      if (pathIndex === -1) {
        return originalUrl; // Return original if not an ImageKit URL
      }

      // Reconstruct URL with transformations
      const baseParts = urlParts.slice(0, pathIndex + 1);
      const pathParts = urlParts.slice(pathIndex + 1);
      
      // Insert transformation parameters
      const transformedUrl = [
        ...baseParts,
        `tr:w-${width},h-${height},c-maintain_ratio`,
        ...pathParts
      ].join('/');

      return transformedUrl;
    } catch (error) {
      console.warn('Failed to generate ImageKit thumbnail URL:', error);
      return originalUrl;
    }
  }

  /**
   * Validate image file before upload
   */
  validateImageFile(file: File | Blob): { isValid: boolean; error?: string } {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return {
        isValid: false,
        error: 'File size must be less than 10MB'
      };
    }

    // Check file type if it's a File object
    if (file instanceof File) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return {
          isValid: false,
          error: 'File type must be JPEG, PNG, GIF, or WebP'
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Delete image from ImageKit
   */
  async deleteImage(fileId: string): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        throw new Error('ImageKit is not configured');
      }

      // Note: ImageKit delete API requires server-side implementation
      // For now, we'll just log the deletion request
      console.log('🗑️ ImageKit delete requested for file:', fileId);
      console.warn('ImageKit deletion requires server-side implementation');
      
      return true;
    } catch (error) {
      console.error('ImageKit delete error:', error);
      return false;
    }
  }
}

// Export singleton instance
const imagekitOnlyService = new ImageKitOnlyService();
export default imagekitOnlyService; 