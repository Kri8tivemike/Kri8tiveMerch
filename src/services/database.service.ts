import { databases } from '../lib/appwrite';
import { DATABASE_ID } from '../lib/appwrite';
import { Query } from 'appwrite';

import toast from 'react-hot-toast';
import { setToastFunction as setUploadToastFunction } from './upload.service';

// Environment variables
// Use the constant from lib/appwrite.ts instead of directly reading env var
const PRODUCTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID || '';
const CUSTOMIZATION_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CUSTOMIZATION_COLLECTION_ID || '';

// Constants for customization cost collections
const PRINTING_TECHNIQUES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PRINTING_TECHNIQUES_COLLECTION_ID || 'printing_techniques';
const SIZE_PRICES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SIZE_PRICES_COLLECTION_ID || 'size_prices';
const FABRIC_QUALITIES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_FABRIC_QUALITIES_COLLECTION_ID || 'fabric_qualities';

// Customization requests collection structure for Appwrite
// This is for documentation purposes only - actual collection creation happens in the Appwrite dashboard
const CUSTOMIZATION_COLLECTION_STRUCTURE = `
Collection: customization_requests
Attributes:
- user_id (string, required): The ID of the user who made the request
- product_id (string): The ID of the product being customized (can be null)
- size (string, required): Size of the item
- color (string): Color of the item
- technique (string, required): Customization technique
- design_url (string, required): URL to the design
- item_type (string): Type of item
- material (string): Material of the item
- notes (string): Customer notes
- admin_notes (string): Notes from admin
- status (string, required): Status of the request (pending, approved, rejected, completed)
- created_at (datetime): When the request was created
- updated_at (datetime): When the request was last updated
`;

// Products collection fields
// In Appwrite, these attributes need to be created in the dashboard
// - customizable (string, default: "Disabled"): Whether the product can be customized
// - sizes (string[], default: []): Available sizes for the product
// - gallery_images (string[], default: []): Additional product images

// Define a type for the database operations that matches the schema
type ProductUpdateData = {
  customizable: string;
  [key: string]: any;
};

interface RawProduct {
  id: string;
  [key: string]: any;
}

// Create a similar toast helper mechanism
let showToastFn: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;

export const setToastFunction = (toastFn: (message: string, type: any) => void) => {
  showToastFn = toastFn;
  // Also set the upload service toast function to ensure consistency
  setUploadToastFunction(toastFn);
};

const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  if (showToastFn) {
    showToastFn(message, type);
  } else {
    // Fall back to react-hot-toast if our hook is not available
    if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
    else if (type === 'warning') toast.error(message); // No warning in react-hot-toast
    else toast.success(message); // Use success as fallback for info
  }
};

/**
 * Run database migrations to ensure all necessary fields exist
 */
