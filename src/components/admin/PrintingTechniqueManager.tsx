import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, Save, X, Printer, AlertCircle, Loader2, EyeOff, Eye, List, ExternalLink, Database } from 'lucide-react';
import { 
  fetchPrintingTechniques,
  toggleTechniqueActive
} from '../../services/customization-costs.service';
import { useAuth } from '@/contexts/AuthContext';
import { Permission, Role } from 'appwrite';
import { ID, databases } from '@/lib/appwrite';
import { ensureCustomizationCostCollections } from '@/services/database.service';

// Get database and collection IDs from environment variables
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'kri8tive_db';
// IMPORTANT: Using VITE_APPWRITE_TECHNIQUES_COLLECTION_ID to match customization-costs.service.ts
const PRINTING_TECHNIQUES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TECHNIQUES_COLLECTION_ID || 'printing_techniques';

// Debug logging for collection IDs
console.log('PrintingTechniqueManager - Using Database ID:', DATABASE_ID);
console.log('PrintingTechniqueManager - Using Printing Techniques Collection ID:', PRINTING_TECHNIQUES_COLLECTION_ID);
console.log('PrintingTechniqueManager - Environment variables:', {
  VITE_APPWRITE_DATABASE_ID: import.meta.env.VITE_APPWRITE_DATABASE_ID,
  VITE_APPWRITE_TECHNIQUES_COLLECTION_ID: import.meta.env.VITE_APPWRITE_TECHNIQUES_COLLECTION_ID
});

/**
 * Represents a printing technique used for customization
 */
interface PrintingTechnique {
  id: string;
  name: string;
  /**
   * The design area or material size, typically specified as dimensions (e.g., "10x10 inches")
   */
  design_area?: string;
  cost: number;
  is_active?: boolean;
  // Appwrite automatically manages these timestamp fields
  $createdAt?: string;
  $updatedAt?: string;
}

interface EditingTechnique extends Omit<PrintingTechnique, '$createdAt' | '$updatedAt'> {
  isNew?: boolean;
}

/**
 * Represents a customization request with references to profiles and products
 */
interface RelatedRequest {
  id: string;
  $createdAt: string;
  status: string;
  user_id: string;
  product_id?: string;
  technique_id: string;
  profile?: {
    id?: string;
    email?: string;
  };
  product?: {
    id?: string;
    name?: string;
  };
}

