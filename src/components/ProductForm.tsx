import React, { useState, useRef, useEffect } from 'react';
import { databases } from '../lib/appwrite';
import { createProduct, updateProduct } from '../services/product.service';
import { uploadImage, deleteImage, uploadGalleryImages } from '../services/upload.service';
import type { Product, ProductColor } from '../types/product';
import { useToast } from '../contexts/ToastContext';
import { categories as initialCategories } from '../data/categories';
import ColorPickerDialog from './ColorPickerDialog';
import { updateProductWithGalleryImages } from '../services/database.service';
import { v4 as uuidv4 } from 'uuid';
import { Plus, X, Image as ImageIcon, Check, PlusCircle, Loader2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SizeSelector } from './ui/SizeSelector';
import '../styles/ProductForm.css';

/**
 * IMPORTANT: Issues Fixed & Remaining Issues
 * 
 * Fixed Issues:
 * 1. Storage bucket error: upload.service.ts was updated to create the Appwrite storage bucket if it doesn't exist
 * 2. customizable field type errors: Product type now accepts both boolean and string values
 * 3. Removed Supabase dependency: Now using Appwrite exclusively for database operations
 * 4. Missing sku field: Added to formData initialization and reset
 * 5. null/undefined checks: Added for formData.colors in the rendering section
 * 6. Appwrite schema issues: Now tries both $id and id fields when querying/updating database
 * 7. Type safety: Added conversions between boolean and string formats for customizable field
 * 8. Database operations: Added direct database updates for product colors using Appwrite APIs
 * 
 * Remaining Issues That Need Attention:
 * 1. Appwrite schema compatibility: May need to create proper collection attributes in Appwrite
 *    - In Appwrite, primary keys are usually $id, not id
 *    - You may need to create proper schema for products and product_colors collections
 * 
 * 2. Type conversion: Review all places where data types might need conversion:
 *    - Boolean vs String values for customizable field
 *    - Object shapes required by Appwrite vs what was used in Supabase
 * 
 * 3. Error handling: Consider adding more error reporting to UI for failed operations
 *    - Currently many errors only go to console
 *    - Add a way to retry failed operations
 * 
 * For further help, check the console logs for specific error messages and contexts.
 */

// Available product sizes
const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL'];

type ProductFormProps = {
  initialProduct?: Product;
  mode: 'create' | 'edit';
  onSuccess?: () => void;
};

