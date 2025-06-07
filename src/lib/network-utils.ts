/**
 * Network Utilities for Appwrite
 * Handles timeouts, retries, and network error management
 */

/**
 * Check if the browser is currently online
 * @returns boolean indicating if the browser has network connectivity
 */
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

/**
 * Advanced network diagnostics to help troubleshoot connection issues
 * @param targetUrl URL that we're trying to connect to
 * @param timeout Optional timeout in milliseconds
 * @returns A diagnostic message with suggestions
 */
export const diagnoseNetworkIssues = async (
  targetUrl: string, 
  timeout: number = 5000
): Promise<string> => {
  // Check basic online status first
  if (!isOnline()) {
    return 'Your device appears to be offline. Please check your internet connection.';
  }

  let diagnosticMessages: string[] = [];
  
  // Extract hostname from URL for ping tests
  let hostname = '';
  try {
    const url = new URL(targetUrl);
    hostname = url.hostname;
  } catch (e) {
    hostname = targetUrl.replace(/https?:\/\//, '').split('/')[0];
  }
  
  // Check if it's a local connection
  const isLocalhost = hostname === 'localhost' || 
                      hostname === '127.0.0.1' || 
                      hostname.includes('192.168.');

  if (isLocalhost) {
    diagnosticMessages.push(
      'You are using a local API instance. Please make sure your server is running ' +
      `at ${targetUrl} and check your browser's console for more details.`
    );
    
    diagnosticMessages.push(
      'CORS issues are common with local development - try using Chrome or disabling ' +
      'CORS protection temporarily.'
    );
    
    return diagnosticMessages.join(' ');
  }
  
  // For non-local connections, try to diagnose internet connectivity issues
  try {
    // Test connection to well-known service (like Google)
    const connectionTestUrl = 'https://www.google.com';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(connectionTestUrl, { 
        method: 'HEAD',
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        diagnosticMessages.push('Your internet connection appears to be working.');
      } else {
        diagnosticMessages.push('Your internet connection may be restricted or filtered.');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      diagnosticMessages.push('Your internet connection appears to have issues.');
    }
    
    // Try to fetch target URL with a HEAD request
    const targetController = new AbortController();
    const targetTimeoutId = setTimeout(() => targetController.abort(), timeout);
    
    try {
      await fetch(targetUrl, { 
        method: 'HEAD',
        signal: targetController.signal 
      });
      clearTimeout(targetTimeoutId);
      diagnosticMessages.push(`Service at ${targetUrl} appears to be reachable.`);
    } catch (error) {
      clearTimeout(targetTimeoutId);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('CORS')) {
        diagnosticMessages.push('CORS policy is preventing connection. This is a browser security feature.');
      } else {
        diagnosticMessages.push(`Cannot reach ${targetUrl}. The service might be down or blocked.`);
      }
    }
  } catch (error) {
    // Fallback message if diagnostics fail
    diagnosticMessages.push('Unable to run network diagnostics. Please check your connection manually.');
  }
  
  // Final suggestion based on all checks
  if (diagnosticMessages.length > 0) {
    diagnosticMessages.push('If the problem persists, please contact support with these details.');
  }
  
  return diagnosticMessages.join(' ');
};

export interface NetworkConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

const DEFAULT_CONFIG: Required<NetworkConfig> = {
  timeout: 10000, // 10 seconds
  retries: 2,
  retryDelay: 1000 // 1 second
};

/**
 * Wrapper for Appwrite calls with timeout and retry logic
 */
export async function withNetworkHandling<T>(
  operation: () => Promise<T>,
  config: NetworkConfig = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= finalConfig.retries; attempt++) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${finalConfig.timeout}ms`));
        }, finalConfig.timeout);
      });

      // Race between the operation and timeout
      const result = await Promise.race([
        operation(),
        timeoutPromise
      ]);

      return result;
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.code === 401 || error.code === 403 || error.code === 404) {
        throw error;
      }

      // If this is the last attempt, throw the error
      if (attempt === finalConfig.retries) {
        break;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));
      console.warn(`Network operation failed, retrying... (attempt ${attempt + 1}/${finalConfig.retries})`);
    }
  }

  throw lastError;
}

/**
 * Check if an error is a network-related error
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  const type = error.type?.toLowerCase() || '';
  
  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('err_timed_out') ||
    type.includes('network') ||
    error.code === 'NETWORK_ERROR' ||
    error.name === 'TypeError' && message.includes('failed to fetch')
  );
}

/**
 * Safe wrapper for operations that might fail due to network issues
 */
export async function safeNetworkOperation<T>(
  operation: () => Promise<T>,
  fallback?: T,
  config?: NetworkConfig
): Promise<{ success: boolean; data?: T; error?: Error }> {
  try {
    const data = await withNetworkHandling(operation, config);
    return { success: true, data };
  } catch (error: any) {
    console.warn('Network operation failed:', error.message);
    
    if (isNetworkError(error)) {
      console.warn('This appears to be a network connectivity issue. Please check your internet connection.');
    }
    
    return { 
      success: false, 
      error, 
      data: fallback 
    };
  }
}

/**
 * Batch network operations with controlled concurrency
 */
export async function batchNetworkOperations<T>(
  operations: (() => Promise<T>)[],
  concurrency: number = 3,
  config?: NetworkConfig
): Promise<Array<{ success: boolean; data?: T; error?: Error }>> {
  const results: Array<{ success: boolean; data?: T; error?: Error }> = [];
  
  for (let i = 0; i < operations.length; i += concurrency) {
    const batch = operations.slice(i, i + concurrency);
    const batchPromises = batch.map(op => safeNetworkOperation(op, undefined, config));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
} 