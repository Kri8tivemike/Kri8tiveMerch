require('dotenv').config();
const { Client, Databases } = require('node-appwrite');

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;
const productsCollectionId = process.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID;

// Products to update
const productsToUpdate = [
  { name: 'Light Gray Blank T-Shirt', newStock: 10 },
  { name: 'Classic Brown Blank T-Shirt', newStock: 10 }
];

async function updateProductStock() {
  try {
    console.log('Starting product stock update...');
    
    // Find products by name
    for (const product of productsToUpdate) {
      console.log(`Searching for product: ${product.name}`);
      
      // List documents filtering by name
      const response = await databases.listDocuments(
        databaseId,
        productsCollectionId,
        [{ '$contains': ['name', product.name] }]
      );
      
      if (response.documents.length === 0) {
        console.log(`❌ Product not found: ${product.name}`);
        continue;
      }
      
      const productDoc = response.documents[0];
      console.log(`Found product: ${productDoc.name} (ID: ${productDoc.$id}), Current stock: ${productDoc.stock || 0}`);
      
      // Update the stock
      await databases.updateDocument(
        databaseId,
        productsCollectionId,
        productDoc.$id,
        { stock: product.newStock }
      );
      
      console.log(`✅ Updated stock for ${product.name} to ${product.newStock}`);
    }
    
    console.log('Stock update completed successfully!');
  } catch (error) {
    console.error('Error updating product stock:', error);
  }
}

// Run the update function
updateProductStock(); 