// Mock product data for testing when Appwrite is not accessible
export const mockProducts = [
  {
    $id: 'mock-product-1',
    name: 'Classic Brown Crew Neck Blank T-Shirt',
    description: 'High-quality cotton t-shirt perfect for customization',
    price: 25.99,
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    category: 'T-Shirts',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Brown', 'Black', 'White'],
    customizable: true,
    stock_quantity: 100,
    material: 'Cotton',
    weight: '180gsm',
    gallery_images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=400&fit=crop'
    ]
  },
  {
    $id: 'mock-product-2',
    name: 'Premium White Cotton T-Shirt',
    description: 'Premium quality white t-shirt for professional printing',
    price: 29.99,
    image_url: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=400&fit=crop',
    category: 'T-Shirts',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['White', 'Black', 'Navy'],
    customizable: true,
    stock_quantity: 150,
    material: 'Premium Cotton',
    weight: '200gsm',
    gallery_images: [
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'
    ]
  }
];

// Function to enable mock mode in console
export const enableMockMode = () => {
  console.log('🧪 Enabling mock mode for product data...');
  
  // Override the getProducts function temporarily
  if (typeof window !== 'undefined') {
    (window as any).mockProducts = mockProducts;
    (window as any).enableProductMockMode = () => {
      console.log('✅ Mock mode enabled. Products will use mock data.');
      localStorage.setItem('useMockProducts', 'true');
      window.location.reload();
    };
    
    (window as any).disableProductMockMode = () => {
      console.log('✅ Mock mode disabled. Products will use Appwrite data.');
      localStorage.removeItem('useMockProducts');
      window.location.reload();
    };
    
    console.log('📋 Mock mode functions available:');
    console.log('- enableProductMockMode() - Use mock data instead of Appwrite');
    console.log('- disableProductMockMode() - Return to Appwrite data');
    console.log('- mockProducts - View available mock products');
  }
};

// Check if mock mode should be enabled
export const shouldUseMockProducts = (): boolean => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('useMockProducts') === 'true';
  }
  return false;
}; 