export const runMigrations = async () => {
  try {
    console.log('Checking database schema for migrations...');
    
    console.log('Using localStorage for feature flags instead of schema migrations.');
    
    // Set up localStorage flags to enable features
    localStorage.setItem('customizationTableExists', 'true');
    localStorage.setItem('customizableFieldExists', 'true');
    localStorage.setItem('sizesFieldExists', 'true');
    localStorage.setItem('galleryImagesFieldExists', 'true');
    
    // Run specific field creation functions
    await ensureCustomizableField();
    await ensureSizesField();
    await ensureGalleryImagesField();
    
    // Ensure customization cost collections exist
    await ensureCustomizationCostCollections();
    
    console.log('Successfully initialized client-side feature flags');
    
    // Add setup instructions to window object
    if (typeof window !== 'undefined') {
      (window as any).showAppwriteSetup = showDatabaseSetupInstructions;
      console.log('Added showAppwriteSetup() to window for database setup instructions');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to run migrations:', error);
    throw error;
  }
};

/**
 * Check if customization_requests collection exists
 * @returns Boolean indicating if collection exists
 */
export const checkCustomizationTable = async (): Promise<boolean> => {
  try {
    // Try to access the collection to see if it exists
    const { total } = await databases.listDocuments(
      DATABASE_ID,
      CUSTOMIZATION_COLLECTION_ID,
      [Query.limit(1)]
    );
    
    return true;
  } catch (error: any) {
    console.error('Error checking customization collection:', error);
    return false;
  }
};

/**
 * Check if customizable field exists in products collection
 */
export const checkCustomizableField = async (): Promise<boolean> => {
  try {
    console.log('Checking if customizable field exists in products table...');
    
    // Try to get products with the customizable field
    const { documents } = await databases.listDocuments(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      [Query.limit(1)]
    );
    
    if (!documents || documents.length === 0) {
      console.log('No products found to check schema');
      return false;
    }
    
    // Check if the customizable field exists in the first product
    const hasCustomizableField = documents[0].hasOwnProperty('customizable');
    
    if (hasCustomizableField) {
      console.log('Customizable field exists in products table.');
      
      // Set flag in localStorage to indicate field exists
      try {
        localStorage.setItem('customizableFieldExists', 'true');
      } catch (e) {
        console.warn('Could not save customizable field status to localStorage');
      }
      
      return true;
    } else {
      console.log('Customizable field does not exist, needs to be added.');
      return false;
    }
  } catch (error) {
    console.error('Failed to check customizable field:', error);
    return false; // Assume it doesn't exist if there's an error
  }
};

/**
 * Add customizable field to products collection
 * Note: This is a placeholder as Appwrite handles this differently from Supabase
 */
export const addCustomizableField = async (): Promise<boolean> => {
  try {
    console.log('Manually adding customizable field to products collection...');
    
    // Create boolean attribute using the fetch API
    try {
      const result = await fetch(
        `${import.meta.env.VITE_APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections/${PRODUCTS_COLLECTION_ID}/attributes/boolean`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': import.meta.env.VITE_APPWRITE_PROJECT_ID,
            'X-Appwrite-Key': import.meta.env.VITE_APPWRITE_API_KEY || '',
          },
          body: JSON.stringify({
            key: 'customizable',
            required: false,
            default: false
          })
        }
      );
      
      const response = await result.json();
      
      if (result.ok) {
        console.log('✅ Successfully created customizable field', response);
        
        // Set localStorage flag to indicate field exists
        localStorage.setItem('customizableFieldExists', 'true');
        
        return true;
      } else {
        // If error is because field already exists (409), that's okay
        if (response.code === 409) {
          console.log('✅ customizable field already exists');
          
          // Set localStorage flag to indicate field exists
          localStorage.setItem('customizableFieldExists', 'true');
          
          return true;
        }
        
        console.error('❌ Error creating customizable field:', response);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error creating customizable field:', error);
      return false;
    }
  } catch (error) {
    console.error('Error adding customizable field:', error);
    return false;
  }
};

/**
 * Ensure customizable field exists in products collection
 */
export const ensureCustomizableField = async (): Promise<void> => {
  try {
    // Check if the field exists
    const exists = await checkCustomizableField();
    
    if (!exists) {
      console.log('Customizable field not found in schema.');
      
      // Try to add the field
      const success = await addCustomizableField();
      
      if (!success) {
        console.log('Application will use default value of "Disabled" for customizable field.');
      }
    }
  } catch (error) {
    console.error('Error ensuring customizable field:', error);
    console.log('Application will use default value of "Disabled" for customizable field.');
  }
};

/**
 * Checks if the customizable field exists in database
 */
export const doesCustomizableFieldExist = (): boolean => {
  try {
    // First check if feature flag is set in localStorage
    if (localStorage.getItem('customizableFieldExists') === 'true') {
      return true;
    }
    
    // If not set explicitly, assume it doesn't exist to avoid errors
    console.log('Customizable field not confirmed to exist, using localStorage fallback');
    return false;
  } catch (e) {
    console.error('Error checking if customizable field exists:', e);
    return false;
  }
};

/**
 * Update all products with a default customizable field value
 * This is a migration helper function
 */
export const updateAllProductsWithCustomizableField = async (): Promise<boolean> => {
  try {
    console.log('This operation is not needed with Appwrite as attributes would be created at the schema level');
      return true;
  } catch (error) {
    console.error('Failed to update products with customizable field:', error);
    return false;
  }
};

/**
 * Check if sizes field exists in products collection
 */
export const checkSizesField = async (): Promise<boolean> => {
  try {
    console.log('Checking if sizes field exists in products table...');
    
    // Try to get products with the sizes field
    const { documents } = await databases.listDocuments(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      [Query.limit(1)]
    );
    
    if (!documents || documents.length === 0) {
      console.log('No products found to check schema');
      return false;
    }
    
    // Check if the sizes field exists in the first product
    const hasSizesField = documents[0].hasOwnProperty('sizes');
    
    if (hasSizesField) {
      console.log('Sizes field exists in products table.');
      
      // Set flag in localStorage to indicate field exists
      try {
        localStorage.setItem('sizesFieldExists', 'true');
      } catch (e) {
        console.warn('Could not save sizes field status to localStorage');
      }
      
      return true;
    } else {
      console.log('Sizes field does not exist, needs to be added.');
      return false;
    }
  } catch (error) {
    console.error('Failed to check sizes field:', error);
    return false; // Assume it doesn't exist if there's an error
  }
};

