#!/usr/bin/env node

/**
 * Deprecated Code Scanner (CommonJS version)
 * Scans the codebase for legacy patterns and generates a cleanup report
 */

const fs = require('fs');
const path = require('path');

// Define patterns to search for
const DEPRECATED_PATTERNS = {
  'Legacy Collection References': [
    'user_profiles',
    'USER_PROFILES_COLLECTION_ID',
    'VITE_APPWRITE_PROFILES_COLLECTION_ID'
  ],
  'Legacy Status Values': [
    "'active'",
    "'inactive'", 
    "'verified'",
    "'unverified'",
    "'pending'",
    '"active"',
    '"inactive"', 
    '"verified"',
    '"unverified"',
    '"pending"'
  ]
};

// Files and directories to scan (more focused)
const SCAN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const SCAN_DIRECTORIES = ['src'];

// Files to exclude from scanning
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  'scan-deprecated-code',
  'migration-validator.ts' // Don't scan the validator
];

class DeprecatedCodeScanner {
  constructor() {
    this.results = {
      totalFiles: 0,
      scannedFiles: 0,
      issuesFound: 0,
      issues: {}
    };
  }

  /**
   * Check if a file should be excluded from scanning
   */
  shouldExclude(filePath) {
    return EXCLUDE_PATTERNS.some(pattern => filePath.includes(pattern));
  }

  /**
   * Check if file has valid extension
   */
  hasValidExtension(filePath) {
    return SCAN_EXTENSIONS.some(ext => filePath.endsWith(ext));
  }

  /**
   * Get all files to scan
   */
  getFilesToScan() {
    const files = [];
    
    for (const dir of SCAN_DIRECTORIES) {
      if (fs.existsSync(dir)) {
        this.scanDirectory(dir, files);
      }
    }

    return files.filter(file => 
      this.hasValidExtension(file) && 
      !this.shouldExclude(file)
    );
  }

  /**
   * Recursively scan directory
   */
  scanDirectory(dir, files) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        
        if (this.shouldExclude(fullPath)) {
          continue;
        }

        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          this.scanDirectory(fullPath, files);
        } else if (stat.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  /**
   * Scan a single file for deprecated patterns
   */
  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const fileIssues = [];

      for (const [category, patterns] of Object.entries(DEPRECATED_PATTERNS)) {
        for (const pattern of patterns) {
          lines.forEach((line, lineNumber) => {
            if (line.includes(pattern)) {
              fileIssues.push({
                category,
                pattern,
                line: lineNumber + 1,
                content: line.trim(),
                severity: this.getSeverity(pattern)
              });
            }
          });
        }
      }

      if (fileIssues.length > 0) {
        this.results.issues[filePath] = fileIssues;
        this.results.issuesFound += fileIssues.length;
      }

      this.results.scannedFiles++;
    } catch (error) {
      console.warn(`Could not scan file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Determine severity of an issue
   */
  getSeverity(pattern) {
    if (pattern.includes('USER_PROFILES_COLLECTION_ID') || pattern === 'user_profiles') {
      return 'HIGH'; // Will cause import errors
    } else if (pattern.includes('VITE_APPWRITE_PROFILES_COLLECTION_ID')) {
      return 'MEDIUM'; // Environment variable issues
    } else {
      return 'LOW'; // Status value inconsistencies
    }
  }

  /**
   * Generate suggestions for fixing issues
   */
  getSuggestion(pattern) {
    const suggestions = {
      'user_profiles': 'Replace with role-based collections: customers, shop_managers, super_admins',
      'USER_PROFILES_COLLECTION_ID': 'Use CUSTOMERS_COLLECTION_ID, SHOP_MANAGERS_COLLECTION_ID, or SUPER_ADMINS_COLLECTION_ID',
      'VITE_APPWRITE_PROFILES_COLLECTION_ID': 'Remove this environment variable - no longer needed',
      "'active'": "Use 'Verified' or 'Pending' instead",
      "'inactive'": "Use 'Deactivated' instead", 
      "'verified'": "Use 'Verified' (capitalized)",
      "'unverified'": "Use 'Pending' instead",
      "'pending'": "Use 'Pending' (capitalized)",
      '"active"': 'Use "Verified" or "Pending" instead',
      '"inactive"': 'Use "Deactivated" instead', 
      '"verified"': 'Use "Verified" (capitalized)',
      '"unverified"': 'Use "Pending" instead',
      '"pending"': 'Use "Pending" (capitalized)'
    };

    return suggestions[pattern] || `Review usage of '${pattern}'`;
  }

  /**
   * Run the complete scan
   */
  async scan() {
    console.log('🔍 Scanning codebase for deprecated patterns...\n');

    const files = this.getFilesToScan();
    this.results.totalFiles = files.length;

    console.log(`Found ${files.length} files to scan`);

    // Scan each file
    for (const file of files) {
      this.scanFile(file);
    }

    this.generateReport();
  }

  /**
   * Generate and display the scan report
   */
  generateReport() {
    console.log('\n📊 DEPRECATED CODE SCAN REPORT');
    console.log('=====================================');
    console.log(`Files scanned: ${this.results.scannedFiles}/${this.results.totalFiles}`);
    console.log(`Issues found: ${this.results.issuesFound}`);

    if (this.results.issuesFound === 0) {
      console.log('\n✅ No deprecated patterns found! Your codebase is clean.');
      return;
    }

    // Group issues by severity
    const issuesBySeverity = { HIGH: [], MEDIUM: [], LOW: [] };
    
    for (const [filePath, issues] of Object.entries(this.results.issues)) {
      for (const issue of issues) {
        issuesBySeverity[issue.severity].push({ filePath, ...issue });
      }
    }

    // Display issues by severity
    for (const [severity, issues] of Object.entries(issuesBySeverity)) {
      if (issues.length === 0) continue;

      console.log(`\n🚨 ${severity} PRIORITY ISSUES (${issues.length})`);
      console.log('─'.repeat(50));

      for (const issue of issues) {
        console.log(`📁 ${issue.filePath}:${issue.line}`);
        console.log(`   Pattern: ${issue.pattern}`);
        console.log(`   Code: ${issue.content}`);
        console.log(`   💡 Fix: ${this.getSuggestion(issue.pattern)}`);
        console.log('');
      }
    }

    console.log('\n🛠️ NEXT STEPS:');
    console.log('1. Review the issues above');
    console.log('2. Fix HIGH priority issues immediately');
    console.log('3. Update MEDIUM priority issues when possible');
    console.log('4. Test your application thoroughly');
    console.log('5. Run this scanner again to verify fixes');
    
    // Exit with error code if HIGH priority issues found
    const highPriorityCount = issuesBySeverity.HIGH.length;
    if (highPriorityCount > 0) {
      console.log(`\n❌ Found ${highPriorityCount} HIGH priority issues that must be fixed!`);
      process.exit(1);
    }
  }
}

// Run the scanner
if (require.main === module) {
  const scanner = new DeprecatedCodeScanner();
  scanner.scan().catch(console.error);
}

module.exports = DeprecatedCodeScanner; 