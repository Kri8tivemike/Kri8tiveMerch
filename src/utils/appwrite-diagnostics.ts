/**
 * Appwrite Diagnostics Utility
 * 
 * This utility helps diagnose and troubleshoot Appwrite connectivity issues
 */

import { Client, Account, Databases } from 'appwrite';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

class AppwriteDiagnostics {
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

  async runDiagnostics(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // Test 1: Environment Variables
    results.push(this.checkEnvironmentVariables());

    // Test 2: Basic Network Connectivity
    results.push(await this.testNetworkConnectivity());

    // Test 3: Appwrite Service Health
    results.push(await this.testAppwriteHealth());

    // Test 4: Project Access
    results.push(await this.testProjectAccess());

    // Test 5: Database Access
    results.push(await this.testDatabaseAccess());

    // Test 6: Browser Compatibility
    results.push(this.checkBrowserCompatibility());

    return results;
  }

  private checkEnvironmentVariables(): DiagnosticResult {
    const requiredVars = [
      'VITE_APPWRITE_ENDPOINT',
      'VITE_APPWRITE_PROJECT_ID',
      'VITE_APPWRITE_DATABASE_ID'
    ];

    const missing = requiredVars.filter(varName => !import.meta.env[varName]);
    
    if (missing.length > 0) {
      return {
        test: 'Environment Variables',
        status: 'fail',
        message: `Missing required environment variables: ${missing.join(', ')}`,
        details: {
          current: {
            endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
            projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
            databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID
          },
          missing
        }
      };
    }

    return {
      test: 'Environment Variables',
      status: 'pass',
      message: 'All required environment variables are set',
      details: {
        endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
        projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
        databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID
      }
    };
  }

