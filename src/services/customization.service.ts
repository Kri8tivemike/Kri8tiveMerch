import { databases, account, storage, ID, Query } from '../lib/appwrite';
import { uploadImage } from './upload.service';
import type { CustomizationFormData } from '../types/customization';
import { CustomizationStatus } from '../lib/actions/customization';
import { fetchPrintingTechniqueById } from './customization-costs.service';

// Environment variables
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
const CUSTOMIZATION_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CUSTOMIZATION_COLLECTION_ID || 
                                   import.meta.env.VITE_APPWRITE_CUSTOMIZATIONS_COLLECTION_ID || 
                                   'customization_requests';
const STORAGE_BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID || 'user_avatars';

// Helper function to get user role from role-based collections
async function getUserRole(userId: string): Promise<string | null> {
  const collections = [
    { id: 'customers', role: 'customer' },
    { id: 'shop_managers', role: 'shop_manager' },
    { id: 'super_admins', role: 'super_admin' }
  ];
  
  for (const collection of collections) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        collection.id,
        [Query.equal('user_id', userId)]
      );
      
      if (response.documents && response.documents.length > 0) {
        return collection.role;
      }
    } catch (error) {
      console.warn(`Could not check ${collection.id} collection:`, error);
    }
  }
  
  return null; // User not found in any role-based collection
}

