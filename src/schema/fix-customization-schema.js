/**
 * Fix Customization Schema Script for Appwrite
 * 
 * This script helps fix schema inconsistencies in the customization_requests collection.
 * It can be run to add missing attributes or fix incorrect ones.
 */

import { Client, Databases } from 'appwrite';

// Appwrite configuration - load from environment variables
const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.VITE_APPWRITE_API_KEY; 
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';

// Initialize Appwrite client
const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new Databases(client);

/**
 * Main function to fix schema issues
 */
async function fixCustomizationSchema() {
    const collectionId = 'customization_requests';
    
    try {
        console.log('Starting customization schema fix...');
        
        // First, get the collection to verify it exists
        try {
            await databases.getCollection(databaseId, collectionId);
            console.log('✅ Collection exists. Proceeding to fix attributes...');
        } catch (error) {
            console.error('❌ Collection does not exist:', error);
            return;
        }

        // Add or update the material attribute if it doesn't exist
        try {
            console.log('Adding missing material attribute...');
            await databases.deleteAttribute(databaseId, collectionId, 'material');
            console.log('✅ Removed existing material attribute if it existed');
        } catch (error) {
            console.log('Material attribute did not exist or could not be deleted:', error.message);
        }

        try {
            // Wait a moment to ensure deletion is processed
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Add the attribute correctly
            await databases.createStringAttribute(
                databaseId,
                collectionId,
                'material',
                100,
                false,
                null,
                false
            );
            console.log('✅ Successfully added material attribute');
        } catch (error) {
            console.error('❌ Error adding material attribute:', error);
        }

        // Check and fix the technique vs technique_name discrepancy
        try {
            // First, ensure the technique attribute is correct
            try {
                await databases.getAttribute(databaseId, collectionId, 'technique');
                console.log('✅ Technique attribute exists');
            } catch (error) {
                console.log('Technique attribute does not exist, creating it...');
                await databases.createStringAttribute(
                    databaseId,
                    collectionId,
                    'technique',
                    100,
                    false,
                    null,
                    false
                );
                console.log('✅ Created technique attribute');
            }
            
            // If technique_name exists, we should remove it since we're standardizing on technique
            try {
                await databases.getAttribute(databaseId, collectionId, 'technique_name');
                console.log('Found technique_name attribute, removing it...');
                await databases.deleteAttribute(databaseId, collectionId, 'technique_name');
                console.log('✅ Removed technique_name attribute');
            } catch (error) {
                console.log('technique_name attribute not found, which is good');
            }
        } catch (error) {
            console.error('❌ Error fixing technique attributes:', error);
        }

        console.log('✅ Schema fix completed');
    } catch (error) {
        console.error('❌ Error fixing customization schema:', error);
        throw error;
    }
}

// Run the fix function
fixCustomizationSchema()
    .then(() => console.log('Schema fix completed'))
    .catch(error => console.error('Schema fix failed:', error));

export default fixCustomizationSchema; 