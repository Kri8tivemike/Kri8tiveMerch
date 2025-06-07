import React, { useState, useEffect, useRef } from 'react';
import { ImageOff } from 'lucide-react';
import { getOptimizedImageUrl } from '../../services/imageOptimizer.service';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  alt: string;
  thumbnail?: boolean;
  maxRetries?: number;
  optimizeForAppwrite?: boolean;
  quality?: number;
}

// Cache for preloaded images
const imageCache = new Set<string>();

export function SafeImage({ 
  src, 
  fallbackSrc, 
  alt, 
  crossOrigin = 'anonymous', 
  thumbnail = false,
  maxRetries = 2,
  optimizeForAppwrite = true,
  quality = 80,
  ...props 
}: SafeImageProps) {
  const { width, height, ...restProps } = props;
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const retryCount = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get optimized image URL if it's from Appwrite
  const optimizedSrc = React.useMemo(() => {
    if (!src || !optimizeForAppwrite) return src;
    
    // Check if this is an Appwrite URL
    const isAppwriteUrl = src.includes('/storage/buckets/') || src.includes('/files/');
    if (!isAppwriteUrl) return src;

    // Get dimensions for optimization
    const targetWidth = thumbnail ? 400 : (typeof width === 'number' ? width : undefined);
    const targetHeight = thumbnail ? 400 : (typeof height === 'number' ? height : undefined);

    try {
      return getOptimizedImageUrl(src, {
        width: targetWidth,
        height: targetHeight,
        quality
      });
    } catch (error) {
      console.warn('Failed to generate optimized URL, using original:', error);
      return src;
    }
  }, [src, optimizeForAppwrite, thumbnail, width, height, quality]);

  // Reset state when src changes
  useEffect(() => {
    if (optimizedSrc) {
      setError(false);
      setLoaded(imageCache.has(optimizedSrc));
      retryCount.current = 0;
    } else {
      setError(true);
      setLoaded(true);
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [optimizedSrc]);

  // Preload image
  useEffect(() => {
    if (!optimizedSrc || imageCache.has(optimizedSrc)) return;

    const img = new Image();
    img.src = optimizedSrc;
    img.crossOrigin = crossOrigin;
    
    const handleLoad = () => {
      console.log(`Successfully loaded optimized image: ${optimizedSrc}`);
      imageCache.add(optimizedSrc);
      setLoaded(true);
      setError(false);
      retryCount.current = 0;
    };
    
    const handleError = () => {
      console.error(`Failed to load optimized image: ${optimizedSrc} (attempt ${retryCount.current + 1}/${maxRetries + 1})`);
      
      if (retryCount.current < maxRetries) {
        console.log(`Retrying image load for: ${optimizedSrc} in 1 second...`);
        retryCount.current += 1;
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          // Try with original URL as fallback (without optimization)
          const fallbackUrl = src || optimizedSrc;
          console.log(`Retrying with fallback URL: ${fallbackUrl}`);
          img.src = fallbackUrl;
        }, 1000);
        
        return;
      }
      
      setError(true);
      setLoaded(true);
      
      if (fallbackSrc && fallbackSrc !== optimizedSrc) {
        console.log(`Trying fallback image: ${fallbackSrc}`);
        const fallbackImg = new Image();
        fallbackImg.src = fallbackSrc;
        fallbackImg.onload = () => setError(false);
      }
    };
    
    img.onload = handleLoad;
    img.onerror = handleError;

    return () => {
      img.onload = null;
      img.onerror = null;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [optimizedSrc, crossOrigin, fallbackSrc, maxRetries, src]);

  // Default fallback image
  const defaultFallback = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%23999" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';

  const imageStyles = {
    ...restProps.style,
    opacity: loaded ? 1 : 0,
    transition: 'opacity 0.3s ease-out',
    ...(thumbnail ? {
      width: '100px',
      height: '100px',
      objectFit: 'cover' as const,
    } : {})
  };

  return (
    <div 
      className="relative" 
      style={{ 
        minHeight: height || 'auto',
        backgroundColor: '#f3f4f6',
        overflow: 'hidden',
        ...(thumbnail ? { width: '100px', height: '100px' } : {})
      }}
    >
      {!loaded && (
        <div 
          className="absolute inset-0 bg-gray-100 animate-pulse"
          style={{ 
            aspectRatio: width && height ? `${width}/${height}` : 'auto',
            ...(thumbnail ? { width: '100px', height: '100px' } : {})
          }}
        />
      )}
      
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
          <ImageOff className="w-8 h-8 text-gray-400 mb-1" />
          {!thumbnail && (
            <span className="text-xs text-gray-500">Image not available</span>
          )}
        </div>
      ) : (
        <img
          {...restProps}
          src={optimizedSrc || fallbackSrc || defaultFallback}
          alt={alt}
          crossOrigin={crossOrigin}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          style={imageStyles}
          width={width}
          height={height}
          onError={(e) => {
            console.error(`Runtime image error for ${optimizedSrc}`);
            if (retryCount.current >= maxRetries) {
              setError(true);
              
              if (fallbackSrc && e.currentTarget) {
                console.log(`Using fallback image: ${fallbackSrc}`);
                e.currentTarget.src = fallbackSrc;
              }
            } else {
              retryCount.current += 1;
              
              if (e.currentTarget && src && src !== optimizedSrc) {
                console.log(`Manual retry ${retryCount.current}/${maxRetries} for image: ${src}`);
                e.currentTarget.src = src; // Try original URL without optimization
              } else {
                setError(true);
              }
            }
          }}
          onLoad={() => setLoaded(true)}
        />
      )}
    </div>
  );
}
