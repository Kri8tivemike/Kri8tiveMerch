import { Client, Databases, Permission, Role, ID } from 'node-appwrite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment variables
const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID || '67ea2c3b00309b589901';
const apiKey = process.env.VITE_APPWRITE_API_KEY;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const databases = new Databases(client);

/**
 * Collection configurations for different user roles
 */
const collections = {
  customers: {
    id: 'customers',
    name: 'Customers',
    description: 'Customer profiles and information',
    attributes: [
      { key: 'user_id', type: 'string', size: 255, required: true, array: false },
      { key: 'email', type: 'string', size: 255, required: true, array: false },
      { key: 'first_name', type: 'string', size: 100, required: true, array: false },
      { key: 'last_name', type: 'string', size: 100, required: true, array: false },
      { key: 'full_name', type: 'string', size: 255, required: false, array: false },
      { key: 'phone', type: 'string', size: 20, required: false, array: false },
      { key: 'whatsapp_number', type: 'string', size: 20, required: false, array: false },
      { key: 'delivery_address', type: 'string', size: 1000, required: false, array: false },
      { key: 'avatar_url', type: 'string', size: 500, required: false, array: false },
      { key: 'status', type: 'enum', elements: ['Pending', 'Verified', 'Deactivated'], required: true, array: false, default: 'Pending' },
      { key: 'email_verified', type: 'boolean', required: false, array: false, default: false },
      { key: 'preferences', type: 'string', size: 2000, required: false, array: false },
      { key: 'total_orders', type: 'integer', required: false, array: false, default: 0 },
      { key: 'total_spent', type: 'float', required: false, array: false, default: 0.0 },
      { key: 'created_at', type: 'datetime', required: true, array: false },
      { key: 'updated_at', type: 'datetime', required: true, array: false }
    ],
    indexes: [
      { key: 'user_id_index', type: 'key', attributes: ['user_id'], orders: ['ASC'] },
      { key: 'email_index', type: 'unique', attributes: ['email'], orders: ['ASC'] },
      { key: 'status_index', type: 'key', attributes: ['status'], orders: ['ASC'] },
      { key: 'created_at_index', type: 'key', attributes: ['created_at'], orders: ['DESC'] }
    ],
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ]
  },

  shop_managers: {
    id: 'shop_managers',
    name: 'Shop Managers',
    description: 'Shop manager profiles and permissions',
    attributes: [
      { key: 'user_id', type: 'string', size: 255, required: true, array: false },
      { key: 'email', type: 'string', size: 255, required: true, array: false },
      { key: 'first_name', type: 'string', size: 100, required: true, array: false },
      { key: 'last_name', type: 'string', size: 100, required: true, array: false },
      { key: 'full_name', type: 'string', size: 255, required: false, array: false },
      { key: 'phone', type: 'string', size: 20, required: false, array: false },
      { key: 'avatar_url', type: 'string', size: 500, required: false, array: false },
      { key: 'status', type: 'enum', elements: ['Pending', 'Verified', 'Deactivated'], required: true, array: false, default: 'Pending' },
      { key: 'email_verified', type: 'boolean', required: false, array: false, default: false },
      { key: 'department', type: 'string', size: 100, required: false, array: false },
      { key: 'permissions', type: 'string', size: 2000, required: false, array: false },
      { key: 'assigned_shop_id', type: 'string', size: 255, required: false, array: false },
      { key: 'hire_date', type: 'datetime', required: false, array: false },
      { key: 'last_login', type: 'datetime', required: false, array: false },
      { key: 'is_active', type: 'boolean', required: false, array: false, default: true },
      { key: 'created_at', type: 'datetime', required: true, array: false },
      { key: 'updated_at', type: 'datetime', required: true, array: false }
    ],
    indexes: [
      { key: 'user_id_index', type: 'key', attributes: ['user_id'], orders: ['ASC'] },
      { key: 'email_index', type: 'unique', attributes: ['email'], orders: ['ASC'] },
      { key: 'status_index', type: 'key', attributes: ['status'], orders: ['ASC'] },
      { key: 'department_index', type: 'key', attributes: ['department'], orders: ['ASC'] },
      { key: 'is_active_index', type: 'key', attributes: ['is_active'], orders: ['ASC'] }
    ],
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ]
  },

  super_admins: {
    id: 'super_admins',
    name: 'Super Admins',
    description: 'Super administrator profiles with full system access',
    attributes: [
      { key: 'user_id', type: 'string', size: 255, required: true, array: false },
      { key: 'email', type: 'string', size: 255, required: true, array: false },
      { key: 'first_name', type: 'string', size: 100, required: true, array: false },
      { key: 'last_name', type: 'string', size: 100, required: true, array: false },
      { key: 'full_name', type: 'string', size: 255, required: false, array: false },
      { key: 'phone', type: 'string', size: 20, required: false, array: false },
      { key: 'avatar_url', type: 'string', size: 500, required: false, array: false },
      { key: 'status', type: 'enum', elements: ['Pending', 'Verified', 'Deactivated'], required: true, array: false, default: 'Verified' },
      { key: 'email_verified', type: 'boolean', required: false, array: false, default: true },
      { key: 'super_admin_level', type: 'enum', elements: ['System', 'Business', 'Technical'], required: true, array: false, default: 'Business' },
      { key: 'permissions', type: 'string', size: 5000, required: false, array: false },
      { key: 'security_clearance', type: 'integer', required: false, array: false, default: 5 },
      { key: 'two_factor_enabled', type: 'boolean', required: false, array: false, default: true },
      { key: 'last_login', type: 'datetime', required: false, array: false },
      { key: 'last_password_change', type: 'datetime', required: false, array: false },
      { key: 'is_active', type: 'boolean', required: false, array: false, default: true },
      { key: 'created_at', type: 'datetime', required: true, array: false },
      { key: 'updated_at', type: 'datetime', required: true, array: false }
    ],
    indexes: [
      { key: 'user_id_index', type: 'key', attributes: ['user_id'], orders: ['ASC'] },
      { key: 'email_index', type: 'unique', attributes: ['email'], orders: ['ASC'] },
      { key: 'status_index', type: 'key', attributes: ['status'], orders: ['ASC'] },
      { key: 'super_admin_level_index', type: 'key', attributes: ['super_admin_level'], orders: ['ASC'] },
      { key: 'security_clearance_index', type: 'key', attributes: ['security_clearance'], orders: ['DESC'] }
    ],
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ]
  }
};

