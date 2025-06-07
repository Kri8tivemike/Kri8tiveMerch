import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePageCache } from '../contexts/PageCacheContext';

interface CachedRouteProps {
  children: React.ReactNode;
  cacheKey: string;
  shouldCache?: boolean;
}

/**
 * A component that caches its content when navigating away
 * and restores it when navigating back.
 */
export const CachedRoute: React.FC<CachedRouteProps> = ({
  children,
  cacheKey,
  shouldCache = true
}) => {
  const location = useLocation();
  const { getCachedPage, cachePage, saveScrollPosition } = usePageCache();
  const [content, setContent] = useState<React.ReactNode>(children);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Save scroll position before unmounting
  useEffect(() => {
    const handleScroll = () => {
      if (shouldCache) {
        saveScrollPosition(cacheKey, {
          x: window.scrollX,
          y: window.scrollY
        });
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      
      // Save final scroll position before unmounting
      if (shouldCache) {
        saveScrollPosition(cacheKey, {
          x: window.scrollX,
          y: window.scrollY
        });
      }
    };
  }, [cacheKey, saveScrollPosition, shouldCache]);
  
  // Try to load from cache on initial render
  useEffect(() => {
    const cachedPage = getCachedPage(cacheKey);
    
    if (cachedPage && shouldCache) {
      console.log(`Restoring cached page: ${cacheKey}`);
      setContent(cachedPage.component);
      
      // Restore scroll position
      setTimeout(() => {
        window.scrollTo(cachedPage.scrollPosition.x, cachedPage.scrollPosition.y);
      }, 0);
    } else {
      // Cache the new content
      if (shouldCache) {
        cachePage(cacheKey, children);
      }
      setContent(children);
    }
  }, [cacheKey, getCachedPage, cachePage, shouldCache]);
  
  // Update cache when children change
  useEffect(() => {
    if (shouldCache) {
      cachePage(cacheKey, children);
    }
  }, [children, cacheKey, cachePage, shouldCache]);
  
  return (
    <div ref={containerRef} className="cached-route-container" data-route-key={cacheKey}>
      {content}
    </div>
  );
}; 