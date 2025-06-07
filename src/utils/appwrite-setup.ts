import { createServerClient, ID } from '../lib/appwrite';
import { Permission, Role } from 'appwrite';

/**
 * Function to create the database and collections for Appwrite
 * For setup purposes only - to be run once during initial setup
 */
export const setupAppwriteDatabase = async () => {
  try {
    console.log('Starting Appwrite database setup...');
    
    // Create server client for admin operations
    const { client, databases } = createServerClient();
    
    // Create database
    const databaseId = ID.unique();
    console.log(`Creating database with ID: ${databaseId}`);
    
    try {
      const database = await databases.create(databaseId, 'Kri8tive Database');
      console.log('Database created successfully:', database.name);
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log('Database already exists, continuing with setup...');
      } else {
        console.error('Failed to create database:', error);
        throw error;
      }
    }
    
    // Create products collection
    try {
      const productsCollection = await databases.createCollection(
        databaseId,
        'products',
        'Products Collection',
        [
          Permission.read(Role.any()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users())
        ]
      );
      console.log('Products collection created:', productsCollection.name);
      
      // Create attributes for products
      await databases.createStringAttribute(databaseId, 'products', 'name', 255, true);
      await databases.createStringAttribute(databaseId, 'products', 'description', 5000, false);
      await databases.createFloatAttribute(databaseId, 'products', 'price', true);
      await databases.createIntegerAttribute(databaseId, 'products', 'stock', true);
      await databases.createStringAttribute(databaseId, 'products', 'image_url', 2048, false);
      await databases.createStringAttribute(databaseId, 'products', 'category', 100, false);
      await databases.createStringAttribute(databaseId, 'products', 'sku', 50, true);
      await databases.createDatetimeAttribute(databaseId, 'products', 'created_at', true);
      await databases.createDatetimeAttribute(databaseId, 'products', 'updated_at', false);
      
      // Create indexes
      await databases.createIndex(databaseId, 'products', 'sku_index', 'key', ['sku']);
      await databases.createIndex(databaseId, 'products', 'category_index', 'key', ['category']);
      
      console.log('Products collection attributes and indexes created.');
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log('Products collection already exists.');
      } else {
        console.error('Failed to create products collection:', error);
      }
    }
    
    // Create orders collection
    try {
      const ordersCollection = await databases.createCollection(
        databaseId,
        'orders',
        'Orders Collection',
        [
          Permission.read(Role.user('${user.id}')),
          Permission.create(Role.users()),
          Permission.update(Role.user('${user.id}')),
          Permission.delete(Role.users())
        ]
      );
      console.log('Orders collection created:', ordersCollection.name);
      
      // Create attributes for orders
      await databases.createStringAttribute(databaseId, 'orders', 'user_id', 36, true);
      await databases.createStringAttribute(databaseId, 'orders', 'status', 20, true);
      await databases.createFloatAttribute(databaseId, 'orders', 'total', true);
      await databases.createStringAttribute(databaseId, 'orders', 'products_json', 10000, true);
      await databases.createStringAttribute(databaseId, 'orders', 'shipping_address', 1000, false);
      await databases.createStringAttribute(databaseId, 'orders', 'payment_id', 100, false);
      await databases.createDatetimeAttribute(databaseId, 'orders', 'created_at', true);
      await databases.createDatetimeAttribute(databaseId, 'orders', 'updated_at', false);
      
      // Create indexes
      await databases.createIndex(databaseId, 'orders', 'user_id_index', 'key', ['user_id']);
      await databases.createIndex(databaseId, 'orders', 'status_index', 'key', ['status']);
      
      console.log('Orders collection attributes and indexes created.');
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log('Orders collection already exists.');
      } else {
        console.error('Failed to create orders collection:', error);
      }
    }
    
    // Create categories collection
    try {
      const categoriesCollection = await databases.createCollection(
        databaseId,
        'categories',
        'Categories Collection',
        [
          Permission.read(Role.any()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users())
        ]
      );
      console.log('Categories collection created:', categoriesCollection.name);
      
      // Create attributes for categories
      await databases.createStringAttribute(databaseId, 'categories', 'name', 100, true);
      await databases.createStringAttribute(databaseId, 'categories', 'description', 1000, false);
      await databases.createStringAttribute(databaseId, 'categories', 'image_url', 2048, false);
      await databases.createDatetimeAttribute(databaseId, 'categories', 'created_at', true);
      
      // Create index
      await databases.createIndex(databaseId, 'categories', 'name_index', 'key', ['name']);
      
      console.log('Categories collection attributes and indexes created.');
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log('Categories collection already exists.');
      } else {
        console.error('Failed to create categories collection:', error);
      }
    }
    
    // Create users collection (for additional user data not stored in Appwrite's users)
    try {
      const usersCollection = await databases.createCollection(
        databaseId,
        'users',
        'Users Collection',
        [
          Permission.read(Role.user('${user.id}')),
          Permission.create(Role.user('${user.id}')),
          Permission.update(Role.user('${user.id}')),
          Permission.delete(Role.user('${user.id}'))
        ]
      );
      console.log('Users collection created:', usersCollection.name);
      
      // Create attributes for users
      await databases.createStringAttribute(databaseId, 'users', 'user_id', 36, true);
      await databases.createStringAttribute(databaseId, 'users', 'full_name', 100, true);
      await databases.createStringAttribute(databaseId, 'users', 'phone', 20, false);
      await databases.createStringAttribute(databaseId, 'users', 'address', 1000, false);
      await databases.createStringAttribute(databaseId, 'users', 'role', 20, true, 'customer');
      await databases.createDatetimeAttribute(databaseId, 'users', 'created_at', true);
      await databases.createDatetimeAttribute(databaseId, 'users', 'updated_at', false);
      
      // Create index
      await databases.createIndex(databaseId, 'users', 'user_id_index', 'unique', ['user_id']);
      
      console.log('Users collection attributes and indexes created.');
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log('Users collection already exists.');
      } else {
        console.error('Failed to create users collection:', error);
      }
    }
    
    console.log('Appwrite database setup completed successfully!');
    return {
      success: true,
      databaseId
    };
  } catch (error) {
    console.error('Error setting up Appwrite database:', error);
    return {
      success: false,
      error
    };
  }
}; 