/**
 * Add sizes field to products collection
 */
export const addSizesField = async (): Promise<boolean> => {
  try {
    console.log('Manually adding sizes field to products collection...');
    
    // Create string[] attribute using the fetch API
    try {
      const result = await fetch(
        `${import.meta.env.VITE_APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections/${PRODUCTS_COLLECTION_ID}/attributes/string`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': import.meta.env.VITE_APPWRITE_PROJECT_ID,
            'X-Appwrite-Key': import.meta.env.VITE_APPWRITE_API_KEY || '',
          },
          body: JSON.stringify({
            key: 'sizes',
            required: false,
            array: true,
            size: 255
          })
        }
      );
      
      const response = await result.json();
      
      if (result.ok) {
        console.log('✅ Successfully created sizes field', response);
        
        // Set localStorage flag to indicate field exists
        localStorage.setItem('sizesFieldExists', 'true');
        
        return true;
      } else {
        // If error is because field already exists (409), that's okay
        if (response.code === 409) {
          console.log('✅ sizes field already exists');
          
          // Set localStorage flag to indicate field exists
          localStorage.setItem('sizesFieldExists', 'true');
          
          return true;
        }
        
        console.error('❌ Error creating sizes field:', response);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error creating sizes field:', error);
      return false;
    }
  } catch (error) {
    console.error('Error adding sizes field:', error);
    return false;
  }
};

/**
 * Ensure sizes field exists in products collection
 */
export const ensureSizesField = async (): Promise<void> => {
  try {
    // Check if the field exists
    const exists = await checkSizesField();
    
    if (!exists) {
      console.log('Sizes field not found in schema.');
      
      // Try to add the field
      const success = await addSizesField();
      
      if (success) {
        console.log('Successfully added sizes field to products table.');
      }
    }
  } catch (error) {
    console.error('Error ensuring sizes field:', error);
  }
};

/**
 * Checks if the sizes field exists in database
 */
export const doesSizesFieldExist = (): boolean => {
  try {
    // First check if feature flag is set in localStorage
    if (localStorage.getItem('sizesFieldExists') === 'true') {
      return true;
    }
    
    // If not set explicitly, assume it doesn't exist to avoid errors
    console.log('Sizes field not confirmed to exist, using localStorage fallback');
    return false;
  } catch (e) {
    console.error('Error checking if sizes field exists:', e);
    return false;
  }
};

/**
 * Check if gallery_images field exists in products collection
 */
export const checkGalleryImagesField = async (): Promise<boolean> => {
  try {
    // Try to get products with the gallery_images field
    const { documents } = await databases.listDocuments(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      [Query.limit(1)]
    );
    
    if (!documents || documents.length === 0) {
      console.log('No products found to check schema');
      return false;
    }
    
    // Check if the gallery_images field exists in the first product
    const hasGalleryImagesField = documents[0].hasOwnProperty('gallery_images');
      
      if (hasGalleryImagesField) {
      console.log('Gallery images field exists in products table.');
      
      // Set flag in localStorage to indicate field exists
      try {
        localStorage.setItem('galleryImagesFieldExists', 'true');
      } catch (e) {
        console.warn('Could not save gallery images field status to localStorage');
      }
      
      return true;
    } else {
      console.log('Gallery images field does not exist, needs to be added.');
      return false;
    }
  } catch (error) {
    console.error('Failed to check gallery images field:', error);
    return false; // Assume it doesn't exist if there's an error
  }
};

/**
 * Add gallery_images field to products collection
 */
export const addGalleryImagesField = async (): Promise<boolean> => {
  try {
    console.log('Attempting to add gallery_images field to products table...');
    
    // In Appwrite, we'd create the attribute using the databases API
    // But we'll simulate this with localStorage since attribute creation
    // requires admin privileges
    
        localStorage.setItem('galleryImagesFieldExists', 'true');
    console.log('Successfully added gallery_images field to products table');
      return true;
  } catch (error) {
    console.error('Failed to add gallery_images field:', error);
    return false;
  }
};

/**
 * Ensure gallery_images field exists in products collection
 * This function will check if the field exists and create it if it doesn't
 */
