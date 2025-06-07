/**
 * Network Diagnostics Utility
 * 
 * This utility helps diagnose and resolve network connectivity issues with Appwrite.
 * It provides comprehensive testing and troubleshooting tools.
 */

import { Client, Account, Databases } from 'appwrite';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

class NetworkDiagnostics {
  private client: Client;
  private account: Account;
  private databases: Databases;
  private results: DiagnosticResult[] = [];

  constructor() {
    this.client = new Client()
      .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');
    
    this.account = new Account(this.client);
    this.databases = new Databases(this.client);
  }

  /**
   * Add a diagnostic result
   */
  private addResult(test: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any) {
    this.results.push({ test, status, message, details });
  }

  /**
   * Test basic network connectivity
   */
  async testBasicConnectivity(): Promise<boolean> {
    console.log('🔍 Testing basic network connectivity...');
    
    try {
      // Test if we can reach the internet
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      this.addResult('Internet Connectivity', 'pass', 'Internet connection is working');
      return true;
    } catch (error) {
      this.addResult('Internet Connectivity', 'fail', 'No internet connection detected', error);
      return false;
    }
  }

  /**
   * Test Appwrite endpoint accessibility
   */
  async testAppwriteEndpoint(): Promise<boolean> {
    console.log('🔍 Testing Appwrite endpoint accessibility...');
    
    const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
    
    try {
      const response = await fetch(endpoint + '/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.addResult('Appwrite Endpoint', 'pass', `Appwrite endpoint is accessible (${response.status})`, data);
        return true;
      } else {
        this.addResult('Appwrite Endpoint', 'warning', `Appwrite endpoint returned ${response.status}`, {
          status: response.status,
          statusText: response.statusText
        });
        return false;
      }
    } catch (error) {
      this.addResult('Appwrite Endpoint', 'fail', 'Cannot reach Appwrite endpoint', error);
      return false;
    }
  }

  /**
   * Test project configuration
   */
  async testProjectConfig(): Promise<boolean> {
    console.log('🔍 Testing project configuration...');
    
    const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
    const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
    const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

    if (!projectId) {
      this.addResult('Project Config', 'fail', 'VITE_APPWRITE_PROJECT_ID is not set');
      return false;
    }

    if (!endpoint) {
      this.addResult('Project Config', 'fail', 'VITE_APPWRITE_ENDPOINT is not set');
      return false;
    }

    if (!databaseId) {
      this.addResult('Project Config', 'fail', 'VITE_APPWRITE_DATABASE_ID is not set');
      return false;
    }

    this.addResult('Project Config', 'pass', 'All required environment variables are set', {
      projectId,
      endpoint,
      databaseId
    });
    return true;
  }

  /**
   * Test CORS and browser restrictions
   */
  async testCORS(): Promise<boolean> {
    console.log('🔍 Testing CORS configuration...');
    
    try {
      // Try to make a simple request to test CORS
      const response = await fetch(import.meta.env.VITE_APPWRITE_ENDPOINT + '/account', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': import.meta.env.VITE_APPWRITE_PROJECT_ID
        }
      });

