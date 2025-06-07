import { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Trash2, 
  Loader2,
  AlertCircle,
  InfoIcon,
  Settings,
  Search,
  MapPin,
  DollarSign,
  ClipboardCheck,
  ArrowUpDown
} from 'lucide-react';
import { 
  ShippingLocation, 
  getShippingLocations, 
  addShippingLocation, 
  deleteShippingLocation,
  checkShippingLocationsTable,
  getShippingLocationsSetupInstructions
} from '../../services/shipping.service';

export default function ShippingSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [locations, setLocations] = useState<ShippingLocation[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<ShippingLocation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'state' | 'city' | 'cost'>('state');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [newLocation, setNewLocation] = useState<ShippingLocation>({
    state: '',
    city: '',
    cost: 0
  });
  const [tableExists, setTableExists] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSetupInstructions, setShowSetupInstructions] = useState(false);

  useEffect(() => {
    // Load shipping locations on component mount
    loadShippingLocations();
  }, []);

  useEffect(() => {
    // Filter locations based on search term
    if (searchTerm.trim() === '') {
      setFilteredLocations(locations);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = locations.filter(location => 
        location.state.toLowerCase().includes(lowercaseSearch) || 
        location.city.toLowerCase().includes(lowercaseSearch)
      );
      setFilteredLocations(filtered);
    }
  }, [searchTerm, locations]);

  useEffect(() => {
    // Sort locations when sort parameters change
    const sorted = [...filteredLocations].sort((a, b) => {
      const fieldA = typeof a[sortField] === 'string' 
        ? (a[sortField] as string).toLowerCase() 
        : a[sortField];
      const fieldB = typeof b[sortField] === 'string' 
        ? (b[sortField] as string).toLowerCase() 
        : b[sortField];
      
      if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredLocations(sorted);
  }, [sortField, sortDirection]);

  const loadShippingLocations = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      // Check if the table exists
      const exists = await checkShippingLocationsTable();
      setTableExists(exists);
      
      if (!exists) {
        setErrorMessage("Shipping locations collection doesn't exist. Please create it in your Appwrite dashboard.");
        setIsLoading(false);
        return;
      }
      
      // Fetch shipping locations
      const locationsData = await getShippingLocations();
      setLocations(locationsData);
      setFilteredLocations(locationsData);
      
      if (locationsData.length === 0) {
        setSuccessMessage("No shipping locations added yet. Add your first location below.");
      } else {
        setSuccessMessage(null);
      }
    } catch (error) {
      console.error('Error loading shipping locations:', error);
      setErrorMessage('Failed to load shipping locations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSetupInstructions = () => {
    setShowSetupInstructions(!showSetupInstructions);
  };

  const handleAddLocation = async () => {
    if (!newLocation.state || !newLocation.city || newLocation.cost <= 0 || !tableExists) return;
    
    try {
      setIsSaving(true);
      setErrorMessage(null);
      
      // Add shipping location
      const addedLocation = await addShippingLocation({
        state: newLocation.state,
        city: newLocation.city,
        cost: newLocation.cost
      });
      
      // Update local state
      setLocations([...locations, addedLocation]);
      
      // Reset form
      setNewLocation({
        state: '',
        city: '',
        cost: 0
      });
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error adding shipping location:', error);
      setErrorMessage('Failed to add shipping location. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLocation = async (locationId: string | undefined) => {
    if (!locationId || !tableExists) return;
    
    try {
      setIsSaving(true);
      setErrorMessage(null);
      
      // Delete shipping location
      await deleteShippingLocation(locationId);
      
      // Update local state
      setLocations(locations.filter(loc => loc.id !== locationId));
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error deleting shipping location:', error);
      setErrorMessage('Failed to delete shipping location. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSort = (field: 'state' | 'city' | 'cost') => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and reset to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success notification */}
      {showSuccess && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg shadow-sm mb-4 animate-fade-in-down">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClipboardCheck className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Shipping settings saved successfully.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg shadow-sm mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <InfoIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-sm mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button 
                  onClick={loadShippingLocations}
                  className="text-xs px-3 py-1.5 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors duration-200"
                >
                  Try Again
                </button>
                <button 
                  onClick={toggleSetupInstructions}
                  className="text-xs px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors duration-200 flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" />
                  {showSetupInstructions ? 'Hide Setup Guide' : 'Show Setup Guide'}
                </button>
                <button 
                  onClick={() => {
                    const message = "Run fixShippingPermissions() in the browser console to automatically fix permissions";
                    alert(message);
                    console.log("%c💡 " + message, "color:blue; font-weight:bold");
                  }}
                  className="text-xs px-3 py-1.5 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors duration-200 flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" />
                  Fix Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      {showSetupInstructions && !tableExists && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 my-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800">
            <Settings className="w-5 h-5 text-blue-600" />
            Shipping Collection Setup Guide
          </h3>
          <div className="prose prose-sm max-w-none">
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs whitespace-pre-wrap text-gray-700">
              {getShippingLocationsSetupInstructions()}
            </pre>
            
            <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md shadow-inner">
              <p className="text-sm text-blue-800">
                <strong>Quick Fix:</strong> Run <code className="bg-blue-100 px-2 py-1 rounded font-mono text-blue-900">fixShippingPermissions()</code> in your browser console to automatically set up the shipping collection.
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={toggleSetupInstructions}
              className="px-4 py-2 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center gap-1"
            >
              <InfoIcon className="w-4 h-4" />
              Hide Instructions
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
            <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Shipping Locations</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add New Location Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="font-medium text-lg mb-5 text-gray-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Add New Location
            </h3>
            <div className="space-y-5">
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  State:
                </label>
                <input
                  type="text"
                  id="state"
                  placeholder="Enter state (e.g., Lagos)"
                  value={newLocation.state}
                  onChange={(e) => setNewLocation({...newLocation, state: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white"
                  disabled={!tableExists || isSaving}
                />
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  City/Town:
                </label>
                <input
                  type="text"
                  id="city"
                  placeholder="Enter city/town (e.g., Ikeja)"
                  value={newLocation.city}
                  onChange={(e) => setNewLocation({...newLocation, city: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white"
                  disabled={!tableExists || isSaving}
                />
              </div>
              
              <div>
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  Shipping Cost (₦):
                </label>
                <input
                  type="number"
                  id="cost"
                  placeholder="Enter shipping cost"
                  value={newLocation.cost}
                  onChange={(e) => setNewLocation({...newLocation, cost: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white"
                  min="0"
                  step="50"
                  disabled={!tableExists || isSaving}
                />
              </div>
              
              <button
                onClick={handleAddLocation}
                disabled={isSaving || !newLocation.state || !newLocation.city || newLocation.cost <= 0 || !tableExists}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors duration-200 mt-4 font-medium"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding Location...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Location
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Locations List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-3">
              <h3 className="font-medium text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Current Shipping Locations
              </h3>
              
              {/* Search and sort options */}
              {locations.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full max-w-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>
            
            {!tableExists ? (
              <div className="text-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-300 mb-3">Shipping locations table not available.</p>
                <button 
                  onClick={loadShippingLocations}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  Check Again
                </button>
              </div>
            ) : locations.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <MapPin className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-300">No shipping locations added yet.</p>
              </div>
            ) : (
              <>
                <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-3 flex justify-between">
                  <button 
                    onClick={() => handleSort('state')} 
                    className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                  >
                    State
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'state' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  </button>
                  <button 
                    onClick={() => handleSort('city')} 
                    className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                  >
                    City
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'city' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  </button>
                  <button 
                    onClick={() => handleSort('cost')} 
                    className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                  >
                    Cost
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'cost' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  </button>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                  {filteredLocations.length === 0 ? (
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-gray-500 dark:text-gray-300">No locations match your search.</p>
                    </div>
                  ) : (
                    filteredLocations.map((location) => (
                      <div 
                        key={location.id} 
                        className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 hover:shadow-md transition-shadow duration-200"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            {location.state}, {location.city}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            ₦{location.cost.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteLocation(String(location.id))}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 rounded-full transition-colors duration-200"
                          aria-label="Delete location"
                          disabled={isSaving}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}