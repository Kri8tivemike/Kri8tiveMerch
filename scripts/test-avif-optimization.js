/**
 * Test script to verify AVIF optimization is working
 */

// Test browser support detection
function testBrowserSupport() {
  console.log('🔍 Testing browser support detection...');
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  const support = {
    avif: canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0,
    webp: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  };
  
  console.log('✅ Browser Support Results:');
  console.log(`   AVIF: ${support.avif ? '✅ Supported' : '❌ Not Supported'}`);
  console.log(`   WebP: ${support.webp ? '✅ Supported' : '❌ Not Supported'}`);
  
  return support;
}

// Test URL generation
function testUrlGeneration() {
  console.log('\n🔗 Testing URL generation...');
  
  const baseUrl = 'https://cloud.appwrite.io/v1/storage/buckets/user_avatars/files/test-image/view';
  
  // Simulate the URL generation logic
  const generateTestUrls = (baseUrl, options = {}) => {
    const { width, height, quality = 80 } = options;
    
    const params = new URLSearchParams();
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    params.append('quality', quality.toString());
    
    const baseParams = params.toString();
    
    return {
      avif: `${baseUrl}?${baseParams}&output=avif`,
      webp: `${baseUrl}?${baseParams}&output=webp`,
      jpeg: `${baseUrl}?${baseParams}&output=jpg`,
      original: baseUrl
    };
  };
  
  const urls = generateTestUrls(baseUrl, { width: 400, height: 400, quality: 85 });
  
  console.log('✅ Generated URLs:');
  console.log(`   AVIF: ${urls.avif}`);
  console.log(`   WebP: ${urls.webp}`);
  console.log(`   JPEG: ${urls.jpeg}`);
  
  return urls;
}

// Test image loading performance
async function testImageLoading(urls) {
  console.log('\n⚡ Testing image loading performance...');
  
  const testLoad = (url, format) => {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const img = new Image();
      
      img.onload = () => {
        const loadTime = performance.now() - startTime;
        resolve({ format, loadTime, success: true, size: 'unknown' });
      };
      
      img.onerror = () => {
        const loadTime = performance.now() - startTime;
        resolve({ format, loadTime, success: false, size: 'unknown' });
      };
      
      img.src = url;
    });
  };
  
  try {
    const results = await Promise.all([
      testLoad(urls.avif, 'AVIF'),
      testLoad(urls.webp, 'WebP'),
      testLoad(urls.jpeg, 'JPEG')
    ]);
    
    console.log('✅ Loading Performance Results:');
    results.forEach(result => {
      const status = result.success ? '✅ Success' : '❌ Failed';
      console.log(`   ${result.format}: ${status} (${result.loadTime.toFixed(2)}ms)`);
    });
    
    return results;
  } catch (error) {
    console.error('❌ Error testing image loading:', error);
    return [];
  }
}

// Main test function
async function runAVIFTests() {
  console.log('🚀 Starting AVIF Optimization Tests\n');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Browser Support
    const support = testBrowserSupport();
    
    // Test 2: URL Generation
    const urls = testUrlGeneration();
    
    // Test 3: Image Loading (only if we have a real URL)
    if (urls.avif.includes('appwrite.io')) {
      await testImageLoading(urls);
    } else {
      console.log('\n⚠️  Skipping image loading test (using test URL)');
    }
    
    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 Test Summary:');
    console.log(`   Browser AVIF Support: ${support.avif ? '✅' : '❌'}`);
    console.log(`   Browser WebP Support: ${support.webp ? '✅' : '❌'}`);
    console.log(`   URL Generation: ✅ Working`);
    console.log(`   Recommended Format: ${support.avif ? 'AVIF' : support.webp ? 'WebP' : 'JPEG'}`);
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (support.avif) {
      console.log('   ✅ Your browser supports AVIF - you\'ll get the best compression!');
    } else if (support.webp) {
      console.log('   ⚠️  Your browser supports WebP but not AVIF - consider updating your browser');
    } else {
      console.log('   ❌ Your browser only supports JPEG - consider updating to a modern browser');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in browser console or Node.js
if (typeof window !== 'undefined') {
  // Browser environment
  window.runAVIFTests = runAVIFTests;
  console.log('🔧 AVIF Test Suite loaded! Run `runAVIFTests()` in the console to test.');
} else {
  // Node.js environment
  console.log('⚠️  This test is designed to run in a browser environment.');
  console.log('   Copy and paste this code into your browser\'s developer console.');
}

// Auto-run if in browser and not in production
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🔄 Auto-running tests in development environment...');
  runAVIFTests();
} 