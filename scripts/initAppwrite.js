/* 
 * This file uses ES Module syntax
 * To run: npm run appwrite:init
 */
import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.VITE_APPWRITE_API_KEY);

const databases = new Databases(client);

// Configuration - use existing database ID
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';

async function createOrdersCollections() {
  console.log('🚀 Creating missing collections for orders functionality...');
  console.log(`Using DATABASE_ID: ${DATABASE_ID}`);
  
  // Define the collections we need to create
  const collections = [
    {
      id: 'orders',
      name: 'Orders',
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ],
      attributes: [
        { key: 'user_id', type: 'string', size: 36, required: true },
        { key: 'status', type: 'string', size: 20, required: true },
        { key: 'total_amount', type: 'double', required: true },
        { key: 'shipping_cost', type: 'double', required: false },
        { key: 'shipping_address', type: 'string', size: 1000, required: false },
        { key: 'payment_reference', type: 'string', size: 100, required: false },
        { key: 'products_json', type: 'string', size: 10000, required: true },
        { key: 'total', type: 'double', required: true },
        { key: 'created_at', type: 'datetime', required: true },
        { key: 'updated_at', type: 'datetime', required: false }
      ],
      indexes: [
        { key: 'user_id_idx', type: 'key', attributes: ['user_id'], orders: ['ASC'] },
        { key: 'status_idx', type: 'key', attributes: ['status'], orders: ['ASC'] }
      ]
    },
    {
      id: 'order_items',
      name: 'Order Items',
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ],
      attributes: [
        { key: 'order_id', type: 'string', size: 36, required: true },
        { key: 'product_id', type: 'string', size: 36, required: true },
        { key: 'quantity', type: 'integer', required: true },
        { key: 'price', type: 'double', required: true },
        { key: 'color_id', type: 'string', size: 100, required: false },
        { key: 'size', type: 'string', size: 20, required: false },
        { key: 'created_at', type: 'datetime', required: true },
        { key: 'updated_at', type: 'datetime', required: false }
      ],
      indexes: [
        { key: 'order_id_idx', type: 'key', attributes: ['order_id'], orders: ['ASC'] },
        { key: 'product_id_idx', type: 'key', attributes: ['product_id'], orders: ['ASC'] }
      ]
    }
  ];

  // Create collections
  for (const collection of collections) {
    try {
      console.log(`Creating collection: ${collection.name}...`);
      await databases.createCollection(
        DATABASE_ID,
        collection.id,
        collection.name,
        collection.permissions
      );
      console.log(`✅ Collection created: ${collection.name}`);

      // Create attributes
      for (const attr of collection.attributes) {
        try {
          console.log(`Creating attribute: ${attr.key}...`);
          
          if (attr.type === 'string') {
            await databases.createStringAttribute(
              DATABASE_ID,
              collection.id,
              attr.key,
              attr.size,
              attr.required,
              attr.default,
              attr.array
            );
          } else if (attr.type === 'integer') {
            await databases.createIntegerAttribute(
              DATABASE_ID,
              collection.id,
              attr.key,
              attr.required,
              attr.default,
              attr.array,
              attr.min,
              attr.max
            );
          } else if (attr.type === 'double') {
            await databases.createFloatAttribute(
              DATABASE_ID,
              collection.id,
              attr.key,
              attr.required,
              attr.default,
              attr.array,
              attr.min,
              attr.max
            );
          } else if (attr.type === 'boolean') {
            await databases.createBooleanAttribute(
              DATABASE_ID,
              collection.id,
              attr.key,
              attr.required,
              attr.default,
              attr.array
            );
          } else if (attr.type === 'datetime') {
            await databases.createDatetimeAttribute(
              DATABASE_ID,
              collection.id,
              attr.key,
              attr.required,
              attr.default,
              attr.array
            );
          } else if (attr.type === 'email') {
            await databases.createEmailAttribute(
              DATABASE_ID,
              collection.id,
              attr.key,
              attr.required,
              attr.default,
              attr.array
            );
          }
            
          console.log(`✅ Attribute created: ${attr.key}`);
        } catch (error) {
          if (error.code === 409) {
            console.log(`Attribute ${attr.key} already exists, continuing...`);
          } else {
            console.error(`❌ Error creating attribute ${attr.key}:`, error);
          }
        }
      }
      
      // Create indexes
      if (collection.indexes) {
        for (const idx of collection.indexes) {
          try {
            console.log(`Creating index: ${idx.key}...`);
            await databases.createIndex(
              DATABASE_ID,
              collection.id,
              idx.key,
              idx.type,
              idx.attributes,
              idx.orders
            );
            console.log(`✅ Index created: ${idx.key}`);
          } catch (error) {
            if (error.code === 409) {
              console.log(`Index ${idx.key} already exists, continuing...`);
            } else {
              console.error(`❌ Error creating index ${idx.key}:`, error);
            }
          }
        }
      }
    } catch (error) {
      if (error.code === 409) {
        console.log(`Collection ${collection.name} already exists, continuing...`);
        
        // Even if collection exists, try to create its attributes and indexes
        for (const attr of collection.attributes) {
          try {
            console.log(`Creating attribute in existing collection: ${attr.key}...`);
            
            if (attr.type === 'string') {
              await databases.createStringAttribute(
                DATABASE_ID,
                collection.id,
                attr.key,
                attr.size,
                attr.required,
                attr.default,
                attr.array
              );
            } else if (attr.type === 'integer') {
              await databases.createIntegerAttribute(
                DATABASE_ID,
                collection.id,
                attr.key,
                attr.required,
                attr.default,
                attr.array,
                attr.min,
                attr.max
              );
            } else if (attr.type === 'double') {
              await databases.createFloatAttribute(
                DATABASE_ID,
                collection.id,
                attr.key,
                attr.required,
                attr.default,
                attr.array,
                attr.min,
                attr.max
              );
            } else if (attr.type === 'boolean') {
              await databases.createBooleanAttribute(
                DATABASE_ID,
                collection.id,
                attr.key,
                attr.required,
                attr.default,
                attr.array
              );
            } else if (attr.type === 'datetime') {
              await databases.createDatetimeAttribute(
                DATABASE_ID,
                collection.id,
                attr.key,
                attr.required,
                attr.default,
                attr.array
              );
            } else if (attr.type === 'email') {
              await databases.createEmailAttribute(
                DATABASE_ID,
                collection.id,
                attr.key,
                attr.required,
                attr.default,
                attr.array
              );
            }
            
            console.log(`✅ Attribute created: ${attr.key}`);
          } catch (error) {
            if (error.code === 409) {
              console.log(`Attribute ${attr.key} already exists, continuing...`);
            } else {
              console.error(`❌ Error creating attribute ${attr.key}:`, error);
            }
          }
        }
        
        // Create indexes for existing collection
        if (collection.indexes) {
          for (const idx of collection.indexes) {
            try {
              console.log(`Creating index in existing collection: ${idx.key}...`);
              await databases.createIndex(
                DATABASE_ID,
                collection.id,
                idx.key,
                idx.type,
                idx.attributes,
                idx.orders
              );
              console.log(`✅ Index created: ${idx.key}`);
            } catch (error) {
              if (error.code === 409) {
                console.log(`Index ${idx.key} already exists, continuing...`);
              } else {
                console.error(`❌ Error creating index ${idx.key}:`, error);
              }
            }
          }
        }
      } else {
        console.error(`❌ Error creating collection ${collection.name}:`, error);
      }
    }
  }

  console.log('✅ Orders collections setup complete!');
}

// Run the initialization
createOrdersCollections().catch(console.error); 