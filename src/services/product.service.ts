import { databases } from '../lib/appwrite';
import { ID, Query, Models } from 'appwrite';
import type { Product, ProductColor } from '../types/product';
import {
  updateProductWithGalleryImages 
} from './database.service';
import { ProductColorInput } from '../stores/productStore';
import { DATABASE_ID } from '../lib/appwrite';

// Product collection ID from environment variables
const PRODUCTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID;

// Re-export the gallery-aware update function
export { updateProductWithGalleryImages };

/**
 * Helper function to convert Appwrite document to Product type
 */
const productDataToProduct = async (data: Models.Document): Promise<Product> => {
  // Get associated colors
  const colors = await databases.listDocuments(
    DATABASE_ID,
    'product_colors',
    [Query.equal('product_id', data.$id)]
  );

  // Map Appwrite document to our Product type
  return {
    id: data.$id,
    name: data.name,
    description: data.description || '',
    price: data.price,
    category: data.category || 'uncategorized',
    image_url: data.image_url || '',
    stock_quantity: (() => {
      // First check if stock_quantity exists as a number
      if (typeof data.stock_quantity === 'number') {
        return Math.max(0, data.stock_quantity);
      }
      // Then check if stock_quantity exists but needs conversion
      if (data.stock_quantity !== undefined && data.stock_quantity !== null) {
        const converted = Number(data.stock_quantity);
        return isNaN(converted) ? 0 : Math.max(0, converted);
      }
      // Then check if there's a stock field (old field name)
      if (typeof data.stock === 'number') {
        return Math.max(0, data.stock);
      }
      // Try to convert stock field if it exists
      if (data.stock !== undefined && data.stock !== null) {
        const converted = Number(data.stock);
        return isNaN(converted) ? 0 : Math.max(0, converted);
      }
      // Default to 0 if nothing valid is found
      return 0;
    })(),
    customizable: typeof data.customizable === 'boolean'
      ? data.customizable
      : (data.customizable === 'true' || 
         data.customizable === 'Enabled' || 
         data.customizable === '1'),
    created_at: data.created_at || data.$createdAt,
    updated_at: data.updated_at || data.$updatedAt,
    sku: data.sku || `SKU-${data.$id}`,
    gallery_images: data.gallery_images || [],
    sizes: data.sizes || [],
    colors: colors.documents.map(color => ({
      id: color.$id,
      product_id: data.$id,
      name: color.name,
      hex: color.hex,
      created_at: color.$createdAt
    }))
  };
};

/**
 * Create a new product
 */
