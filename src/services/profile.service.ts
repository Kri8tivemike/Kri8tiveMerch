import { account, databases, storage, ID } from '../lib/appwrite';
import { Query, Permission, Role } from 'appwrite';
// Database and collection IDs
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
const CUSTOMERS_COLLECTION_ID = 'customers';
const SHOP_MANAGERS_COLLECTION_ID = 'shop_managers';
const SUPER_ADMINS_COLLECTION_ID = 'super_admins';

// Define interfaces for Appwrite database attribute schemas
interface AppwriteAttribute {
  key: string;
  type: string;
  status: string;
  required: boolean;
  array: boolean;
  default?: any;
  size?: number;
  format?: string;
}

interface AttributesResponse {
  total: number;
  attributes: AppwriteAttribute[];
}

// Define the Profile interface
interface Profile {
  id: string;
  email?: string;
  name?: string;
  full_name?: string;
  role?: string;
  phone?: string;
  avatar_url?: string;
  whatsapp_number?: string;
  delivery_address?: string;
  emailVerified?: boolean;
  user_id?: string;
}

// Helper function to get database and collection IDs
const getDatabaseIds = () => {
  const databaseId = DATABASE_ID;
  const wishlistCollectionId = import.meta.env.VITE_APPWRITE_WISHLIST_COLLECTION_ID || '';
  const productsCollectionId = import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID || '';
  
  return {
    databaseId,
    wishlistCollectionId,
    productsCollectionId
  };
};

/**
 * Helper function to find user profile in role-based collections
 */
const findUserProfile = async (userId: string): Promise<{ collection: string; document: any } | null> => {
  const collections = [
    { id: SUPER_ADMINS_COLLECTION_ID, name: 'super_admins' },
    { id: SHOP_MANAGERS_COLLECTION_ID, name: 'shop_managers' },
    { id: CUSTOMERS_COLLECTION_ID, name: 'customers' }
  ];

  for (const collection of collections) {
    try {
      const document = await databases.getDocument(DATABASE_ID, collection.id, userId);
      if (document) {
        return { collection: collection.id, document };
      }
    } catch (error: any) {
      if (error.code !== 404) {
        console.warn(`Error checking ${collection.name} collection:`, error);
      }
    }
  }
  return null;
};

/**
 * Helper function to update user profile in the correct role-based collection
 */
const updateUserProfileInCollection = async (userId: string, data: any): Promise<any> => {
  const profile = await findUserProfile(userId);
  if (!profile) {
    throw new Error('User profile not found in any collection');
  }

  return await databases.updateDocument(DATABASE_ID, profile.collection, userId, data);
};

/**
 * Manages user wishlist items
 */
export async function addToWishlist(productId: string): Promise<void> {
  try {
    // Get current user
    const user = await account.get();
    if (!user) throw new Error('You must be logged in to add items to your wishlist');
    
    const { databaseId, wishlistCollectionId } = getDatabaseIds();
    
    try {
      // Check if item is already in wishlist
      const existingItems = await databases.listDocuments(
        databaseId,
        wishlistCollectionId,
        [
          Query.equal('user_id', user.$id),
          Query.equal('product_id', productId)
        ]
      );
      
      if (existingItems.documents && existingItems.documents.length > 0) {
        // Item is already in wishlist, no need to add it again
        return;
      }
      
      // Add to wishlist with document-level permissions
      await databases.createDocument(
        databaseId,
        wishlistCollectionId,
        ID.unique(),
        {
          user_id: user.$id,
          product_id: productId,
          created_at: new Date().toISOString()
        },
        [
          // These document permissions ensure only the creator can access
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id))
        ]
      );
    } catch (error: any) {
      // If permission error, log it but don't throw
      if (error.code === 401 || error.message?.includes('missing scope')) {
        console.warn('Permission error adding to wishlist. Check Appwrite collection permissions:', error.message);
        return;
      }
      // For other errors, rethrow
      throw error;
    }
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    throw error;
  }
}

/**
 * Cleans up invalid wishlist items that reference products that no longer exist
 */
