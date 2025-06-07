/**
 * Customization Requests Collection Schema for Appwrite
 * 
 * This script helps set up the customization_requests collection with all necessary attributes
 * based on the CustomizationRequest type used in the application.
 */

import { Client, Databases, Permission, Role } from 'appwrite';

// Appwrite configuration
const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.VITE_APPWRITE_API_KEY;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
const collectionId = process.env.VITE_APPWRITE_CUSTOMIZATION_COLLECTION_ID || 'customization_requests';

// Initialize Appwrite client
const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new Databases(client);

/**
 * Creates the customization_requests collection with all required attributes
 */
async function createCustomizationCollection() {
    try {
        console.log('Creating customization_requests collection...');
        
        // Check if collection already exists
        try {
            await databases.getCollection(databaseId, collectionId);
            console.log('Collection already exists. Skipping creation.');
            return;
        } catch (error) {
            if (error.code !== 404) {
                throw error; // Re-throw if it's not a "not found" error
            }
            console.log('Collection does not exist. Creating it now...');
        }
        
        // Create the collection with appropriate permissions
        // Users can create and read their own requests
        // Admins can read and update all requests
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
        
        console.log('Collection created successfully.');
        
        // Add required attributes
        console.log('Adding attributes to collection...');
        
        // User ID (Foreign Key to profiles collection)
        await databases.createStringAttribute(
            databaseId,
            collectionId,
            'user_id',
            255,
            true,
            null,
            false
        );
        
        // User information fields
        await databases.createStringAttribute(
            databaseId,
            collectionId,
            'user_name',
            255,
            false,
            null,
            false
        );
        
        await databases.createEmailAttribute(
            databaseId,
            collectionId,
            'user_email',
            false,
            null,
            false
        );
        
        await databases.createStringAttribute(
            databaseId,
            collectionId,
            'phone_number',
            50,
            false,
            null,
            false
        );
        
        await databases.createStringAttribute(
            databaseId,
            collectionId,
            'whatsapp_number',
            50,
            false,
            null,
            false
        );
        
        await databases.createStringAttribute(
            databaseId,
            collectionId,
            'delivery_address',
            500,
            false,
            null,
            false
        );
        
        // Title and description
        await databases.createStringAttribute(
            databaseId,
            collectionId,
            'title',
            255,
            true,
            null,
            false
        );
        
        await databases.createStringAttribute(
            databaseId,
            collectionId,
            'description',
            2000,
            true,
            null,
            false
        );
        
        // Product information
        await databases.createStringAttribute(
            databaseId,
            collectionId,
            'product_id',
            36,
            false,
            null,
            false
        );
        
        await databases.createStringAttribute(
            databaseId,
            collectionId,
            'item_type',
            100,
            false,
            null,
            false
        );
        
        await databases.createStringAttribute(
            databaseId,
            collectionId,
            'size',
            50,
            true,
            'Standard',
            false
        );
        
        await databases.createStringAttribute(
            databaseId,
            collectionId,
            'color',
            50,
            false,
            null,
            false
        );
        
        // Customization details
        await databases.createStringAttribute(
            databaseId,
            collectionId,
            'technique_id',
            36,
            false,
            null,
            false
        );
        
        await databases.createStringAttribute(
            databaseId,
            collectionId,
            'technique',
            100,
            false,
            null,
            false
        );
        
        await databases.createStringAttribute(
            databaseId,
            collectionId,
            'material_id',
            36,
            false,
            null,
            false
        );
        
        // Comment out the material attribute temporarily until we can fix the schema
        /*
        await databases.createStringAttribute(
            databaseId,
            collectionId,
            'material',
            100,
            false,
            null,
            false
        );
        */
        
        await databases.createStringAttribute(
            databaseId,
            collectionId,
            'fabric_purchase_option',
            20,
            false,
            null,
            false
        );
        
        await databases.createFloatAttribute(
            databaseId,
            collectionId,
            'fabric_quality',
            false,
            null,
            1,
            2000,
            false
        );
        
        // Cost information
        await databases.createFloatAttribute(
            databaseId,
            collectionId,
            'technique_cost',
            true,
            0,
            0,
            1000000,
            false
        );
        
        await databases.createFloatAttribute(
            databaseId,
            collectionId,
            'fabric_cost',
            false,
            0,
            0,
            1000000,
            false
        );
        
        await databases.createFloatAttribute(
            databaseId,
            collectionId,
            'unit_cost',
            true,
            0,
            0,
            1000000,
            false
        );
        
        await databases.createIntegerAttribute(
            databaseId,
            collectionId,
            'quantity',
            true,
            1,
            1,
            10000,
            false
        );
        
        await databases.createFloatAttribute(
            databaseId,
            collectionId,
            'total_cost',
            true,
            0,
            0,
            10000000,
            false
        );
        
        // Status tracking
        await databases.createEnumAttribute(
            databaseId,
            collectionId,
            'status',
            ['Pending', 'approved', 'rejected', 'completed'],
            true,
            'Pending',
            false
        );
        
        // Design files
        await databases.createUrlAttribute(
            databaseId,
            collectionId,
            'design_url',
            false,
            null,
            false
        );
        
        await databases.createUrlAttribute(
            databaseId,
            collectionId,
            'image_url',
            false,
            null,
            false
        );
        
        // Notes
        await databases.createStringAttribute(
            databaseId,
            collectionId,
            'notes',
            2000,
            false,
            null,
            false
        );
        
        await databases.createStringAttribute(
            databaseId,
            collectionId,
            'admin_notes',
            2000,
            false,
            null,
            false
        );
        
        // Timestamps
        await databases.createDatetimeAttribute(
            databaseId,
            collectionId,
            'created_at',
            true,
            null,
            false
        );
        
        await databases.createDatetimeAttribute(
            databaseId,
            collectionId,
            'updated_at',
            false,
            null,
            false
        );
        
        // Payment tracking fields
        await databases.createStringAttribute(
            databaseId,
            collectionId,
            'payment_reference',
            100,
            false,
            null,
            false
        );
        
        await databases.createBooleanAttribute(
            databaseId,
            collectionId,
            'payment_completed',
            false,
            false,
            false
        );
        
        console.log('Creating indexes...');
        
        // Create indexes for common query patterns
        await databases.createIndex(
            databaseId,
            collectionId,
            'user_id_index',
            'key',
            ['user_id']
        );
        
        await databases.createIndex(
            databaseId,
            collectionId,
            'status_index',
            'key',
            ['status']
        );
        
        await databases.createIndex(
            databaseId,
            collectionId,
            'created_at_index',
            'key',
            ['created_at']
        );
        
        console.log('Customization requests collection setup completed successfully!');
    } catch (error) {
        console.error('Error creating customization collection:', error);
    }
}

// Execute the function
createCustomizationCollection();

// Export the function for potential import elsewhere
export default createCustomizationCollection; 