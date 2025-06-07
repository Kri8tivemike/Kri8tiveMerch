const { Client, Databases, ID } = require('appwrite');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;

// Sample products data
const sampleProducts = [
  {
    name: 'Classic T-Shirt',
    description: 'A comfortable cotton t-shirt that goes with everything.',
    price: 19.99,
    stock: 100,
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    category: 'clothing',
    sku: 'TS-001',
    created_at: new Date().toISOString(),
  },
  {
    name: 'Coffee Mug',
    description: 'Start your day right with this premium ceramic coffee mug.',
    price: 12.99,
    stock: 50,
    image_url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    category: 'kitchenware',
    sku: 'MG-001',
    created_at: new Date().toISOString(),
  },
  {
    name: 'Notebook',
    description: 'Premium quality notebook with 200 pages of high-quality paper.',
    price: 8.99,
    stock: 75,
    image_url: 'https://images.unsplash.com/photo-1517971129774-8a2b38fa128e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    category: 'stationery',
    sku: 'NB-001',
    created_at: new Date().toISOString(),
  }
];

// Function to add sample products
async function addSampleProducts() {
  console.log('Adding sample products...');
  
  for (const product of sampleProducts) {
    try {
      const result = await databases.createDocument(
        databaseId,
        'products',
        ID.unique(),
        product
      );
      console.log(`Added product: ${product.name} (${result.$id})`);
    } catch (error) {
      console.error(`Error adding product ${product.name}:`, error);
    }
  }
  
  console.log('Sample products added successfully!');
}

// Main function to run initialization
async function initializeAppwrite() {
  try {
    console.log('Initializing Appwrite with sample data...');
    console.log('Database ID:', databaseId);
    
    // Add sample products
    await addSampleProducts();
    
    console.log('Initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing Appwrite:', error);
  }
}

// Run the initialization
initializeAppwrite(); 