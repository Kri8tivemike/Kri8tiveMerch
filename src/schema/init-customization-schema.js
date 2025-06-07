/**
 * Customization Database Schema Initialization Script
 * 
 * This script initializes the entire customization schema in Appwrite:
 * 1. Creates the database if it doesn't exist
 * 2. Creates collections: customization_requests, techniques, fabric_qualities, etc.
 * 3. Adds all required attributes to each collection
 * 4. Creates indexes for efficient querying
 * 
 * Run this script with Node.js to set up the database:
 * node src/schema/init-customization-schema.js
 */

const { Client, Databases, ID, Permission, Role } = require('node-appwrite');
require('dotenv').config();

// Appwrite configuration from environment variables
const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.VITE_APPWRITE_API_KEY;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';

// Initialize Appwrite client with API key
const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new Databases(client);

/**
 * Main function to set up the customization schema
 */
async function initCustomizationSchema() {
    try {
        console.log('🚀 Initializing customization schema...');
        
        // Step 1: Create the database if it doesn't exist
        let database;
        try {
            database = await databases.get(databaseId);
            console.log(`✅ Database '${databaseId}' already exists.`);
        } catch (error) {
            if (error.code === 404) {
                console.log(`Creating database '${databaseId}'...`);
                database = await databases.create(databaseId, 'Kri8tive Blanks Database');
                console.log(`✅ Database created successfully.`);
            } else {
                throw error;
            }
        }
        
        // Step 2: Create all necessary collections
        await createCustomizationCollection();
        await createTechniquesCollection();
        await createFabricQualitiesCollection();
        await createSizesCollection();
        
        console.log('✅ All collections created successfully!');
        console.log('🎉 Customization schema setup complete!');
    } catch (error) {
        console.error('❌ Error initializing customization schema:', error);
    }
}

/**
 * Creates the customization_requests collection
 */
async function createCustomizationCollection() {
    const collectionId = 'customization_requests';
    
    try {
        // Check if collection exists
        try {
            await databases.getCollection(databaseId, collectionId);
            console.log(`✅ Collection '${collectionId}' already exists.`);
            return;
        } catch (error) {
            if (error.code !== 404) throw error;
            console.log(`Creating '${collectionId}' collection...`);
        }
        
        // Create collection
        await databases.createCollection(
            databaseId,
            collectionId,
            {
                name: 'Customization Requests',
                documentSecurity: true,
                permissions: [
                    Permission.read(Role.any()),
                    Permission.create(Role.users()),
                ]
            }
        );
        
        console.log('Adding attributes to customization_requests collection...');
        
        // User information
        await databases.createStringAttribute(databaseId, collectionId, 'user_id', 255, true);
        await databases.createStringAttribute(databaseId, collectionId, 'user_name', 255, false);
        await databases.createEmailAttribute(databaseId, collectionId, 'user_email', false);
        await databases.createStringAttribute(databaseId, collectionId, 'phone_number', 50, false);
        await databases.createStringAttribute(databaseId, collectionId, 'whatsapp_number', 50, false);
        await databases.createStringAttribute(databaseId, collectionId, 'delivery_address', 500, false);
        
        // Basic request info
        await databases.createStringAttribute(databaseId, collectionId, 'title', 255, true);
        await databases.createStringAttribute(databaseId, collectionId, 'description', 2000, true);
        
        // Product information
        await databases.createStringAttribute(databaseId, collectionId, 'product_id', 36, false);
        await databases.createStringAttribute(databaseId, collectionId, 'item_type', 100, false);
        await databases.createStringAttribute(databaseId, collectionId, 'size', 50, true, 'Standard');
        await databases.createStringAttribute(databaseId, collectionId, 'color', 50, false);
        
        // Customization details
        await databases.createStringAttribute(databaseId, collectionId, 'technique_id', 36, false);
        await databases.createStringAttribute(databaseId, collectionId, 'technique', 100, false);
        await databases.createStringAttribute(databaseId, collectionId, 'material_id', 36, false);
        await databases.createStringAttribute(databaseId, collectionId, 'material', 100, false);
        await databases.createStringAttribute(databaseId, collectionId, 'fabric_purchase_option', 20, false);
        await databases.createFloatAttribute(databaseId, collectionId, 'fabric_quality', false, null, 1, 2000);
        
        // Financial information
        await databases.createFloatAttribute(databaseId, collectionId, 'technique_cost', true, 0, 0, 1000000);
        await databases.createFloatAttribute(databaseId, collectionId, 'fabric_cost', false, 0, 0, 1000000);
        await databases.createFloatAttribute(databaseId, collectionId, 'unit_cost', true, 0, 0, 1000000);
        await databases.createIntegerAttribute(databaseId, collectionId, 'quantity', true, 1, 1, 10000);
        await databases.createFloatAttribute(databaseId, collectionId, 'total_cost', true, 0, 0, 10000000);
        
        // Status and notes
        await databases.createEnumAttribute(databaseId, collectionId, 'status', ['Pending', 'approved', 'rejected', 'completed'], true, 'Pending');
        await databases.createStringAttribute(databaseId, collectionId, 'notes', 2000, false);
        await databases.createStringAttribute(databaseId, collectionId, 'admin_notes', 2000, false);
        
        // Design files
        await databases.createUrlAttribute(databaseId, collectionId, 'design_url', false);
        await databases.createUrlAttribute(databaseId, collectionId, 'image_url', false);
        
        // Timestamps
        await databases.createDatetimeAttribute(databaseId, collectionId, 'created_at', true);
        await databases.createDatetimeAttribute(databaseId, collectionId, 'updated_at', false);
        
        // Payment tracking
        await databases.createStringAttribute(databaseId, collectionId, 'payment_reference', 100, false);
        await databases.createBooleanAttribute(databaseId, collectionId, 'payment_completed', false, false);
        
        // Wait a moment for attributes to be created before creating indexes
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create indexes
        console.log('Creating indexes for customization_requests...');
        await databases.createIndex(databaseId, collectionId, 'user_id_index', 'key', ['user_id']);
        await databases.createIndex(databaseId, collectionId, 'status_index', 'key', ['status']);
        await databases.createIndex(databaseId, collectionId, 'created_at_index', 'key', ['created_at']);
        
        console.log(`✅ Collection '${collectionId}' created successfully with all attributes and indexes.`);
    } catch (error) {
        console.error(`❌ Error creating '${collectionId}' collection:`, error);
        throw error;
    }
}