  private async testNetworkConnectivity(): Promise<DiagnosticResult> {
    try {
      const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
      const healthUrl = `${endpoint}/health`;
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return {
          test: 'Network Connectivity',
          status: 'pass',
          message: 'Successfully connected to Appwrite endpoint',
          details: { status: response.status, url: healthUrl }
        };
      } else {
        return {
          test: 'Network Connectivity',
          status: 'fail',
          message: `HTTP ${response.status}: ${response.statusText}`,
          details: { status: response.status, url: healthUrl }
        };
      }
    } catch (error) {
      return {
        test: 'Network Connectivity',
        status: 'fail',
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : error }
      };
    }
  }

  private async testAppwriteHealth(): Promise<DiagnosticResult> {
    try {
      const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
      const healthUrl = `${endpoint}/health`;
      
      const response = await fetch(healthUrl);
      const data = await response.json();

      if (data.status === 'OK') {
        return {
          test: 'Appwrite Service Health',
          status: 'pass',
          message: 'Appwrite services are healthy',
          details: data
        };
      } else {
        return {
          test: 'Appwrite Service Health',
          status: 'warning',
          message: 'Appwrite services may be experiencing issues',
          details: data
        };
      }
    } catch (error) {
      return {
        test: 'Appwrite Service Health',
        status: 'fail',
        message: `Failed to check Appwrite health: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : error }
      };
    }
  }

  private async testProjectAccess(): Promise<DiagnosticResult> {
    try {
      // Try to get account info (this will work even without authentication)
      await this.account.get();
      
      return {
        test: 'Project Access',
        status: 'pass',
        message: 'Successfully accessed Appwrite project',
        details: { authenticated: true }
      };
    } catch (error: any) {
      // 401 is expected if not logged in, but means project access is working
      if (error?.code === 401) {
        return {
          test: 'Project Access',
          status: 'pass',
          message: 'Project access working (not authenticated)',
          details: { authenticated: false, expectedError: true }
        };
      }

      return {
        test: 'Project Access',
        status: 'fail',
        message: `Project access failed: ${error?.message || 'Unknown error'}`,
        details: { 
          error: error?.message || error,
          code: error?.code,
          type: error?.type
        }
      };
    }
  }

  private async testDatabaseAccess(): Promise<DiagnosticResult> {
    try {
      const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      const productsCollectionId = import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID;

      if (!databaseId || !productsCollectionId) {
        return {
          test: 'Database Access',
          status: 'fail',
          message: 'Missing database or collection ID in environment variables',
          details: { databaseId, productsCollectionId }
        };
      }

      // Try to list documents (this will fail with permissions error if not authenticated, but means database is accessible)
      await this.databases.listDocuments(databaseId, productsCollectionId);
      
      return {
        test: 'Database Access',
        status: 'pass',
        message: 'Successfully accessed database and collections',
        details: { databaseId, productsCollectionId }
      };
    } catch (error: any) {
      // 401 is expected if not logged in, but means database access is working
      if (error?.code === 401) {
        return {
          test: 'Database Access',
          status: 'pass',
          message: 'Database access working (authentication required)',
          details: { authenticated: false, expectedError: true }
        };
      }

      return {
        test: 'Database Access',
        status: 'fail',
        message: `Database access failed: ${error?.message || 'Unknown error'}`,
        details: { 
          error: error?.message || error,
          code: error?.code,
          type: error?.type
        }
      };
    }
  }

  private checkBrowserCompatibility(): DiagnosticResult {
    const issues: string[] = [];

    // Check for fetch API
    if (typeof fetch === 'undefined') {
      issues.push('Fetch API not supported');
    }

    // Check for localStorage
    if (typeof localStorage === 'undefined') {
      issues.push('localStorage not supported');
    }

    // Check for Promise
    if (typeof Promise === 'undefined') {
      issues.push('Promise not supported');
    }

    // Check for modern JavaScript features
    try {
      // Test arrow functions and const
      const test = () => 'test';
      if (test() !== 'test') {
        issues.push('Modern JavaScript features not supported');
      }
    } catch {
      issues.push('Modern JavaScript features not supported');
    }

    if (issues.length > 0) {
      return {
        test: 'Browser Compatibility',
        status: 'fail',
        message: `Browser compatibility issues: ${issues.join(', ')}`,
        details: { issues, userAgent: navigator.userAgent }
      };
    }

    return {
      test: 'Browser Compatibility',
      status: 'pass',
      message: 'Browser is compatible with Appwrite SDK',
      details: { userAgent: navigator.userAgent }
    };
  }

  // Quick fixes
  async quickFix(): Promise<void> {
    console.log('🔧 Running Appwrite Quick Fix...');
    
    // Clear any cached data that might be causing issues
    try {
      localStorage.removeItem('appwrite-session');
      localStorage.removeItem('appwrite-fallback');
      console.log('✅ Cleared cached session data');
    } catch (error) {
      console.warn('⚠️ Could not clear session data:', error);
    }

    // Clear browser cache for Appwrite endpoints
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        const appwriteCaches = cacheNames.filter(name => 
          name.includes('appwrite') || name.includes('cloud.appwrite.io')
        );
        
        for (const cacheName of appwriteCaches) {
          await caches.delete(cacheName);
        }
        
        if (appwriteCaches.length > 0) {
          console.log('✅ Cleared Appwrite-related caches');
        }
      } catch (error) {
        console.warn('⚠️ Could not clear caches:', error);
      }
    }

    console.log('🔧 Quick fix completed. Please refresh the page.');
  }
}

// Create global instance
const diagnostics = new AppwriteDiagnostics();

// Export for use in console
(window as any).appwriteDiagnostics = {
  run: () => diagnostics.runDiagnostics(),
  quickFix: () => diagnostics.quickFix(),
  test: async () => {
    console.log('🔍 Running Appwrite Diagnostics...');
    const results = await diagnostics.runDiagnostics();
    
    console.log('\n📊 Diagnostic Results:');
    console.log('='.repeat(50));
    
    results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${result.test}: ${result.message}`);
      
      if (result.details) {
        console.log('   Details:', result.details);
      }
    });
    
    const failedTests = results.filter(r => r.status === 'fail');
    if (failedTests.length > 0) {
      console.log('\n🔧 Suggested Actions:');
      console.log('- Run appwriteDiagnostics.quickFix() to clear cached data');
      console.log('- Check your internet connection');
      console.log('- Verify Appwrite project settings in console');
      console.log('- Check browser developer tools for CORS errors');
    } else {
      console.log('\n✅ All tests passed! Appwrite should be working correctly.');
    }
    
    return results;
  }
};

export default diagnostics; 