export async function cleanupWishlist(): Promise<void> {
  try {
    // Get current user
    const user = await account.get();
    if (!user) return; // No user, no cleanup needed
    
    const { databaseId, wishlistCollectionId, productsCollectionId } = getDatabaseIds();
    
    // Get all wishlist items for the current user
    const response = await databases.listDocuments(
      databaseId,
      wishlistCollectionId,
      [Query.equal('user_id', user.$id)]
    );
    
    if (!response.documents || response.documents.length === 0) {
      return; // No wishlist items to clean up
    }
    
    // Check each wishlist item for product existence
    for (const item of response.documents) {
      try {
        // Try to get the product
        await databases.getDocument(
          databaseId,
          productsCollectionId,
          item.product_id
        );
        // If we get here, product exists
      } catch (error: any) {
        // If product doesn't exist, remove the wishlist item
        if (error.code === 404 || error.message?.includes('could not be found')) {
          try {
            await databases.deleteDocument(
              databaseId,
              wishlistCollectionId,
              item.$id
            );
            console.log(`Removed wishlist item for non-existent product: ${item.product_id}`);
          } catch (deleteError) {
            console.warn(`Failed to delete invalid wishlist item: ${item.$id}`, deleteError);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up wishlist:', error);
    // Don't throw the error, as this is a background process
  }
}

/**
 * Gets a user's wishlist items with product details
 */
export async function getUserWishlist(): Promise<any[]> {
  try {
    // Get current user
    const user = await account.get();
    if (!user) throw new Error('You must be logged in to view your wishlist');
    
    const { databaseId, wishlistCollectionId, productsCollectionId } = getDatabaseIds();
    
    try {
      // Get user wishlist items from Appwrite
      const response = await databases.listDocuments(
        databaseId,
        wishlistCollectionId,
        [
          Query.equal('user_id', user.$id)
        ]
      );
      
      if (response.documents && response.documents.length > 0) {
        // Track if we encountered any missing products
        let hasInvalidProducts = false;

        // Get product details for each wishlist item
        const wishlistWithDetails = await Promise.all(
          response.documents.map(async (item) => {
            try {
              // Get product details
              const productResponse = await databases.getDocument(
                databaseId,
                productsCollectionId,
                item.product_id
              );
              
              return {
                ...item,
                product: productResponse,
                productExists: true
              };
            } catch (error: any) {
              console.error(`Error fetching product ${item.product_id}:`, error);
              
              // Check if the error is because the product doesn't exist
              if (error.code === 404 || error.message?.includes('could not be found')) {
                hasInvalidProducts = true;
              }
              
              return {
                ...item,
                product: { 
                  name: 'Product not available', 
                  price: 0,
                  image_url: '',
                  description: 'This product has been removed from the store.'
                },
                productExists: false
              };
            }
          })
        );
        
        // If we found invalid products, trigger cleanup in the background
        if (hasInvalidProducts) {
          // Clean up in the background, don't wait for it
          setTimeout(() => {
            cleanupWishlist().catch(err => {
              console.warn('Background wishlist cleanup failed:', err);
            });
          }, 1000);
        }
        
        // Only return wishlist items for products that still exist
        return wishlistWithDetails.filter(item => item.productExists);
      }
    } catch (error: any) {
      // If permission error, log it but return empty array instead of throwing
      if (error.code === 401 || error.message?.includes('missing scope')) {
        console.warn('Permission error accessing wishlist. Check Appwrite collection permissions:', error.message);
        return [];
      }
      // For other errors, rethrow
      throw error;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    // Return empty array instead of throwing to prevent UI issues
    return [];
  }
}

/**
 * Removes an item from the user's wishlist
 */
export async function removeFromWishlist(wishlistItemId: string): Promise<void> {
  try {
    // Get current user
    const user = await account.get();
    if (!user) throw new Error('You must be logged in to remove items from your wishlist');
    
    const { databaseId, wishlistCollectionId } = getDatabaseIds();
    
    try {
      // Delete wishlist item
      await databases.deleteDocument(
        databaseId,
        wishlistCollectionId,
        wishlistItemId
      );
    } catch (error: any) {
      // If permission error, log it but don't throw
      if (error.code === 401 || error.message?.includes('missing scope')) {
        console.warn('Permission error removing from wishlist. Check Appwrite collection permissions:', error.message);
        return;
      }
      // If document not found, just ignore
      if (error.code === 404) {
        console.log('Wishlist item not found, may have been already removed:', wishlistItemId);
        return;
      }
      // For other errors, rethrow
      throw error;
    }
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    throw error;
  }
}

/**
 * Updates user profile information using role-based collections
 */
export const updateProfile = async (profileData: Partial<Profile>): Promise<Profile> => {
  try {
    console.log('Updating profile with data:', profileData);
    
    // Get user first to avoid promise in string context
    const user = await account.get();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    console.log('User ID:', user.$id);
    
    // Try to find the existing profile in role-based collections
    const existingProfile = await findUserProfile(user.$id);
    
    if (existingProfile) {
      console.log('Found existing profile:', existingProfile.document);
      
      // Prepare update data based on the collection schema
      const updateData: Record<string, any> = {};
      
      // Handle name fields - role-based collections use full_name
      if (profileData.full_name !== undefined) {
        updateData.full_name = profileData.full_name;
      }
      
      // Add email if available
      if (profileData.email !== undefined) {
        updateData.email = profileData.email;
      }
      
      // Add optional fields if provided - explicitly check for undefined
      // This allows saving empty strings to clear a field
      if (profileData.phone !== undefined) updateData.phone_number = profileData.phone;
      if (profileData.avatar_url !== undefined) updateData.avatar_url = profileData.avatar_url;
      if (profileData.whatsapp_number !== undefined) updateData.whatsapp_number = profileData.whatsapp_number;
      if (profileData.delivery_address !== undefined) updateData.delivery_address = profileData.delivery_address;
      
      // Add updated timestamp
      updateData.updated_at = new Date().toISOString();
      
      console.log('Updating profile with data:', updateData);
      
      try {
        const updatedProfile = await updateUserProfileInCollection(user.$id, updateData);
        
        return {
          id: updatedProfile.$id,
          email: updatedProfile.email,
          name: updatedProfile.full_name,
          full_name: updatedProfile.full_name,
          role: updatedProfile.role || 'Customer',
          phone: updatedProfile.phone_number,
          avatar_url: updatedProfile.avatar_url,
          whatsapp_number: updatedProfile.whatsapp_number,
          delivery_address: updatedProfile.delivery_address,
          emailVerified: user.emailVerification || false,
          user_id: user.$id,
        };
      } catch (updateError: any) {
        // Handle "Unknown attribute" errors
        if (updateError.message && updateError.message.includes('Unknown attribute')) {
          console.warn('Unknown attribute error:', updateError.message);
          // Remove the problematic field and try again
          const unknownAttrMatch = updateError.message.match(/Unknown attribute: "([^"]+)"/);
          if (unknownAttrMatch && unknownAttrMatch[1]) {
            const problematicField = unknownAttrMatch[1];
            console.log(`Removing problematic field ${problematicField} and retrying update`);
            delete updateData[problematicField];
            
            // Try updating again without the problematic field
            const retryUpdate = await updateUserProfileInCollection(user.$id, updateData);
            
            // Return with basic profile data
            return {
              id: retryUpdate.$id,
              email: retryUpdate.email,
              name: retryUpdate.full_name,
              full_name: retryUpdate.full_name,
              role: retryUpdate.role || 'Customer',
              phone: retryUpdate.phone_number,
              avatar_url: retryUpdate.avatar_url,
              whatsapp_number: retryUpdate.whatsapp_number,
              delivery_address: retryUpdate.delivery_address,
              emailVerified: user.emailVerification || false,
              user_id: user.$id,
            };
          }
        }
        // If it's not an unknown attribute error or we couldn't fix it, rethrow
        throw updateError;
      }
    } else {
      // Profile doesn't exist, this shouldn't happen in normal flow
      // but we'll handle it by creating in customers collection
      console.log('Profile not found, creating new customer profile');
      
      // Create data object for customers collection
      const createData: Record<string, any> = {
        full_name: profileData.full_name || user.name || '',
        email: profileData.email || user.email || '',
        role: 'Customer',
        account_status: 'Verified', // Use standard status value
        user_id: user.$id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Add optional fields if provided - checking for undefined
      if (profileData.phone !== undefined) createData.phone_number = profileData.phone;
      if (profileData.avatar_url !== undefined) createData.avatar_url = profileData.avatar_url;
      if (profileData.whatsapp_number !== undefined) createData.whatsapp_number = profileData.whatsapp_number;
      if (profileData.delivery_address !== undefined) createData.delivery_address = profileData.delivery_address;
      
      console.log('Creating customer profile with data:', createData);
      
      try {
        const newProfile = await databases.createDocument(
          DATABASE_ID,
          CUSTOMERS_COLLECTION_ID,
          user.$id,
          createData
        );
        
        return {
          id: newProfile.$id,
          email: newProfile.email,
          name: newProfile.full_name,
          full_name: newProfile.full_name,
          role: newProfile.role || 'Customer',
          phone: newProfile.phone_number,
          avatar_url: newProfile.avatar_url,
          whatsapp_number: newProfile.whatsapp_number,
          delivery_address: newProfile.delivery_address,
          emailVerified: user.emailVerification || false,
          user_id: user.$id,
        };
      } catch (createError: any) {
        // Handle "Unknown attribute" errors
        if (createError.message && createError.message.includes('Unknown attribute')) {
          console.warn('Unknown attribute error during create:', createError.message);
          // Remove the problematic field and try again
          const unknownAttrMatch = createError.message.match(/Unknown attribute: "([^"]+)"/);
          if (unknownAttrMatch && unknownAttrMatch[1]) {
            const problematicField = unknownAttrMatch[1];
            console.log(`Removing problematic field ${problematicField} and retrying create`);
            delete createData[problematicField];
            
            // Try creating again without the problematic field
            const retryCreate = await databases.createDocument(
              DATABASE_ID,
              CUSTOMERS_COLLECTION_ID,
              user.$id,
              createData
            );
            
            // Return with basic profile data
            return {
              id: retryCreate.$id,
              email: retryCreate.email,
              name: retryCreate.full_name,
              full_name: retryCreate.full_name,
              role: retryCreate.role || 'Customer',
              phone: retryCreate.phone_number,
              avatar_url: retryCreate.avatar_url,
              whatsapp_number: retryCreate.whatsapp_number,
              delivery_address: retryCreate.delivery_address,
              emailVerified: user.emailVerification || false,
              user_id: user.$id,
            };
          }
        }
        // If it's not an unknown attribute error or we couldn't fix it, rethrow
        throw createError;
      }
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

/**
 * Upload a profile avatar image
 */
export async function uploadAvatar(file: File): Promise<string> {
  try {
    const user = await account.get();
    if (!user) throw new Error('You must be logged in to upload an avatar');
    
    const bucketId = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID || 'user_avatars';
    console.log('Using storage bucket ID:', bucketId);
    
    console.log('Starting avatar upload process', {
      userId: user.$id,
      fileSize: file.size,
      fileType: file.type,
      bucketId
    });
    
    // Get file extension from filename or fallback to jpg
    const fileExtension = file.name.split('.').pop() || 'jpg';
    
    // Create a unique file ID that meets Appwrite's requirements:
    // - Maximum 36 characters
    // - Valid chars: a-z, A-Z, 0-9, period, hyphen, underscore
    // - Cannot start with special character
    
    // Use first 8 chars of user ID + timestamp (truncated) to stay under the limit
    const userId = user.$id.substring(0, 8);
    const timestamp = Date.now().toString().slice(-8);
    const fileId = `avatar${userId}${timestamp}.${fileExtension}`;
    
    console.log('Generated fileId:', fileId, 'Length:', fileId.length);
    
    // Upload file to storage
    try {
      console.log('Uploading file to Appwrite storage');
      const uploadResult = await storage.createFile(
        bucketId,
        fileId,
        file
      );
      
      console.log('File uploaded successfully', uploadResult);
      
      // Get file view URL
      const fileUrl = storage.getFileView(
        bucketId,
        uploadResult.$id
      );
      
      // Update profile with new avatar URL
      await updateProfile({
        avatar_url: fileUrl
      });
      
      console.log('Profile updated with new avatar', fileUrl);
      return fileUrl;
    } catch (uploadError) {
      console.error('Specific upload error:', uploadError);
      
      // Check for specific Appwrite error codes
      if ((uploadError as any)?.code === 401) {
        throw new Error('Unauthorized: Please log in again');
      } else if ((uploadError as any)?.code === 413) {
        throw new Error('File is too large. Maximum size is 5MB');
      } else if ((uploadError as any)?.code === 404) {
        throw new Error('Storage bucket not found. Please contact support.');
      } else {
        throw uploadError;
      }
    }
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

/**
 * Gets user orders
 */
export async function getUserOrders(): Promise<any[]> {
  try {
    // Get current user
    const user = await account.get();
    if (!user) throw new Error('You must be logged in to view your orders');
    
    const { databaseId } = getDatabaseIds();
    const ordersCollectionId = import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_ID || '';
    
    // Get user orders from Appwrite
    const response = await databases.listDocuments(
      databaseId,
      ordersCollectionId,
      [
        Query.equal('user_id', user.$id)
      ]
    );
    
    if (response.documents && response.documents.length > 0) {
      // Sort by date (newest first)
      return response.documents.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

/**
 * Gets user customization requests
 */
export async function getUserCustomizationRequests(): Promise<any[]> {
  try {
    // Get current user
    const user = await account.get();
    if (!user) throw new Error('You must be logged in to view your customization requests');
    
    const { databaseId } = getDatabaseIds();
    const customizationCollectionId = import.meta.env.VITE_APPWRITE_CUSTOMIZATION_COLLECTION_ID || '';
    
    // Get user customization requests from Appwrite
    const response = await databases.listDocuments(
      databaseId,
      customizationCollectionId,
      [
        Query.equal('user_id', user.$id)
      ]
    );
    
    if (response.documents && response.documents.length > 0) {
      // Sort by date (newest first)
      return response.documents.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching customization requests:', error);
    throw error;
  }
}
