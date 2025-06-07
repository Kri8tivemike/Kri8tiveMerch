import React, { createContext, useContext, useState, useCallback } from 'react';

// Type for the cache storage
interface PageCache {
  [key: string]: {
    component: React.ReactNode;
    scrollPosition: { x: number; y: number };
    data: any;
  };
}

interface PageCacheContextType {
  getCachedPage: (pageId: string) => { component: React.ReactNode; scrollPosition: { x: number; y: number }; data: any } | null;
  cachePage: (pageId: string, component: React.ReactNode, data?: any) => void;
  saveScrollPosition: (pageId: string, position: { x: number; y: number }) => void;
  clearCache: (pageId?: string) => void;
}

const PageCacheContext = createContext<PageCacheContextType | undefined>(undefined);

export const PageCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<PageCache>({});

  const getCachedPage = useCallback((pageId: string) => {
    return cache[pageId] || null;
  }, [cache]);

  const cachePage = useCallback((pageId: string, component: React.ReactNode, data: any = {}) => {
    console.log(`Caching page: ${pageId}`);
    setCache(prev => ({
      ...prev,
      [pageId]: {
        component,
        scrollPosition: { x: 0, y: 0 },
        data
      }
    }));
  }, []);

  const saveScrollPosition = useCallback((pageId: string, position: { x: number; y: number }) => {
    setCache(prev => {
      if (!prev[pageId]) return prev;
      
      return {
        ...prev,
        [pageId]: {
          ...prev[pageId],
          scrollPosition: position
        }
      };
    });
  }, []);

  const clearCache = useCallback((pageId?: string) => {
    if (pageId) {
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[pageId];
        return newCache;
      });
    } else {
      setCache({});
    }
  }, []);

  return (
    <PageCacheContext.Provider value={{ getCachedPage, cachePage, saveScrollPosition, clearCache }}>
      {children}
    </PageCacheContext.Provider>
  );
};

export const usePageCache = () => {
  const context = useContext(PageCacheContext);
  if (!context) {
    throw new Error('usePageCache must be used within a PageCacheProvider');
  }
  return context;
}; 