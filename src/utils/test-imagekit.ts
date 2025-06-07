import { imagekitConfig } from '../config/imagekit';

export const testImageKitConnectivity = async () => {
  console.log('🧪 Testing ImageKit connectivity...');
  
  // Test 1: Configuration check
  console.log('📋 ImageKit Configuration:');
  console.log('- Public Key:', imagekitConfig.publicKey ? '✅ Set' : '❌ Missing');
  console.log('- URL Endpoint:', imagekitConfig.urlEndpoint ? '✅ Set' : '❌ Missing');
  console.log('- Private Key:', imagekitConfig.privateKey ? '✅ Set' : '❌ Missing');
  
  // Test 2: Try to access ImageKit endpoint
  try {
    const testUrl = `${imagekitConfig.urlEndpoint}/tr:w-100,h-100/default-image.jpg`;
    console.log('🌐 Testing ImageKit endpoint access...');
    console.log('Test URL:', testUrl);
    
    const response = await fetch(testUrl, { method: 'HEAD' });
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok || response.status === 404) {
      console.log('✅ ImageKit endpoint is accessible');
    } else {
      console.log('⚠️ ImageKit endpoint returned:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ ImageKit endpoint test failed:', error);
  }
  
  // Test 3: Test upload endpoint accessibility
  try {
    console.log('🔗 Testing ImageKit upload endpoint...');
    const uploadUrl = 'https://upload.imagekit.io/api/v1/files/upload';
    
    // Just test if the endpoint is reachable (will fail due to missing data, but that's expected)
    const response = await fetch(uploadUrl, { 
      method: 'POST',
      body: new FormData() // Empty form data
    });
    
    console.log('Upload endpoint status:', response.status);
    
    if (response.status === 400 || response.status === 422) {
      console.log('✅ ImageKit upload endpoint is accessible (400/422 expected for empty request)');
    } else {
      console.log('⚠️ Unexpected response from upload endpoint:', response.status);
    }
  } catch (error) {
    console.error('❌ ImageKit upload endpoint test failed:', error);
  }
  
  // Test 4: Current ngrok URL detection
  const currentUrl = window.location.href;
  console.log('🌍 Current URL:', currentUrl);
  
  if (currentUrl.includes('ngrok')) {
    console.log('✅ Running on ngrok tunnel - ImageKit should be able to access public URLs');
  } else if (currentUrl.includes('localhost')) {
    console.log('⚠️ Running on localhost - ImageKit cannot access local URLs');
  } else {
    console.log('✅ Running on public domain - ImageKit should work');
  }
  
  return {
    configured: !!(imagekitConfig.publicKey && imagekitConfig.urlEndpoint),
    publicUrl: !currentUrl.includes('localhost'),
    endpoint: imagekitConfig.urlEndpoint
  };
};

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testImageKit = testImageKitConnectivity;
  console.log('🔧 ImageKit test utility loaded. Run testImageKit() in console to test connectivity.');
} 