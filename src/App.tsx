import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { PageCacheProvider } from './contexts/PageCacheContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import { setTelegramChatId } from './services/telegram.service';
import { useTheme } from './contexts/ThemeProvider';
import { logAppwriteConfig, account, verifyRoleBasedCollections } from './lib/appwrite';
import './utils/storage-setup-helper';
import { safeNetworkOperation, isNetworkError } from './lib/network-utils';
import { cleanupWishlist } from './services/profile.service';
import { checkAndShowSetupInstructions, fixMissingDatabaseFields, setupDatabaseFixes, syncAllGalleryImages } from './services/database.service';
import { setToastFunction as setUploadToastFunction } from './services/upload.service';
import { setToastFunction as setDatabaseToastFunction } from './services/database.service';
import schemaFixes from './lib/debugging/schemaFixes';

function AppContent() {
  const { theme } = useTheme();
  const [appwriteHealthy, setAppwriteHealthy] = useState<boolean | null>(null);
  const { showToast } = useToast();
  
  // Check for React DevTools
  useEffect(() => {
    // Check if React DevTools is installed (only in development mode)
    if (import.meta.env.DEV) {
      setTimeout(() => {
        // Check if React DevTools extension global hook exists
        const devToolsInstalled = !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.size;
        
        if (!devToolsInstalled) {
          console.log(
            '%c React DevTools Not Detected! %c Install for better development experience: ',
            'background:#ef4444;color:white;padding:4px;',
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
        }
      }, 2000); // Delay checking to ensure it has time to initialize
    }
  }, []);
  
  // Test connection on app start and initialize services
  useEffect(() => {
    // Initialize Telegram notification service
    const savedChatId = localStorage.getItem('telegram_chat_id');
    if (savedChatId) {
      console.log('Initializing Telegram notifications service');
      setTelegramChatId(savedChatId);
    }
  
    // Set up database fix functions in browser console
    setupDatabaseFixes();
    
    // Check Appwrite connection with better error handling
    const checkConnection = async () => {
      try {
        console.log('Testing Appwrite connection and configuration...');
        
        // Log Appwrite configuration
        logAppwriteConfig();
        
        // Verify role-based collections with network handling
        const collectionsResult = await safeNetworkOperation(
          () => verifyRoleBasedCollections(),
          false,
          { timeout: 5000, retries: 1 }
        );
        
        if (!collectionsResult.success) {
          console.warn('Could not verify collections:', collectionsResult.error?.message);
          if (isNetworkError(collectionsResult.error)) {
            console.warn('⚠️ Network connectivity issues detected. Some features may not work properly.');
            setAppwriteHealthy(false);
            return;
          }
        }
        
        // Try to get current user with network handling
        const userResult = await safeNetworkOperation(
          () => account.get(),
          null,
          { timeout: 5000, retries: 1 }
        );
        
        if (userResult.success) {
          console.log('✅ Appwrite connection successful - user is authenticated');
          setAppwriteHealthy(true);
          
          // Check and fix missing database fields
          try {
            if (localStorage.getItem('attemptDatabaseFix') !== 'false') {
              console.log('Attempting to fix missing database fields...');
              const result = await fixMissingDatabaseFields();
              console.log(result.message);
              
              // If we fixed some fields, show a toast
              if (Object.keys(result.fields).length > 0) {
                showToast(
                  result.message,
                  result.success ? 'success' : 'warning'
                );
                
                // If gallery_images field exists, try to sync all gallery images after a delay
                if (result.fields.gallery_images === true || localStorage.getItem('galleryImagesFieldExists') === 'true') {
                  console.log('Gallery images field exists, scheduling sync operation...');
                  setTimeout(async () => {
                    try {
                      const { success, failed } = await syncAllGalleryImages();
                      if (success > 0) {
                        showToast(
                          `Successfully synchronized ${success} products with gallery images`,
                          'success'
                        );
                      }
                    } catch (syncError) {
                      console.error('Error syncing gallery images:', syncError);
                    }
                  }, 5000);
                }
              }
              
              localStorage.setItem('attemptDatabaseFix', 'false'); // Don't attempt again this session
            }
          } catch (fixError) {
            console.error('Error fixing database fields:', fixError);
          }
          
          // Clean up wishlist for logged-in users
          setTimeout(() => {
            cleanupWishlist().catch(err => {
              console.warn('Background wishlist cleanup failed during app initialization:', err);
            });
          }, 3000); // Delay to avoid competing with other initialization tasks
          
          // Show setup instructions if any fields are missing
          const timeoutId = setTimeout(() => {
            checkAndShowSetupInstructions()
              .then(() => {
                console.log('Setup instructions checked');
                console.log('%cTip: You can use window.showAppwriteSetup() in the console to view database setup instructions at any time', 'color: #4ade80; font-weight: bold');
                console.log('%cTip: To fix missing database fields, run window.fixMissingDatabaseFields() in the console', 'color: #4ade80; font-weight: bold');
              })
              .catch((error: Error) => {
                console.error('Error checking setup instructions:', error);
              });
          }, 5000);

          return () => clearTimeout(timeoutId);
        } else if ((userResult.error as any)?.code === 401) {
          // If we got a 401, that's expected when not logged in, so server is reachable
          console.log('✅ Appwrite connection successful - waiting for authentication');
          setAppwriteHealthy(true);
          
          // Still check missing fields even if not logged in
          const timeoutId = setTimeout(() => {
            checkAndShowSetupInstructions()
              .then(() => {
                console.log('Setup instructions checked');
                console.log('%cTip: You can use window.showAppwriteSetup() in the console to view database setup instructions at any time', 'color: #4ade80; font-weight: bold');
              })
              .catch((error: Error) => {
                console.error('Error checking setup instructions:', error);
              });
          }, 5000);

          return () => clearTimeout(timeoutId);
        } else {
          // Network error or other issue
          console.error('❌ Error connecting to Appwrite:', userResult.error?.message);
          if (isNetworkError(userResult.error)) {
            console.warn('⚠️ Network connectivity issues detected. Please check your internet connection.');
          }
          setAppwriteHealthy(false);
        }
      } catch (error) {
        console.error('❌ Failed to check Appwrite connection:', error);
        setAppwriteHealthy(false);
      }
    };
    
    // Only run in development mode
    if (import.meta.env.DEV) {
      checkConnection();
    }
    
    // Set up periodic wishlist cleanup (every 24 hours)
    // Only run if localStorage flag is set to avoid excessive cleanup
    const lastCleanupTime = localStorage.getItem('lastWishlistCleanup');
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    if (!lastCleanupTime || (now - parseInt(lastCleanupTime)) > dayInMs) {
      console.log('Scheduling periodic wishlist cleanup');
      
      // Run cleanup after a delay
      const timerId = setTimeout(() => {
        cleanupWishlist()
          .then(() => {
            // Store last cleanup time
            localStorage.setItem('lastWishlistCleanup', now.toString());
            console.log('Periodic wishlist cleanup completed successfully');
          })
          .catch(err => {
            console.warn('Periodic wishlist cleanup failed:', err);
          });
      }, 5000);
      
      // Clear the timeout if component unmounts
      return () => clearTimeout(timerId);
    }
  }, []);

  // Initialize the toast functions when the app loads
  useEffect(() => {
    // Register the toast function with the services
    setUploadToastFunction(showToast);
    setDatabaseToastFunction(showToast);
  }, [showToast]);

  // Register schema fix utilities for console access
  useEffect(() => {
    if (import.meta.env.DEV) {
      // Make schema fixes available in the global window object
      if (typeof window !== 'undefined') {
        window.fixCustomizationSchema = schemaFixes.fixAllSchemaIssues;
        
        console.log('💡 Customization schema fix utilities now available in console:');
        console.log('  - fixCustomizationSchema() - Fix all customization schema issues');
        console.log('  - fixMaterialAttribute() - Fix material attribute specifically');
        console.log('  - fixTechniqueAttributes() - Fix technique attribute issues');
        console.log('');
        console.log('🔍 Network diagnostics available in console:');
        console.log('  - runNetworkDiagnostics() - Run comprehensive network tests');
        console.log('  - quickConnectivityCheck() - Quick Appwrite connectivity test');
        console.log('');
        console.log('🔧 Connectivity fixes available in console:');
        console.log('  - fixConnectivityIssues() - Run all connectivity fixes');
        console.log('  - fixDNSIssues() - Clear DNS cache and service workers');
        console.log('  - fixCORSIssues() - Get CORS configuration instructions');
        console.log('  - resetAppwriteClient() - Reset Appwrite client configuration');
        console.log('  - checkEnvVars() - Check environment variables');
        console.log('');
        console.log('📚 Troubleshooting guides available in console:');
        console.log('  - showTroubleshootingGuide() - Complete troubleshooting guide');
        console.log('  - showQuickFixes() - Quick fixes for common errors');
        console.log('  - showNetworkTroubleshooting() - Network-specific help');
        console.log('');
        console.log('🔍 Migration validation available in console:');
        console.log('  - validateMigration() - Check for deprecated patterns');
        console.log('  - validateCollections() - Verify role-based collections');
        console.log('  - validateEnvVars() - Check environment variables');
      }
    }
  }, []);

  return (
    <div className={`min-h-screen ${theme}`}>
      <AuthProvider>
        <CartProvider>
          <PageCacheProvider>
            <ErrorBoundary>
              <RouterProvider router={router} />
            </ErrorBoundary>
            <Toaster 
              position="top-center"
              toastOptions={{
                className: theme === 'dark' ? '!bg-dark-surface !text-dark-text' : '',
              }}
            />
          </PageCacheProvider>
        </CartProvider>
      </AuthProvider>
    </div>
  );
}

// Main App component that doesn't need theme context
function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;