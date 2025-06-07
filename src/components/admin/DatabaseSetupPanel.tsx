import React, { useState, useEffect } from 'react';
import { 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  FileSymlink 
} from 'lucide-react';
import { 
  addGalleryImagesFieldManually, 
  addCustomizableField, 
  addSizesField,
  showDatabaseSetupInstructions
} from '../../services/database.service';
import { useToast } from '../../contexts/ToastContext';

/**
 * Database Setup Panel for administrators to fix missing database fields
 */
export const DatabaseSetupPanel = () => {
  const { showToast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [missingFields, setMissingFields] = useState({
    galleryImages: false,
    customizable: false,
    sizes: false
  });
  const [loading, setLoading] = useState({
    galleryImages: false,
    customizable: false,
    sizes: false,
    checking: true
  });
  const [success, setSuccess] = useState({
    galleryImages: false,
    customizable: false, 
    sizes: false
  });

  // Check if user is admin and which fields are missing
  useEffect(() => {
    // Check if user is admin from localStorage
    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    setIsAdmin(adminStatus);

    // Check which fields are missing
    const galleryImagesFieldExists = localStorage.getItem('galleryImagesFieldExists') === 'true';
    const customizableFieldExists = localStorage.getItem('customizableFieldExists') === 'true';
    const sizesFieldExists = localStorage.getItem('sizesFieldExists') === 'true';

    setMissingFields({
      galleryImages: !galleryImagesFieldExists,
      customizable: !customizableFieldExists,
      sizes: !sizesFieldExists
    });

    setLoading(prev => ({ ...prev, checking: false }));
  }, []);

  // Handle fixing gallery_images field
  const handleFixGalleryImagesField = async () => {
    setLoading(prev => ({ ...prev, galleryImages: true }));
    try {
      const result = await addGalleryImagesFieldManually();
      if (result) {
        setSuccess(prev => ({ ...prev, galleryImages: true }));
        setMissingFields(prev => ({ ...prev, galleryImages: false }));
        showToast('Successfully added gallery_images field', 'success');
      } else {
        showToast('Failed to add gallery_images field', 'error');
      }
    } catch (error) {
      console.error('Error fixing gallery_images field:', error);
      showToast('Error fixing gallery_images field', 'error');
    } finally {
      setLoading(prev => ({ ...prev, galleryImages: false }));
    }
  };

  // Handle fixing customizable field
  const handleFixCustomizableField = async () => {
    setLoading(prev => ({ ...prev, customizable: true }));
    try {
      const result = await addCustomizableField();
      if (result) {
        setSuccess(prev => ({ ...prev, customizable: true }));
        setMissingFields(prev => ({ ...prev, customizable: false }));
        showToast('Successfully added customizable field', 'success');
      } else {
        showToast('Failed to add customizable field', 'error');
      }
    } catch (error) {
      console.error('Error fixing customizable field:', error);
      showToast('Error fixing customizable field', 'error');
    } finally {
      setLoading(prev => ({ ...prev, customizable: false }));
    }
  };

  // Handle fixing sizes field
  const handleFixSizesField = async () => {
    setLoading(prev => ({ ...prev, sizes: true }));
    try {
      const result = await addSizesField();
      if (result) {
        setSuccess(prev => ({ ...prev, sizes: true }));
        setMissingFields(prev => ({ ...prev, sizes: false }));
        showToast('Successfully added sizes field', 'success');
      } else {
        showToast('Failed to add sizes field', 'error');
      }
    } catch (error) {
      console.error('Error fixing sizes field:', error);
      showToast('Error fixing sizes field', 'error');
    } finally {
      setLoading(prev => ({ ...prev, sizes: false }));
    }
  };

  // Handle showing setup instructions
  const handleShowInstructions = () => {
    showDatabaseSetupInstructions();
    showToast('Setup instructions displayed in console', 'info');
  };

  // If not admin or checking, don't show
  if (!isAdmin || loading.checking) {
    return null;
  }

  // If no missing fields, don't show
  if (!missingFields.galleryImages && !missingFields.customizable && !missingFields.sizes) {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-2 text-amber-700 mb-3">
        <Database className="h-5 w-5" />
        <h3 className="font-medium">Database Setup Required</h3>
      </div>
      
      <p className="text-sm text-amber-600 mb-4">
        The following fields are missing in your Appwrite database. Click the buttons below to add them.
      </p>
      
      <div className="space-y-3">
        {/* Gallery Images Field */}
        {missingFields.galleryImages && (
          <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">gallery_images field (array)</span>
            </div>
            <button
              onClick={handleFixGalleryImagesField}
              disabled={loading.galleryImages}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading.galleryImages ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Fixing...
                </>
              ) : success.galleryImages ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Fixed
                </>
              ) : (
                <>Fix</>
              )}
            </button>
          </div>
        )}
        
        {/* Customizable Field */}
        {missingFields.customizable && (
          <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">customizable field (boolean)</span>
            </div>
            <button
              onClick={handleFixCustomizableField}
              disabled={loading.customizable}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading.customizable ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Fixing...
                </>
              ) : success.customizable ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Fixed
                </>
              ) : (
                <>Fix</>
              )}
            </button>
          </div>
        )}
        
        {/* Sizes Field */}
        {missingFields.sizes && (
          <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">sizes field (array)</span>
            </div>
            <button
              onClick={handleFixSizesField}
              disabled={loading.sizes}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading.sizes ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Fixing...
                </>
              ) : success.sizes ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Fixed
                </>
              ) : (
                <>Fix</>
              )}
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex justify-center">
        <button 
          onClick={handleShowInstructions}
          className="text-xs text-indigo-600 flex items-center gap-1 hover:text-indigo-800"
        >
          <FileSymlink className="h-3 w-3" />
          Show detailed setup instructions in console
        </button>
      </div>
    </div>
  );
};

export default DatabaseSetupPanel; 