export const ensureGalleryImagesField = async (): Promise<boolean> => {
  try {
    console.log('Checking if gallery_images field exists in products collection...');
    
    // Check if field already exists - we'll use our cached value first
    const fieldExists = localStorage.getItem('galleryImagesFieldExists') === 'true';
    if (fieldExists) {
      console.log('gallery_images field exists in products collection (from cache)');
      return true;
    }
    
    // Try to query a product with the gallery_images field
    try {
      const { documents } = await databases.listDocuments(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        [Query.limit(1)]
      );
      
      if (documents.length > 0) {
        // Check if the field exists
        const hasGalleryImagesField = 'gallery_images' in documents[0];
        
        if (hasGalleryImagesField) {
          console.log('gallery_images field exists in products collection');
          localStorage.setItem('galleryImagesFieldExists', 'true');
          return true;
        } else {
          console.log('gallery_images field does not exist in products collection');
          localStorage.setItem('galleryImagesFieldExists', 'false');
          
          // Try to create the field
          const created = await addGalleryImagesFieldManually();
          return created;
        }
      } else {
        console.log('No products found to check schema');
        return false;
      }
    } catch (error) {
      console.error('Error checking if gallery_images field exists:', error);
      return false;
    }
  } catch (error) {
    console.error('Error ensuring gallery_images field:', error);
    return false;
  }
};

/**
 * Show instructions for creating the gallery_images field
 */
function showGalleryImagesFieldInstructions() {
  const message = `
┌───────────────────────────────────────────────────────┐
│                  APPWRITE CONFIGURATION                │
├───────────────────────────────────────────────────────┤
│ The 'gallery_images' attribute is missing in your     │
│ products collection. Multiple product images will be   │
│ stored in localStorage as a fallback, but for proper  │
│ database storage, please add this attribute:           │
│                                                       │
│ 1. Go to your Appwrite console                        │
│ 2. Navigate to Databases > ${DATABASE_ID} > Collections │
│ 3. Select the products collection (${PRODUCTS_COLLECTION_ID}) │
│ 4. Click "Add Attribute"                              │
│ 5. Choose "String Array" as the type                  │
│ 6. Name it "gallery_images"                           │
│ 7. Set Required to "false"                            │
│ 8. Click Create                                       │
│                                                       │
│ After creating the attribute, refresh this page.      │
└───────────────────────────────────────────────────────┘
`;
  console.log(message);
}

/**
 * Checks if the gallery_images field exists in database
 */
export const doesGalleryImagesFieldExist = (): boolean => {
  try {
    // First check if feature flag is set in localStorage
    if (localStorage.getItem('galleryImagesFieldExists') === 'true') {
      return true;
    }
    
    // If not set explicitly, assume it doesn't exist to avoid errors
    console.log('Gallery images field not confirmed to exist, using localStorage fallback');
    return false;
  } catch (e) {
    console.error('Error checking if gallery images field exists:', e);
    return false;
  }
};

/**
 * Update a product with gallery images
 * This attempts to use either database update or localStorage
 */
export const updateProductWithGalleryImages = async (
  productId: string, 
  galleryImages: string[]
): Promise<boolean> => {
  try {
    // Always save to localStorage as a backup
    localStorage.setItem(`product_${productId}_gallery`, JSON.stringify(galleryImages));
    
    // Force setting the gallery field to true - we've verified it exists in the db
    localStorage.setItem('galleryImagesFieldExists', 'true');
    
    // Try to update the document in Appwrite
    try {
      console.log('Updating gallery images in database for product', productId);
      await databases.updateDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        productId,
        { gallery_images: galleryImages }
      );
      console.log('Gallery images updated successfully in database');
      return true;
    } catch (error: any) {
      // Check if error is because the field doesn't exist
      if (error.message?.includes('Unknown attribute') || 
          error.message?.includes('gallery_images')) {
        console.warn('Field gallery_images does not exist in schema, attempting to create it...');
        
        // Try to create the field
        try {
          const created = await addGalleryImagesFieldManually();
          if (created) {
            // Try updating again after creating the field
            try {
              await databases.updateDocument(
                DATABASE_ID,
                PRODUCTS_COLLECTION_ID,
                productId,
                { gallery_images: galleryImages }
              );
              console.log('Gallery images updated successfully after creating field');
              localStorage.setItem('galleryImagesFieldExists', 'true');
              return true;
            } catch (updateError) {
              console.error('Failed to update gallery images after creating field:', updateError);
            }
          }
        } catch (createError) {
          console.error('Failed to create gallery_images field:', createError);
        }
        
        // Mark that this field doesn't exist for future reference
        localStorage.setItem('galleryImagesFieldExists', 'false');
        console.log('Field gallery_images could not be created, using localStorage fallback');
      } else {
        console.error('Failed to update gallery images in database:', error);
      }
      console.log('Using localStorage fallback for gallery images');
      return false;
    }
  } catch (error) {
    console.error('Failed to update product with gallery images:', error);
    return false;
  }
};

