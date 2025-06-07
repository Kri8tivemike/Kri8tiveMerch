import { useEffect, useState } from 'react';
import { checkImageFormatSupport } from '../../services/imageOptimizer.service';

interface ImagePerformanceData {
  format: string;
  loadTime: number;
  fileSize?: number;
  compressionRatio?: number;
}

interface ImagePerformanceMonitorProps {
  enabled?: boolean;
  onPerformanceData?: (data: ImagePerformanceData) => void;
}

/**
 * ImagePerformanceMonitor - Tracks image loading performance and AVIF optimization benefits
 * This component runs in development mode to help monitor the effectiveness of AVIF optimization
 */
export function ImagePerformanceMonitor({ 
  enabled = process.env.NODE_ENV === 'development',
  onPerformanceData 
}: ImagePerformanceMonitorProps) {
  const [performanceData, setPerformanceData] = useState<ImagePerformanceData[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const support = checkImageFormatSupport();
    
    // Monitor image loading performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.entryType === 'resource' && entry.name.includes('image')) {
          const url = new URL(entry.name);
          const format = url.searchParams.get('output') || 'unknown';
          
          const data: ImagePerformanceData = {
            format: format === 'avif' ? 'AVIF' : format === 'webp' ? 'WebP' : 'JPEG',
            loadTime: entry.duration,
            fileSize: (entry as any).transferSize || undefined
          };
          
          setPerformanceData(prev => [...prev.slice(-9), data]); // Keep last 10 entries
          onPerformanceData?.(data);
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });

    // Keyboard shortcut to toggle visibility (Ctrl+Shift+I)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        setIsVisible(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      observer.disconnect();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onPerformanceData]);

  if (!enabled || !isVisible) {
    return null;
  }

  const avgLoadTime = performanceData.length > 0 
    ? performanceData.reduce((sum, data) => sum + data.loadTime, 0) / performanceData.length 
    : 0;

  const formatCounts = performanceData.reduce((acc, data) => {
    acc[data.format] = (acc[data.format] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const support = checkImageFormatSupport();

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/90 text-white p-4 rounded-lg shadow-lg max-w-sm text-xs font-mono">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">🚀 AVIF Performance Monitor</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      {/* Browser Support */}
      <div className="mb-3">
        <div className="text-gray-300 mb-1">Browser Support:</div>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded text-xs ${support.avif ? 'bg-green-600' : 'bg-red-600'}`}>
            AVIF {support.avif ? '✓' : '✗'}
          </span>
          <span className={`px-2 py-1 rounded text-xs ${support.webp ? 'bg-green-600' : 'bg-red-600'}`}>
            WebP {support.webp ? '✓' : '✗'}
          </span>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="mb-3">
        <div className="text-gray-300 mb-1">Performance:</div>
        <div>Avg Load Time: {avgLoadTime.toFixed(1)}ms</div>
        <div>Images Loaded: {performanceData.length}</div>
      </div>

      {/* Format Usage */}
      <div className="mb-3">
        <div className="text-gray-300 mb-1">Format Usage:</div>
        {Object.entries(formatCounts).map(([format, count]) => (
          <div key={format} className="flex justify-between">
            <span>{format}:</span>
            <span>{count}</span>
          </div>
        ))}
      </div>

      {/* Recent Loads */}
      <div>
        <div className="text-gray-300 mb-1">Recent Loads:</div>
        <div className="max-h-32 overflow-y-auto">
          {performanceData.slice(-5).map((data, index) => (
            <div key={index} className="flex justify-between text-xs">
              <span className={`${
                data.format === 'AVIF' ? 'text-green-400' : 
                data.format === 'WebP' ? 'text-yellow-400' : 'text-gray-400'
              }`}>
                {data.format}
              </span>
              <span>{data.loadTime.toFixed(1)}ms</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 text-gray-400 text-xs">
        Press Ctrl+Shift+I to toggle
      </div>
    </div>
  );
}

/**
 * Hook to use image performance monitoring
 */
export function useImagePerformanceMonitor() {
  const [performanceData, setPerformanceData] = useState<ImagePerformanceData[]>([]);

  const addPerformanceData = (data: ImagePerformanceData) => {
    setPerformanceData(prev => [...prev.slice(-99), data]); // Keep last 100 entries
  };

  const getAverageLoadTime = (format?: string) => {
    const filteredData = format 
      ? performanceData.filter(d => d.format === format)
      : performanceData;
    
    return filteredData.length > 0
      ? filteredData.reduce((sum, data) => sum + data.loadTime, 0) / filteredData.length
      : 0;
  };

  const getFormatUsage = () => {
    return performanceData.reduce((acc, data) => {
      acc[data.format] = (acc[data.format] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  return {
    performanceData,
    addPerformanceData,
    getAverageLoadTime,
    getFormatUsage,
    totalImages: performanceData.length
  };
} 