const PrintingTechniqueManager: React.FC = () => {
  const [techniques, setTechniques] = useState<PrintingTechnique[]>([]);
  const [editingTechnique, setEditingTechnique] = useState<EditingTechnique | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showingRelatedRequests, setShowingRelatedRequests] = useState<string | null>(null);
  const [relatedRequests, setRelatedRequests] = useState<RelatedRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const [isFixingCollection, setIsFixingCollection] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);
  const { user, profile } = useAuth();
  
  // Check if user has permission to manage techniques
  const hasPermission = profile?.role && ['shop_manager', 'super_admin'].includes(profile.role);

  // Fetch techniques from database on component mount
  useEffect(() => {
    if (!user) {
      setError('You must be logged in to access this feature');
      return;
    }
    
    if (!hasPermission) {
      setError('You do not have permission to manage printing techniques');
      return;
    }
    
    loadTechniques();
  }, [user, profile?.role]);

  const loadTechniques = async () => {
      try {
        setLoading(true);
        setError(null);
        setCollectionError(null);
      
        // Debug logging
        console.log('loadTechniques - Using Database ID:', DATABASE_ID);
        console.log('loadTechniques - Using Printing Techniques Collection ID:', PRINTING_TECHNIQUES_COLLECTION_ID);
      
        // First ensure the collection exists
        await ensureCustomizationCostCollections();
      
        // Check if the collection is still missing
        const isMissing = localStorage.getItem('printingTechniquesCollectionMissing') === 'true';
        if (isMissing) {
          setCollectionError('The Printing Techniques collection is missing. Please run the setup script.');
          setTechniques([]);
          
          // Show detailed instructions in console
          console.log(`
┌─────────────────────────────────────────────────────────────────┐
│           PRINTING TECHNIQUES COLLECTION SETUP                  │
├─────────────────────────────────────────────────────────────────┤
│ To fix this issue:                                              │
│                                                                 │
│ 1. Open a command prompt or terminal                            │
│ 2. Navigate to your project directory                           │
│ 3. Run the following command:                                   │
│    scripts/fix-printing-techniques.bat                          │
│                                                                 │
│ This will create the printing_techniques collection with the    │
│ required attributes:                                            │
│ - name (string, required): Technique name                       │
│ - base_cost (number, required): Cost of the technique           │
│ - design_area (string, optional): Size of design area           │
│ - is_active (boolean, default: true): Whether technique is active │
│                                                                 │
│ After running the script, refresh this page and the error       │
│ should be resolved.                                             │
└─────────────────────────────────────────────────────────────────┘
          `);
          
          return;
        }
      
        const data = await fetchPrintingTechniques();
      
        // Filter out any null or undefined values before setting state
        const validData = data.filter(technique => 
          technique !== null && 
          technique !== undefined && 
          typeof technique === 'object' &&
          'id' in technique &&
          'name' in technique &&
          'cost' in technique
        );
      
        console.log('Loaded techniques:', validData);
        
        if (validData.length === 0) {
          console.log('No printing techniques found in database');
        }
        
        setTechniques(validData);
      } catch (error: any) {
        console.error('Error loading printing techniques:', error);
      
        if (error?.code === 401 || error?.code === 403) {
          setError('You do not have permission to access printing techniques. Please contact an administrator.');
          setTechniques([]);
        } else if (error?.code === 404) {
          // Collection doesn't exist error
          setCollectionError('The Printing Techniques collection is missing. Please check the console for setup instructions.');
          setTechniques([]);
        } else if (error?.message?.includes('base_cost')) {
          // Schema mismatch error - guide user to update schema
          setCollectionError('The Printing Techniques collection schema needs to be updated. Please check the console for setup instructions.');
          console.log(`
┌─────────────────────────────────────────────────────────────────┐
│           PRINTING TECHNIQUES SCHEMA UPDATE REQUIRED            │
├─────────────────────────────────────────────────────────────────┤
│ The schema for printing techniques needs to be updated:         │
│                                                                 │
│ 1. Rename field 'cost' to 'base_cost' (number, required)        │
│ 2. Add 'design_area' field (string, optional)                   │
│ 3. Add 'is_active' field (boolean, optional)                    │
│                                                                 │
│ After running the script, refresh this page and the error       │
│ should be resolved.                                             │
└─────────────────────────────────────────────────────────────────┘
          `);
          setTechniques([]);
        } else {
          setError('Failed to load printing techniques. Please try again.');
        }
      } finally {
        setLoading(false);
      }
  };

  const handleEdit = (technique: PrintingTechnique) => {
    if (!technique) {
      console.error('Attempted to edit a null technique');
      return;
    }
    
    setEditingTechnique({
      id: technique.id,
      name: technique.name,
      design_area: technique.design_area,
      cost: technique.cost,
      is_active: technique.is_active !== undefined ? technique.is_active : true
    });
    setShowAddForm(false);
  };

  const handleAdd = () => {
    // Check if collection exists first
    if (collectionError) {
      setError('Cannot add technique - missing printing techniques collection');
      return;
    }
    
    setShowAddForm(true);
    setEditingTechnique({
      id: Date.now().toString(),
      name: '',
      design_area: '10x10 inches',
      cost: 0,
      is_active: true,
      isNew: true
    });
  };

  // Create document with custom permissions for admin
  const createTechniqueWithPermissions = async (
    name: string, 
    cost: number, 
    design_area?: string, 
    is_active: boolean = true
  ): Promise<PrintingTechnique> => {
    try {
      if (!user) throw new Error('User not authenticated');

      const document = await databases.createDocument(
        DATABASE_ID,
        PRINTING_TECHNIQUES_COLLECTION_ID,
        ID.unique(),
        {
          name,
          base_cost: cost,
          design_area,
          is_active
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any())
        ]
      );
      return document as unknown as PrintingTechnique;
    } catch (error) {
      console.error('Error creating technique with custom permissions:', error);
      throw error;
    }
  };

  // Update document with custom permissions for admin
  const updateTechniqueWithPermissions = async (
    id: string, 
    name: string, 
    cost: number, 
    design_area?: string, 
    is_active: boolean = true
  ): Promise<PrintingTechnique> => {
    try {
      if (!user) throw new Error('User not authenticated');

      const document = await databases.updateDocument(
        DATABASE_ID,
        PRINTING_TECHNIQUES_COLLECTION_ID,
        id,
        {
          name,
          base_cost: cost,
          design_area,
          is_active
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any())
        ]
      );
      return document as unknown as PrintingTechnique;
    } catch (error) {
      console.error('Error updating technique with custom permissions:', error);
      throw error;
    }
  };

  const handleSave = async (technique: EditingTechnique) => {
    // Check for null technique
    if (!technique) {
      setError('Cannot save - invalid technique data');
      return;
    }

    // Check for admin permissions
    if (!profile?.role || !['shop_manager', 'super_admin'].includes(profile.role)) {
      setError('You do not have permission to modify printing techniques');
      return;
    }

    // Double check for collection error
    if (collectionError) {
      setError('Cannot save technique - missing printing techniques collection');
      return;
    }
    
    try {
      setLoading(true);
      if (technique.isNew) {
        // Use custom implementation with permissions
        await createTechniqueWithPermissions(
          technique.name, 
          technique.cost, 
          technique.design_area, 
          technique.is_active !== undefined ? technique.is_active : true
        );
        setError(null);
      } else if (technique.id) {
        // Use custom implementation with permissions
        await updateTechniqueWithPermissions(
          technique.id, 
          technique.name, 
          technique.cost, 
          technique.design_area, 
          technique.is_active !== undefined ? technique.is_active : true
        );
        setError(null);
      } else {
        throw new Error('Invalid technique ID');
      }
      await loadTechniques();
      setEditingTechnique(null);
      setShowAddForm(false);
    } catch (error: any) {
      console.error('Error saving printing technique:', error);
      
      if (error?.code === 404) {
        // Collection doesn't exist error
        setCollectionError('The Printing Techniques collection is missing. Please check the console for setup instructions.');
        setError('Cannot save - missing printing techniques collection');
      } else if (error?.code === 401 || error?.code === 403) {
        // Permission error
        setError('You do not have permission to modify printing techniques. Please contact an administrator.');
      } else {
        setError(technique.isNew ? 'Failed to add printing technique' : 'Failed to update printing technique');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (technique: PrintingTechnique) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check for admin permissions
      if (!profile?.role || !['shop_manager', 'super_admin'].includes(profile.role)) {
        setError('You do not have permission to update printing techniques');
        return;
      }
      
      const newActiveStatus = !(technique.is_active ?? true);
      
      // Update the technique's active status using the service
      const updatedTechnique = await toggleTechniqueActive(technique.id, newActiveStatus);
      
      // Update in local state
      setTechniques(techniques.map(t => 
        t.id === technique.id 
          ? { ...t, is_active: updatedTechnique.is_active } 
          : t
      ));
      
    } catch (err: any) {
      console.error('Error toggling technique status:', err);
      
      if (err?.code === 401 || err?.code === 403) {
        setError('You do not have permission to update printing techniques');
      } else if (err?.code === 404) {
        setCollectionError('The Printing Techniques collection is missing');
      } else {
        setError('Failed to update technique status. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete document with direct database call
  const deleteTechniqueWithPermissions = async (id: string): Promise<void> => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      // Check if the user has permission to delete
      if (!profile?.role || !['shop_manager', 'super_admin'].includes(profile.role)) {
        throw new Error('You do not have permission to delete printing techniques');
      }
      
      await databases.deleteDocument(
        DATABASE_ID,
        PRINTING_TECHNIQUES_COLLECTION_ID,
        id
      );
    } catch (error) {
      console.error('Error deleting printing technique with custom permissions:', error);
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
      setError('You do not have permission to delete printing techniques');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this printing technique?')) return;
    
    try {
      setLoading(true);
      // TODO: Check if technique is used in customization requests
      // This would require implementing a customization requests collection in Appwrite
      
      // Use custom implementation with permissions
      await deleteTechniqueWithPermissions(id);
      await loadTechniques();
    } catch (error: any) {
      console.error('Error deleting printing technique:', error);
      
      if (error?.code === 401 || error?.code === 403) {
        setError('You do not have permission to delete printing techniques');
      } else if (error?.code === 404) {
        setCollectionError('The Printing Techniques collection is missing');
      } else if (error.message?.includes('being used')) {
        // Handle custom error for techniques in use
        setError(error.message);
      } else {
        setError('Failed to delete printing technique');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingTechnique(null);
    setShowAddForm(false);
  };

  const handleViewRelatedRequests = async (techniqueId: string, techniqueName: string) => {
    try {
      setLoadingRequests(true);
      setError(null);
      setShowingRelatedRequests(techniqueId);
      
      // Since we don't yet have a customization_requests collection in Appwrite,
      // For now we'll just show a placeholder message
        setRelatedRequests([]);
      setError(`This functionality is not yet available in the Appwrite version. Please check back later.`);
    } catch (err) {
      console.error('Error fetching related requests:', err);
      setError('Failed to load related requests. Please try again.');
      setRelatedRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const closeRelatedRequests = () => {
    setShowingRelatedRequests(null);
    setRelatedRequests([]);
  };

  const handleRefreshCollections = async () => {
    setLoading(true);
    try {
      await ensureCustomizationCostCollections();
      // Clear error state and try to load again
      localStorage.removeItem('printingTechniquesCollectionMissing');
      setCollectionError(null);
      await loadTechniques();
    } catch (error) {
      console.error('Error refreshing collections:', error);
      setError('Failed to refresh collections. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFixCollection = async () => {
    try {
      setIsFixingCollection(true);
      setError(null);
      
      // Check if window.fixPrintingTechniquesCollection exists
      if (typeof window !== 'undefined' && 'fixPrintingTechniquesCollection' in window) {
        // Call the global function to fix the collection
        const result = await (window as any).fixPrintingTechniquesCollection();
        
        console.log('Fix collection result:', result);
        setFixResult(result);
        
        if (result.success) {
          // Collection fixed, clear error and reload techniques
          setCollectionError(null);
          localStorage.removeItem('printingTechniquesCollectionMissing');
          await loadTechniques();
        } else {
          // Fix failed, show the error
          setError(`Failed to fix collection: ${result.message}`);
        }
      } else {
        // Function not available
        setError('Collection fix function not available. Try refreshing the page.');
      }
    } catch (error: unknown) {
      console.error('Error fixing collection:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Error fixing collection: ${errorMessage}`);
    } finally {
      setIsFixingCollection(false);
    }
  };

  // Function to check for data and show a proper empty state
  const renderTechniquesList = () => {
    if (loading && techniques.length === 0) {
      return (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
          <span className="ml-3 text-gray-600 dark:text-gray-300">Loading techniques...</span>
        </div>
      );
    }

    if (!loading && techniques.length === 0 && !collectionError && !error) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="bg-white dark:bg-gray-700 p-4 rounded-full mb-4 shadow-sm">
            <Printer className="w-10 h-10 text-indigo-400 dark:text-indigo-300" />
          </div>
          <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">No printing techniques found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
            Get started by adding your first printing technique. These will be available for customization options.
          </p>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Add First Technique</span>
          </button>
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {techniques.map(technique => (
          <div
            key={technique.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all duration-200"
          >
            {editingTechnique?.id === technique.id ? (
              // Edit Form
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Technique Name
                  </label>
                  <input
                    type="text"
                    value={editingTechnique.name}
                    onChange={e => setEditingTechnique({
                      ...editingTechnique,
                      name: e.target.value
                    })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Design Area (Material Size)
                  </label>
                  <input
                    type="text"
                    value={editingTechnique.design_area || ''}
                    onChange={e => setEditingTechnique({
                      ...editingTechnique,
                      design_area: e.target.value
                    })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white"
                    placeholder="e.g., 10x10 inches"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cost (₦)
                  </label>
                  <input
                    type="number"
                    value={editingTechnique.cost}
                    onChange={e => setEditingTechnique({
                      ...editingTechnique,
                      cost: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleSave(editingTechnique)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all shadow-sm"
                  >
                    <Save className="w-5 h-5" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                  >
                    <X className="w-5 h-5" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              // Display View
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3.5 rounded-full flex items-center justify-center 
                    ${technique.is_active === false 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' 
                      : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}
                  >
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-lg font-semibold ${
                        technique.is_active === false 
                          ? 'text-gray-500 dark:text-gray-400' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {technique.name}
                      </h3>
                      {technique.is_active === false && (
                        <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-md font-medium flex items-center gap-1.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Area:</span> 
                        {technique.design_area || 'Not specified'}
                      </span>
                      <span className={`px-2.5 py-1 rounded-md font-bold ${
                        technique.is_active === false 
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' 
                          : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        ₦{technique.cost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleViewRelatedRequests(technique.id, technique.name)}
                    className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-all"
                    title="View related customization requests"
                  >
                    <List className="w-4.5 h-4.5" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(technique)}
                    className={`p-2.5 rounded-full transition-all ${
                      technique.is_active === false 
                        ? 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                    }`}
                    title={technique.is_active === false ? "Activate technique" : "Deactivate technique"}
                  >
                    {technique.is_active === false ? (
                      <Eye className="w-4.5 h-4.5" />
                    ) : (
                      <EyeOff className="w-4.5 h-4.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(technique)}
                    className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all"
                    title="Edit technique"
                  >
                    <Pencil className="w-4.5 h-4.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(technique.id)}
                    className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                    title="Delete technique"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Error display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 text-red-700 dark:text-red-300">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Error</span>
          </div>
          <p>{error}</p>
        </div>
      )}

      {/* Collection error message */}
      {collectionError && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{collectionError}</p>
              <p className="mt-1 text-sm">The printing techniques collection may not be set up correctly.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button 
                  onClick={handleRefreshCollections}
                  className="px-3 py-1.5 bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-200 rounded text-sm flex items-center gap-1"
                  disabled={loading || isFixingCollection}
                >
                  <Loader2 className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> 
                  Refresh Collections
                </button>
                
                <button 
                  onClick={handleFixCollection}
                  className="px-3 py-1.5 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 rounded text-sm flex items-center gap-1"
                  disabled={loading || isFixingCollection}
                >
                  <Database className={`w-3.5 h-3.5 ${isFixingCollection ? 'animate-pulse' : ''}`} /> 
                  {isFixingCollection ? 'Creating Collection...' : 'Create Collection'}
                </button>
                
                <button 
                  onClick={() => {
                    console.log(`
┌─────────────────────────────────────────────────────────────────┐
│           PRINTING TECHNIQUES COLLECTION SETUP                  │
├─────────────────────────────────────────────────────────────────┤
│ To fix this issue:                                              │
│                                                                 │
│ 1. Open a command prompt or terminal                            │
│ 2. Navigate to your project directory                           │
│ 3. Run the following command:                                   │
│    scripts/fix-printing-techniques.bat                          │
│                                                                 │
│ This will create the printing_techniques collection with the    │
│ required attributes:                                            │
│ - name (string, required): Technique name                       │
│ - base_cost (number, required): Cost of the technique           │
│ - design_area (string, optional): Size of design area           │
│ - is_active (boolean, default: true): Whether technique is active │
│                                                                 │
│ After running the script, refresh this page and the error       │
│ should be resolved.                                             │
└─────────────────────────────────────────────────────────────────┘
                    `);
                  }}
                  className="px-3 py-1.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded text-sm flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> 
                  Show Setup Instructions
                </button>
              </div>
              
              {/* Show fix result if available */}
              {fixResult && (
                <div className={`mt-3 p-2 rounded text-sm ${
                  fixResult.success 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}>
                  <p className="font-medium">
                    {fixResult.success ? '✅ Collection created successfully!' : '❌ Failed to create collection'}
                  </p>
                  <p className="mt-1 text-xs">{fixResult.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-lg flex items-center space-x-3">
            <Loader2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <span className="text-gray-700 dark:text-gray-200">Processing...</span>
          </div>
        </div>
      )}

      {/* Add New Technique Button */}
      {(!loading && techniques.length > 0) && (
        <div className="flex justify-end">
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Technique</span>
          </button>
        </div>
      )}

      {/* Render techniques list or empty state */}
      {renderTechniquesList()}

      {/* Add New Technique Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 mt-4 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add New Technique</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Technique Name
              </label>
              <input
                type="text"
                value={editingTechnique?.name || ''}
                onChange={e => setEditingTechnique({
                  ...editingTechnique!,
                  name: e.target.value
                })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Design Area (Material Size)
              </label>
              <input
                type="text"
                value={editingTechnique?.design_area || ''}
                onChange={e => setEditingTechnique({
                  ...editingTechnique!,
                  design_area: e.target.value
                })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white"
                placeholder="e.g., 10x10 inches"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cost (₦)
              </label>
              <input
                type="number"
                value={editingTechnique?.cost || 0}
                onChange={e => setEditingTechnique({
                  ...editingTechnique!,
                  cost: parseFloat(e.target.value) || 0
                })}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => handleSave(editingTechnique!)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all shadow-sm"
              >
                <Save className="w-5 h-5" />
                <span>Save</span>
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                <X className="w-5 h-5" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Related Requests Modal */}
      {showingRelatedRequests && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <List className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                Customization Requests Using This Technique
              </h3>
              <button 
                onClick={closeRelatedRequests}
                className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-auto flex-1">
              {loadingRequests ? (
                <div className="flex flex-col items-center justify-center p-8 gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 dark:text-indigo-400 animate-spin" />
                  <span className="text-gray-600 dark:text-gray-300">Loading requests...</span>
                </div>
              ) : relatedRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-full mb-4">
                    <List className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-center mb-2">No related requests found</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center max-w-md">
                    There are currently no customization requests using this printing technique.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    This technique is used in {relatedRequests.length} customization request{relatedRequests.length !== 1 ? 's' : ''}.
                    You need to update or complete these requests before you can delete this technique.
                  </p>
                  
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {relatedRequests.map(request => (
                          <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                            <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                              {request.id.slice(0, 8)}...
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                              {new Date(request.$createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                request.status === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                                request.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                                request.status === 'completed' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                                'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                              }`}>
                                {request.status}
                              </span>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                              {request.profile?.email || 'Unknown'}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                              {request.product?.name || 'Personal Item'}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-xs">
                              <a 
                                href={`/admin/customization-requests/${request.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                              >
                                View <ExternalLink className="w-3 h-3" />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
              <button
                onClick={closeRelatedRequests}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all font-medium flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintingTechniqueManager;
