/**
 * Create Size Prices Collection for Appwrite
 * Run with: node scripts/create-size-prices-collection.js
 */

import { Client, Databases, ID, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID;

// Collection ID for size prices
const SIZE_PRICES_COLLECTION_ID = process.env.VITE_APPWRITE_SIZE_PRICES_COLLECTION_ID || 'printing_sizes';

// Sample size prices data
const sampleSizePrices = [
  {
    size: 'S',
    cost: 0,
    active: true
  },
  {
    size: 'M',
    cost: 500,
    active: true
  },
  {
    size: 'L',
    cost: 1000,
    active: true
  },
  {
    size: 'XL',
    cost: 1500,
    active: true
  },
  {
    size: 'XXL',
    cost: 2000,
    active: true
  }
];

async function createSizePricesCollection() {
  console.log(`🔧 Creating Size Prices collection in database: ${databaseId}`);
  
  try {
    // Check if collection exists
    try {
      console.log(`Checking if size prices collection exists (${SIZE_PRICES_COLLECTION_ID})...`);
      await databases.getCollection(databaseId, SIZE_PRICES_COLLECTION_ID);
      console.log('✅ Size prices collection already exists.');
      
      // Clear localStorage flag if it exists
      console.log('To clear the localStorage flag in your browser, run this in the browser console:');
      console.log('localStorage.removeItem("sizePricesCollectionMissing");');
      
      // Add sample data if requested
      const addSamples = process.argv.includes('--add-samples');
      if (addSamples) {
        await addSampleSizePrices();
      } else {
        console.log('\nTo add sample size prices, run this script with --add-samples flag:');
        console.log('node scripts/create-size-prices-collection.js --add-samples');
      }
      
      return;
    } catch (error) {
      if (error.code === 404) {
        console.log('⚠️ Size prices collection missing. Creating...');
        
        // Create the collection
        await databases.createCollection(
          databaseId,
          SIZE_PRICES_COLLECTION_ID,
          'Size Prices',
          [
            Permission.read(Role.any()),
            Permission.create(Role.any()),
            Permission.update(Role.any()),
            Permission.delete(Role.any())
          ]
        );
        
        console.log('✅ Size prices collection created.');
        
        // Add required attributes
        console.log('Adding required attributes...');
        
        // Size attribute (string, required)
        await databases.createStringAttribute(
          databaseId,
          SIZE_PRICES_COLLECTION_ID,
          'size',
          10,  // max length
          true   // required
        );
        console.log('✅ Added size attribute');
        
        // Cost attribute (number, required)
        await databases.createFloatAttribute(
          databaseId,
          SIZE_PRICES_COLLECTION_ID,
          'cost',
          true,  // required
          0,     // min
          null   // max
          // No default value for required attribute
        );
        console.log('✅ Added cost attribute');
        
        // Active attribute (boolean, required)
        await databases.createBooleanAttribute(
          databaseId,
          SIZE_PRICES_COLLECTION_ID,
          'active',
          true  // required
        );
        console.log('✅ Added active attribute');
        
        console.log('✅ All attributes created successfully.');
        
        // Wait for indexes to be ready (this can take a few seconds in Appwrite)
        console.log('Waiting for indexes to be ready...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Add sample data
        await addSampleSizePrices();
        
        console.log('\n🎉 Size prices collection setup completed!');
        console.log('\nTo clear the localStorage flag in your browser, run this in the browser console:');
        console.log('localStorage.removeItem("sizePricesCollectionMissing");');
      } else {
        console.error('Error checking size prices collection:', error);
      }
    }
  } catch (error) {
    console.error('❌ Error creating size prices collection:', error);
  }
}

async function addSampleSizePrices() {
  console.log('\nAdding sample size prices...');
  
  for (const sizePrice of sampleSizePrices) {
    try {
      const result = await databases.createDocument(
        databaseId,
        SIZE_PRICES_COLLECTION_ID,
        ID.unique(),
        sizePrice
      );
      console.log(`✅ Added size price: ${sizePrice.size} (${result.$id})`);
    } catch (error) {
      console.error(`❌ Error adding size price ${sizePrice.size}:`, error);
    }
  }
  
  console.log('✅ Sample size prices added successfully!');
}

// Run the creation function
createSizePricesCollection();
