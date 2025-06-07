#!/usr/bin/env node

import { execSync } from 'child_process';
import { glob } from 'glob';

console.log('🧹 Starting automated unused import cleanup...');

try {
  // Run ESLint with --fix to automatically remove unused imports
  console.log('📋 Running ESLint to fix unused imports...');
  
  const result = execSync('npx eslint . --fix --quiet', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('✅ ESLint cleanup completed successfully!');
  
  // Count TypeScript/React files
  const files = await glob('src/**/*.{ts,tsx}');
  console.log(`📁 Processed ${files.length} TypeScript/React files`);
  
  // Run a quick scan to see remaining issues
  try {
    const lintResult = execSync('npx eslint . --format=compact', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    console.log('🎉 No remaining lint issues found!');
  } catch (error) {
    const output = error.stdout || error.message;
    const unusedImportLines = output.split('\n').filter(line => 
      line.includes('unused-imports/no-unused-imports') || 
      line.includes('unused-imports/no-unused-vars')
    );
    
    if (unusedImportLines.length > 0) {
      console.log(`⚠️  Found ${unusedImportLines.length} remaining unused import/variable issues`);
      console.log('💡 Some issues may require manual review');
    } else {
      console.log('✨ All unused imports have been cleaned up!');
    }
  }
  
} catch (error) {
  console.error('❌ Error during cleanup:', error.message);
  process.exit(1);
}

console.log('🎯 Cleanup process completed!'); 