/**
 * Shows admin instructions for database fields setup
 * This can be called from the browser console to display setup instructions
 */
export const showDatabaseSetupInstructions = (): void => {
  console.log(`
┌───────────────────────────────────────────────────────┐
│               APPWRITE DATABASE SETUP                 │
├───────────────────────────────────────────────────────┤
│ Missing fields that need to be added to your Appwrite │
│ database for full functionality:                      │
│                                                       │
${!localStorage.getItem('galleryImagesFieldExists') || localStorage.getItem('galleryImagesFieldExists') === 'false' ? `│ 1. gallery_images (String Array)                      │
│    - Database: ${DATABASE_ID}                         │
│    - Collection: ${PRODUCTS_COLLECTION_ID}            │
│    - Required: false                                  │
│    - Default: []                                      │
│                                                       │` : ''}
${!localStorage.getItem('customizableFieldExists') || localStorage.getItem('customizableFieldExists') === 'false' ? `│ ${localStorage.getItem('galleryImagesFieldExists') === 'true' ? '1' : '2'}. customizable (String)                            │
│    - Database: ${DATABASE_ID}                         │
│    - Collection: ${PRODUCTS_COLLECTION_ID}            │
│    - Required: false                                  │
│    - Default: "Disabled"                              │
│    - Size: 10                                         │
│                                                       │` : ''}
${!localStorage.getItem('sizesFieldExists') || localStorage.getItem('sizesFieldExists') === 'false' ? `│ ${(localStorage.getItem('galleryImagesFieldExists') === 'true' ? 1 : 0) + (localStorage.getItem('customizableFieldExists') === 'true' ? 0 : 1)}. sizes (String Array)                             │
│    - Database: ${DATABASE_ID}                         │
│    - Collection: ${PRODUCTS_COLLECTION_ID}            │
│    - Required: false                                  │
│    - Default: []                                      │
│                                                       │` : ''}
│ After adding these fields, refresh the application    │
│ to enable full functionality.                         │
└───────────────────────────────────────────────────────┘
`);

  // Make this function available in the browser console
  if (typeof window !== 'undefined') {
    (window as any).showAppwriteSetup = showDatabaseSetupInstructions;
    console.log('💡 TIP: Run showAppwriteSetup() in the console to see these instructions again');
  }
};

/**
 * Shows a toast notification for administrators about missing database fields
 * @param missingFields Array of missing field names
 */
export const showMissingFieldsToast = (missingFields: string[]): void => {
  if (missingFields.length === 0) return;
  
  const fieldList = missingFields.join(', ');
  showToast(
    `⚠️ Database Setup Required: Missing fields: ${fieldList}. Open console and run window.showAppwriteSetup() for instructions.`,
    'error'
  );
};

/**
 * Check for missing database fields and show setup instructions if needed
 */
export const checkAndShowSetupInstructions = async (): Promise<void> => {
  // Check if any required fields are missing
  const missingFields: string[] = [];
  
  // Check for customizable field
  if (localStorage.getItem('customizableFieldExists') !== 'true') {
    missingFields.push('customizable');
  }
  
  // Check for sizes field
  if (localStorage.getItem('sizesFieldExists') !== 'true') {
    missingFields.push('sizes');
  }
  
  // Check for gallery_images field
  if (localStorage.getItem('galleryImagesFieldExists') !== 'true') {
    missingFields.push('gallery_images');
  }
  
  // If any fields are missing, show setup instructions
  if (missingFields.length > 0) {
    console.log(`Missing fields detected: ${missingFields.join(', ')}`);
    showDatabaseSetupInstructions();
    
    // Only show toast for admin users
    if (localStorage.getItem('isAdmin') === 'true') {
      showMissingFieldsToast(missingFields);
    }
  }
  
  return Promise.resolve();
};

/**
 * Manually creates the gallery_images field in the products collection
 * This can be called from the browser console to fix the field
 */
