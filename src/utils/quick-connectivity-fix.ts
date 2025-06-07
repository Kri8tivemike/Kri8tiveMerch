/**
 * Quick Connectivity Fix Script
 * Run this in the browser console to fix "Failed to fetch" errors
 */

// Quick fix function that can be called from console
async function quickFixAppwriteConnectivity() {
  console.log('🔧 Running Quick Appwrite Connectivity Fix...');
  
  try {
    // 1. Clear browser caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
      }
      console.log('✅ Browser caches cleared');
    }

    // 2. Clear service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      console.log('✅ Service workers cleared');
    }

    // 3. Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Local storage cleared');

    // 4. Force reload the page
    console.log('🔄 Reloading page to apply fixes...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);

  } catch (error) {
    console.error('❌ Error during quick fix:', error);
  }
}

// Alternative fix without page reload
async function quickFixWithoutReload() {
  console.log('🔧 Running Quick Fix (without reload)...');
  
  try {
    // 1. Test current connectivity
    const response = await fetch('https://cloud.appwrite.io/v1/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('✅ Appwrite endpoint is reachable');
      
      // 2. Test your specific project
      const projectResponse = await fetch(`https://cloud.appwrite.io/v1/databases/kri8tive_db`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': '67ea2c3b00309b589901',
        },
      });
      
      if (projectResponse.ok) {
        console.log('✅ Your Appwrite project is accessible');
      } else {
        console.error('❌ Project access failed:', projectResponse.status, projectResponse.statusText);
      }
    } else {
      console.error('❌ Appwrite endpoint not reachable:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Network connectivity test failed:', error);
    console.log('💡 This suggests a network connectivity issue. Try:');
    console.log('   1. Check your internet connection');
    console.log('   2. Disable VPN if using one');
    console.log('   3. Try a different network');
    console.log('   4. Check if your firewall is blocking the connection');
  }
}

// Network diagnostics
function runNetworkDiagnostics() {
  console.log('🔍 Running Network Diagnostics...');
  
  // Check network connection
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (connection) {
    console.log('📶 Network Info:', {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink + ' Mbps',
      rtt: connection.rtt + ' ms',
      saveData: connection.saveData
    });
  }
  
  // Check if online
  console.log('🌐 Online Status:', navigator.onLine ? 'Online' : 'Offline');
  
  // Check current URL
  console.log('🔗 Current URL:', window.location.href);
  
  // Check environment variables
  console.log('⚙️ Environment Check:', {
    endpoint: import.meta.env?.VITE_APPWRITE_ENDPOINT || 'Not set',
    projectId: import.meta.env?.VITE_APPWRITE_PROJECT_ID || 'Not set',
    databaseId: import.meta.env?.VITE_APPWRITE_DATABASE_ID || 'Not set'
  });
}

// Make functions available globally
(window as any).quickFixAppwriteConnectivity = quickFixAppwriteConnectivity;
(window as any).quickFixWithoutReload = quickFixWithoutReload;
(window as any).runNetworkDiagnostics = runNetworkDiagnostics;

console.log('🚀 Quick Connectivity Fix loaded! Available commands:');
console.log('   quickFixAppwriteConnectivity() - Full fix with page reload');
console.log('   quickFixWithoutReload() - Test connectivity without reload');
console.log('   runNetworkDiagnostics() - Check network status');

export { quickFixAppwriteConnectivity, quickFixWithoutReload, runNetworkDiagnostics }; 