/**
 * Creates the techniques collection for printing/customization techniques
 */
async function createTechniquesCollection() {
    const collectionId = 'techniques';
    
    try {
        // Check if collection exists
        try {
            await databases.getCollection(databaseId, collectionId);
            console.log(`✅ Collection '${collectionId}' already exists.`);
            return;
        } catch (error) {
            if (error.code !== 404) throw error;
            console.log(`Creating '${collectionId}' collection...`);
        }
        
        // Create collection
        await databases.createCollection(
            databaseId,
            collectionId,
            {
                name: 'Printing Techniques',
                documentSecurity: false,
                permissions: [
                    Permission.read(Role.any()),
                ]
            }
        );
        
        // Add attributes
        await databases.createStringAttribute(databaseId, collectionId, 'name', 100, true);
        await databases.createStringAttribute(databaseId, collectionId, 'description', 1000, false);
        await databases.createFloatAttribute(databaseId, collectionId, 'cost', true, 0, 0, 1000000);
        await databases.createStringAttribute(databaseId, collectionId, 'design_area', 100, false);
        await databases.createBooleanAttribute(databaseId, collectionId, 'available', true, true);
        await databases.createUrlAttribute(databaseId, collectionId, 'image_url', false);
        await databases.createDatetimeAttribute(databaseId, collectionId, 'created_at', true);
        await databases.createDatetimeAttribute(databaseId, collectionId, 'updated_at', false);
        
        // Create index on name for quick lookups
        await databases.createIndex(databaseId, collectionId, 'name_index', 'key', ['name']);
        
        console.log(`✅ Collection '${collectionId}' created successfully.`);
    } catch (error) {
        console.error(`❌ Error creating '${collectionId}' collection:`, error);
    }
}

/**
 * Creates the fabric_qualities collection
 */
async function createFabricQualitiesCollection() {
    const collectionId = 'fabric_qualities';
    
    try {
        // Check if collection exists
        try {
            await databases.getCollection(databaseId, collectionId);
            console.log(`✅ Collection '${collectionId}' already exists.`);
            return;
        } catch (error) {
            if (error.code !== 404) throw error;
            console.log(`Creating '${collectionId}' collection...`);
        }
        
        // Create collection
        await databases.createCollection(
            databaseId,
            collectionId,
            {
                name: 'Fabric Qualities',
                documentSecurity: false,
                permissions: [
                    Permission.read(Role.any()),
                ]
            }
        );
        
        // Add attributes
        await databases.createIntegerAttribute(databaseId, collectionId, 'quality', true, null, 50, 500);
        await databases.createFloatAttribute(databaseId, collectionId, 'cost', true, 0, 0, 100000);
        await databases.createStringAttribute(databaseId, collectionId, 'description', 255, false);
        await databases.createDatetimeAttribute(databaseId, collectionId, 'created_at', true);
        await databases.createDatetimeAttribute(databaseId, collectionId, 'updated_at', false);
        
        // Create index
        await databases.createIndex(databaseId, collectionId, 'quality_index', 'key', ['quality']);
        
        console.log(`✅ Collection '${collectionId}' created successfully.`);
    } catch (error) {
        console.error(`❌ Error creating '${collectionId}' collection:`, error);
    }
}

/**
 * Creates the sizes collection for size-based pricing
 */
async function createSizesCollection() {
    const collectionId = 'sizes';
    
    try {
        // Check if collection exists
        try {
            await databases.getCollection(databaseId, collectionId);
            console.log(`✅ Collection '${collectionId}' already exists.`);
            return;
        } catch (error) {
            if (error.code !== 404) throw error;
            console.log(`Creating '${collectionId}' collection...`);
        }
        
        // Create collection
        await databases.createCollection(
            databaseId,
            collectionId,
            {
                name: 'Size Pricing',
                documentSecurity: false,
                permissions: [
                    Permission.read(Role.any()),
                ]
            }
        );
        
        // Add attributes
        await databases.createStringAttribute(databaseId, collectionId, 'size', 50, true);
        await databases.createFloatAttribute(databaseId, collectionId, 'cost', true, 0, 0, 100000);
        await databases.createDatetimeAttribute(databaseId, collectionId, 'created_at', true);
        await databases.createDatetimeAttribute(databaseId, collectionId, 'updated_at', false);
        
        // Create index
        await databases.createIndex(databaseId, collectionId, 'size_index', 'key', ['size']);
        
        console.log(`✅ Collection '${collectionId}' created successfully.`);
    } catch (error) {
        console.error(`❌ Error creating '${collectionId}' collection:`, error);
    }
}

// Execute the main function
initCustomizationSchema(); 