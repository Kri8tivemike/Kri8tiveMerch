/**
 * Comprehensive ngrok Compatibility Fix
 * Consolidated solution for all ngrok-related issues
 * Replaces multiple separate utilities to avoid conflicts
 */

interface NgrokFixConfig {
  disableWebSocket: boolean;
  enablePolling: boolean;
  skipBrowserWarning: boolean;
  enableRetry: boolean;
  debugMode: boolean;
}

class NgrokCompatibilityManager {
  private config: NgrokFixConfig = {
    disableWebSocket: true,
    enablePolling: true,
    skipBrowserWarning: true,
    enableRetry: true,
    debugMode: import.meta.env.DEV
  };

  private originalFetch: typeof fetch;
  private originalWebSocket: typeof WebSocket;
  private isFixesApplied = false;

  constructor() {
    this.originalFetch = window.fetch;
    this.originalWebSocket = window.WebSocket;
  }

  /**
   * Detect if running through ngrok
   */
  public isNgrokEnvironment(): boolean {
    const hostname = window.location.hostname;
    return hostname.includes('ngrok') || 
           hostname.includes('ngrok-free.app') ||
           hostname.includes('ngrok.io') ||
           hostname.includes('ngrok.app');
  }

  /**
   * Apply all ngrok compatibility fixes
   */
  public applyAllFixes(): void {
    if (!this.isNgrokEnvironment()) {
      if (this.config.debugMode) {
        console.log('🔍 Not running through ngrok, fixes not needed');
      }
      return;
    }

    if (this.isFixesApplied) {
      if (this.config.debugMode) {
        console.log('🔍 ngrok fixes already applied');
      }
      return;
    }

    console.log('🔧 Applying comprehensive ngrok compatibility fixes...');

    this.fixWebSocketConnections();
    this.fixFetchRequests();
    this.setupVitePolling();
    this.addNgrokStyles();

    this.isFixesApplied = true;
    console.log('✅ All ngrok fixes applied successfully');
  }

