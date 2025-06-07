import { databases } from './appwrite';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
const PRODUCTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID || 'products';

export const seedProducts = async () => {
  const initialProducts = [
    {
      name: 'Classic T-Shirt',
      description: 'Comfortable cotton t-shirt with custom design',
      price: 29.99,
      image_url: '/images/products/tshirt.jpg',
      category: 'Clothing',
      stock_quantity: 100
    },
    {
      name: 'Custom Mug',
      description: 'Ceramic mug with your favorite design',
      price: 14.99,
      image_url: '/images/products/mug.jpg',
      category: 'Accessories',
      stock_quantity: 50
    },
    {
      name: 'Phone Case',
      description: 'Durable phone case with unique artwork',
      price: 19.99,
      image_url: '/images/products/phonecase.jpg',
      category: 'Accessories',
      stock_quantity: 75
    }
  ];

  try {
    const results = [];
    
    for (const product of initialProducts) {
      try {
        // Check if product already exists by name
        const { documents } = await databases.listDocuments(
          DATABASE_ID,
          PRODUCTS_COLLECTION_ID,
          [Query.equal('name', product.name)]
        );
        
        if (documents.length > 0) {
          // Product exists, update it
          const existingProduct = documents[0];
          const updatedProduct = await databases.updateDocument(
            DATABASE_ID, 
            PRODUCTS_COLLECTION_ID,
            existingProduct.$id,
            product
          );
          results.push(updatedProduct);
        } else {
          // Product doesn't exist, create it
          const newProduct = await databases.createDocument(
            DATABASE_ID,
            PRODUCTS_COLLECTION_ID,
            ID.unique(),
            product
          );
          results.push(newProduct);
        }
      } catch (error) {
        console.error(`Error seeding product ${product.name}:`, error);
      }
    }

    console.log('Products seeded successfully:', results);
    return true;
  } catch (error) {
    console.error('Error in seedProducts:', error);
    return false;
  }
};

export const checkAndSeedData = async () => {
  try {
    // Check if products table is empty
    const { documents } = await databases.listDocuments(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      [Query.limit(1)]
    );

    // If no products exist, seed the data
    if (!documents || documents.length === 0) {
      console.log('No products found, seeding initial data...');
      return await seedProducts();
    }

    console.log('Products already exist, skipping seed');
    return true;
  } catch (error) {
    console.error('Error in checkAndSeedData:', error);
    return false;
  }
};