export const createProduct = async (
  product: Omit<Product, 'id' | 'created_at'>,
  colors: ProductColorInput[]
): Promise<Product> => {
  try {
    // Create the product document
    const response = await databases.createDocument(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      ID.unique(),
      {
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category || 'uncategorized',
        // Set both stock and stock_quantity for compatibility
        stock: Math.max(0, Number(product.stock_quantity || 0)),
        stock_quantity: Math.max(0, Number(product.stock_quantity || 0)),
        image_url: product.image_url,
        customizable: typeof product.customizable === 'boolean'
          ? product.customizable
          : (product.customizable === 'true' || 
             product.customizable === 'Enabled' ||
             product.customizable === '1'),
        sku: product.sku || `SKU-${ID.unique()}`,
        sizes: product.sizes || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    );

    // Create color documents for the product
    const colorPromises = colors.map(color =>
      databases.createDocument(
        DATABASE_ID,
        'product_colors',
        ID.unique(),
        {
          product_id: response.$id,
          name: color.name,
          hex: color.hex
        }
      )
    );

    const createdColors = await Promise.all(colorPromises);

    // Map the created colors to our ProductColor type
    const mappedColors: ProductColor[] = createdColors.map(doc => ({
      id: doc.$id,
      product_id: doc.product_id,
      name: doc.name,
      hex: doc.hex,
      created_at: doc.$createdAt
    }));

    // Return the complete product with colors
    return {
      id: response.$id,
      name: response.name,
      description: response.description || '',
      price: response.price,
      category: response.category || 'uncategorized',
      stock_quantity: (() => {
        // First check if stock_quantity exists as a number
        if (typeof response.stock_quantity === 'number') {
          return Math.max(0, response.stock_quantity);
        }
        // Then check if stock_quantity exists but needs conversion
        if (response.stock_quantity !== undefined && response.stock_quantity !== null) {
          const converted = Number(response.stock_quantity);
          return isNaN(converted) ? 0 : Math.max(0, converted);
        }
        // Then check if there's a stock field (old field name)
        if (typeof response.stock === 'number') {
          return Math.max(0, response.stock);
        }
        // Try to convert stock field if it exists
        if (response.stock !== undefined && response.stock !== null) {
          const converted = Number(response.stock);
          return isNaN(converted) ? 0 : Math.max(0, converted);
        }
        // Default to 0 if nothing valid is found
        return 0;
      })(),
      image_url: response.image_url || '',
      customizable: response.customizable || false,
      colors: mappedColors,
      sizes: response.sizes || [],
      created_at: response.created_at || response.$createdAt,
      updated_at: response.updated_at || response.$updatedAt,
      sku: response.sku || `SKU-${response.$id}`
    };
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

/**
 * Update an existing product
 */
export const updateProduct = async (id: string, productData: Partial<Product>): Promise<Product> => {
  try {
    console.log('Updating product with data:', { id, ...productData });
    console.log('Sizes in productData:', productData.sizes); // Debug log for sizes
    
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('Invalid product ID provided');
    }

    const updateData = {
      ...(productData.name && { name: productData.name }),
      ...(productData.description && { description: productData.description }),
      ...(productData.price && { price: productData.price }),
      ...(productData.category && { category: productData.category }),
      ...(productData.stock_quantity !== undefined && { 
        stock_quantity: Math.max(0, Number(productData.stock_quantity)),
        stock: Math.max(0, Number(productData.stock_quantity))
      }),
      ...(productData.image_url && { image_url: productData.image_url }),
      ...(productData.customizable !== undefined && { 
        customizable: typeof productData.customizable === 'boolean' 
          ? productData.customizable 
          : (productData.customizable === 'true' || 
             productData.customizable === 'Enabled' ||
             productData.customizable === '1')
      }),
      ...(productData.sku && { sku: productData.sku }),
      // Always include sizes, even if it's an empty array
      sizes: productData.sizes || [],
      updated_at: new Date().toISOString()
    };

    console.log('Update data being sent to Appwrite:', updateData); // Debug log for update data
    console.log('Sizes in update data:', updateData.sizes); // Debug log specifically for sizes

    const response = await databases.updateDocument(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      id,
      updateData
    );

    console.log('Appwrite response:', response); // Debug log for response
    console.log('Sizes in response:', response.sizes); // Debug log for response sizes

    // Handle colors update if colors were provided
    let updatedColors: ProductColor[] = [];
    if (productData.colors && productData.colors.length > 0) {
      // First delete all existing colors
      const existingColors = await databases.listDocuments(
        DATABASE_ID,
        'product_colors',
        [Query.equal('product_id', id)]
      );

      // Delete existing colors
      await Promise.all(
        existingColors.documents.map(color =>
          databases.deleteDocument(
            DATABASE_ID,
            'product_colors',
            color.$id
          )
        )
      );

      // Add new colors
      const colorPromises = productData.colors.map(color =>
        databases.createDocument(
          DATABASE_ID,
          'product_colors',
          ID.unique(),
          {
            product_id: id,
            name: color.name,
            hex: color.hex
          }
        )
      );

      const createdColors = await Promise.all(colorPromises);
      updatedColors = createdColors.map(doc => ({
        id: doc.$id,
        product_id: doc.product_id,
        name: doc.name,
        hex: doc.hex,
        created_at: doc.$createdAt
      }));
    }

    // Construct and return the updated product
    return {
      id: response.$id,
      name: response.name,
      description: response.description || '',
      price: response.price,
      category: response.category || 'uncategorized',
      stock_quantity: (() => {
        // First check if stock_quantity exists as a number
        if (typeof response.stock_quantity === 'number') {
          return Math.max(0, response.stock_quantity);
        }
        // Then check if stock_quantity exists but needs conversion
        if (response.stock_quantity !== undefined && response.stock_quantity !== null) {
          const converted = Number(response.stock_quantity);
          return isNaN(converted) ? 0 : Math.max(0, converted);
        }
        // Then check if there's a stock field (old field name)
        if (typeof response.stock === 'number') {
          return Math.max(0, response.stock);
        }
        // Try to convert stock field if it exists
        if (response.stock !== undefined && response.stock !== null) {
          const converted = Number(response.stock);
          return isNaN(converted) ? 0 : Math.max(0, converted);
        }
        // Default to 0 if nothing valid is found
        return 0;
      })(),
      image_url: response.image_url || '',
      customizable: typeof response.customizable === 'boolean' 
        ? response.customizable 
        : (response.customizable === 'true' || 
           response.customizable === 'Enabled' || 
           response.customizable === '1'),
      colors: updatedColors.length > 0 ? updatedColors : (productData.colors || []),
      sizes: response.sizes || productData.sizes || [], // sizes from response, then from input, then empty array
      gallery_images: response.gallery_images || [], // Restored gallery_images
      created_at: response.created_at || response.$createdAt,
      updated_at: response.updated_at || response.$updatedAt,
      sku: response.sku || `SKU-${response.$id}`
    };
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

/**
 * Delete a product and its associated colors
 */
export const deleteProduct = async (id: string) => {
  try {
    // First delete all associated colors
    const colors = await databases.listDocuments(
      DATABASE_ID,
      'product_colors',
      [Query.equal('product_id', id)]
    );

    await Promise.all(
      colors.documents.map(color =>
        databases.deleteDocument(
          DATABASE_ID,
          'product_colors',
          color.$id
        )
      )
    );

    // Then delete the product
    await databases.deleteDocument(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      id
    );
  } catch (error) {
    console.error('Failed to delete product:', error);
    throw error;
  }
};

/**
 * Get a single product by ID
 */
export const getProduct = async (productId: string): Promise<Product> => {
  try {
    const productData = await databases.getDocument(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID,
      productId
    );
    
    const product = await productDataToProduct(productData);
    
    // Check if we have gallery images in the database
    const hasGalleryImages = Array.isArray(product.gallery_images) && product.gallery_images.length > 0;
    
    // If no gallery images in database, check localStorage
    if (!hasGalleryImages) {
      try {
        const storedGallery = localStorage.getItem(`product_${productId}_gallery`);
        if (storedGallery) {
          const galleryImages = JSON.parse(storedGallery);
          if (Array.isArray(galleryImages) && galleryImages.length > 0) {
            console.log(`Found ${galleryImages.length} gallery images in localStorage for product ${productId}`);
            product.gallery_images = galleryImages;
            
            // Try to update the database if gallery_images field exists
            const galleryFieldExists = localStorage.getItem('galleryImagesFieldExists') === 'true';
            if (galleryFieldExists) {
              try {
                await databases.updateDocument(
                  DATABASE_ID,
                  PRODUCTS_COLLECTION_ID,
                  productId,
                  { gallery_images: galleryImages }
                );
                console.log('Updated product in database with gallery images from localStorage');
              } catch (syncError) {
                console.warn('Could not sync gallery images to database:', syncError);
              }
            }
          }
        }
      } catch (storageError) {
        console.warn('Failed to load gallery images from localStorage:', storageError);
      }
    }
    
    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

/**
 * Get all products
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID
    );

    if (!response.documents) {
      console.warn('No products found');
      return [];
    }

    // Get all colors for all products in a single query
    const colorsResponse = await databases.listDocuments(
      DATABASE_ID,
      'product_colors'
    );

    // Create a map of product ID to colors
    const colorsByProductId = colorsResponse.documents.reduce((acc, color) => {
      if (!acc[color.product_id]) {
        acc[color.product_id] = [];
      }
      acc[color.product_id].push({
        id: color.$id,
        product_id: color.product_id,
        name: color.name,
        hex: color.hex,
        created_at: color.$createdAt
      });
      return acc;
    }, {} as Record<string, ProductColor[]>);

    // Map products with their colors
    const products = response.documents.map(doc => ({
      id: doc.$id,
      name: doc.name,
      description: doc.description || '',
      price: doc.price,
      category: doc.category || 'uncategorized',
      image_url: doc.image_url || '',
      stock_quantity: doc.stock_quantity !== undefined ? doc.stock_quantity : (doc.stock || 0),
      customizable: doc.customizable || false,
      sku: doc.sku || `SKU-${doc.$id}`,
      created_at: doc.created_at || doc.$createdAt,
      updated_at: doc.updated_at || doc.$updatedAt,
      gallery_images: doc.gallery_images || [],
      colors: colorsByProductId[doc.$id] || []
    }));

    // Check for gallery images in localStorage for products that don't have them in the database
    await Promise.all(products.map(async (product) => {
      const hasGalleryImages = Array.isArray(product.gallery_images) && product.gallery_images.length > 0;
      
      if (!hasGalleryImages) {
        try {
          const storedGallery = localStorage.getItem(`product_${product.id}_gallery`);
          if (storedGallery) {
            const galleryImages = JSON.parse(storedGallery);
            if (Array.isArray(galleryImages) && galleryImages.length > 0) {
              console.log(`Found ${galleryImages.length} gallery images in localStorage for product ${product.id}`);
              product.gallery_images = galleryImages;
              
              // Try to update the database if gallery_images field exists
              const galleryFieldExists = localStorage.getItem('galleryImagesFieldExists') === 'true';
              if (galleryFieldExists) {
                try {
                  await databases.updateDocument(
                    DATABASE_ID,
                    PRODUCTS_COLLECTION_ID,
                    product.id,
                    { gallery_images: galleryImages }
                  );
                  console.log('Updated product in database with gallery images from localStorage');
                } catch (syncError) {
                  console.warn(`Could not sync gallery images to database for product ${product.id}:`, syncError);
                }
              }
            }
          }
        } catch (storageError) {
          console.warn(`Failed to load gallery images from localStorage for product ${product.id}:`, storageError);
        }
      }
    }));

    return products;
  } catch (error) {
    console.error('Failed to get products:', error);
    throw error;
  }
};