      if (response.status === 401) {
        // 401 is expected for unauthenticated requests, but it means CORS is working
        this.addResult('CORS Configuration', 'pass', 'CORS is properly configured');
        return true;
      } else if (response.ok) {
        this.addResult('CORS Configuration', 'pass', 'CORS is working and user might be authenticated');
        return true;
      } else {
        this.addResult('CORS Configuration', 'warning', `Unexpected response: ${response.status}`, {
          status: response.status,
          statusText: response.statusText
        });
        return false;
      }
    } catch (error: any) {
      if (error.message.includes('CORS')) {
        this.addResult('CORS Configuration', 'fail', 'CORS policy is blocking requests', error);
        return false;
      } else {
        this.addResult('CORS Configuration', 'fail', 'Network error during CORS test', error);
        return false;
      }
    }
  }

  /**
   * Test database connectivity
   */
  async testDatabaseConnectivity(): Promise<boolean> {
    console.log('🔍 Testing database connectivity...');
    
    try {
      // Try to list documents from a known collection (this will fail with 401 if not authenticated, but that's OK)
      const documents = await this.databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db',
        'products'
      );
      
      this.addResult('Database Connectivity', 'pass', `Database is accessible (${documents.total} documents found)`, {
        documentsCount: documents.total
      });
      return true;
    } catch (error: any) {
      if (error.code === 401) {
        this.addResult('Database Connectivity', 'pass', 'Database is accessible (authentication required for full access)');
        return true;
      } else {
        this.addResult('Database Connectivity', 'fail', 'Cannot connect to database', error);
        return false;
      }
    }
  }

  /**
   * Test DNS resolution
   */
  async testDNSResolution(): Promise<boolean> {
    console.log('🔍 Testing DNS resolution...');
    
    try {
      // Test if we can resolve cloud.appwrite.io
      const response = await fetch('https://cloud.appwrite.io', { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      this.addResult('DNS Resolution', 'pass', 'DNS resolution is working for cloud.appwrite.io');
      return true;
    } catch (error) {
      this.addResult('DNS Resolution', 'fail', 'DNS resolution failed for cloud.appwrite.io', error);
      return false;
    }
  }

  /**
   * Run comprehensive diagnostics
   */
  async runComprehensiveDiagnostics(): Promise<DiagnosticResult[]> {
    console.log('🚀 Starting comprehensive network diagnostics...\n');
    
    this.results = []; // Clear previous results
    
    // Run all tests
    await this.testBasicConnectivity();
    await this.testDNSResolution();
    await this.testAppwriteEndpoint();
    await this.testProjectConfig();
    await this.testCORS();
    await this.testDatabaseConnectivity();
    
    // Display results
    this.displayResults();
    
    return this.results;
  }

  /**
   * Display diagnostic results in a formatted way
   */
  private displayResults() {
    console.log('\n📊 DIAGNOSTIC RESULTS');
    console.log('═'.repeat(50));
    
    let passCount = 0;
    let failCount = 0;
    let warningCount = 0;
    
    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      console.log(`${icon} ${result.test}: ${result.message}`);
      
      if (result.details) {
        console.log(`   Details:`, result.details);
      }
      
      if (result.status === 'pass') passCount++;
      else if (result.status === 'fail') failCount++;
      else warningCount++;
    });
    
    console.log('\n📈 SUMMARY');
    console.log('─'.repeat(30));
    console.log(`✅ Passed: ${passCount}`);
    console.log(`⚠️  Warnings: ${warningCount}`);
    console.log(`❌ Failed: ${failCount}`);
    
    if (failCount > 0) {
      console.log('\n🔧 TROUBLESHOOTING SUGGESTIONS');
      console.log('─'.repeat(40));
      
      const failedTests = this.results.filter(r => r.status === 'fail');
      
      failedTests.forEach(test => {
        console.log(`\n❌ ${test.test}:`);
        
        switch (test.test) {
          case 'Internet Connectivity':
            console.log('   • Check your internet connection');
            console.log('   • Try accessing other websites');
            console.log('   • Check firewall settings');
            break;
            
          case 'DNS Resolution':
            console.log('   • Check DNS settings');
            console.log('   • Try using Google DNS (8.8.8.8, 8.8.4.4)');
            console.log('   • Flush DNS cache: ipconfig /flushdns');
            break;
            
          case 'Appwrite Endpoint':
            console.log('   • Verify VITE_APPWRITE_ENDPOINT in .env file');
            console.log('   • Check if Appwrite Cloud is experiencing issues');
            console.log('   • Try accessing https://cloud.appwrite.io directly');
            break;
            
          case 'Project Config':
            console.log('   • Check .env file exists and has correct values');
            console.log('   • Verify VITE_APPWRITE_PROJECT_ID is correct');
            console.log('   • Restart development server after .env changes');
            break;
            
          case 'CORS Configuration':
            console.log('   • Check Appwrite Console > Settings > Domains');
            console.log('   • Add your development URL (e.g., http://localhost:5173)');
            console.log('   • Ensure wildcard (*) is not the only domain in production');
            break;
            
          case 'Database Connectivity':
            console.log('   • Verify database exists in Appwrite Console');
            console.log('   • Check database permissions');
            console.log('   • Ensure collections are properly configured');
            break;
        }
      });
    }
    
    if (failCount === 0 && warningCount === 0) {
      console.log('\n🎉 All tests passed! Your Appwrite connection should be working properly.');
    }
  }

  /**
   * Quick connectivity check
   */
  async quickConnectivityCheck(): Promise<boolean> {
    console.log('⚡ Running quick connectivity check...');
    
    try {
      const response = await fetch(import.meta.env.VITE_APPWRITE_ENDPOINT + '/health');
      if (response.ok) {
        console.log('✅ Quick check passed - Appwrite is reachable');
        return true;
      } else {
        console.log(`⚠️ Quick check warning - Appwrite returned ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log('❌ Quick check failed - Cannot reach Appwrite');
      console.error(error);
      return false;
    }
  }
}

// Create global instance
const networkDiagnostics = new NetworkDiagnostics();

// Export functions to global scope for console access
declare global {
  interface Window {
    runNetworkDiagnostics: () => Promise<DiagnosticResult[]>;
    quickConnectivityCheck: () => Promise<boolean>;
    networkDiagnostics: NetworkDiagnostics;
  }
}

// Make functions available globally
window.runNetworkDiagnostics = () => networkDiagnostics.runComprehensiveDiagnostics();
window.quickConnectivityCheck = () => networkDiagnostics.quickConnectivityCheck();
window.networkDiagnostics = networkDiagnostics;

export { networkDiagnostics, NetworkDiagnostics };
export type { DiagnosticResult }; 