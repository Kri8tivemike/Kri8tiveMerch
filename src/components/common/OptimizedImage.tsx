import React from 'react';
import { generateResponsiveImageUrls } from '../../services/imageOptimizer.service';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  sizes?: string;
  className?: string;
}

/**
 * OptimizedImage component that serves AVIF, WebP, and JPEG formats
 * using the HTML picture element for progressive enhancement
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 80,
  sizes = '100vw',
  className = '',
  ...props
}: OptimizedImageProps) {
  // Generate responsive URLs for different formats
  const imageUrls = generateResponsiveImageUrls(src, { width, height, quality });
  
  if (!imageUrls) {
    // Fallback to regular img if URL generation fails
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading="lazy"
        decoding="async"
        {...props}
      />
    );
  }

  return (
    <picture className={className}>
      {/* AVIF format - best compression */}
      <source srcSet={imageUrls.avif} type="image/avif" sizes={sizes} />
      
      {/* WebP format - good compression and support */}
      <source srcSet={imageUrls.webp} type="image/webp" sizes={sizes} />
      
      {/* JPEG fallback - universal support */}
      <img
        src={imageUrls.jpeg}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        {...props}
      />
    </picture>
  );
} 