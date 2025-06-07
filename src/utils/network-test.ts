/**
 * Network Connectivity Test Utility
 * Helps diagnose Appwrite connection issues
 */

import { account, databases } from '../lib/appwrite';
import { safeNetworkOperation, isNetworkError } from '../lib/network-utils';

export interface NetworkTestResult {
  test: string;
  success: boolean;
  message: string;
  duration?: number;
  error?: any;
}

/**
 * Test basic internet connectivity
 */
async function testInternetConnectivity(): Promise<NetworkTestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://httpbin.org/get', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      return {
        test: 'Internet Connectivity',
        success: true,
        message: 'Internet connection is working',
        duration
      };
    } else {
      return {
        test: 'Internet Connectivity',
        success: false,
        message: `HTTP error: ${response.status}`,
        duration
      };
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      test: 'Internet Connectivity',
      success: false,
      message: `Connection failed: ${error.message}`,
      duration,
      error
    };
  }
}

/**
 * Test Appwrite Cloud connectivity
 */
async function testAppwriteConnectivity(): Promise<NetworkTestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://cloud.appwrite.io/v1/health', {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      return {
        test: 'Appwrite Cloud Connectivity',
        success: true,
        message: 'Appwrite Cloud is reachable',
        duration
      };
    } else {
      return {
        test: 'Appwrite Cloud Connectivity',
        success: false,
        message: `Appwrite Cloud returned: ${response.status}`,
        duration
      };
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      test: 'Appwrite Cloud Connectivity',
      success: false,
      message: `Cannot reach Appwrite Cloud: ${error.message}`,
      duration,
      error
    };
  }
}

/**
 * Test Appwrite account service
 */
async function testAppwriteAccount(): Promise<NetworkTestResult> {
  const result = await safeNetworkOperation(
    async () => {
      const startTime = Date.now();
      try {
        await account.get();
        return { duration: Date.now() - startTime, authenticated: true };
      } catch (error: any) {
        if (error.code === 401) {
          return { duration: Date.now() - startTime, authenticated: false };
        }
        throw error;
      }
    },
    undefined,
    { timeout: 10000, retries: 1 }
  );

  if (result.success) {
    return {
      test: 'Appwrite Account Service',
      success: true,
      message: result.data?.authenticated 
        ? 'Account service working - user authenticated' 
        : 'Account service working - no user session',
      duration: result.data?.duration
    };
  } else {
    return {
      test: 'Appwrite Account Service',
      success: false,
      message: `Account service failed: ${result.error?.message}`,
      error: result.error
    };
  }
}

/**
 * Test Appwrite database connectivity
 */
async function testAppwriteDatabase(): Promise<NetworkTestResult> {
  const result = await safeNetworkOperation(
    async () => {
      const startTime = Date.now();
      const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
      
      // Try to list documents from customers collection
      const response = await databases.listDocuments(databaseId, 'customers', []);
      return { 
        duration: Date.now() - startTime, 
        documentCount: response.documents.length 
      };
    },
    undefined,
    { timeout: 10000, retries: 1 }
  );

  if (result.success) {
    return {
      test: 'Appwrite Database Service',
      success: true,
      message: `Database accessible - found ${result.data?.documentCount} customer records`,
      duration: result.data?.duration
    };
  } else {
    return {
      test: 'Appwrite Database Service',
      success: false,
      message: `Database access failed: ${result.error?.message}`,
      error: result.error
    };
  }
}

/**
 * Run comprehensive network diagnostics
 */
export async function runNetworkDiagnostics(): Promise<NetworkTestResult[]> {
  console.log('🔍 Running network diagnostics...');
  
  const tests = [
    testInternetConnectivity,
    testAppwriteConnectivity,
    testAppwriteAccount,
    testAppwriteDatabase
  ];

  const results: NetworkTestResult[] = [];

  for (const test of tests) {
    console.log(`Running ${test.name}...`);
    try {
      const result = await test();
      results.push(result);
      
      if (result.success) {
        console.log(`✅ ${result.test}: ${result.message} (${result.duration}ms)`);
      } else {
        console.log(`❌ ${result.test}: ${result.message}`);
        if (isNetworkError(result.error)) {
          console.log('   This appears to be a network connectivity issue');
        }
      }
    } catch (error: any) {
      const result: NetworkTestResult = {
        test: test.name,
        success: false,
        message: `Test failed: ${error.message}`,
        error
      };
      results.push(result);
      console.log(`❌ ${result.test}: ${result.message}`);
    }
  }

  // Summary
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`\n📊 Network Diagnostics Summary: ${successful}/${total} tests passed`);
  
  if (successful === total) {
    console.log('✅ All network tests passed - your connection to Appwrite is working properly');
  } else {
    console.log('⚠️ Some network tests failed - this may indicate connectivity issues');
    
    const failedTests = results.filter(r => !r.success);
    console.log('Failed tests:', failedTests.map(t => t.test).join(', '));
  }

  return results;
}

/**
 * Quick connectivity check
 */
export async function quickConnectivityCheck(): Promise<boolean> {
  try {
    const result = await testAppwriteConnectivity();
    return result.success;
  } catch {
    return false;
  }
}

// Make diagnostics available globally for console access
if (typeof window !== 'undefined') {
  (window as any).runNetworkDiagnostics = runNetworkDiagnostics;
  (window as any).quickConnectivityCheck = quickConnectivityCheck;
} 