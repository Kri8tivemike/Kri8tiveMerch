import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './contexts/ThemeProvider';
import { AppwriteProvider } from './contexts/AppwriteContext';

// Initialize error handling system
import './utils/errorHandler';

// Import shop manager utility for testing
import './utils/createShopManager';
import './utils/debugAuth';
import './utils/imageDebug';
import './utils/imageUrlFixer';
import './utils/test-imagekit';
import './utils/appwrite-diagnostics';
import './utils/network-diagnostics';
import './utils/connectivity-fixes';
import './utils/troubleshooting-guide';
import './utils/appwrite-connectivity-fix';
import './utils/quick-connectivity-fix';
import './utils/ngrok-websocket-fix';
import { enableMockMode } from './utils/mock-products';

// Declare the React DevTools hook on Window interface
declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: any;
  }
}

// Apply initial theme before rendering to avoid FOUC
const initialThemeSetup = () => {
  if (typeof window !== 'undefined') {
    // Get stored theme or check system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Apply appropriate class to document root
    const themeMode = savedTheme === 'dark' || (!savedTheme && prefersDark) ? 'dark' : 'light';
    document.documentElement.classList.add(themeMode);
    
    // For debugging
    console.log(`Initial theme set to: ${themeMode}`);
  }
};

// Execute theme setup immediately
initialThemeSetup();

// Check if React DevTools are installed
const checkReactDevTools = () => {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    // Check if React DevTools are installed by looking for __REACT_DEVTOOLS_GLOBAL_HOOK__
    const hasDevTools = typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined';
    if (!hasDevTools) {
      console.log('%cDownload the React DevTools for a better development experience: https://reactjs.org/link/react-devtools', 
        'background: #222; color: #bada55; font-size: 14px; padding: 8px; border-radius: 4px;');
    }
  }
};

// Load debug utilities in development mode
const loadDevTools = async () => {
  if (import.meta.env.DEV) {
    checkReactDevTools();
    
    // Check for potential shipping locations permissions issues
    try {
      const { getShippingLocations } = await import('./services/shipping.service');
      const locations = await getShippingLocations();
      if (locations && locations.length > 0) {
        console.log('✅ Shipping locations service working correctly - found', locations.length, 'locations');
      } else {
        console.warn('⚠️ Shipping locations service returned empty data. Run fixShippingPermissions() in the console to set up locations.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('not authorized')) {
        console.warn('⚠️ Shipping locations permission issue detected. Run fixShippingPermissions() in the console to fix.');
      } else {
        console.error('❌ Error checking shipping locations:', error);
      }
    }
    
    console.log('Appwrite setup complete');
    
    // Enable mock mode utilities for testing
    enableMockMode();
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

// Load development tools first, then render the app
loadDevTools().then(() => {
  createRoot(rootElement).render(
    import.meta.env.DEV ? (
      <ThemeProvider>
        <AppwriteProvider>
          <App />
        </AppwriteProvider>
      </ThemeProvider>
    ) : (
      <React.StrictMode>
        <ThemeProvider>
          <AppwriteProvider>
            <App />
          </AppwriteProvider>
        </ThemeProvider>
      </React.StrictMode>
    )
  );

  // Log React DevTools installation information
  console.log(
    '%c React DevTools %c Available in two ways: %c',
    'background:#1e40af;color:white;padding:4px 0;',
    'background:#3b82f6;color:white;padding:4px 10px 4px 0;',
    'background:transparent;color:inherit;'
  );
  console.log(
    '1. Run in terminal: %cnpm run devtools',
    'font-family:monospace;color:#16a34a;font-weight:bold;'
  );
  console.log(
    '2. Install browser extension: %chttps://react.dev/learn/react-developer-tools',
    'color:#2563eb;text-decoration:underline;'
  );
});