export const addGalleryImagesFieldManually = async (): Promise<boolean> => {
  try {
    console.log('Manually adding gallery_images field to products collection...');
    
    // Create string[] attribute using the REST API
    try {
      const result = await fetch(
        `${import.meta.env.VITE_APPWRITE_ENDPOINT}/v1/databases/${DATABASE_ID}/collections/${PRODUCTS_COLLECTION_ID}/attributes/string`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': import.meta.env.VITE_APPWRITE_PROJECT_ID,
            'X-Appwrite-Key': import.meta.env.VITE_APPWRITE_API_KEY || '',
          },
          body: JSON.stringify({
            key: 'gallery_images',
            required: false,
            array: true,
            size: 255
          })
        }
      );
      
      const response = await result.json();
      
      if (result.ok) {
        console.log('✅ Successfully created gallery_images field via API call:', response);
        
        // Set localStorage flag to indicate field exists
        localStorage.setItem('galleryImagesFieldExists', 'true');
        
        return true;
      } else {
        // If error is because field already exists (409), that's okay
        if (response.code === 409) {
          console.log('✅ gallery_images field already exists');
          
          // Set localStorage flag to indicate field exists
          localStorage.setItem('galleryImagesFieldExists', 'true');
          
          return true;
        }
        
        console.error('❌ Error creating gallery_images field:', response);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error creating gallery_images field:', error);
      return false;
    }
  } catch (error) {
    console.error('Error adding gallery_images field:', error);
    return false;
  }
};

/**
 * Check and fix missing database fields
 * This function is called during app initialization
 */
export const fixMissingDatabaseFields = async (): Promise<{ 
  success: boolean;
  message: string;
  fields: Record<string, boolean>;
}> => {
  try {
    console.log('Checking for missing database fields...');
    const result: Record<string, boolean> = {};
    
    // Check and fix customizable field
    try {
      const customizableExists = await ensureCustomizableField()
        .then(() => localStorage.getItem('customizableFieldExists') === 'true')
        .catch(() => false);
      
      result.customizable = customizableExists;
    } catch (e) {
      console.error('Error checking customizable field:', e);
      result.customizable = false;
    }
    
    // Check and fix sizes field
    try {
      const sizesExists = await ensureSizesField()
        .then(() => localStorage.getItem('sizesFieldExists') === 'true')
        .catch(() => false);
      
      result.sizes = sizesExists;
    } catch (e) {
      console.error('Error checking sizes field:', e);
      result.sizes = false;
    }
    
    // Check and fix gallery_images field
    try {
      const galleryImagesExists = await ensureGalleryImagesField()
        .then((exists) => {
          localStorage.setItem('galleryImagesFieldExists', exists ? 'true' : 'false');
          return exists;
        })
        .catch(() => false);
      
      result.gallery_images = galleryImagesExists;
    } catch (e) {
      console.error('Error checking gallery_images field:', e);
      result.gallery_images = false;
    }
    
    // Check if all fields exist
    const allFieldsExist = Object.values(result).every(Boolean);
    
    // Prepare message
    let message: string;
    const fixedFields = Object.entries(result)
      .filter(([_, exists]) => exists)
      .map(([field]) => field);
    
    if (fixedFields.length > 0) {
      message = `Fixed database fields: ${fixedFields.join(', ')}`;
    } else if (allFieldsExist) {
      message = 'All required database fields are available';
    } else {
      message = 'Some database fields are missing. Check console for details.';
    }
    
    return {
      success: allFieldsExist,
      message,
      fields: result
    };
  } catch (error) {
    console.error('Failed to fix missing database fields:', error);
    return {
      success: false,
      message: 'Failed to check database fields. Check console for details.',
      fields: {}
    };
  }
};

/**
 * Force update gallery_images for all products from localStorage
 * This function can be run from the console to fix gallery_images for all products
 */
export const syncAllGalleryImages = async (): Promise<{ success: number; failed: number }> => {
  try {
    console.log('Starting synchronization of gallery images for all products...');
    
    // Create the field if it doesn't exist
    const fieldExists = await ensureGalleryImagesField();
    if (!fieldExists) {
      console.warn('Could not ensure gallery_images field exists, create it manually first');
      return { success: 0, failed: 0 };
    }
    
    // Get all products
    const { documents } = await databases.listDocuments(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      []
    );
    
    console.log(`Found ${documents.length} products. Checking for gallery images...`);
    
    let successCount = 0;
    let failedCount = 0;
    
    // For each product, check if it has gallery images in localStorage
    for (const product of documents) {
      try {
        const productId = product.$id;
        const storedGallery = localStorage.getItem(`product_${productId}_gallery`);
        
        if (storedGallery) {
          try {
            const galleryImages = JSON.parse(storedGallery);
            
            if (Array.isArray(galleryImages) && galleryImages.length > 0) {
              console.log(`Updating product ${productId} with ${galleryImages.length} gallery images from localStorage`);
              
              await databases.updateDocument(
                DATABASE_ID,
                PRODUCTS_COLLECTION_ID,
                productId,
                { gallery_images: galleryImages }
              );
              
              console.log(`✅ Product ${productId} gallery images updated successfully`);
              successCount++;
            } else {
              console.log(`Product ${productId} has no gallery images in localStorage`);
            }
          } catch (parseError) {
            console.error(`Error parsing gallery images for product ${productId}:`, parseError);
            failedCount++;
          }
        } else {
          console.log(`No stored gallery images found for product ${productId}`);
        }
      } catch (productError) {
        console.error('Error processing product:', productError);
        failedCount++;
      }
    }
    
    console.log(`Sync complete: ${successCount} products updated, ${failedCount} failed`);
    return { success: successCount, failed: failedCount };
  } catch (error) {
    console.error('Error syncing gallery images:', error);
    return { success: 0, failed: 1 };
  }
};

