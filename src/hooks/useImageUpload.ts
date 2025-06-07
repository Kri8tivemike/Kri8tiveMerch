import { useState } from 'react';

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File): Promise<string | null> => {
    setUploading(true);
    setError(null);

    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create object URL for local preview
      const url = URL.createObjectURL(file);
      return url;
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    handleUpload,
    uploading,
    error
  };
}