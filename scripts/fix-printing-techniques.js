/**
 * Fix Printing Techniques Collection Script
 * 
 * This script creates the printing_techniques collection in Appwrite along with
 * all required attributes. Run this script if you are encountering the
 * "Collection with the requested ID could not be found" error.
 * 
 * Usage:
 * node scripts/fix-printing-techniques.js
 * 
 * Requirements:
 * - Node.js 14+ installed
 * - .env file with Appwrite configuration
 */

// Load environment variables from .env file
require('dotenv').config();

// Import fetch
const fetch = require('node-fetch');

// Configuration
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
const PRINTING_TECHNIQUES_COLLECTION_ID = process.env.VITE_APPWRITE_TECHNIQUES_COLLECTION_ID || 'printing_techniques';
const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const API_KEY = process.env.VITE_APPWRITE_API_KEY;

// Validate configuration
if (!PROJECT_ID) {
  console.error('❌ Missing PROJECT_ID in .env file');
  process.exit(1);
}

if (!API_KEY) {
  console.error('❌ Missing API_KEY in .env file');
  process.exit(1);
}

console.log('='.repeat(60));
console.log('🔧 Printing Techniques Collection Fix Script');
console.log('='.repeat(60));
console.log(`📊 Database ID: ${DATABASE_ID}`);
console.log(`📋 Collection ID: ${PRINTING_TECHNIQUES_COLLECTION_ID}`);
console.log(`🔌 Endpoint: ${ENDPOINT}`);
console.log(`🔑 Project ID: ${PROJECT_ID}`);
console.log(`🔑 API Key: ${'*'.repeat(8)}`);
console.log('-'.repeat(60));

/**
 * Creates the printing techniques collection
 */
async function createCollection() {
  try {
    console.log('📦 Creating printing techniques collection...');
    
    const response = await fetch(
      `${ENDPOINT}/databases/${DATABASE_ID}/collections`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': PROJECT_ID,
          'X-Appwrite-Key': API_KEY
        },
        body: JSON.stringify({
          collectionId: PRINTING_TECHNIQUES_COLLECTION_ID,
          name: 'Printing Techniques',
          permissions: ['read("any")', 'create("any")', 'update("any")', 'delete("any")']
        })
      }
    );
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Successfully created printing_techniques collection!');
      return { success: true, result };
    } else {
      // If collection already exists (409), that's fine
      if (response.status === 409) {
        console.log('ℹ️ Collection already exists, continuing with attribute creation...');
        return { success: true, alreadyExists: true };
      }
      
      console.error('❌ Failed to create collection:', result);
      return { success: false, error: result };
    }
  } catch (error) {
    console.error('❌ Error creating collection:', error);
    return { success: false, error };
  }
}

/**
 * Creates the required attributes for the printing techniques collection
 */
async function createAttributes() {
  const attributes = [
    {
      name: 'name',
      type: 'string',
      required: true,
      config: { size: 255 }
    },
    {
      name: 'base_cost',
      type: 'float',
      required: true,
      config: { min: 0 }
    },
    {
      name: 'design_area',
      type: 'string',
      required: false,
      config: { size: 100 }
    },
    {
      name: 'is_active',
      type: 'boolean',
      required: false,
      config: { default: true }
    }
  ];
  
  const results = [];
  
  for (const attr of attributes) {
    try {
      console.log(`⚙️ Creating ${attr.name} attribute (${attr.type})...`);
      
      const response = await fetch(
        `${ENDPOINT}/databases/${DATABASE_ID}/collections/${PRINTING_TECHNIQUES_COLLECTION_ID}/attributes/${attr.type}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': PROJECT_ID,
            'X-Appwrite-Key': API_KEY
          },
          body: JSON.stringify({
            key: attr.name,
            required: attr.required,
            ...attr.config
          })
        }
      );
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Successfully created ${attr.name} attribute!`);
        results.push({ attribute: attr.name, success: true });
      } else {
        // If attribute already exists (409), that's fine
        if (response.status === 409) {
          console.log(`ℹ️ Attribute ${attr.name} already exists, skipping...`);
          results.push({ attribute: attr.name, success: true, alreadyExists: true });
        } else {
          console.error(`❌ Failed to create ${attr.name} attribute:`, result);
          results.push({ attribute: attr.name, success: false, error: result });
        }
      }
    } catch (error) {
      console.error(`❌ Error creating ${attr.name} attribute:`, error);
      results.push({ attribute: attr.name, success: false, error });
    }
  }
  
  return results;
}

/**
 * Create a sample technique for testing
 */
async function createSampleTechnique() {
  try {
    console.log('🧪 Creating sample printing technique...');
    
    const response = await fetch(
      `${ENDPOINT}/databases/${DATABASE_ID}/collections/${PRINTING_TECHNIQUES_COLLECTION_ID}/documents`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': PROJECT_ID,
          'X-Appwrite-Key': API_KEY
        },
        body: JSON.stringify({
          name: 'Screen Printing',
          base_cost: 1500,
          design_area: '10x10 inches',
          is_active: true
        })
      }
    );
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Successfully created sample technique!');
      return { success: true, technique: result };
    } else {
      console.error('❌ Failed to create sample technique:', result);
      return { success: false, error: result };
    }
  } catch (error) {
    console.error('❌ Error creating sample technique:', error);
    return { success: false, error };
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Step 1: Create collection
    const collectionResult = await createCollection();
    if (!collectionResult.success && !collectionResult.alreadyExists) {
      console.error('❌ Failed to create collection, aborting...');
      process.exit(1);
    }
    
    // Step 2: Create attributes
    const attributesResult = await createAttributes();
    const attributesSuccess = attributesResult.every(attr => attr.success);
    
    if (!attributesSuccess) {
      console.warn('⚠️ Some attributes failed to create, but continuing...');
    }
    
    // Step 3: Create sample technique (optional)
    console.log('Do you want to create a sample technique? (y/n)');
    const answer = await new Promise(resolve => {
      process.stdin.once('data', data => {
        resolve(data.toString().trim().toLowerCase());
      });
    });
    
    if (answer === 'y' || answer === 'yes') {
      const sampleResult = await createSampleTechnique();
      if (sampleResult.success) {
        console.log('🎉 Sample technique created successfully!');
      }
    }
    
    console.log('-'.repeat(60));
    console.log('🎉 Setup complete!');
    console.log('You can now refresh your application and the error should be resolved.');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  }
}

// Run the script
main(); 