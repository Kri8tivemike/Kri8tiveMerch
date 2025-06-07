/**
 * Schema Fix Utility Functions
 * 
 * This module provides browser-callable functions to fix database schema issues.
 * These functions can be called from the console in development environments.
 */


// Environment variables
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
const CUSTOMIZATION_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CUSTOMIZATION_COLLECTION_ID || 'customization_requests';
const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || '';
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

/**
 * Helper function to create an attribute using direct REST API calls
 * This is more reliable than using the SDK which might have TypeScript issues
 */
async function createAttribute(attributeType: string, key: string, options: any = {}): Promise<boolean> {
  try {
    console.log(`Creating ${attributeType} attribute: ${key}...`);
    
    // Fetch auth cookies from current session
    const response = await fetch(
      `${ENDPOINT}/databases/${DATABASE_ID}/collections/${CUSTOMIZATION_COLLECTION_ID}/attributes/${attributeType}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': PROJECT_ID,
        },
        credentials: 'include', // This sends the session cookie
        body: JSON.stringify({
          key,
          ...options
        })
      }
    );
    
    if (response.ok) {
      console.log(`✅ Successfully created ${key} attribute`);
      return true;
    } 
    
    // Check for already exists error
    if (response.status === 409) {
      console.log(`✅ Attribute ${key} already exists`);
      return true;
    }
    
    // Otherwise it's an error
    const errorData = await response.json();
    console.error(`❌ Error creating ${key} attribute:`, errorData);
    return false;
  } catch (error) {
    console.error(`❌ Error creating ${key} attribute:`, error);
    return false;
  }
}

/**
 * Fix the image_url attribute issue in customization_requests collection
 */
export async function fixImageUrlAttribute(): Promise<boolean> {
  try {
    console.log('Starting fix for image_url attribute...');
    
    return await createAttribute('url', 'image_url', {
      required: false
    });
  } catch (error) {
    console.error('❌ Image URL attribute fix failed:', error);
    return false;
  }
}

/**
 * Fix the material attribute issue in customization_requests collection
 */
export async function fixMaterialAttribute(): Promise<boolean> {
  try {
    console.log('Starting fix for material attribute...');
    
    return await createAttribute('string', 'material', {
      required: false,
      size: 100
    });
  } catch (error) {
    console.error('❌ Material attribute fix failed:', error);
    return false;
  }
}

/**
 * Fix technique attribute vs technique_name discrepancy
 */
export async function fixTechniqueAttributes(): Promise<boolean> {
  try {
    console.log('Starting fix for technique attributes...');
    
    // Add technique attribute if needed
    return await createAttribute('string', 'technique', {
      required: false,
      size: 100
    });
  } catch (error) {
    console.error('❌ Technique attribute fix failed:', error);
    return false;
  }
}

/**
 * Fix all schema issues in one function
 */
export async function fixAllSchemaIssues(): Promise<boolean> {
  console.log('Starting complete schema fix...');
  
  // Fix the image_url attribute first since it's causing the current error
  const imageUrlFixed = await fixImageUrlAttribute();
  const materialFixed = await fixMaterialAttribute();
  const techniqueFixed = await fixTechniqueAttributes();
  
  if (imageUrlFixed && materialFixed && techniqueFixed) {
    console.log('✅ All schema issues fixed successfully');
    return true;
  } else {
    console.warn('⚠️ Some schema fixes may have failed');
    console.log('Fix results:', { imageUrlFixed, materialFixed, techniqueFixed });
    return imageUrlFixed; // Return true if at least the image_url is fixed
  }
}

// Extend the Window interface to include our utility functions
declare global {
  interface Window {
    fixImageUrlAttribute: () => Promise<boolean>;
    fixMaterialAttribute: () => Promise<boolean>;
    fixTechniqueAttributes: () => Promise<boolean>;
    fixAllSchemaIssues: () => Promise<boolean>;
    fixCustomizationSchema: () => Promise<boolean>;
  }
}

// Add functions to window object for console access
if (typeof window !== 'undefined') {
  // Add to window for console access
  window.fixImageUrlAttribute = fixImageUrlAttribute;
  window.fixMaterialAttribute = fixMaterialAttribute;
  window.fixTechniqueAttributes = fixTechniqueAttributes;
  window.fixAllSchemaIssues = fixAllSchemaIssues;
  window.fixCustomizationSchema = fixAllSchemaIssues; // Alias for convenience
  
  console.log('Schema fix utilities loaded, you can now run:');
  console.log(' - window.fixImageUrlAttribute() - Fix image_url attribute issues');
  console.log(' - window.fixMaterialAttribute() - Fix material attribute issues');
  console.log(' - window.fixTechniqueAttributes() - Fix technique attribute issues');
  console.log(' - window.fixAllSchemaIssues() - Fix all schema issues');
  console.log(' - window.fixCustomizationSchema() - Alias for fixAllSchemaIssues');
}

const schemaFixes = {
  fixImageUrlAttribute,
  fixMaterialAttribute,
  fixTechniqueAttributes,
  fixAllSchemaIssues
};

export default schemaFixes; 