/**
 * Appwrite Connectivity Fix Utility
 * Addresses "Failed to fetch" errors and network connectivity issues
 */

import { Client, Databases, Account } from 'appwrite';

// Enhanced Appwrite client with retry logic and better error handling
class AppwriteConnectivityFixer {
  private client: Client;
  private databases: Databases;
  private account: Account;
  private retryAttempts = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    this.client = new Client();
    this.setupClient();
    this.databases = new Databases(this.client);
    this.account = new Account(this.client);
  }

  private setupClient() {
    const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
    const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '67ea2c3b00309b589901';

    this.client
      .setEndpoint(endpoint)
      .setProject(projectId);
  }

  /**
   * Test basic connectivity to Appwrite
   */
  async testConnectivity(): Promise<{ success: boolean; error?: string; latency?: number }> {
    const startTime = Date.now();
    
    try {
      // Test with a simple fetch to the health endpoint instead
      const response = await fetch(`${import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'}/health`);
      const latency = Date.now() - startTime;
      
      if (response.ok) {
        console.log('✅ Appwrite connectivity test passed', { latency: `${latency}ms` });
        return { success: true, latency };
      } else {
        console.error('❌ Appwrite connectivity test failed', { status: response.status, latency: `${latency}ms` });
        return { success: false, error: `HTTP ${response.status}`, latency };
      }
    } catch (error: any) {
      const latency = Date.now() - startTime;
      console.error('❌ Appwrite connectivity test failed', { error: error.message, latency: `${latency}ms` });
      return { success: false, error: error.message, latency };
    }
  }

  /**
   * Test database connectivity
   */
  async testDatabaseConnectivity(): Promise<{ success: boolean; error?: string }> {
    try {
      const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
      // Test by listing documents from a known collection
      await this.databases.listDocuments(databaseId, 'products');
      
      console.log('✅ Database connectivity test passed');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Database connectivity test failed', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test collection connectivity
   */
  async testCollectionConnectivity(collectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
      // Use Query.limit() for proper query formatting
      await this.databases.listDocuments(databaseId, collectionId);
      
      console.log(`✅ Collection "${collectionId}" connectivity test passed`);
      return { success: true };
    } catch (error: any) {
      console.error(`❌ Collection "${collectionId}" connectivity test failed`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Retry wrapper for network operations
   */
  async withRetry<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const result = await operation();
        if (attempt > 1) {
          console.log(`✅ ${operationName} succeeded on attempt ${attempt}`);
        }
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`⚠️ ${operationName} failed on attempt ${attempt}/${this.retryAttempts}:`, error.message);
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  /**
   * Enhanced document listing with retry logic
   */
  async listDocumentsWithRetry(collectionId: string, queries: string[] = []) {
    const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
    
    return this.withRetry(
      () => this.databases.listDocuments(databaseId, collectionId, queries),
      `List documents from ${collectionId}`
    );
  }

  /**
   * Enhanced document creation with retry logic
   */
  async createDocumentWithRetry(collectionId: string, documentId: string, data: any, permissions?: string[]) {
    const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
    
    return this.withRetry(
      () => this.databases.createDocument(databaseId, collectionId, documentId, data, permissions),
      `Create document in ${collectionId}`
    );
  }

  /**
   * Enhanced document update with retry logic
   */
  async updateDocumentWithRetry(collectionId: string, documentId: string, data: any, permissions?: string[]) {
    const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
    
    return this.withRetry(
      () => this.databases.updateDocument(databaseId, collectionId, documentId, data, permissions),
      `Update document in ${collectionId}`
    );
  }

  /**
   * Enhanced document deletion with retry logic
   */
  async deleteDocumentWithRetry(collectionId: string, documentId: string) {
    const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
    
    return this.withRetry(
      () => this.databases.deleteDocument(databaseId, collectionId, documentId),
      `Delete document from ${collectionId}`
    );
  }

  /**
   * Comprehensive connectivity diagnosis
   */
  async diagnoseConnectivity(): Promise<{
    overall: boolean;
    tests: Array<{ name: string; success: boolean; error?: string; latency?: number }>;
  }> {
    console.log('🔍 Running comprehensive Appwrite connectivity diagnosis...');
    
    const tests = [];
    let overallSuccess = true;

    // Test 1: Basic connectivity
    const connectivityTest = await this.testConnectivity();
    tests.push({ name: 'Basic Connectivity', ...connectivityTest });
    if (!connectivityTest.success) overallSuccess = false;

    // Test 2: Database connectivity
    const databaseTest = await this.testDatabaseConnectivity();
    tests.push({ name: 'Database Access', ...databaseTest });
    if (!databaseTest.success) overallSuccess = false;

    // Test 3: Critical collections
    const criticalCollections = ['products', 'customers', 'shop_managers', 'super_admins', 'shipping_locations'];
    
    for (const collectionId of criticalCollections) {
      const collectionTest = await this.testCollectionConnectivity(collectionId);
      tests.push({ name: `Collection: ${collectionId}`, ...collectionTest });
      if (!collectionTest.success) overallSuccess = false;
    }

    // Summary
    console.log(overallSuccess ? '✅ All connectivity tests passed!' : '❌ Some connectivity tests failed');
    
    return { overall: overallSuccess, tests };
  }

  /**
   * Fix common connectivity issues
   */
  async fixConnectivityIssues(): Promise<void> {
    console.log('🔧 Attempting to fix connectivity issues...');

    // 1. Reset client configuration
    this.setupClient();
    console.log('✅ Client configuration reset');

    // 2. Clear any cached requests
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        console.log('✅ Service workers cleared');
      } catch (error) {
        console.warn('⚠️ Could not clear service workers:', error);
      }
    }

    // 3. Clear browser cache for Appwrite endpoints
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          if (cacheName.includes('appwrite') || cacheName.includes('cloud.appwrite.io')) {
            await caches.delete(cacheName);
          }
        }
        console.log('✅ Appwrite caches cleared');
      } catch (error) {
        console.warn('⚠️ Could not clear caches:', error);
      }
    }

    // 4. Test connectivity after fixes
    await this.diagnoseConnectivity();
  }

  /**
   * Get network information
   */
  getNetworkInfo(): any {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    
    return { message: 'Network information not available' };
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get the enhanced client instance
   */
  getClient(): Client {
    return this.client;
  }

  /**
   * Get the enhanced databases instance
   */
  getDatabases(): Databases {
    return this.databases;
  }

  /**
   * Get the enhanced account instance
   */
  getAccount(): Account {
    return this.account;
  }
}

