import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, Save, X, Shirt, AlertTriangle, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchFabricQualities,
} from '@/services/customization-costs.service';
import { ensureCustomizationCostCollections } from '@/services/database.service';
import { useAuth } from '@/contexts/AuthContext';
import { Permission, Role } from 'appwrite';
import { ID, databases } from '@/lib/appwrite';

// Get database and collection IDs from environment variables
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
const FABRIC_QUALITIES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_FABRIC_QUALITIES_COLLECTION_ID || 'fabric_qualities';

// Local definition of FabricQuality interface with active property
interface FabricQuality {
  id: string;
  quality: number;
  cost: number;
  active?: boolean;
  // Appwrite automatically manages these timestamp fields
  // We include them in the interface for type safety when reading documents
  $createdAt?: string;
  $updatedAt?: string;
}

interface EditingQuality extends Omit<FabricQuality, '$createdAt' | '$updatedAt'> {
  isNew?: boolean;
  active?: boolean;
}

const FabricQualityManager: React.FC = () => {
  const [qualities, setQualities] = useState<FabricQuality[]>([]);
  const [editingQuality, setEditingQuality] = useState<EditingQuality | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  // Check if user has permission to manage fabric qualities
  const hasPermission = profile?.role && ['shop_manager', 'super_admin'].includes(profile.role);

  useEffect(() => {
    if (!user) {
      setAuthError('You must be logged in to access this feature');
      return;
    }
    
    if (!hasPermission) {
      setAuthError('You do not have permission to manage fabric qualities');
      return;
    }
    
    loadQualities();
  }, [user, profile?.role]);

  const loadQualities = async () => {
    try {
      setIsLoading(true);
      setCollectionError(null);
      setAuthError(null);
      
      // First ensure the collection exists
      await ensureCustomizationCostCollections();
      
      // Check if the collection is still missing
      const isMissing = localStorage.getItem('fabricQualitiesCollectionMissing') === 'true';
      if (isMissing) {
        setCollectionError('The Fabric Qualities collection is missing. Please check the console for setup instructions.');
        setQualities([]);
        return;
      }
      
      const data = await fetchFabricQualities();
      // Filter out any null or undefined values before setting state
      const validData = data.filter(quality => 
        quality !== null && 
        quality !== undefined && 
        typeof quality === 'object' &&
        'id' in quality &&
        'quality' in quality &&
        'cost' in quality
      );
      console.log('Loaded qualities:', validData);
      setQualities(validData);
    } catch (error: any) {
      console.error('Error loading fabric qualities:', error);
      
      if (error?.code === 401 || error?.code === 403) {
        setAuthError('You do not have permission to access fabric qualities. Please contact an administrator.');
        setQualities([]);
      } else if (error?.code === 404) {
        // Collection doesn't exist error
        setCollectionError('The Fabric Qualities collection is missing. Please check the console for setup instructions.');
        setQualities([]);
      } else {
        toast.error('Failed to load fabric qualities');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (quality: FabricQuality) => {
    if (!quality) {
      console.error('Attempted to edit a null quality');
      return;
    }
    
    setEditingQuality({
      id: quality.id,
      quality: quality.quality,
      cost: quality.cost,
      active: quality.active !== undefined ? quality.active : true
    });
    setShowAddForm(false);
  };

  const handleAdd = () => {
    // Check if collection exists first
    if (collectionError) {
      toast.error('Cannot add quality - missing fabric qualities collection');
      return;
    }
    
    setShowAddForm(true);
    setEditingQuality({
      id: Date.now().toString(),
      quality: 0,
      cost: 0,
      active: true,
      isNew: true
    });
  };

  // Create document with custom permissions for admin
  const createFabricQualityWithPermissions = async (quality: number, cost: number, active: boolean = true): Promise<FabricQuality> => {
    try {
      if (!user) throw new Error('User not authenticated');

      const document = await databases.createDocument(
        DATABASE_ID,
        FABRIC_QUALITIES_COLLECTION_ID,
        ID.unique(),
        {
          quality,
          cost,
          active
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any())
        ]
      );
      return document as unknown as FabricQuality;
    } catch (error) {
      console.error('Error creating fabric quality with custom permissions:', error);
      throw error;
    }
  };

  // Update document with custom permissions for admin
  const updateFabricQualityWithPermissions = async (id: string, quality: number, cost: number, active: boolean = true): Promise<FabricQuality> => {
    try {
      if (!user) throw new Error('User not authenticated');

      const document = await databases.updateDocument(
        DATABASE_ID,
        FABRIC_QUALITIES_COLLECTION_ID,
        id,
        {
          quality,
          cost,
          active
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any())
        ]
      );
      return document as unknown as FabricQuality;
    } catch (error) {
      console.error('Error updating fabric quality with custom permissions:', error);
      throw error;
    }
  };

  const handleSave = async (quality: EditingQuality) => {
    // Check for null quality
    if (!quality) {
      toast.error('Cannot save - invalid quality data');
      return;
    }

    // Check for admin permissions
    if (!profile?.role || !['shop_manager', 'super_admin'].includes(profile.role)) {
      toast.error('You do not have permission to modify fabric qualities');
      return;
    }

    // Double check for collection error
    if (collectionError) {
      toast.error('Cannot save quality - missing fabric qualities collection');
      return;
    }
    
    try {
      setIsLoading(true);
      if (quality.isNew) {
        // Use custom implementation with permissions
        await createFabricQualityWithPermissions(quality.quality, quality.cost, quality.active !== undefined ? quality.active : true);
        toast.success('Fabric quality added successfully');
      } else if (quality.id) {
        // Use custom implementation with permissions
        await updateFabricQualityWithPermissions(quality.id, quality.quality, quality.cost, quality.active !== undefined ? quality.active : true);
        toast.success('Fabric quality updated successfully');
      } else {
        throw new Error('Invalid quality ID');
      }
      await loadQualities();
      setEditingQuality(null);
      setShowAddForm(false);
    } catch (error: any) {
      console.error('Error saving fabric quality:', error);
      
      if (error?.code === 404) {
        // Collection doesn't exist error
        setCollectionError('The Fabric Qualities collection is missing. Please check the console for setup instructions.');
        toast.error('Cannot save - missing fabric qualities collection');
      } else if (error?.code === 401 || error?.code === 403) {
        // Permission error
        toast.error('You do not have permission to modify fabric qualities. Please contact an administrator.');
      } else {
        toast.error(quality.isNew ? 'Failed to add fabric quality' : 'Failed to update fabric quality');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Delete document with direct database call
  const deleteFabricQualityWithPermissions = async (id: string): Promise<void> => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      // Check if the user has permission to delete
      if (!profile?.role || !['shop_manager', 'super_admin'].includes(profile.role)) {
        throw new Error('You do not have permission to delete fabric qualities');
      }
      
      await databases.deleteDocument(
        DATABASE_ID,
        FABRIC_QUALITIES_COLLECTION_ID,
        id
      );
    } catch (error) {
      console.error('Error deleting fabric quality with custom permissions:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      console.error('Attempted to delete with null ID');
      return;
    }
    
    // Check for admin permissions
    if (!profile?.role || !['shop_manager', 'super_admin'].includes(profile.role)) {
      toast.error('You do not have permission to delete fabric qualities');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this fabric quality?')) return;
    
    try {
      setIsLoading(true);
      // Use custom implementation with permissions
      await deleteFabricQualityWithPermissions(id);
      toast.success('Fabric quality deleted successfully');
      await loadQualities();
    } catch (error: any) {
      console.error('Error deleting fabric quality:', error);
      
      if (error?.code === 401 || error?.code === 403) {
        toast.error('You do not have permission to delete fabric qualities');
      } else {
        toast.error('Failed to delete fabric quality');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingQuality(null);
    setShowAddForm(false);
  };

  const validateQuality = (value: string) => {
    // Only allow numbers
    return value.replace(/[^0-9]/g, '');
  };

  const handleRefreshCollections = async () => {
    setIsLoading(true);
    try {
      await ensureCustomizationCostCollections();
      // Clear error state and try to load again
      localStorage.removeItem('fabricQualitiesCollectionMissing');
      setCollectionError(null);
      await loadQualities();
    } catch (error) {
      console.error('Error refreshing collections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !qualities.length) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-red-800 mb-2">Access Denied</h3>
            <p className="text-red-700 mb-4">
              {authError}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile?.role || !['shop_manager', 'super_admin'].includes(profile.role)) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-red-800 mb-2">Access Denied</h3>
            <p className="text-red-700 mb-4">
              You do not have permission to manage fabric qualities. Please contact a shop manager for access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (collectionError) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Collection Setup Required</h3>
            <p className="text-yellow-700 mb-4">{collectionError}</p>
            <p className="text-yellow-700 mb-4">
              To fix this issue, please create the required collection in your Appwrite dashboard.
              See the console for detailed setup instructions.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRefreshCollections}
                disabled={isLoading}
                className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md flex items-center gap-2 transition-colors"
              >
                <span className={`${isLoading ? 'animate-spin' : ''}`}>↻</span> 
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Shirt className="w-5 h-5" />
          Fabric Quality Management
        </h2>
        
        <div className="flex gap-2">
          {hasPermission && (
            <button
              onClick={handleAdd}
              disabled={isLoading || !!collectionError}
              className="flex items-center gap-1 px-3 py-2 bg-black hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Quality
            </button>
          )}
          
          <button
            onClick={loadQualities}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {/* Collection error message */}
      {collectionError && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{collectionError}</p>
              <p className="mt-1 text-sm">The fabric qualities collection may not be set up correctly.</p>
              <button 
                onClick={handleRefreshCollections}
                className="mt-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-200 rounded text-sm flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Collections
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add/Edit Form */}
      {(showAddForm || editingQuality) && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-medium mb-4">
            {editingQuality?.isNew ? 'Add New Fabric Quality' : 'Edit Fabric Quality'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Quality (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={editingQuality?.quality || 0}
                onChange={(e) => {
                  const value = e.target.value;
                  if (validateQuality(value)) {
                    setEditingQuality(prev => 
                      prev ? { ...prev, quality: Number(value) } : null
                    );
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Cost Per Unit (₦)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editingQuality?.cost || 0}
                onChange={(e) => {
                  const value = e.target.value;
                  if (validateQuality(value)) {
                    setEditingQuality(prev => 
                      prev ? { ...prev, cost: Number(value) } : null
                    );
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editingQuality?.active !== false}
                onChange={(e) => {
                  setEditingQuality(prev => 
                    prev ? { ...prev, active: e.target.checked } : null
                  );
                }}
                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="text-sm font-medium">Active</span>
              <span className="text-xs text-gray-500">(Inactive qualities will not be available for selection)</span>
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded-md transition-colors"
            >
              <X className="w-4 h-4 inline mr-1" />
              Cancel
            </button>
            
            <button
              onClick={() => {
                if (editingQuality) {
                  handleSave(editingQuality);
                }
              }}
              disabled={isLoading}
              className="px-4 py-2 bg-black hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-md transition-colors flex items-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Qualities Table */}
      {isLoading && !qualities.length ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading fabric qualities...</span>
        </div>
      ) : !qualities.length ? (
        <div className="py-12 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <Shirt className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-lg mb-1">No fabric qualities found</p>
          <p className="text-sm">
            {collectionError 
              ? 'Please fix the collection issue and try again.' 
              : 'Click "Add Quality" to create your first fabric quality.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quality Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cost (₦)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {qualities.map((quality) => (
                <tr key={quality.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">{quality.quality}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">₦{quality.cost.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${quality.active !== false ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {quality.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {hasPermission && (
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleEdit(quality)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          aria-label="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(quality.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FabricQualityManager; 