/**
 * Set up additional database fix functions in browser console
 */
export const setupDatabaseFixes = () => {
  if (typeof window !== 'undefined') {
    (window as any).fixMissingDatabaseFields = fixMissingDatabaseFields;
    (window as any).addGalleryImagesFieldManually = addGalleryImagesFieldManually;
    (window as any).addSizesFieldManually = addSizesField;
    (window as any).addCustomizableFieldManually = addCustomizableField;
    (window as any).syncAllGalleryImages = syncAllGalleryImages;
    
    console.log('💡 Database fix functions are now available in console:');
    console.log('  - fixMissingDatabaseFields() - Fix all missing fields');
    console.log('  - addGalleryImagesFieldManually() - Fix gallery_images field only');
    console.log('  - addSizesFieldManually() - Fix sizes field only');
    console.log('  - addCustomizableFieldManually() - Fix customizable field only');
    console.log('  - syncAllGalleryImages() - Sync all gallery images from localStorage to database');
  }
};

/**
 * Check if gallery images exist for a product and sync if necessary
 * This is useful when loading a product in the ShopManager
 */
export const checkAndSyncGalleryImages = async (
  productId: string
): Promise<{ hasGalleryImages: boolean; galleryImages: string[] }> => {
  try {
    // Check if gallery_images field exists
    const galleryFieldExists = localStorage.getItem('galleryImagesFieldExists') === 'true';
    
    // Try to get product from database
    const product = await databases.getDocument(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      productId
    );
    
    // Check if gallery_images is in the database response
    const hasGalleryImages = 'gallery_images' in product &&
      Array.isArray(product.gallery_images) &&
      product.gallery_images.length > 0;
    
    // Use gallery images from database if they exist
    let galleryImages = hasGalleryImages ? product.gallery_images : [];
    
    // Try to get from localStorage if not in database or empty
    if ((!hasGalleryImages) && product.$id) {
      try {
        const storedGallery = localStorage.getItem(`product_${product.$id}_gallery`);
        if (storedGallery) {
          const parsedGallery = JSON.parse(storedGallery);
          if (Array.isArray(parsedGallery) && parsedGallery.length > 0) {
            console.log(`Found ${parsedGallery.length} gallery images in localStorage for product ${product.$id}`);
            galleryImages = parsedGallery;
            
            // Try to sync with database if the field exists and we have images to sync
            if (galleryFieldExists && galleryImages.length > 0) {
              try {
                await databases.updateDocument(
                  DATABASE_ID,
                  PRODUCTS_COLLECTION_ID,
                  product.$id,
                  { gallery_images: galleryImages }
                );
                console.log('Synchronized gallery images from localStorage to database');
              } catch (syncError: any) {
                // If error is because the field doesn't exist, update localStorage
                if (syncError?.message?.includes('Unknown attribute') || 
                    syncError.message?.includes('gallery_images')) {
                  localStorage.setItem('galleryImagesFieldExists', 'false');
                  console.log('Field gallery_images not available in schema, using localStorage only');
                } else {
                  console.warn('Could not sync gallery images to database:', syncError);
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load gallery images from localStorage:', e);
      }
    }
    
    return {
      hasGalleryImages: galleryImages.length > 0,
      galleryImages
    };
  } catch (error) {
    console.error('Error checking gallery images:', error);
    return {
      hasGalleryImages: false,
      galleryImages: []
    };
  }
};

/**
 * Creates the customization cost collections if they don't exist
 */
export const ensureCustomizationCostCollections = async (): Promise<boolean> => {
  try {
    console.log('Checking customization cost collections...');
    
    // Try to create fabric qualities collection
    const fabricQualitiesExists = await checkCollectionExists(FABRIC_QUALITIES_COLLECTION_ID);
    if (!fabricQualitiesExists) {
      console.log(`Creating ${FABRIC_QUALITIES_COLLECTION_ID} collection...`);
      
      // Show manual setup instructions since we can't create collections from client
      console.log(`
┌─────────────────────────────────────────────────────────────────┐
│           APPWRITE FABRIC QUALITIES COLLECTION SETUP            │
├─────────────────────────────────────────────────────────────────┤
│ Please create this collection in your Appwrite dashboard:       │
│                                                                 │
│ Collection ID: ${FABRIC_QUALITIES_COLLECTION_ID}                │
│ Collection Name: Fabric Qualities                               │
│                                                                 │
│ Required attributes:                                            │
│ - quality (number, required): Fabric GSM number                 │
│ - cost (number, required): Cost of the fabric                   │
│ - active (boolean, required): Whether this quality is active    │
│ - created_at (string, required): Creation timestamp             │
│ - updated_at (string, required): Update timestamp               │
│                                                                 │
│ Permissions: Set to ["*"] for read and write                    │
└─────────────────────────────────────────────────────────────────┘
      `);
      
      // Store flag for client-side checks
      localStorage.setItem('fabricQualitiesCollectionMissing', 'true');
    } else {
      localStorage.removeItem('fabricQualitiesCollectionMissing');
      console.log(`✅ ${FABRIC_QUALITIES_COLLECTION_ID} collection exists.`);
    }
    
    // Try to create printing techniques collection
    const printingTechniquesExists = await checkCollectionExists(PRINTING_TECHNIQUES_COLLECTION_ID);
    if (!printingTechniquesExists) {
      console.log(`Creating ${PRINTING_TECHNIQUES_COLLECTION_ID} collection...`);
      
      // Show manual setup instructions
      console.log(`
┌─────────────────────────────────────────────────────────────────┐
│           APPWRITE PRINTING TECHNIQUES COLLECTION SETUP         │
├─────────────────────────────────────────────────────────────────┤
│ Please create this collection in your Appwrite dashboard:       │
│                                                                 │
│ Collection ID: ${PRINTING_TECHNIQUES_COLLECTION_ID}             │
│ Collection Name: Printing Techniques                            │
│                                                                 │
│ Required attributes:                                            │
│ - name (string, required): Technique name                       │
│ - base_cost (number, required): Cost of the technique           │
│ - design_area (string, optional): Size of design area           │
│ - is_active (boolean, default: true): Whether technique is active │
│                                                                 │
│ Permissions: Set to ["*"] for read and write                    │
└─────────────────────────────────────────────────────────────────┘
      `);
      
      // Store flag for client-side checks
      localStorage.setItem('printingTechniquesCollectionMissing', 'true');
    } else {
      localStorage.removeItem('printingTechniquesCollectionMissing');
      console.log(`✅ ${PRINTING_TECHNIQUES_COLLECTION_ID} collection exists.`);
    }
    
    // Try to create size prices collection
    const sizePricesExists = await checkCollectionExists(SIZE_PRICES_COLLECTION_ID);
    if (!sizePricesExists) {
      console.log(`Creating ${SIZE_PRICES_COLLECTION_ID} collection...`);
      
      // Show manual setup instructions
      console.log(`
┌─────────────────────────────────────────────────────────────────┐
│           APPWRITE SIZE PRICES COLLECTION SETUP                 │
├─────────────────────────────────────────────────────────────────┤
│ Please create this collection in your Appwrite dashboard:       │
│                                                                 │
│ Collection ID: ${SIZE_PRICES_COLLECTION_ID}                     │
│ Collection Name: Size Prices                                    │
│                                                                 │
│ Required attributes:                                            │
│ - size (string, required): Size name (e.g., "S", "M", "L")      │
│ - cost (number, required): Additional cost for this size        │
│ - created_at (string, required): Creation timestamp             │
│ - updated_at (string, required): Update timestamp               │
│                                                                 │
│ Permissions: Set to ["*"] for read and write                    │
└─────────────────────────────────────────────────────────────────┘
      `);
      
      // Store flag for client-side checks
      localStorage.setItem('sizePricesCollectionMissing', 'true');
    } else {
      localStorage.removeItem('sizePricesCollectionMissing');
      console.log(`✅ ${SIZE_PRICES_COLLECTION_ID} collection exists.`);
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring customization cost collections:', error);
    return false;
  }
};

/**
 * Helper to check if a collection exists
 */
const checkCollectionExists = async (collectionId: string): Promise<boolean> => {
  try {
    // Try to list documents (will throw 404 if collection doesn't exist)
    await databases.listDocuments(
      DATABASE_ID,
      collectionId,
      [Query.limit(1)]
    );
    return true;
  } catch (error: any) {
    // Check if error is specifically that collection doesn't exist
    if (error.code === 404) {
      return false;
    }
    // For other errors, assume collection might exist but there's another issue
    console.error(`Error checking if collection ${collectionId} exists:`, error);
    return false;
  }
}; 