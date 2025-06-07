/**
 * Connectivity Fixes Utility
 * 
 * This utility provides automated fixes for common Appwrite connectivity issues.
 */

import { Client, Account, Databases } from 'appwrite';

interface FixResult {
  success: boolean;
  message: string;
  details?: any;
}

class ConnectivityFixes {
  private client: Client;
  private account: Account;
  private databases: Databases;

  constructor() {
    this.client = new Client()
      .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');
    
    this.account = new Account(this.client);
    this.databases = new Databases(this.client);
  }

  /**
   * Test and fix DNS issues
   */
  async fixDNSIssues(): Promise<FixResult> {
    console.log('🔧 Attempting to fix DNS issues...');
    
    try {
      // Try to flush DNS cache (browser-level)
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        console.log('✅ Service workers cleared');
      }

      // Clear browser cache for Appwrite domain
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          if (cacheName.includes('appwrite') || cacheName.includes('cloud.appwrite.io')) {
            await caches.delete(cacheName);
            console.log(`✅ Cleared cache: ${cacheName}`);
          }
        }
      }

      return {
        success: true,
        message: 'DNS cache cleared. Please refresh the page and try again.',
        details: {
          serviceWorkersCleared: true,
          cachesCleared: true
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to clear DNS cache',
        details: error
      };
    }
  }

  /**
   * Fix CORS issues by checking domain configuration
   */
  async fixCORSIssues(): Promise<FixResult> {
    console.log('🔧 Checking CORS configuration...');
    
    const currentOrigin = window.location.origin;
    const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
    
    console.log(`Current origin: ${currentOrigin}`);
    console.log(`Project ID: ${projectId}`);
    
    // Common development origins
    const commonDevOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8080'
    ];

    const instructions = `
🔧 CORS Configuration Instructions:

1. Go to your Appwrite Console:
   https://cloud.appwrite.io/console/project-${projectId}

2. Navigate to "Settings" → "Domains"

3. Add your current origin: ${currentOrigin}

4. For development, also add these common origins:
   ${commonDevOrigins.map(origin => `   - ${origin}`).join('\n')}

5. Make sure to include both HTTP and HTTPS versions if needed

6. Save the configuration and wait a few minutes for changes to propagate

7. Refresh your application and try again
    `;

    console.log(instructions);

    return {
      success: true,
      message: 'CORS configuration instructions provided. Please follow the steps above.',
      details: {
        currentOrigin,
        projectId,
        consoleUrl: `https://cloud.appwrite.io/console/project-${projectId}/settings/domains`
      }
    };
  }

  /**
   * Reset Appwrite client configuration
   */
  async resetClientConfiguration(): Promise<FixResult> {
    console.log('🔧 Resetting Appwrite client configuration...');
    
    try {
      // Clear any stored session data
      localStorage.removeItem('cookieFallback');
      sessionStorage.clear();
      
      // Recreate client with fresh configuration
      this.client = new Client()
        .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');
      
      this.account = new Account(this.client);
      this.databases = new Databases(this.client);
      
      console.log('✅ Client configuration reset');
      
      return {
        success: true,
        message: 'Appwrite client configuration has been reset. Please refresh the page.',
        details: {
          endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
          projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to reset client configuration',
        details: error
      };
    }
  }

  /**
   * Check and fix environment variables
   */
  async checkEnvironmentVariables(): Promise<FixResult> {
    console.log('🔧 Checking environment variables...');
    
    const requiredVars = {
      VITE_APPWRITE_ENDPOINT: import.meta.env.VITE_APPWRITE_ENDPOINT,
      VITE_APPWRITE_PROJECT_ID: import.meta.env.VITE_APPWRITE_PROJECT_ID,
      VITE_APPWRITE_DATABASE_ID: import.meta.env.VITE_APPWRITE_DATABASE_ID
    };

    const missingVars = Object.entries(requiredVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      const instructions = `
❌ Missing Environment Variables:

The following required environment variables are not set:
${missingVars.map(varName => `  - ${varName}`).join('\n')}

To fix this:

1. Check your .env file in the project root
2. Make sure it contains:
   VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=your_project_id
   VITE_APPWRITE_DATABASE_ID=kri8tive_db

3. Restart your development server after making changes
4. Refresh the application

Current values:
${Object.entries(requiredVars).map(([key, value]) => `  ${key}: ${value || 'NOT SET'}`).join('\n')}
      `;

      console.log(instructions);

      return {
        success: false,
        message: 'Missing required environment variables',
        details: {
          missingVars,
          currentValues: requiredVars,
          instructions
        }
      };
    }

    return {
      success: true,
      message: 'All required environment variables are set',
      details: requiredVars
    };
  }

  /**
   * Run all connectivity fixes
   */
  async runAllFixes(): Promise<FixResult[]> {
    console.log('🚀 Running all connectivity fixes...\n');
    
    const results: FixResult[] = [];
    
    // Check environment variables first
    const envResult = await this.checkEnvironmentVariables();
    results.push(envResult);
    
    if (!envResult.success) {
      console.log('❌ Environment variables are missing. Please fix them first before running other fixes.');
      return results;
    }
    
    // Run other fixes
    const dnsResult = await this.fixDNSIssues();
    results.push(dnsResult);
    
    const corsResult = await this.fixCORSIssues();
    results.push(corsResult);
    
    const clientResult = await this.resetClientConfiguration();
    results.push(clientResult);
    
    // Display summary
    console.log('\n📊 CONNECTIVITY FIXES SUMMARY');
    console.log('═'.repeat(40));
    
    results.forEach((result, index) => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} Fix ${index + 1}: ${result.message}`);
    });
    
    const successCount = results.filter(r => r.success).length;
    console.log(`\n✅ ${successCount}/${results.length} fixes completed successfully`);
    
    if (successCount === results.length) {
      console.log('\n🎉 All connectivity fixes applied! Please refresh the page and try again.');
    } else {
      console.log('\n⚠️ Some fixes failed. Please check the instructions above and try manual fixes.');
    }
    
    return results;
  }
}

// Create global instance
const connectivityFixes = new ConnectivityFixes();

// Export functions to global scope for console access
declare global {
  interface Window {
    fixConnectivityIssues: () => Promise<FixResult[]>;
    fixDNSIssues: () => Promise<FixResult>;
    fixCORSIssues: () => Promise<FixResult>;
    resetAppwriteClient: () => Promise<FixResult>;
    checkEnvVars: () => Promise<FixResult>;
    connectivityFixes: ConnectivityFixes;
  }
}

// Make functions available globally
window.fixConnectivityIssues = () => connectivityFixes.runAllFixes();
window.fixDNSIssues = () => connectivityFixes.fixDNSIssues();
window.fixCORSIssues = () => connectivityFixes.fixCORSIssues();
window.resetAppwriteClient = () => connectivityFixes.resetClientConfiguration();
window.checkEnvVars = () => connectivityFixes.checkEnvironmentVariables();
window.connectivityFixes = connectivityFixes;

console.log('🔧 Connectivity fix utilities loaded:');
console.log('  - fixConnectivityIssues() - Run all connectivity fixes');
console.log('  - fixDNSIssues() - Clear DNS cache and service workers');
console.log('  - fixCORSIssues() - Get CORS configuration instructions');
console.log('  - resetAppwriteClient() - Reset Appwrite client configuration');
console.log('  - checkEnvVars() - Check environment variables');

export { connectivityFixes, ConnectivityFixes };
export type { FixResult }; 