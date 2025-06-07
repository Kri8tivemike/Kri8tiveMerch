/**
 * Create Printing Techniques Collection for Appwrite
 * Run with: node scripts/create-printing-techniques-collection.js
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

// Collection ID for printing techniques
const PRINTING_TECHNIQUES_COLLECTION_ID = process.env.VITE_APPWRITE_PRINTING_TECHNIQUES_COLLECTION_ID || 'printing_techniques';

// Sample printing techniques data
const sampleTechniques = [
  {
    name: 'Screen Printing',
    base_cost: 2500,
    design_area: '10x10 inches',
    is_active: true
  },
  {
    name: 'DTG (Direct to Garment)',
    base_cost: 3500,
    design_area: '12x12 inches',
    is_active: true
  },
  {
    name: 'Embroidery',
    base_cost: 4000,
    design_area: '6x6 inches',
    is_active: true
  },
  {
    name: 'Heat Transfer Vinyl',
    base_cost: 2000,
    design_area: '10x10 inches',
    is_active: true
  }
];

async function createPrintingTechniquesCollection() {
  console.log(`🔧 Creating Printing Techniques collection in database: ${databaseId}`);
  
  try {
    // Check if collection exists
    try {
      console.log(`Checking if printing techniques collection exists (${PRINTING_TECHNIQUES_COLLECTION_ID})...`);
      await databases.getCollection(databaseId, PRINTING_TECHNIQUES_COLLECTION_ID);
      console.log('✅ Printing techniques collection already exists.');
      
      // Clear localStorage flag if it exists
      console.log('To clear the localStorage flag in your browser, run this in the browser console:');
      console.log('localStorage.removeItem("printingTechniquesCollectionMissing");');
      
      // Add sample data if requested
      const addSamples = process.argv.includes('--add-samples');
      if (addSamples) {
        await addSampleTechniques();
      } else {
        console.log('\nTo add sample techniques, run this script with --add-samples flag:');
        console.log('node scripts/create-printing-techniques-collection.js --add-samples');
      }
      
      return;
    } catch (error) {
      if (error.code === 404) {
        console.log('⚠️ Printing techniques collection missing. Creating...');
        
        // Create the collection
        await databases.createCollection(
          databaseId,
          PRINTING_TECHNIQUES_COLLECTION_ID,
          'Printing Techniques',
          [
            Permission.read(Role.any()),
            Permission.create(Role.any()),
            Permission.update(Role.any()),
            Permission.delete(Role.any())
          ]
        );
        
        console.log('✅ Printing techniques collection created.');
        
        // Add required attributes
        console.log('Adding required attributes...');
        
        // Name attribute (string, required)
        await databases.createStringAttribute(
          databaseId,
          PRINTING_TECHNIQUES_COLLECTION_ID,
          'name',
          255,  // max length
          true   // required
        );
        console.log('✅ Added name attribute');
        
        // Base cost attribute (number, required)
        await databases.createFloatAttribute(
          databaseId,
          PRINTING_TECHNIQUES_COLLECTION_ID,
          'base_cost',
          true,  // required
          0,     // min
          null,  // max
          0      // default
        );
        console.log('✅ Added base_cost attribute');
        
        // Design area attribute (string, optional)
        await databases.createStringAttribute(
          databaseId,
          PRINTING_TECHNIQUES_COLLECTION_ID,
          'design_area',
          255,   // max length
          false  // not required
        );
        console.log('✅ Added design_area attribute');
        
        // Is active attribute (boolean, default: true)
        await databases.createBooleanAttribute(
          databaseId,
          PRINTING_TECHNIQUES_COLLECTION_ID,
          'is_active',
          false,  // not required
          true    // default value
        );
        console.log('✅ Added is_active attribute');
        
        console.log('✅ All attributes created successfully.');
        
        // Wait for indexes to be ready (this can take a few seconds in Appwrite)
        console.log('Waiting for indexes to be ready...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Add sample data
        await addSampleTechniques();
        
        console.log('\n🎉 Printing techniques collection setup completed!');
        console.log('\nTo clear the localStorage flag in your browser, run this in the browser console:');
        console.log('localStorage.removeItem("printingTechniquesCollectionMissing");');
      } else {
        console.error('Error checking printing techniques collection:', error);
      }
    }
  } catch (error) {
    console.error('❌ Error creating printing techniques collection:', error);
  }
}

async function addSampleTechniques() {
  console.log('\nAdding sample printing techniques...');
  
  for (const technique of sampleTechniques) {
    try {
      const result = await databases.createDocument(
        databaseId,
        PRINTING_TECHNIQUES_COLLECTION_ID,
        ID.unique(),
        technique
      );
      console.log(`✅ Added technique: ${technique.name} (${result.$id})`);
    } catch (error) {
      console.error(`❌ Error adding technique ${technique.name}:`, error);
    }
  }
  
  console.log('✅ Sample techniques added successfully!');
}

// Run the creation function
createPrintingTechniquesCollection();