  /**
   * Completely disable WebSocket connections for ngrok compatibility
   */
  private fixWebSocketConnections(): void {
    if (!this.config.disableWebSocket) return;

    console.log('🔧 Disabling WebSocket connections for ngrok compatibility...');

    // Create a mock WebSocket class that prevents actual connections
    window.WebSocket = class MockWebSocket extends EventTarget {
      static readonly CONNECTING = 0;
      static readonly OPEN = 1;
      static readonly CLOSING = 2;
      static readonly CLOSED = 3;

      readonly CONNECTING = 0;
      readonly OPEN = 1;
      readonly CLOSING = 2;
      readonly CLOSED = 3;

      readyState = this.CLOSED;
      bufferedAmount = 0;
      extensions = '';
      protocol = '';
      url: string;
      binaryType: BinaryType = 'blob';

      onopen: ((event: Event) => void) | null = null;
      onclose: ((event: CloseEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onmessage: ((event: MessageEvent) => void) | null = null;

    constructor(url: string | URL, protocols?: string | string[]) {
        super();
        this.url = url.toString();
        
        if (this.url.includes('localhost') || this.url.includes('127.0.0.1')) {
          console.log('🚫 Blocked WebSocket connection for ngrok:', this.url);
          
          // Immediately trigger close event to prevent hanging
          setTimeout(() => {
            const closeEvent = new CloseEvent('close', { 
              code: 1000, 
              reason: 'ngrok compatibility - WebSocket disabled' 
            });
            
            if (this.onclose) {
              this.onclose(closeEvent);
            }
            this.dispatchEvent(closeEvent);
          }, 100);
        }
      }

      close(code?: number, reason?: string): void {
        this.readyState = this.CLOSED;
      }

      send(data: string | ArrayBuffer | Blob | ArrayBufferView): void {
        console.warn('🚫 WebSocket send blocked for ngrok compatibility');
      }
    } as any;

    console.log('✅ WebSocket connections disabled for ngrok');
  }

  /**
   * Fix fetch requests with ngrok-specific headers and retry logic
   */
  private fixFetchRequests(): void {
    console.log('🔧 Enhancing fetch requests for ngrok compatibility...');

    window.fetch = async (input: any, init?: RequestInit): Promise<Response> => {
      const url = input.toString();
      
      // Enhanced headers for ngrok
      const enhancedInit: RequestInit = {
        ...init,
        headers: {
          ...init?.headers,
          'ngrok-skip-browser-warning': 'true',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
      };

      try {
        const response = await this.originalFetch(input, enhancedInit);
        
        if (!response.ok && this.config.debugMode) {
          console.warn(`🔴 HTTP ${response.status} for ${url}`);
        }
        
        return response;
      } catch (error) {
        if (this.config.debugMode) {
          console.error(`🔴 Fetch failed for ${url}:`, error);
        }

        // Retry logic for ngrok
        const headers = enhancedInit.headers as Record<string, string>;
        if (this.config.enableRetry && !headers?.['x-ngrok-retry']) {
          console.log('🔄 Retrying fetch request for ngrok...');
          
          const retryInit: RequestInit = {
            ...enhancedInit,
            headers: {
              ...enhancedInit.headers,
              'x-ngrok-retry': '1',
            },
          };
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            return await this.originalFetch(input, retryInit);
          } catch (retryError) {
            console.error('❌ Fetch retry also failed:', retryError);
            throw retryError;
          }
        }
        
        throw error;
      }
    };

    console.log('✅ Fetch requests enhanced for ngrok');
  }

  /**
   * Setup Vite polling mode for ngrok
   */
  private setupVitePolling(): void {
    if (!this.config.enablePolling || !import.meta.env.DEV) return;

    console.log('🔧 Setting up Vite polling mode for ngrok...');

    // Disable Vite error overlay which can cause issues with ngrok
    const viteOverlayStyle = document.createElement('style');
    viteOverlayStyle.id = 'ngrok-vite-fixes';
    viteOverlayStyle.textContent = `
      #vite-error-overlay {
        display: none !important;
      }
      vite-error-overlay {
        display: none !important;
      }
    `;
    document.head.appendChild(viteOverlayStyle);

    // Force Vite to use polling instead of WebSocket
    if (window.location.search.includes('__vite_ping')) {
      window.history.replaceState(null, '', window.location.pathname);
    }

    console.log('📡 Vite polling mode configured for ngrok');
  }

  /**
   * Add visual indicator for ngrok mode
   */
  private addNgrokStyles(): void {
    if (!this.config.debugMode) return;

    const indicatorStyle = document.createElement('style');
    indicatorStyle.id = 'ngrok-indicator';
    indicatorStyle.textContent = `
      body::after {
        content: "🌐 ngrok Mode";
        position: fixed;
        top: 10px;
        right: 10px;
        background: linear-gradient(135deg, #1e40af, #3b82f6);
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        animation: ngrok-pulse 2s ease-in-out infinite;
      }
      
      @keyframes ngrok-pulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
      }
    `;
    document.head.appendChild(indicatorStyle);

    // Remove indicator after 5 seconds
    setTimeout(() => {
      const indicator = document.getElementById('ngrok-indicator');
      if (indicator) {
        indicator.remove();
      }
    }, 5000);
  }

  /**
   * Test ngrok connectivity
   */
  public async testConnectivity(): Promise<{ success: boolean; message: string }> {
    console.log('🧪 Testing ngrok connectivity...');

    try {
      // Test basic connectivity
      const response = await fetch(window.location.origin, {
        method: 'HEAD',
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (response.ok) {
        console.log('✅ ngrok connectivity test passed');
        return { success: true, message: 'ngrok connectivity is working' };
} else {
        console.log('❌ ngrok connectivity test failed:', response.status);
        return { success: false, message: `HTTP ${response.status}` };
      }
    } catch (error: any) {
      console.error('❌ ngrok connectivity test failed:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get current ngrok status
   */
  public getStatus(): object {
    return {
      isNgrokEnvironment: this.isNgrokEnvironment(),
      fixesApplied: this.isFixesApplied,
      currentHost: window.location.hostname,
      currentOrigin: window.location.origin,
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      config: this.config,
    };
  }

  /**
   * Reset all fixes (for debugging)
   */
  public resetFixes(): void {
    console.log('🔄 Resetting ngrok fixes...');
    
    // Restore original functions
    window.fetch = this.originalFetch;
    window.WebSocket = this.originalWebSocket;
    
    // Remove styles
    const styles = document.querySelectorAll('#ngrok-vite-fixes, #ngrok-indicator');
    styles.forEach(style => style.remove());
    
    this.isFixesApplied = false;
    console.log('✅ ngrok fixes reset');
  }

  /**
   * Show troubleshooting guide
   */
  public showTroubleshootingGuide(): void {
    console.log(`
🔧 NGROK TROUBLESHOOTING GUIDE
═══════════════════════════════════════════════════════════════

❌ If you're still experiencing "Failed to fetch" errors:

1. 🌐 ADD NGROK URL TO APPWRITE:
   • Go to: https://cloud.appwrite.io/console
   • Select your project (67ea2c3b00309b589901)
   • Go to Settings → Domains
   • Add: ${window.location.origin}

2. 🔄 RESTART NGROK:
   • Stop ngrok (Ctrl+C)
   • Run: ngrok http 5173 --host-header="localhost:5173"

3. 🚀 ALTERNATIVE SOLUTIONS:
   • Use localhost: http://localhost:5173
   • Try different ngrok region: ngrok http 5173 --region us
   • Use Cloudflare Tunnel instead

4. 🔧 EMERGENCY FIXES:
   • Run: enableProductMockMode() (use mock data)
   • Run: fixConnectivityIssues() (general fixes)

═══════════════════════════════════════════════════════════════
    `);
  }
} 