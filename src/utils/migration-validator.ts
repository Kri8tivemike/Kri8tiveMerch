/**
 * Migration Validation System
 * Prevents legacy collection references and ensures database consistency
 */

import { databases } from '../lib/appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';

// Define deprecated patterns that should not be used
const DEPRECATED_PATTERNS = {
  collections: [
    'user_profiles',
    'USER_PROFILES_COLLECTION_ID',
    'VITE_APPWRITE_PROFILES_COLLECTION_ID'
  ],
  statusValues: [
    'active',
    'inactive', 
    'verified',
    'unverified',
    'pending' // lowercase versions
  ],
  envVars: [
    'VITE_APPWRITE_PROFILES_COLLECTION_ID'
  ]
};

// Define current valid patterns
const VALID_PATTERNS = {
  collections: [
    'customers',
    'shop_managers', 
    'super_admins'
  ],
  statusValues: [
    'Pending',
    'Verified',
    'Deactivated'
  ],
  collectionIds: [
    'CUSTOMERS_COLLECTION_ID',
    'SHOP_MANAGERS_COLLECTION_ID', 
    'SUPER_ADMINS_COLLECTION_ID'
  ]
};

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Validate that role-based collections exist and are accessible
 */
export async function validateCollectionsExist(): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  for (const collectionId of VALID_PATTERNS.collections) {
    try {
      const response = await databases.listDocuments(DATABASE_ID, collectionId, []);
      console.log(`✅ Collection '${collectionId}' is accessible (${response.documents.length} documents)`);
    } catch (error: any) {
      result.isValid = false;
      if (error.code === 404) {
        result.errors.push(`Collection '${collectionId}' does not exist`);
        result.suggestions.push(`Create the '${collectionId}' collection in your Appwrite database`);
      } else {
        result.warnings.push(`Collection '${collectionId}' access issue: ${error.message}`);
      }
    }
  }

  return result;
}

/**
 * Check if deprecated environment variables are still being used
 */
export function validateEnvironmentVariables(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  // Check for deprecated environment variables
  for (const envVar of DEPRECATED_PATTERNS.envVars) {
    if (import.meta.env[envVar]) {
      result.warnings.push(`Deprecated environment variable '${envVar}' is still defined`);
      result.suggestions.push(`Remove '${envVar}' from your .env file - it's no longer needed`);
    }
  }

  // Check for required environment variables
  const requiredEnvVars = [
    'VITE_APPWRITE_ENDPOINT',
    'VITE_APPWRITE_PROJECT_ID', 
    'VITE_APPWRITE_DATABASE_ID'
  ];

  for (const envVar of requiredEnvVars) {
    if (!import.meta.env[envVar]) {
      result.isValid = false;
      result.errors.push(`Required environment variable '${envVar}' is missing`);
    }
  }

  return result;
}

/**
 * Validate status values in a document
 */
export function validateStatusValue(status: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  if (DEPRECATED_PATTERNS.statusValues.includes(status)) {
    result.isValid = false;
    result.errors.push(`Deprecated status value '${status}' detected`);
    
    // Suggest correct capitalized version
    const correctStatus = status.charAt(0).toUpperCase() + status.slice(1);
    if (VALID_PATTERNS.statusValues.includes(correctStatus)) {
      result.suggestions.push(`Use '${correctStatus}' instead of '${status}'`);
    } else {
      result.suggestions.push(`Use one of: ${VALID_PATTERNS.statusValues.join(', ')}`);
    }
  } else if (!VALID_PATTERNS.statusValues.includes(status)) {
    result.warnings.push(`Unknown status value '${status}' - ensure it's intentional`);
    result.suggestions.push(`Valid status values are: ${VALID_PATTERNS.statusValues.join(', ')}`);
  }

  return result;
}

/**
 * Run comprehensive migration validation
 */
export async function runMigrationValidation(): Promise<ValidationResult> {
  console.log('🔍 Running migration validation...');
  
  const results: ValidationResult[] = [];
  
  // Validate collections exist
  results.push(await validateCollectionsExist());
  
  // Validate environment variables
  results.push(validateEnvironmentVariables());
  
  // Combine all results
  const combinedResult: ValidationResult = {
    isValid: results.every(r => r.isValid),
    errors: results.flatMap(r => r.errors),
    warnings: results.flatMap(r => r.warnings),
    suggestions: results.flatMap(r => r.suggestions)
  };

  // Log results
  if (combinedResult.isValid) {
    console.log('✅ Migration validation passed');
  } else {
    console.log('❌ Migration validation failed');
    combinedResult.errors.forEach(error => console.error(`  Error: ${error}`));
  }
  
  if (combinedResult.warnings.length > 0) {
    console.log('⚠️ Migration validation warnings:');
    combinedResult.warnings.forEach(warning => console.warn(`  Warning: ${warning}`));
  }
  
  if (combinedResult.suggestions.length > 0) {
    console.log('💡 Suggestions:');
    combinedResult.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
  }

  return combinedResult;
}

/**
 * Helper function to find user profile in role-based collections
 * This is the standard way to access user profiles post-migration
 */
export async function findUserProfileSafely(userId: string): Promise<{ collection: string; document: any } | null> {
  for (const collectionId of VALID_PATTERNS.collections) {
    try {
      const document = await databases.getDocument(DATABASE_ID, collectionId, userId);
      if (document) {
        return { collection: collectionId, document };
      }
    } catch (error: any) {
      if (error.code !== 404) {
        console.warn(`Error checking ${collectionId} collection:`, error);
      }
    }
  }
  return null;
}

/**
 * Helper function to update user profile safely
 */
export async function updateUserProfileSafely(userId: string, data: any): Promise<boolean> {
  // Validate status if provided
  if (data.status) {
    const statusValidation = validateStatusValue(data.status);
    if (!statusValidation.isValid) {
      console.error('Invalid status value:', statusValidation.errors);
      return false;
    }
  }

  const profile = await findUserProfileSafely(userId);
  if (!profile) {
    console.warn('No profile found for user:', userId);
    return false;
  }

  try {
    await databases.updateDocument(DATABASE_ID, profile.collection, userId, data);
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
}

// Make validation functions available globally for console access
if (typeof window !== 'undefined') {
  (window as any).validateMigration = runMigrationValidation;
  (window as any).validateCollections = validateCollectionsExist;
  (window as any).validateEnvVars = validateEnvironmentVariables;
  (window as any).findUserProfileSafely = findUserProfileSafely;
  (window as any).updateUserProfileSafely = updateUserProfileSafely;
}

export { DEPRECATED_PATTERNS, VALID_PATTERNS }; 