// Create singleton instance
const appwriteConnectivityFixer = new AppwriteConnectivityFixer();

// Global functions for console access
(window as any).appwriteConnectivityFixer = {
  test: () => appwriteConnectivityFixer.testConnectivity(),
  diagnose: () => appwriteConnectivityFixer.diagnoseConnectivity(),
  fix: () => appwriteConnectivityFixer.fixConnectivityIssues(),
  networkInfo: () => appwriteConnectivityFixer.getNetworkInfo(),
  listProducts: () => appwriteConnectivityFixer.listDocumentsWithRetry('products'),
  listShippingLocations: () => appwriteConnectivityFixer.listDocumentsWithRetry('shipping_locations'),
};

console.log('🔧 Appwrite Connectivity Fixer loaded. Available commands:');
console.log('  - appwriteConnectivityFixer.test() - Test basic connectivity');
console.log('  - appwriteConnectivityFixer.diagnose() - Run full diagnosis');
console.log('  - appwriteConnectivityFixer.fix() - Attempt to fix issues');
console.log('  - appwriteConnectivityFixer.networkInfo() - Get network info');
console.log('  - appwriteConnectivityFixer.listProducts() - Test product listing');
console.log('  - appwriteConnectivityFixer.listShippingLocations() - Test shipping locations');

export default appwriteConnectivityFixer;
export { AppwriteConnectivityFixer }; 