/**
 * Creates a collection with attributes and indexes
 */
async function createCollection(collectionConfig) {
  try {
    console.log(`\n🏗️  Creating collection: ${collectionConfig.name}...`);

    // Create the collection
    const collection = await databases.createCollection(
      databaseId,
      collectionConfig.id,
      collectionConfig.name,
      collectionConfig.permissions,
      false, // documentSecurity - set to false for collection-level permissions
      true   // enabled
    );

    console.log(`✅ Collection '${collectionConfig.name}' created with ID: ${collection.$id}`);

    // Add attributes
    console.log(`\n📝 Adding attributes to ${collectionConfig.name}...`);
    for (const attr of collectionConfig.attributes) {
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            databaseId,
            collectionConfig.id,
            attr.key,
            attr.size,
            attr.required,
            attr.default || null,
            attr.array || false
          );
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            databaseId,
            collectionConfig.id,
            attr.key,
            attr.required,
            null, // min
            null, // max
            attr.default || null,
            attr.array || false
          );
        } else if (attr.type === 'float') {
          await databases.createFloatAttribute(
            databaseId,
            collectionConfig.id,
            attr.key,
            attr.required,
            null, // min
            null, // max
            attr.default || null,
            attr.array || false
          );
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(
            databaseId,
            collectionConfig.id,
            attr.key,
            attr.required,
            attr.default || null,
            attr.array || false
          );
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            databaseId,
            collectionConfig.id,
            attr.key,
            attr.required,
            attr.default || null,
            attr.array || false
          );
        } else if (attr.type === 'enum') {
          await databases.createEnumAttribute(
            databaseId,
            collectionConfig.id,
            attr.key,
            attr.elements,
            attr.required,
            attr.default || null,
            attr.array || false
          );
        }

        console.log(`   ✓ Added ${attr.type} attribute: ${attr.key}`);
        
        // Wait a bit between attribute creations to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (attrError) {
        console.error(`   ❌ Failed to create attribute ${attr.key}:`, attrError.message);
      }
    }

    // Add indexes
    console.log(`\n🔍 Adding indexes to ${collectionConfig.name}...`);
    for (const index of collectionConfig.indexes) {
      try {
        await databases.createIndex(
          databaseId,
          collectionConfig.id,
          index.key,
          index.type,
          index.attributes,
          index.orders
        );
        console.log(`   ✓ Added index: ${index.key}`);
        
        // Wait a bit between index creations
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (indexError) {
        console.error(`   ❌ Failed to create index ${index.key}:`, indexError.message);
      }
    }

    console.log(`✅ Collection '${collectionConfig.name}' setup complete!`);
    return collection;

  } catch (error) {
    console.error(`❌ Failed to create collection '${collectionConfig.name}':`, error.message);
    throw error;
  }
}