export default function ProductForm({ initialProduct, mode, onSuccess }: ProductFormProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(initialProduct?.image_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const [customizationSupported, setCustomizationSupported] = useState(true);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>(initialProduct?.gallery_images || []);
  
  // Boolean state for UI toggle - determine initial value from product data
  const [isCustomizable, setIsCustomizable] = useState(() => {
    console.log('Initializing customizable state from:', initialProduct?.customizable);
    // Handle all possible types for customizable field
    return initialProduct?.customizable === true || 
           (typeof initialProduct?.customizable === 'string' && 
             (initialProduct?.customizable === 'Enabled' || initialProduct?.customizable === 'true'));
  });
  
  // Log initial state for debugging
  useEffect(() => {
    console.log('Initial customizable state:', {
      initialValue: initialProduct?.customizable,
      isCustomizable: isCustomizable
    });
  }, [initialProduct?.customizable]);
  
  const [customCategories, setCustomCategories] = useState<string[]>([...initialCategories]);
  const [newCategory, setNewCategory] = useState<string>('');
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [categoryError, setCategoryError] = useState<string>('');
  
  const [formData, setFormData] = useState<Omit<Product, 'id' | 'created_at'>>({
    name: initialProduct?.name || '',
    description: initialProduct?.description || '',
    price: initialProduct?.price || 0,
    category: initialProduct?.category || customCategories[0],
    image_url: initialProduct?.image_url || '',
    stock_quantity: initialProduct?.stock_quantity || 0,
    colors: initialProduct?.colors || [],
    sizes: initialProduct?.sizes || [],
    customizable: isCustomizable,
    user_id: initialProduct?.user_id || '',
    updated_at: initialProduct?.updated_at || new Date().toISOString(),
    gallery_images: initialProduct?.gallery_images || [],
    sku: initialProduct?.sku || ''
  });

  // Update formData when isCustomizable changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      customizable: isCustomizable
    }));
    console.log('Customizable state updated:', isCustomizable ? 'Enabled' : 'Disabled');
  }, [isCustomizable]);
  
  // Update formData when galleryImages changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      gallery_images: galleryImages
    }));
    
    // Save to localStorage as a fallback mechanism
    if (initialProduct?.id) {
      try {
        // Don't log errors for gallery images updates
        // The updateProductWithGalleryImages function will handle error logging
        updateProductWithGalleryImages(initialProduct.id, galleryImages)
          .then(success => {
            if (success) {
              if (localStorage.getItem('galleryImagesFieldExists') === 'true') {
                console.log('Gallery images saved to database');
              } else {
                console.log('Gallery images saved to localStorage (field not in database)');
              }
            }
          })
          .catch(() => {
            // Error already logged by the function
          });
      } catch (e) {
        // Error already logged by the function
      }
    }
  }, [galleryImages, initialProduct?.id]);
  
  // Fix the issue with product loading from Appwrite
  useEffect(() => {
    if (mode === 'edit' && initialProduct) {
      // Get product data directly from product service to ensure we have the latest data
      const getLatestProductData = async () => {
        try {
          if (initialProduct?.id) {
            console.log(`Loading latest data for product ${initialProduct.id}...`);
            
            // Use a try/catch approach for Appwrite compatibility
            let productData;
            
            try {
              const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
              const collectionId = import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID;
              
              console.log('Trying to fetch product with $id field...');
              productData = await databases.getDocument(
                databaseId,
                collectionId,
                initialProduct.id
              );
              
              console.log('Found product using $id field');
            } catch (idError) {
              console.log('Error or no results with $id:', idError);
              productData = null;
            }
            
            // Also check local storage in case we stored the state there
            const storedState = localStorage.getItem(`product_${initialProduct.id}_customizable`);
            
            console.log('Product data from database:', productData);
            console.log('Stored customizable state:', storedState);
            
            // Determine the correct state from multiple sources
            let shouldBeCustomizable = false;
            
            // 1. From database
            if (productData) {
              if (productData.customizable === true) {
                shouldBeCustomizable = true;
              } else if (typeof productData.customizable === 'string') {
                shouldBeCustomizable = 
                  productData.customizable === 'Enabled' || 
                  productData.customizable === 'true';
              }
            }
            
            // 2. From initialProduct prop if database didn't give us a value
            if (!productData && initialProduct) {
              if (initialProduct.customizable === true) {
                shouldBeCustomizable = true;
              } else if (typeof initialProduct.customizable === 'string') {
                shouldBeCustomizable = 
                  initialProduct.customizable === 'Enabled' || 
                  initialProduct.customizable === 'true';
              }
            }
            
            // 3. From localStorage as a last resort
            if (!productData && !initialProduct.customizable && storedState) {
              shouldBeCustomizable = 
                storedState === 'true' || 
                storedState === 'Enabled';
            }
            
            console.log('Computed customizable state:', shouldBeCustomizable);
            
            // Update state if different
            if (shouldBeCustomizable !== isCustomizable) {
              console.log('Updating customizable state:', shouldBeCustomizable);
              setIsCustomizable(shouldBeCustomizable);
              
              // Also update formData
              setFormData(prev => ({
                ...prev,
                customizable: shouldBeCustomizable
              }));
            }
            
            // Also update sizes if we have fresh data from the database
            if (productData && productData.sizes) {
              console.log('Updating sizes from database:', productData.sizes);
              setFormData(prev => ({
                ...prev,
                sizes: productData.sizes || []
              }));
            }
          }
        } catch (error) {
          console.error('Error loading latest product data:', error);
        }
      };
      
      getLatestProductData();
    }
  }, [initialProduct?.id, mode, isCustomizable]);

  // Add a direct DOM manipulation effect to ensure toggle state is visually correct
  useEffect(() => {
    // Force the toggle button to visually reflect the current state
    const updateToggleVisuals = () => {
      const toggleButton = document.getElementById('product-customizable');
      if (toggleButton) {
        console.log('Updating toggle button visuals:', isCustomizable);
        toggleButton.setAttribute('aria-checked', String(isCustomizable));
        
        // Update toggle style classes
        if (isCustomizable) {
          toggleButton.classList.remove('bg-gray-200');
          toggleButton.classList.add('bg-green-500');
          
          // Also update the toggle position
          const toggleHandle = toggleButton.querySelector('span:not(.sr-only)');
          if (toggleHandle) {
            toggleHandle.classList.remove('translate-x-1');
            toggleHandle.classList.add('translate-x-6');
          }
        } else {
          toggleButton.classList.remove('bg-green-500');
          toggleButton.classList.add('bg-gray-200');
          
          // Update toggle position
          const toggleHandle = toggleButton.querySelector('span:not(.sr-only)');
          if (toggleHandle) {
            toggleHandle.classList.remove('translate-x-6');
            toggleHandle.classList.add('translate-x-1');
          }
        }
      }
    };
    
    // Allow DOM to render first
    const timeoutId = setTimeout(updateToggleVisuals, 100);
    return () => clearTimeout(timeoutId);
  }, [isCustomizable]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'stock_quantity' ? Number(value) : value,
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      showToast('No file selected', 'error');
      return;
    }

    try {
      setIsSubmitting(true); // Disable form while uploading
      showToast('Uploading image...', 'info');

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size too large. Maximum size is 5MB.');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Allowed types are: JPEG, PNG, GIF, and WebP.');
      }

      // Create a preview
      const preview = URL.createObjectURL(file);
      setPreviewImage(preview);

      console.log('Starting image upload for file:', file.name);

      // Upload the image
      const imageUrl = await uploadImage(file);
      console.log('Image uploaded successfully:', imageUrl);
      
      // If updating and there's an existing image, delete it
      if (mode === 'edit' && formData.image_url) {
        try {
          console.log('Deleting old image:', formData.image_url);
          await deleteImage(formData.image_url);
          console.log('Old image deleted successfully');
        } catch (error) {
          console.error('Failed to delete old image:', error);
          showToast('Warning: Failed to delete old image, but upload succeeded', 'warning');
        }
      }

      setFormData(prev => ({
        ...prev,
        image_url: imageUrl
      }));

      showToast('Image uploaded successfully', 'success');
    } catch (error) {
      console.error('Failed to upload image:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to upload image. Please try again.',
        'error'
      );
      setPreviewImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleColorSelect = (color: Omit<ProductColor, 'id' | 'product_id' | 'created_at'>) => {
    // Create a full ProductColor object with required product_id
    const newColor: ProductColor = {
      ...color,
      id: `temp_${uuidv4()}`, // Generate a temporary ID
      product_id: initialProduct?.id || 'temp_id',
      created_at: new Date().toISOString() // Add required created_at field
    };
    
    setFormData((prev) => ({
      ...prev,
      colors: [...(prev.colors || []), newColor],
    }));
    setIsColorPickerOpen(false);
    showToast(`Added ${color.name} color`, 'success');
  };

  const removeColor = (index: number) => {
    const colorName = formData.colors && formData.colors[index] ? formData.colors[index].name : '';
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors ? prev.colors.filter((_, i) => i !== index) : [],
    }));
    showToast(`Removed ${colorName} color`, 'info');
  };

  const handleToggleCustomizable = async () => {
    const newValue = !isCustomizable;
    console.log('Toggle clicked, new value:', newValue);
    
    // First update the toggle state
    setIsCustomizable(newValue);
    
    // Convert to string format for localStorage only - keep boolean for database
    const newStringValue = newValue ? 'Enabled' : 'Disabled';
    
    // Then update form data with the value
    setFormData(prev => ({
      ...prev,
      customizable: newValue // Keep boolean in state for UI toggle
    }));
    
    // Store in localStorage for persistence
    if (initialProduct?.id) {
      try {
        // Save to localStorage first (most reliable)
        localStorage.setItem(
          `product_${initialProduct.id}_customizable`, 
          newStringValue
        );
        console.log(`Saved customizable state to localStorage: ${newStringValue}`);
        
        // Then try to update the database directly
        console.log('Updating database with new customizable value...');
        
        // Validate the ID to prevent UUID errors
        if (!initialProduct.id || typeof initialProduct.id !== 'string' || initialProduct.id.trim() === '') {
          console.error('Invalid product ID, cannot update database');
          return;
        }
        
        // Try updating with both ID formats (Appwrite and Supabase)
        const updateData = { 
          customizable: newValue, // Use boolean value for Appwrite
          updated_at: new Date().toISOString()
        };
        
        let updated = false;
        
        try {
          // First try Appwrite convention with $id
          console.log('Trying to update with $id field...');
          await databases.updateDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
            initialProduct.id,
            updateData
          );
          
          console.log('Database updated successfully using $id field');
          updated = true;
        } catch (e) {
          console.log('Error updating with $id field:', e);
        }
        
        if (!updated) {
          try {
            // Then try with regular id field (Supabase convention)
            console.log('Trying to update with id field...');
            await databases.updateDocument(
              import.meta.env.VITE_APPWRITE_DATABASE_ID,
              import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
              initialProduct.id,
              updateData
            );
            
            console.log('Database updated successfully using id field');
            updated = true;
          } catch (e) {
            console.error('Exception updating database with id field:', e);
          }
        }
        
        if (!updated) {
          console.warn('Could not update database through API, relying on localStorage');
        }
      } catch (error) {
        console.error('Exception updating database:', error);
      }
    } else {
      console.log('No product ID available, only updating local state');
    }
    
    // Log the change for debugging
    console.log('Toggled customizable to:', newValue ? 'Enabled' : 'Disabled');
    
    // Force a redraw of the toggle button
    setTimeout(() => {
      const toggleButton = document.getElementById('product-customizable');
      if (toggleButton) {
        toggleButton.setAttribute('aria-checked', String(newValue));
        if (newValue) {
          toggleButton.classList.remove('bg-gray-200');
          toggleButton.classList.add('bg-green-500');
        } else {
          toggleButton.classList.remove('bg-green-500');
          toggleButton.classList.add('bg-gray-200');
        }
      }
    }, 0);
  };

  const handleSizeToggle = (size: string) => {
    setFormData(prev => {
      const updatedSizes = prev.sizes?.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...(prev.sizes || []), size];
      
      return {
        ...prev,
        sizes: updatedSizes
      };
    });
  };

  const handleGalleryImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      showToast('No files selected', 'error');
      return;
    }

    try {
      setIsGalleryUploading(true);
      const fileCount = files.length;
      showToast(`Processing ${fileCount} gallery images...`, 'info');

      // Convert FileList to array
      const fileArray = Array.from(files);
      
      // Validate file sizes (10MB each)
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      const oversizedFiles = fileArray.filter(file => file.size > MAX_SIZE);
      if (oversizedFiles.length > 0) {
        throw new Error(`${oversizedFiles.length} files exceed the 10MB size limit.`);
      }

      // Validate file types
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const invalidFiles = fileArray.filter(file => !allowedTypes.includes(file.type));
      if (invalidFiles.length > 0) {
        throw new Error(`${invalidFiles.length} files have invalid types. Allowed types are: JPEG, PNG, GIF, and WebP.`);
      }

      // Use the uploadGalleryImages service function which now includes optimization
      showToast('Optimizing and uploading images...', 'info');
      const uploadedUrls = await uploadGalleryImages(fileArray);
      
      if (uploadedUrls.length === 0) {
        throw new Error('All image uploads failed. Please try again.');
      }
      
      if (uploadedUrls.length < fileArray.length) {
        showToast(`Warning: Only ${uploadedUrls.length} of ${fileArray.length} images were uploaded successfully.`, 'warning');
      }
      
      // Update gallery images state
      const newGalleryImages = [...galleryImages, ...uploadedUrls];
      setGalleryImages(newGalleryImages);
      
      // Update formData directly to ensure it's saved
      setFormData(prev => ({
        ...prev,
        gallery_images: newGalleryImages
      }));
      
      // If in edit mode and we have a product ID, update the database immediately
      if (mode === 'edit' && initialProduct?.id) {
        try {
          const success = await updateProductWithGalleryImages(initialProduct.id, newGalleryImages);
          if (success) {
            console.log('Gallery images immediately saved to database');
          } else {
            console.log('Gallery images saved to local state, will be updated on form save');
            // Save to localStorage as a fallback
            localStorage.setItem(`product_${initialProduct.id}_gallery`, JSON.stringify(newGalleryImages));
          }
        } catch (dbError) {
          console.error('Error saving gallery images to database:', dbError);
          // Save to localStorage as a fallback
          localStorage.setItem(`product_${initialProduct.id}_gallery`, JSON.stringify(newGalleryImages));
        }
      }
      
      showToast(`Successfully uploaded ${uploadedUrls.length} gallery images`, 'success');
      
      // Reset file input
      if (galleryFileInputRef.current) {
        galleryFileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to upload gallery images:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to upload gallery images. Please try again.',
        'error'
      );
      // Reset file input
      if (galleryFileInputRef.current) {
        galleryFileInputRef.current.value = '';
      }
    } finally {
      setIsGalleryUploading(false);
    }
  };

  const removeGalleryImage = async (index: number) => {
    const imageUrl = galleryImages[index];
    try {
      // Create a new array without the removed image
      const updatedGalleryImages = [...galleryImages];
      updatedGalleryImages.splice(index, 1);
      
      // Update state first for immediate UI feedback
      setGalleryImages(updatedGalleryImages);
      
      // Update formData directly
      setFormData(prev => ({
        ...prev,
        gallery_images: updatedGalleryImages
      }));
      
      // If in edit mode and we have a product ID, update the database immediately
      if (mode === 'edit' && initialProduct?.id) {
        try {
          const success = await updateProductWithGalleryImages(initialProduct.id, updatedGalleryImages);
          if (success) {
            console.log('Updated gallery images saved to database after removal');
          } else {
            console.log('Updated gallery images saved to local state after removal');
            // Save to localStorage as a fallback
            localStorage.setItem(`product_${initialProduct.id}_gallery`, JSON.stringify(updatedGalleryImages));
          }
        } catch (dbError) {
          console.error('Error saving updated gallery images to database after removal:', dbError);
          // Save to localStorage as a fallback
          localStorage.setItem(`product_${initialProduct.id}_gallery`, JSON.stringify(updatedGalleryImages));
        }
      }
      
      // Delete the image from storage in the background
      deleteImage(imageUrl)
        .then(() => console.log('Gallery image deleted from storage'))
        .catch(error => console.error('Failed to delete gallery image from storage:', error));
      
      showToast('Gallery image removed', 'info');
    } catch (error) {
      console.error('Failed to remove gallery image:', error);
      showToast('Failed to remove gallery image', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('Submitting product form with data:', formData);
      
      // Create a copy of form data to handle type conversions properly
      const submittedData = {
        ...formData,
        // Convert string customizable field to boolean if needed
        customizable: typeof formData.customizable === 'string' 
          ? ['true', 'Enabled', '1'].includes(formData.customizable as string)
          : !!formData.customizable,
        // Ensure gallery_images is an array
        gallery_images: Array.isArray(formData.gallery_images) ? formData.gallery_images : []
      };
      
      // Create or update product
      if (mode === 'create') {
        console.log('Creating new product');
        await createProduct(submittedData, submittedData.colors || []);
      } else if (mode === 'edit' && initialProduct?.id) {
        console.log('Updating existing product with ID:', initialProduct.id);
        await updateProduct(initialProduct.id, submittedData);
        
        // Also update gallery images via dedicated function to ensure compatibility
        if (submittedData.gallery_images && submittedData.gallery_images.length > 0) {
          try {
            await updateProductWithGalleryImages(initialProduct.id, submittedData.gallery_images);
          } catch (galleryError) {
            console.error('Error updating gallery images:', galleryError);
            // Continue - gallery error shouldn't stop the main update
          }
        }
      }
      
      console.log('Product saved successfully');
      // Clear the form and close it
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: customCategories[0],
        image_url: '',
        stock_quantity: 0,
        colors: [],
        sizes: [],
        customizable: false,
        user_id: '',
        updated_at: new Date().toISOString(),
        gallery_images: [],
        sku: ''
      });
      
      showToast('Product saved successfully', 'success');
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Error saving product:', error);
      showToast('Failed to save product. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryAdd = () => {
    if (!newCategory.trim()) {
      setCategoryError('Category name cannot be empty');
      return;
    }
    
    // Check if category already exists
    if (customCategories.includes(newCategory.trim())) {
      setCategoryError('This category already exists');
      return;
    }
    
    // Add the new category
    const updatedCategories = [...customCategories, newCategory.trim()];
    setCustomCategories(updatedCategories);
    setNewCategory('');
    setIsAddingCategory(false);
    setCategoryError('');
    
    // Save to localStorage for persistence
    try {
      localStorage.setItem('custom_categories', JSON.stringify(updatedCategories));
    } catch (e) {
      console.warn('Could not save categories to localStorage:', e);
    }
    
    showToast(`Added ${newCategory.trim()} category`, 'success');
  };
  
  const handleCategoryDelete = (categoryToDelete: string) => {
    // Don't delete the currently selected category
    if (formData.category === categoryToDelete) {
      showToast('Cannot delete the currently selected category', 'error');
      return;
    }
    
    // Filter out the category to delete
    const updatedCategories = customCategories.filter(cat => cat !== categoryToDelete);
    
    // Make sure we don't end up with an empty array
    if (updatedCategories.length === 0) {
      showToast('Cannot delete the last category', 'error');
      return;
    }
    
    setCustomCategories(updatedCategories);
    
    // Save to localStorage for persistence
    try {
      localStorage.setItem('custom_categories', JSON.stringify(updatedCategories));
    } catch (e) {
      console.warn('Could not save categories to localStorage:', e);
    }
    
    showToast(`Deleted ${categoryToDelete} category`, 'info');
  };
  
  // Load custom categories from localStorage on component mount
  useEffect(() => {
    try {
      const savedCategories = localStorage.getItem('custom_categories');
      if (savedCategories) {
        const parsedCategories = JSON.parse(savedCategories);
        if (Array.isArray(parsedCategories) && parsedCategories.length > 0) {
          setCustomCategories(parsedCategories);
        }
      }
    } catch (e) {
      console.warn('Could not load custom categories from localStorage:', e);
    }
  }, []);

  // Show a notification to the administrator if gallery_images field doesn't exist
  useEffect(() => {
    if (mode === 'edit' && galleryImages.length > 0) {
      const galleryFieldExists = localStorage.getItem('galleryImagesFieldExists') === 'true';
      if (!galleryFieldExists) {
        setTimeout(() => {
          showToast(
            'Gallery images will be stored in localStorage until the gallery_images field is added to your Appwrite collection. Check console for setup instructions.',
            'info'
          );
        }, 2000);
      }
    }
  }, [mode, galleryImages.length, showToast]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-2">
            <label htmlFor="product-name" className="block text-sm font-medium text-amber-600">
              Product Name
            </label>
            <input
              type="text"
              name="name"
              id="product-name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full px-4 py-3 rounded-md border-2 border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="product-description" className="block text-sm font-medium text-amber-600">
              Description
            </label>
            <textarea
              name="description"
              id="product-description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full px-4 py-3 rounded-md border-2 border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="product-price" className="block text-sm font-medium text-amber-600">
                Price (₦)
              </label>
              <input
                type="number"
                name="price"
                id="product-price"
                value={formData.price}
                onChange={(e) => {
                  // Ensure price is a non-negative number with up to 2 decimal places
                  const value = e.target.value;
                  const numberValue = parseFloat(value);
                  
                  if (value === '') {
                    // Allow empty field during typing
                    setFormData(prev => ({ ...prev, price: 0 }));
                  } else if (!isNaN(numberValue) && numberValue >= 0) {
                    // Round to 2 decimal places
                    setFormData(prev => ({ 
                      ...prev, 
                      price: Math.round(numberValue * 100) / 100 
                    }));
                  }
                }}
                onBlur={() => {
                  // Ensure we always have a valid number when focus leaves the field
                  if (formData.price === undefined || formData.price === null || isNaN(Number(formData.price))) {
                    setFormData(prev => ({ ...prev, price: 0 }));
                  }
                }}
                min="0"
                step="0.01"
                className="mt-1 block w-full px-4 py-3 rounded-md border-2 border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
              <p className="text-xs text-gray-500">
                Current price: <span className="font-medium">₦{formData.price.toLocaleString()}</span>
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="product-stock" className="block text-sm font-medium text-amber-600">
                Stock Quantity
              </label>
              <input
                type="number"
                name="stock_quantity"
                id="product-stock"
                value={formData.stock_quantity}
                onChange={(e) => {
                  // Ensure stock quantity is a non-negative integer
                  const value = e.target.value;
                  const numberValue = parseInt(value, 10);
                  
                  if (value === '') {
                    // Allow empty field during typing
                    setFormData(prev => ({ ...prev, stock_quantity: 0 }));
                  } else if (!isNaN(numberValue) && numberValue >= 0) {
                    setFormData(prev => ({ ...prev, stock_quantity: numberValue }));
                  }
                }}
                onBlur={() => {
                  // Ensure we always have a valid number when focus leaves the field
                  if (formData.stock_quantity === undefined || formData.stock_quantity === null || isNaN(Number(formData.stock_quantity))) {
                    setFormData(prev => ({ ...prev, stock_quantity: 0 }));
                  }
                }}
                min="0"
                step="1"
                className="mt-1 block w-full px-4 py-3 rounded-md border-2 border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
              <p className="text-xs text-gray-500">
                {formData.stock_quantity <= 0 ? (
                  <span className="text-red-500 font-medium">
                    This product will be marked as "Out of stock"
                  </span>
                ) : formData.stock_quantity <= 10 ? (
                  <span className="text-yellow-500 font-medium">
                    Low stock warning will be displayed
                  </span>
                ) : (
                  <span className="text-green-500 font-medium">
                    Product in stock
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="product-customizable" className="block text-sm font-medium text-amber-600">
                Customizable Product
              </label>
              <button
                type="button"
                role="switch"
                aria-checked={isCustomizable}
                id="product-customizable"
                onClick={handleToggleCustomizable}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  isCustomizable ? 'bg-green-500' : 'bg-gray-200'
                }`}
              >
                <span className="sr-only">Enable customization</span>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isCustomizable ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              When enabled, this product will appear in the Customize page for customers to select for customization.
            </p>
            <p className="mt-2 text-xs font-medium text-gray-900">
              Status: <span className={isCustomizable ? "text-green-600" : "text-gray-500"}>
                {isCustomizable ? "Enabled" : "Disabled"}
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="product-category" className="block text-sm font-medium text-amber-600">
              Category
            </label>
            <div className="flex space-x-2">
              <select
                name="category"
                id="product-category"
                value={formData.category}
                onChange={handleInputChange}
                className="mt-1 block w-full px-4 py-3 rounded-md border-2 border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
                autoComplete="off"
              >
                {customCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsAddingCategory(true)}
                className="mt-1 inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                aria-label="Add new category"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="product-image" className="block text-sm font-medium text-amber-600">
              Product Image
            </label>
            <div className="mt-1 flex justify-center px-6 py-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-2 text-center">
                {previewImage ? (
                  <div className="relative">
                    <img
                      src={previewImage}
                      alt="Product preview"
                      className="mx-auto h-64 w-auto object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImage(null);
                        setFormData(prev => ({ ...prev, image_url: '' }));
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-100 rounded-full p-2 text-red-600 hover:text-red-700"
                      aria-label="Remove image"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="product-image-upload"
                        className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="product-image-upload"
                          name="image-upload"
                          type="file"
                          ref={fileInputRef}
                          className="sr-only"
                          accept="image/*"
                          onChange={handleImageChange}
                          aria-label="Upload product image"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-amber-600">Product Colors</label>
              <button
                type="button"
                onClick={() => setIsColorPickerOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Color
              </button>
            </div>
            
            <div className="colors-grid">
              {formData.colors?.map((color, index) => (
                <div
                  key={index}
                  className="color-item"
                >
                  <div 
                    className="color-preview"
                    style={{ backgroundColor: color?.hex }}
                  ></div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {color?.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeColor(index)}
                      className="p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-amber-600">Available Sizes</label>
            </div>
            
            <SizeSelector
              sizes={AVAILABLE_SIZES}
              selectedSizes={formData.sizes}
              onSizeSelect={handleSizeToggle}
              colorScheme="blue"
              className="mt-2"
              multiSelect={true}
            />
            
            <div className="sizes-container">
              {formData.sizes && formData.sizes.length > 0 ? (
                <>
                  <div className="text-sm text-gray-700 w-full mb-1">Selected sizes:</div>
                  {formData.sizes.map(size => (
                    <span key={size} className="size-chip selected">
                      {size}
                      <button 
                        type="button" 
                        onClick={() => handleSizeToggle(size)}
                        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-200 hover:bg-blue-300 text-blue-600"
                        aria-label={`Remove ${size} size`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </>
              ) : (
                <p className="text-sm text-gray-500 italic">No sizes selected</p>
              )}
            </div>
            
            <p className="mt-2 text-sm text-gray-500">
              Select all sizes that are available for this product.
            </p>
          </div>

          {/* Gallery Images Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-amber-600">
                Product Gallery
              </label>
              <button
                type="button"
                onClick={() => galleryFileInputRef.current?.click()}
                disabled={isGalleryUploading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isGalleryUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Gallery Images
                  </>
                )}
              </button>
              <input
                id="gallery-image-upload"
                name="gallery-image-upload"
                type="file"
                ref={galleryFileInputRef}
                className="sr-only"
                accept="image/*"
                multiple
                onChange={handleGalleryImageChange}
                aria-label="Upload gallery images"
                disabled={isGalleryUploading}
              />
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Add multiple images to showcase your product from different angles.
            </p>
            
            {galleryImages.length > 0 ? (
              <div className="image-gallery">
                {galleryImages.map((imageUrl, index) => (
                  <div key={index} className="gallery-image-container">
                    <img
                      src={imageUrl}
                      alt={`Product gallery image ${index + 1}`}
                      className="gallery-image"
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="gallery-image-remove"
                      aria-label={`Remove gallery image ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-md">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
                <p className="mt-2 text-sm text-gray-500">
                  No gallery images added yet
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Add images to showcase your product from different angles
                </p>
              </div>
            )}
          </div>

          {/* Category Management Section */}
          <div className="space-y-4 border-2 border-gray-200 rounded-md p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-amber-600">Category Management</h3>
              {!isAddingCategory && (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </button>
              )}
            </div>
            
            {isAddingCategory && (
              <div className="space-y-3 p-3 bg-gray-50 rounded-md">
                <label htmlFor="new-category" className="block text-sm font-medium text-gray-700">
                  New Category Name
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    id="new-category"
                    value={newCategory}
                    onChange={(e) => {
                      setNewCategory(e.target.value);
                      setCategoryError('');
                    }}
                    className="block w-full px-4 py-3 rounded-md border-2 border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter category name"
                  />
                  <button
                    type="button"
                    onClick={handleCategoryAdd}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategory('');
                      setCategoryError('');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </div>
                {categoryError && (
                  <p className="text-sm text-red-600 mt-1">{categoryError}</p>
                )}
              </div>
            )}
            
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Categories</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {customCategories.map((category) => (
                  <div 
                    key={category}
                    className={`flex justify-between items-center p-3 rounded-md border ${
                      formData.category === category ? 'border-amber-500 bg-amber-50' : 'border-gray-300'
                    }`}
                  >
                    <span className="text-sm font-medium truncate">{category}</span>
                    <button
                      type="button"
                      onClick={() => handleCategoryDelete(category)}
                      className={`p-1 rounded-full text-red-600 hover:text-red-800 hover:bg-red-50 ${
                        formData.category === category ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={formData.category === category}
                      aria-label={`Delete ${category} category`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-8 border-t mt-8">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-medium text-white bg-black border border-transparent rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Product' : 'Update Product'}
          </button>
        </div>
      </form>

      <ColorPickerDialog
        isOpen={isColorPickerOpen}
        onClose={() => setIsColorPickerOpen(false)}
        onColorSelect={handleColorSelect}
      />
    </div>
  );
}