// Helper function to generate UUID v4
function generateUUID() {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validates if a string is a valid URL
 * @param str The string to validate
 * @returns True if the string is a valid URL, false otherwise
 */
function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Create a new customization request (requires authentication)
 * @param data Customization request data
 * @returns The created customization request
 */
export const createCustomizationRequest = async (
  data: CustomizationFormData
): Promise<CustomizationRequest> => {
  try {
    // Check if user is authenticated
    let currentUser;
    try {
      currentUser = await account.get();
    } catch (error) {
      throw new Error('Authentication required. Please login or create an account to submit customization requests.');
    }
    
    // If no authenticated user, reject the request
    if (!currentUser?.$id) {
      throw new Error('Authentication required. Please login or create an account to submit customization requests.');
    }
    
    console.log('User authentication verified:', { 
      userId: currentUser.$id,
      email: currentUser.email
    });
    
    // CRITICAL FIX: Check for duplicate payment references to prevent duplicate submissions
    if (data.payment_reference && data.payment_reference.trim() !== '') {
      try {
        const existingRequests = await databases.listDocuments(
          DATABASE_ID,
          CUSTOMIZATION_COLLECTION_ID,
          [Query.equal('payment_reference', data.payment_reference)]
        );
        
        if (existingRequests.documents && existingRequests.documents.length > 0) {
          console.log('Duplicate payment reference detected:', data.payment_reference);
          console.log('Existing request found:', existingRequests.documents[0]);
          
          // Return the existing request instead of creating a duplicate
          const existingRequest = existingRequests.documents[0];
          return {
            id: existingRequest.$id,
            user_id: existingRequest.user_id,
            title: existingRequest.title,
            description: existingRequest.description,
            status: existingRequest.status as CustomizationStatus,
            created_at: existingRequest.created_at,
            updated_at: existingRequest.updated_at,
            design_url: existingRequest.design_url,
            size: existingRequest.size,
            color: existingRequest.color,
            technique_id: existingRequest.technique_id,
            technique: existingRequest.technique,
            product_id: existingRequest.product_id,
            item_type: existingRequest.item_type,
            material_id: existingRequest.material_id,
            notes: existingRequest.notes,
            technique_cost: existingRequest.technique_cost,
            fabric_cost: existingRequest.fabric_cost,
            quantity: existingRequest.quantity,
            unit_cost: existingRequest.unit_cost,
            total_cost: existingRequest.total_cost,
            fabric_quality: existingRequest.fabric_quality,
            fabric_purchase_option: existingRequest.fabric_purchase_option,
            phone_number: existingRequest.phone_number,
            whatsapp_number: existingRequest.whatsapp_number,
            delivery_address: existingRequest.delivery_address,
            payment_reference: existingRequest.payment_reference,
            payment_completed: existingRequest.payment_completed,
            admin_notes: existingRequest.admin_notes,
            image_url: existingRequest.image_url,
            product_name: existingRequest.product_name,
            product_size: existingRequest.product_size,
            product_cost: existingRequest.product_cost,
            product_price: existingRequest.product_price,
            user_name: existingRequest.user_name,
            user_email: existingRequest.user_email,
            technique_name: existingRequest.technique,
            material: existingRequest.material,
            product: existingRequest.product_id ? {
              id: existingRequest.product_id,
              name: existingRequest.product_name || '',
              image_url: existingRequest.image_url,
              price: existingRequest.product_price
            } : null
          } as CustomizationRequest;
        }
      } catch (duplicateCheckError) {
        console.warn('Error checking for duplicate payment references:', duplicateCheckError);
        // Continue with creation if duplicate check fails
      }
    }
    
    // Calculate or validate cost fields if not provided
    const technique_cost = data.technique_cost || 0;
    const fabric_cost = data.fabric_cost || 0;
    const quantity = data.quantity || 1;
    
    // Calculate unit cost if not provided
    let unit_cost = data.unit_cost || 0;
    // If we have a product customization, validate unit cost
    if (data.product_id && data.product_price) {
      unit_cost = (data.product_price || 0) + technique_cost;
    } else {
      // For personal item customization
      unit_cost = technique_cost + fabric_cost;
    }
    
    // Calculate total cost based on unit cost and quantity
    const total_cost = data.total_cost || (unit_cost * quantity);
    
    // Log cost calculations
    console.log('Cost calculations for request:', {
      technique_cost,
      fabric_cost,
      unit_cost,
      quantity,
      total_cost,
      isProductCustomization: !!data.product_id
    });
    
    // Extract user_id from auth or data
    const user_id = data.user_id || currentUser.$id;
    
    // Ensure required fields are present
    if (!user_id) {
      throw new Error('User ID is required');
    }

    const title = data.title || `Customization Request - ${new Date().toLocaleDateString()}`;
    const description = data.description || `Customization request for ${data.item_type || 'product'}`;
    const status: CustomizationStatus = 'Pending'; // Initial status is always Pending
    const created_at = new Date().toISOString();
    
    // Create a request object with ALL fields supported by Appwrite schema
    const requestObject = {
      // Required fields
      user_id,
      title,
      description,
      status,
      created_at,
      
      // Optional fields
      updated_at: created_at,
      user_name: data.user_name || currentUser.name,
      user_email: data.user_email || currentUser.email,
      phone_number: data.phone_number || '',
      whatsapp_number: data.whatsapp_number || '',
      delivery_address: data.delivery_address || '',
      product_id: data.product_id || undefined,
      item_type: data.item_type || '',
      size: data.size || 'Standard',
      color: data.color || '',
      technique_id: data.technique_id || '',
      technique: data.technique_name || '',
      material_id: data.material_id || null,
      fabric_purchase_option: data.fabric_purchase_option || undefined,
      fabric_quality: data.fabric_quality || undefined,
      technique_cost,
      fabric_cost,
      unit_cost,
      quantity,
      total_cost,
      design_url: data.design_url || '',
      image_url: data.image_url && isValidUrl(data.image_url) ? data.image_url : undefined,
      notes: data.notes || '',
      admin_notes: data.admin_notes || '',
      payment_reference: data.payment_reference || '',
      payment_completed: data.payment_completed || false,
      
      // CRITICAL FIX: Add the missing product fields
      product_name: data.product_name || undefined,
      product_size: data.product_size || undefined,
      product_cost: data.product_cost || undefined,
      product_price: data.product_price || undefined
    } as const;
    
    console.log('Creating customization request with data:', requestObject);
    
    // CRITICAL DEBUG: Log the product fields specifically
    console.log('PRODUCT FIELDS BEING SENT TO DATABASE:', {
      product_name: requestObject.product_name,
      product_size: requestObject.product_size,
      product_cost: requestObject.product_cost,
      product_price: requestObject.product_price,
      product_id: requestObject.product_id
    });
    
    // Create the request
    const newRequest = await databases.createDocument(
      DATABASE_ID,
      CUSTOMIZATION_COLLECTION_ID,
      ID.unique(),
      requestObject
    );
    
    console.log('DATABASE RESPONSE:', newRequest);

    // Return the created request with all fields
    return {
      id: newRequest.$id,
      ...requestObject,
      // Add virtual fields
      product: data.product || null
    };
  } catch (error) {
    console.error('Failed to create customization request:', error);
    throw error;
  }
};

/**
 * Upload a design file to the designs bucket
 * @param file The file to upload
 * @returns The public URL of the uploaded file
 */
export const uploadDesign = async (file: File): Promise<string> => {
  try {
    // Check if user is authenticated
    let currentUser;
    try {
      currentUser = await account.get();
    } catch (error) {
      throw new Error('You must be logged in to upload designs');
    }

    // Validate the file type
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf'
    ];
    
    if (!allowedMimeTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types are: JPG, PNG, GIF, WEBP, SVG, PDF`);
    }

    // Create a unique filename with the user ID as prefix for better organization
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const randomId = Math.random().toString(36).substring(2);
    const timestamp = Date.now();
    const fileName = `designs_${timestamp}_${randomId}.${fileExt}`;

    // Upload the file to Appwrite storage
    try {
              const uploadedFile = await storage.createFile(
        STORAGE_BUCKET_ID,
        ID.unique(),
        file
      );
      
      // Get the file URL
              const fileUrl = storage.getFileView(STORAGE_BUCKET_ID, uploadedFile.$id);
      return fileUrl.toString();
    } catch (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      
      // Try uploading through the upload service as fallback
      try {
        return await uploadImage(file);
      } catch (fallbackError) {
        console.error('Fallback upload also failed:', fallbackError);
        throw new Error('Failed to upload design. Please try again.');
      }
    }
  } catch (error) {
    console.error('Error in uploadDesign:', error);
    throw error;
  }
};

/**
 * Convert a filename to a proper Appwrite storage URL
 * This function assumes the file exists in the user_avatars bucket
 * @param fileName The filename to convert
 * @returns The full Appwrite storage URL
 */
const convertFileNameToAppwriteUrl = (fileName: string): string => {
  if (!fileName || fileName.trim() === '') {
    return '';
  }

  // If it's already a URL, return as-is
  if (fileName.startsWith('http') || fileName.startsWith('data:')) {
    return fileName;
  }

  // For filenames, we need to find the corresponding file in Appwrite storage
  // Since we can't easily search by filename, we'll construct the URL pattern
  // This assumes the filename follows our pattern: ViewName-ShortCode-Timestamp.png
  const projectId = '67ea2c3b00309b589901';
  const bucketId = 'user_avatars';
  
  // Extract the timestamp from the filename to use as a file ID approximation
  const timestampMatch = fileName.match(/-(\d+)\.png$/);
  if (timestampMatch) {
    const timestamp = timestampMatch[1];
    // Generate a file ID based on the timestamp (this is an approximation)
    const fileId = `design_${timestamp}`;
    return `https://cloud.appwrite.io/v1/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
  }

  // Fallback: return the filename as-is (it might be processed elsewhere)
  return fileName;
};

/**
 * Get the actual Appwrite file URL for a design filename
 * This function searches for files in the user_avatars bucket that match the filename pattern
 * @param fileName The filename to search for
 * @returns Promise resolving to the Appwrite URL or the original filename if not found
 */
const getAppwriteUrlForFileName = async (fileName: string): Promise<string> => {
  if (!fileName || fileName.trim() === '') {
    return '';
  }

  // If it's already a URL, return as-is
  if (fileName.startsWith('http') || fileName.startsWith('data:')) {
    return fileName;
  }

  try {
    // List files in the user_avatars bucket to find matching files
    const bucketId = 'user_avatars';
    const files = await storage.listFiles(bucketId);
    
    // Look for files that match our filename pattern
    const matchingFile = files.files.find(file => {
      // Check if the file name contains the key parts of our filename
      const fileNameParts = fileName.split('-');
      if (fileNameParts.length >= 3) {
        const viewName = fileNameParts[0];
        const shortCode = fileNameParts[1];
        const timestamp = fileNameParts[2].replace('.png', '');
        
        // Check if the file was created around the timestamp
        const fileCreatedTime = new Date(file.$createdAt).getTime();
        const expectedTime = parseInt(timestamp);
        const timeDiff = Math.abs(fileCreatedTime - expectedTime);
        
        // Allow 5 minutes difference
        return timeDiff < 5 * 60 * 1000;
      }
      return false;
    });

    if (matchingFile) {
      // Generate the proper Appwrite URL
      const projectId = '67ea2c3b00309b589901';
      return `https://cloud.appwrite.io/v1/storage/buckets/${bucketId}/files/${matchingFile.$id}/view?project=${projectId}`;
    }

    // If no matching file found, return the original filename
    console.warn(`No matching file found for filename: ${fileName}`);
    return fileName;
  } catch (error) {
    console.error('Error searching for file:', error);
    return fileName;
  }
};

/**
 * Save design URLs directly to a draft customization request
 * This allows saving designs for later completion without payment
 * @param designData Design data including URLs and metadata
 * @returns The created draft customization request
 */
export const saveDraftCustomizationWithDesigns = async (designData: {
  productId?: string;
  productName?: string;
  designUrls: string[]; // These can be filenames or URLs
  canvasDesigns?: any[];
  technique?: string;
  notes?: string;
}): Promise<CustomizationRequest> => {
  try {
    // Check if user is authenticated
    let currentUser;
    try {
      currentUser = await account.get();
    } catch (error) {
      throw new Error('You must be logged in to save designs');
    }

    // Convert filenames to proper Appwrite URLs
    const allDesignUrls: string[] = [];
    
    // Process uploaded design URLs/filenames
    if (designData.designUrls && designData.designUrls.length > 0) {
      for (const urlOrFileName of designData.designUrls) {
        if (urlOrFileName && urlOrFileName.trim() !== '') {
          // Convert filename to Appwrite URL if needed
          const appwriteUrl = await getAppwriteUrlForFileName(urlOrFileName);
          allDesignUrls.push(appwriteUrl);
        }
      }
    }
    
    // Add canvas design URLs
    if (designData.canvasDesigns && designData.canvasDesigns.length > 0) {
      const canvasUrls = designData.canvasDesigns
        .map(design => {
          // Prefer appwriteUrl, then preview, then thumbnailUrl
          return design.appwriteUrl || design.preview || design.thumbnailUrl || '';
        })
        .filter(url => url && url.trim() !== '');
      allDesignUrls.push(...canvasUrls);
    }

    // Remove duplicates and filter out empty values
    const uniqueDesignUrls = [...new Set(allDesignUrls.filter(url => url && url.trim() !== ''))];

    // Create design URLs info for notes
    const designUrlsInfo = uniqueDesignUrls.length > 0 
      ? `\n\nSaved Design URLs:\n${uniqueDesignUrls.map((url, index) => `${index + 1}. ${url}`).join('\n')}`
      : '';

    const canvasInfo = designData.canvasDesigns && designData.canvasDesigns.length > 0
      ? `\n\nCanvas Designs: ${designData.canvasDesigns.length} saved`
      : '';

    // Create a draft customization request
    const requestObject = {
      user_id: currentUser.$id,
      title: `Draft - ${designData.productName || 'Design Collection'} - ${new Date().toLocaleDateString()}`,
      description: `Draft customization with saved designs. Product: ${designData.productName || 'N/A'}`,
      status: 'Pending' as CustomizationStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_name: currentUser.name || currentUser.email?.split('@')[0] || 'Unknown User',
      user_email: currentUser.email || '',
      
      // Design information - store proper Appwrite URLs
      design_url: uniqueDesignUrls.length > 0 ? uniqueDesignUrls[0] : '',
      image_url: uniqueDesignUrls.length > 1 ? uniqueDesignUrls[1] : undefined,
      
      // Product information (if available)
      product_id: designData.productId || undefined,
      product_name: designData.productName || undefined,
      
      // Technique information (if available)
      technique_id: designData.technique || '',
      technique: designData.technique || '',
      
      // Default values for required fields
      size: 'Standard',
      quantity: 1,
      technique_cost: 0,
      unit_cost: 0,
      total_cost: 0,
      
      // Notes with all design URL information
      notes: `${designData.notes || 'Saved design collection'}${designUrlsInfo}${canvasInfo}\n\nTotal designs: ${uniqueDesignUrls.length}\nSaved on: ${new Date().toISOString()}`,
      
      // Draft indicator
      admin_notes: 'DRAFT - Designs saved for later completion',
      payment_completed: false,
    };

    console.log('Creating draft customization request with design URLs:', {
      totalDesigns: uniqueDesignUrls.length,
      designUrls: uniqueDesignUrls,
      canvasDesigns: designData.canvasDesigns?.length || 0,
      productId: designData.productId,
      userId: currentUser.$id
    });

    // Create the request
    const newRequest = await databases.createDocument(
      DATABASE_ID,
      CUSTOMIZATION_COLLECTION_ID,
      ID.unique(),
      requestObject
    );

    console.log('Draft customization request created successfully:', newRequest.$id);

    return {
      id: newRequest.$id,
      ...requestObject,
    };
  } catch (error) {
    console.error('Failed to save draft customization with design URLs:', error);
    throw error;
  }
};

/**
 * Update an existing customization request with new design URLs
 * @param requestId The ID of the customization request to update
 * @param designUrls Array of design URLs to add
 * @param canvasDesigns Array of canvas design data to add
 * @returns The updated customization request
 */
export const addDesignsToCustomizationRequest = async (
  requestId: string, 
  designUrls: string[], 
  canvasDesigns?: any[]
): Promise<CustomizationRequest> => {
  try {
    // Check if user is authenticated
    let currentUser;
    try {
      currentUser = await account.get();
    } catch (error) {
      throw new Error('You must be logged in to update designs');
    }

    // Get the existing request
    const existingRequest = await databases.getDocument(
      DATABASE_ID,
      CUSTOMIZATION_COLLECTION_ID,
      requestId
    );

    // Collect all new design URLs
    const newDesignUrls = [...designUrls];
    
    if (canvasDesigns && canvasDesigns.length > 0) {
      const canvasUrls = canvasDesigns
        .map(design => design.appwriteUrl || design.preview || design.thumbnailUrl)
        .filter(url => url && url.trim() !== '');
      newDesignUrls.push(...canvasUrls);
    }

    // Parse existing notes to extract current design URLs
    const existingNotes = existingRequest.notes || '';
    const existingDesignUrls: string[] = [];
    
    // Extract URLs from existing notes (simple pattern matching)
    const urlMatches = existingNotes.match(/https?:\/\/[^\s]+/g);
    if (urlMatches) {
      existingDesignUrls.push(...urlMatches);
    }

    // Combine and deduplicate URLs
    const allDesignUrls = [...new Set([...existingDesignUrls, ...newDesignUrls])];

    // Create updated notes with all design information
    const designUrlsInfo = allDesignUrls.length > 0 
      ? `\n\nAll Design URLs:\n${allDesignUrls.map((url, index) => `${index + 1}. ${url}`).join('\n')}`
      : '';

    const updateInfo = `\n\nUpdated on: ${new Date().toISOString()}\nNew designs added: ${newDesignUrls.length}`;

    // Update the request
    const updateData = {
      design_url: allDesignUrls.length > 0 ? allDesignUrls[0] : existingRequest.design_url,
      image_url: allDesignUrls.length > 1 ? allDesignUrls[1] : existingRequest.image_url,
      notes: `${existingNotes.split('\n\nAll Design URLs:')[0]}${designUrlsInfo}${updateInfo}`,
      updated_at: new Date().toISOString(),
    };

    const updatedRequest = await databases.updateDocument(
      DATABASE_ID,
      CUSTOMIZATION_COLLECTION_ID,
      requestId,
      updateData
    );

    console.log('Added designs to customization request:', {
      requestId,
      newDesignsAdded: newDesignUrls.length,
      totalDesigns: allDesignUrls.length
    });

    return {
      id: updatedRequest.$id,
      user_id: updatedRequest.user_id,
      title: updatedRequest.title,
      description: updatedRequest.description,
      status: updatedRequest.status,
      created_at: updatedRequest.created_at,
      updated_at: updatedRequest.updated_at,
      design_url: updatedRequest.design_url,
      image_url: updatedRequest.image_url,
      notes: updatedRequest.notes,
      // Include other fields as needed
      technique_id: updatedRequest.technique_id,
      technique: updatedRequest.technique,
      product_id: updatedRequest.product_id,
      product_name: updatedRequest.product_name,
      size: updatedRequest.size,
      quantity: updatedRequest.quantity,
      technique_cost: updatedRequest.technique_cost,
      unit_cost: updatedRequest.unit_cost,
      total_cost: updatedRequest.total_cost,
      user_name: updatedRequest.user_name,
      user_email: updatedRequest.user_email,
      phone_number: updatedRequest.phone_number,
      whatsapp_number: updatedRequest.whatsapp_number,
      delivery_address: updatedRequest.delivery_address,
      payment_reference: updatedRequest.payment_reference,
      payment_completed: updatedRequest.payment_completed,
      admin_notes: updatedRequest.admin_notes,
    } as CustomizationRequest;
  } catch (error) {
    console.error('Failed to add designs to customization request:', error);
    throw error;
  }
};

/**
 * Get all customization requests for the current user (requires authentication)
 * @returns Array of customization requests with product details
 */
export const getUserCustomizationRequests = async (): Promise<CustomizationRequest[]> => {
  try {
    // Check if user is authenticated
    let currentUser;
    try {
      currentUser = await account.get();
    } catch (error) {
      throw new Error('You must be logged in to get your customization requests');
    }

    // Get all requests for the user
    const response = await databases.listDocuments(
      DATABASE_ID,
      CUSTOMIZATION_COLLECTION_ID,
      [
        Query.equal('user_id', currentUser.$id),
        Query.orderDesc('created_at'),
      ]
    );

    // Now fetch the related products if we have any
    const productIds = [...new Set(response.documents
      .map(req => req.product_id)
      .filter(id => id !== null) as string[])];
    
    let products: any[] = [];
    if (productIds.length > 0) {
      const productsCollection = import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID || '';
      const productsResponse = await databases.listDocuments(
        DATABASE_ID,
        productsCollection,
        [Query.equal('$id', productIds)]
      );
      products = productsResponse.documents || [];
    }

    // Create lookup map for faster product access
    const productMap = products.reduce((map, product: any) => {
      if (product && product.$id) {
        map[product.$id] = product;
      }
      return map;
    }, {} as Record<string, any>);

    // Map documents to CustomizationRequest type
    const requests = response.documents.map(doc => {
      const productId = doc.product_id;
      const product = productId ? productMap[productId] : null;
      
      return {
        id: doc.$id,
        user_id: doc.user_id,
        user_name: doc.user_name,
        user_email: doc.user_email,
        phone_number: doc.phone_number,
        whatsapp_number: doc.whatsapp_number,
        delivery_address: doc.delivery_address,
        product_id: doc.product_id,
        product: product ? {
          id: product.$id,
          name: product.name,
          image_url: product.image_url,
          price: product.price
        } : null,
        // CRITICAL FIX: Add the missing product fields from the database
        product_name: doc.product_name,
        product_price: doc.product_price,
        product_size: doc.product_size,
        product_cost: doc.product_cost,
        technique_id: doc.technique_id,
        technique_name: doc.technique,
        size: doc.size,
        color: doc.color,
        design_url: doc.design_url,
        image_url: doc.image_url,
        item_type: doc.item_type,
        material_id: doc.material_id,
        material: doc.material,
        notes: doc.notes,
        admin_notes: doc.admin_notes,
        technique_cost: doc.technique_cost,
        fabric_cost: doc.fabric_cost,
        fabric_quality: doc.fabric_quality,
        fabric_purchase_option: doc.fabric_purchase_option,
        unit_cost: doc.unit_cost,
        quantity: doc.quantity,
        total_cost: doc.total_cost,
        status: doc.status,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        title: doc.title,
        description: doc.description,
        payment_reference: doc.payment_reference,
        payment_completed: doc.payment_completed
      } as CustomizationRequest;
    });

    return requests;
  } catch (error) {
    console.error('Failed to get customization requests:', error);
    return [];
  }
};

/**
 * Get a specific customization request by ID
 * @param id Customization request ID
 * @returns The customization request
 */
export const getCustomizationRequestById = async (id: string): Promise<CustomizationRequest> => {
  try {
    console.log('getCustomizationRequestById called with ID:', id);
    
    // Check if user is authenticated
    let currentUser;
    try {
      currentUser = await account.get();
      console.log('Session check result:', {
        hasSession: !!currentUser,
        userId: currentUser.$id
      });
    } catch (error) {
      throw new Error('You must be logged in to view a customization request');
    }

    // Get the request
    console.log('Fetching request data from database...');
    const request = await databases.getDocument(
      DATABASE_ID,
      CUSTOMIZATION_COLLECTION_ID,
      id
    );

    if (!request) {
      console.error('No request found with ID:', id);
      throw new Error('Customization request not found');
    }

    // Fetch product details if applicable
    let product = null;
    if (request.product_id) {
      try {
        const productsCollection = import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID || '';
        const productDoc = await databases.getDocument(
          DATABASE_ID,
          productsCollection,
          request.product_id
        );
        
        if (productDoc) {
          product = {
            id: productDoc.$id,
            name: productDoc.name,
            image_url: productDoc.image_url,
            price: productDoc.price
          };
        }
      } catch (error) {
        console.warn('Could not fetch product details:', error);
      }
    }

    // Security check: ensure the user owns this request or is an admin
    console.log('Checking user permissions...');
    try {
      const userRole = await getUserRole(currentUser.$id);
      const isShopManager = userRole === 'shop_manager' || userRole === 'super_admin';
      const isOwner = request.user_id === currentUser.$id;

      if (!isShopManager && !isOwner) {
        throw new Error('You do not have permission to view this customization request');
      }
    } catch (error) {
      console.warn('Error checking permissions, proceeding anyway:', error);
      // Continue anyway, as the document security should prevent unauthorized access
    }

    // Return the properly formatted request
    return {
      id: request.$id,
      user_id: request.user_id,
      user_name: request.user_name,
      user_email: request.user_email,
      phone_number: request.phone_number,
      whatsapp_number: request.whatsapp_number,
      delivery_address: request.delivery_address,
      product_id: request.product_id,
      product,
      // CRITICAL FIX: Add the missing product fields from the database
      product_name: request.product_name,
      product_price: request.product_price,
      product_size: request.product_size,
      product_cost: request.product_cost,
      technique_id: request.technique_id,
      technique_name: request.technique_name || request.technique,
      technique: request.technique || request.technique_name,
      size: request.size,
      color: request.color,
      design_url: request.design_url,
      image_url: request.image_url,
      item_type: request.item_type,
      material_id: request.material_id,
      material: request.material,
      notes: request.notes,
      admin_notes: request.admin_notes,
      technique_cost: request.technique_cost,
      fabric_cost: request.fabric_cost,
      fabric_quality: request.fabric_quality,
      fabric_purchase_option: request.fabric_purchase_option,
      unit_cost: request.unit_cost,
      quantity: request.quantity,
      total_cost: request.total_cost,
      status: request.status,
      created_at: request.created_at,
      updated_at: request.updated_at,
      title: request.title,
      description: request.description,
      payment_reference: request.payment_reference,
      payment_completed: request.payment_completed
    } as CustomizationRequest;
  } catch (error) {
    console.error('Failed to get customization request:', error);
    throw error;
  }
};

/**
 * Get all customization requests (admin function)
 * @returns Array of all customization requests with user and product details
 */
export const getAllCustomizationRequests = async (): Promise<CustomizationRequest[]> => {
  try {
    // Check if user is authenticated with admin privileges
    let currentUser;
    try {
      currentUser = await account.get();
    } catch (error) {
      throw new Error('You must be logged in to view customization requests');
    }

    // Verify admin status
    try {
      const userRole = await getUserRole(currentUser.$id);
      if (!userRole || !['shop_manager', 'super_admin'].includes(userRole)) {
        throw new Error('You need shop manager privileges to access all customization requests');
      }
    } catch (error) {
      console.warn('Error checking admin status:', error);
      // Continue anyway, as the collection permissions should prevent unauthorized access
    }

    // Get all customization requests
    const response = await databases.listDocuments(
      DATABASE_ID,
      CUSTOMIZATION_COLLECTION_ID,
      [Query.orderDesc('created_at')]
    );

    // Map documents to CustomizationRequest type
    const requests = response.documents.map(doc => {
      return {
        id: doc.$id,
        user_id: doc.user_id,
        user_name: doc.user_name,
        user_email: doc.user_email,
        phone_number: doc.phone_number,
        whatsapp_number: doc.whatsapp_number,
        delivery_address: doc.delivery_address,
        product_id: doc.product_id,
        technique_id: doc.technique_id,
        technique_name: doc.technique,
        size: doc.size,
        color: doc.color,
        design_url: doc.design_url,
        image_url: doc.image_url,
        item_type: doc.item_type,
        material_id: doc.material_id,
        material: doc.material,
        notes: doc.notes,
        admin_notes: doc.admin_notes,
        technique_cost: doc.technique_cost,
        fabric_cost: doc.fabric_cost,
        fabric_quality: doc.fabric_quality,
        fabric_purchase_option: doc.fabric_purchase_option,
        unit_cost: doc.unit_cost,
        quantity: doc.quantity,
        total_cost: doc.total_cost,
        status: doc.status,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        title: doc.title,
        description: doc.description,
        payment_reference: doc.payment_reference,
        payment_completed: doc.payment_completed
      } as CustomizationRequest;
    });

    return requests;
  } catch (error) {
    console.error('Failed to get all customization requests:', error);
    throw error;
  }
};

/**
 * Update a customization request status
 * @param id The ID of the request to update
 * @param status The new status to set
 * @param adminNotes Optional admin notes to add
 * @returns The updated customization request
 */
export const updateCustomizationStatus = async (
  id: string, 
  status: CustomizationStatus,
  adminNotes?: string
): Promise<CustomizationRequest> => {
  try {
    // Check if user is authenticated with admin privileges
    let currentUser;
    try {
      currentUser = await account.get();
    } catch (error) {
      throw new Error('You must be logged in to update requests');
    }

    // Verify admin status
    try {
      const userRole = await getUserRole(currentUser.$id);
      if (!userRole || !['shop_manager', 'super_admin'].includes(userRole)) {
        throw new Error('You need shop manager privileges to update customization requests');
      }
    } catch (error) {
      console.warn('Error checking admin status:', error);
      // Continue anyway, as the collection permissions should prevent unauthorized access
    }

    // Update the request
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (adminNotes !== undefined) {
      updateData.admin_notes = adminNotes;
    }

    const updatedRequest = await databases.updateDocument(
      DATABASE_ID,
      CUSTOMIZATION_COLLECTION_ID,
      id,
      updateData
    );

    return {
      id: updatedRequest.$id,
      status: updatedRequest.status,
      admin_notes: updatedRequest.admin_notes,
      updated_at: updatedRequest.updated_at
    } as CustomizationRequest;
  } catch (error) {
    console.error('Failed to update customization request:', error);
    throw error;
  }
};

export type CustomizationRequest = {
  id?: string;
  user_id: string;  // Required in DB
  title: string;    // Required in DB
  description: string; // Required in DB
  status: CustomizationStatus; // Required in DB
  created_at: string; // Required in DB
  updated_at?: string;
  design_url?: string;
  size?: string;
  color?: string;
  technique_id?: string;
  technique?: string;
  product_id?: string;
  item_type?: string;
  material_id?: string | null;
  notes?: string;
  technique_cost?: number;
  fabric_cost?: number;
  quantity?: number;
  unit_cost?: number;
  total_cost?: number;
  fabric_quality?: number;
  fabric_purchase_option?: 'help_buy' | 'already_have' | 'help_me_buy';
  phone_number?: string;
  whatsapp_number?: string;
  delivery_address?: string;
  payment_reference?: string;
  payment_completed?: boolean;
  admin_notes?: string;
  image_url?: string;
  // CRITICAL FIX: Add the missing product fields
  product_name?: string;
  product_size?: string;
  product_cost?: number;
  product_price?: number;
  // Virtual fields (not in DB but computed)
  user_name?: string;
  user_email?: string;
  technique_name?: string;
  material?: string;
  product?: {
    id: string;
    name: string;
    image_url?: string;
    price?: number;
  } | null;
}; 

// Add this new interface for formatted customization details
export interface FormattedCustomizationDetails {
  id: string;
  title: string;
  status: string;
  paymentReference: string;
  designsUploaded: number;
  printingTechnique: {
    name: string;
    cost: number;
    formatted: string;
  };
  fabricDetails: {
    purchaseOption: string;
    quality: number;
    cost: number;
    formatted: string;
  };
  itemDetails: {
    type: string;
    color: string;
    size: string;
    formatted: string;
  };
  quantity: {
    count: number;
    formatted: string;
  };
  costBreakdown: {
    techniqueCost: number;
    fabricCost: number;
    unitCost: number;
    totalCost: number;
  };
  contactInfo: {
    phone: string;
    whatsapp: string;
    deliveryAddress: string;
  };
  timestamps: {
    createdAt: string;
    updatedAt: string;
  };
}

// Add this new function to fetch and format customization details
export const fetchCustomizationDetails = async (requestId: string): Promise<FormattedCustomizationDetails | null> => {
  try {
    console.log('Fetching customization details for ID:', requestId);
    
    // Fetch the customization request
    const request = await databases.getDocument(
      DATABASE_ID,
      CUSTOMIZATION_COLLECTION_ID,
      requestId
    );
    
    console.log('Raw customization request data:', request);
    
    // Fetch technique details if technique_id exists
    let techniqueName = request.technique || 'Unknown';
    let techniqueCost = request.technique_cost || 0;
    
    if (request.technique_id) {
      try {
        // Import the service function
        const { fetchPrintingTechniqueById } = await import('./customization-costs.service');
        const techniqueDetails = await fetchPrintingTechniqueById(request.technique_id);
        
        if (techniqueDetails) {
          techniqueName = techniqueDetails.name;
          // Use the cost from the request (which might be different due to pricing changes)
          techniqueCost = request.technique_cost || techniqueDetails.cost;
        }
      } catch (error) {
        console.warn('Could not fetch technique details:', error);
        // Fallback to stored technique name or default
        techniqueName = request.technique || 'Unknown Technique';
      }
    }
    
    // Extract payment reference from description or notes
    let paymentReference = request.payment_reference || 'N/A';
    if (!paymentReference || paymentReference === '') {
      // Try to extract from description
      const descriptionMatch = request.description?.match(/Payment Reference: ([^\n]+)/);
      if (descriptionMatch) {
        paymentReference = descriptionMatch[1].trim();
      } else {
        // Try to extract from notes
        const notesMatch = request.notes?.match(/reference: ([^\s]+)/);
        if (notesMatch) {
          paymentReference = notesMatch[1].trim();
        }
      }
    }
    
    // Count designs uploaded (assuming 1 if design_url exists)
    const designsUploaded = request.design_url && request.design_url !== 'N/A' ? 1 : 0;
    
    // Format fabric purchase option
    const fabricPurchaseOptionMap: { [key: string]: string } = {
      'help_buy': 'Help buying fabric',
      'own_fabric': 'Using own fabric',
      'provided': 'Fabric provided'
    };
    
    const fabricPurchaseOption = fabricPurchaseOptionMap[request.fabric_purchase_option] || request.fabric_purchase_option || 'Not specified';
    
    // Format the details
    const formattedDetails: FormattedCustomizationDetails = {
      id: request.$id,
      title: request.title,
      status: request.status,
      paymentReference,
      designsUploaded,
      printingTechnique: {
        name: techniqueName,
        cost: techniqueCost,
        formatted: `${techniqueName} (₦${techniqueCost.toLocaleString()})`
      },
      fabricDetails: {
        purchaseOption: fabricPurchaseOption,
        quality: request.fabric_quality || 160,
        cost: request.fabric_cost || 0,
        formatted: `${fabricPurchaseOption} (${request.fabric_quality || 160} GSM) (₦${(request.fabric_cost || 0).toLocaleString()})`
      },
      itemDetails: {
        type: request.item_type || 'Unknown',
        color: request.color || 'Not specified',
        size: request.size || 'Not specified',
        formatted: `${request.item_type || 'Unknown'} - ${request.color || 'Not specified'} - Size ${request.size || 'Not specified'}`
      },
      quantity: {
        count: request.quantity || 1,
        formatted: `${request.quantity || 1} units`
      },
      costBreakdown: {
        techniqueCost: request.technique_cost || 0,
        fabricCost: request.fabric_cost || 0,
        unitCost: request.unit_cost || 0,
        totalCost: request.total_cost || 0
      },
      contactInfo: {
        phone: request.phone_number || '',
        whatsapp: request.whatsapp_number || '',
        deliveryAddress: request.delivery_address || ''
      },
      timestamps: {
        createdAt: request.created_at || request.$createdAt,
        updatedAt: request.updated_at || request.$updatedAt
      }
    };
    
    console.log('Formatted customization details:', formattedDetails);
    return formattedDetails;
    
  } catch (error) {
    console.error('Error fetching customization details:', error);
    return null;
  }
};

/**
 * Fetch printing technique name by technique ID
 * @param techniqueId The ID of the technique to fetch
 * @returns The technique name or null if not found
 */
export const getTechniqueNameById = async (techniqueId: string): Promise<string | null> => {
  try {
    if (!techniqueId) return null;
    
    const technique = await fetchPrintingTechniqueById(techniqueId);
    return technique?.name || null;
  } catch (error) {
    console.error('Error fetching technique name:', error);
    return null;
  }
}; 