/**
 * Creates sample data for testing
 */
async function createSampleData() {
  console.log('\n📊 Creating sample data...');

  // Sample customer
  try {
    await databases.createDocument(
      databaseId,
      'customers',
      ID.unique(),
      {
        user_id: 'sample_customer_1',
        email: 'customer@example.com',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        phone: '+1234567890',
        status: 'Verified',
        email_verified: true,
        total_orders: 5,
        total_spent: 250.50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    );
    console.log('✓ Sample customer created');
  } catch (error) {
    console.error('❌ Failed to create sample customer:', error.message);
  }

  // Sample shop manager
  try {
    await databases.createDocument(
      databaseId,
      'shop_managers',
      ID.unique(),
      {
        user_id: 'sample_manager_1',
        email: 'manager@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        full_name: 'Jane Smith',
        phone: '+1234567891',
        status: 'Verified',
        email_verified: true,
        department: 'Sales',
        hire_date: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    );
    console.log('✓ Sample shop manager created');
  } catch (error) {
    console.error('❌ Failed to create sample shop manager:', error.message);
  }

  // Sample super admin
  try {
    await databases.createDocument(
      databaseId,
      'super_admins',
      ID.unique(),
      {
        user_id: 'sample_admin_1',
        email: 'admin@example.com',
        first_name: 'Admin',
        last_name: 'User',
        full_name: 'Admin User',
        phone: '+1234567892',
        status: 'Verified',
        email_verified: true,
        super_admin_level: 'System',
        security_clearance: 10,
        two_factor_enabled: true,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    );
    console.log('✓ Sample super admin created');
  } catch (error) {
    console.error('❌ Failed to create sample super admin:', error.message);
  }
}

/**
 * Main setup function
 */
async function setupUserCollections() {
  console.log('🚀 Setting up user role collections in Appwrite...');
  console.log(`📊 Database ID: ${databaseId}`);
  console.log(`🔗 Endpoint: ${endpoint}`);
  console.log(`📦 Project ID: ${projectId}`);

  try {
    // Check if database exists
    try {
      await databases.get(databaseId);
      console.log(`✅ Database '${databaseId}' found`);
    } catch (error) {
      console.error(`❌ Database '${databaseId}' not found. Please create it first in Appwrite Console.`);
      return;
    }

    // Create collections
    for (const [key, config] of Object.entries(collections)) {
      try {
        // Check if collection already exists
        try {
          await databases.getCollection(databaseId, config.id);
          console.log(`⚠️  Collection '${config.name}' already exists. Skipping...`);
        } catch (error) {
          // Collection doesn't exist, create it
          await createCollection(config);
        }
      } catch (error) {
        console.error(`❌ Error setting up collection '${config.name}':`, error.message);
      }
    }

    // Create sample data
    const shouldCreateSampleData = process.argv.includes('--sample-data');
    if (shouldCreateSampleData) {
      await createSampleData();
    }

    console.log('\n🎉 User collections setup complete!');
    console.log('\n📋 Collections created:');
    console.log('   📁 customers - Customer profiles and data');
    console.log('   📁 shop_managers - Shop manager profiles and permissions');
    console.log('   📁 super_admins - Super administrator profiles');
    
    console.log('\n🔧 Next steps:');
    console.log('   1. Update your application to use these new collections');
    console.log('   2. Create migration scripts to move existing user_profiles data');
    console.log('   3. Update your authentication flows to use role-specific collections');
    console.log('   4. Test the new user role separation');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the script
const isMainModule = import.meta.url.endsWith(process.argv[1]) || import.meta.url.endsWith('setup-user-collections.js');
if (isMainModule) {
  console.log('🔍 Checking environment variables...');
  console.log(`   Project ID: ${projectId || 'NOT SET'}`);
  console.log(`   API Key: ${apiKey ? 'SET' : 'NOT SET'}`);
  console.log(`   Database ID: ${databaseId}`);
  console.log(`   Endpoint: ${endpoint}`);
  
  // Check required environment variables
  if (!projectId || !apiKey) {
    console.error('❌ Missing required environment variables:');
    if (!projectId) console.error('   VITE_APPWRITE_PROJECT_ID');
    if (!apiKey) console.error('   VITE_APPWRITE_API_KEY');
    console.error('\n💡 Please set these environment variables in a .env file or export them in your shell');
    process.exit(1);
  }

  setupUserCollections();
}

export { setupUserCollections, collections }; 