import { Client, Account, Databases, Users, ID } from 'node-appwrite';

// Environment variables
const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID!;
const apiKey = process.env.VITE_APPWRITE_API_KEY!;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
const superAdminsCollectionId = 'super_admins';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const account = new Account(client);
const databases = new Databases(client);
const users = new Users(client);

interface CreateSuperAdminParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Creates a Super Admin user in Appwrite using role-based collections
 * @param params User creation parameters
 */
async function createSuperAdmin({ email, password, firstName, lastName }: CreateSuperAdminParams) {
  try {
    console.log('🚀 Creating Super Admin user...');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${firstName} ${lastName}`);

    // Step 1: Create user in Appwrite Auth
    console.log('\n📝 Step 1: Creating user in Appwrite Auth...');
    const user = await users.create(
      ID.unique(),
      email,
      undefined, // phone (optional)
      password,
      `${firstName} ${lastName}`
    );

    console.log(`✅ User created with ID: ${user.$id}`);

    // Step 2: Verify email (mark as verified)
    console.log('\n📧 Step 2: Verifying email...');
    await users.updateEmailVerification(user.$id, true);
    console.log('✅ Email verified');

    // Step 3: Create profile in super_admins collection
    console.log('\n👤 Step 3: Creating super admin profile...');
    const profile = await databases.createDocument(
      databaseId,
      superAdminsCollectionId,
      user.$id, // Use the same ID as the auth user
      {
        user_id: user.$id,
        email: email,
        full_name: `${firstName} ${lastName}`,
        status: 'Verified', // Use capitalized status
        email_verified: true,
        super_admin_level: 'System Administrator',
        security_clearance: 10,
        permissions: 'full_access',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    );

    console.log(`✅ Profile created with ID: ${profile.$id}`);

    console.log('\n🎉 Super Admin user created successfully!');
    console.log('\n📋 Summary:');
    console.log(`   User ID: ${user.$id}`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${firstName} ${lastName}`);
    console.log(`   Collection: super_admins`);
    console.log(`   Status: Verified`);
    console.log('\n🔐 The user can now log in with the provided credentials.');

  } catch (error: any) {
    console.error('❌ Error creating Super Admin:', error);
    
    if (error.code === 409) {
      console.error('💡 A user with this email already exists.');
    } else if (error.code === 401) {
      console.error('💡 Invalid API key or insufficient permissions.');
    } else if (error.code === 404) {
      console.error('💡 Database or collection not found. Please check your configuration.');
      console.error('💡 Make sure the super_admins collection exists in your database.');
    }
    
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 4) {
    console.error('❌ Usage: npm run create-superadmin <email> <password> <firstName> <lastName>');
    console.error('   Example: npm run create-superadmin admin@example.com SecurePass123 John Doe');
    process.exit(1);
  }

  const [email, password, firstName, lastName] = args;

  // Validate inputs
  if (!email.includes('@')) {
    console.error('❌ Invalid email address');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters long');
    process.exit(1);
  }

  if (!firstName.trim() || !lastName.trim()) {
    console.error('❌ First name and last name are required');
    process.exit(1);
  }

  // Check required environment variables
  if (!projectId || !apiKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   VITE_APPWRITE_PROJECT_ID');
    console.error('   VITE_APPWRITE_API_KEY');
    process.exit(1);
  }

  try {
    await createSuperAdmin({ email, password, firstName, lastName });
  } catch (error) {
    console.error('❌ Failed to create Super Admin');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { createSuperAdmin }; 