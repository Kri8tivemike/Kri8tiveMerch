import { databases } from '../lib/appwrite';
import { Query, ID } from 'appwrite';

export interface ShippingLocation {
  id?: string;
  state: string;
  city: string;
  cost: number;
  created_at?: string;
  updated_at?: string;
}

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
const SHIPPING_COLLECTION_ID = 'shipping_locations';

/**
 * Fetch all shipping locations from the database
 * @returns Promise with array of shipping locations
 */
export const getShippingLocations = async (): Promise<ShippingLocation[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      SHIPPING_COLLECTION_ID,
      [
        Query.orderAsc('state'),
        Query.orderAsc('city')
      ]
    );
    
    return response.documents.map(doc => ({
      id: doc.$id,
      state: doc.state,
      city: doc.city,
      cost: doc.cost,
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt
    })) as ShippingLocation[];
  } catch (error) {
    console.error('Error fetching shipping locations:', error);
    // Return empty array instead of throwing to make the app more resilient
    return [];
  }
};

/**
 * Setup shipping_locations collection with proper permissions using the Appwrite Dashboard
 * This function doesn't create the collection programmatically as it requires permission setup
 * @returns Instructions for manual setup
 */
export const getShippingLocationsSetupInstructions = (): string => {
  return `
To setup the shipping_locations collection properly:

1. Log in to your Appwrite Console: ${import.meta.env.VITE_APPWRITE_ENDPOINT}
2. Navigate to your project: ${import.meta.env.VITE_APPWRITE_PROJECT_ID}
3. Go to Databases > ${DATABASE_ID}
4. Create a collection named '${SHIPPING_COLLECTION_ID}'
5. Set the following permissions:
   - Read: role:all (allows all users to read shipping data)
   - Write: role:shop_manager (restricts writing to shop manager users)
6. Add these attributes:
   - state (string, required, max length: 255)
   - city (string, required, max length: 255)
   - cost (number, required)
7. Create an index on state and city for faster lookups

After completing these steps, refresh the application.
`;
};

// Make this function available in the window object
if (typeof window !== 'undefined') {
  (window as any).showShippingSetupInstructions = () => {
    console.group('🚚 Shipping Locations Collection Setup');
    console.log(getShippingLocationsSetupInstructions());
    console.groupEnd();
    
    return "Setup instructions displayed above. Follow these steps to fix the shipping collection permissions.";
  };
  
  // Add a console-runnable function to fix shipping permissions
  (window as any).fixShippingPermissions = async () => {
    console.group('🔧 Fixing Shipping Locations Collection');
    console.log('Attempting to fix shipping locations collection permissions...');
    
    const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
    const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
    const apiKey = import.meta.env.VITE_APPWRITE_API_KEY;
    
    try {
      // Use fetch API directly instead of Appwrite SDK to avoid type issues
      // First check if collection exists
      let collectionExists = false;
      try {
        const checkResponse = await fetch(
          `${endpoint}/databases/${DATABASE_ID}/collections/${SHIPPING_COLLECTION_ID}`,
          {
            method: 'GET',
            headers: {
              'X-Appwrite-Project': projectId,
              'X-Appwrite-Key': apiKey,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (checkResponse.ok) {
          collectionExists = true;
          console.log('✅ Shipping locations collection exists, updating permissions...');
        }
      } catch (error) {
        console.error('Error checking if collection exists:', error);
      }
      
      // If collection doesn't exist, create it
      if (!collectionExists) {
        console.log('Creating shipping_locations collection...');
        
        // Create collection
        const createResponse = await fetch(
          `${endpoint}/databases/${DATABASE_ID}/collections`,
          {
            method: 'POST',
            headers: {
              'X-Appwrite-Project': projectId,
              'X-Appwrite-Key': apiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              collectionId: SHIPPING_COLLECTION_ID,
              name: 'Shipping Locations',
              permissions: [
                'read("any")',
                'write("team:admin")'
              ],
              documentSecurity: false
            })
          }
        );
        
        if (!createResponse.ok) {
          throw new Error(`Failed to create collection: ${await createResponse.text()}`);
        }
        
        console.log('✅ Collection created successfully');
        
        // Create state attribute
        const stateResponse = await fetch(
          `${endpoint}/databases/${DATABASE_ID}/collections/${SHIPPING_COLLECTION_ID}/attributes/string`,
          {
            method: 'POST',
            headers: {
              'X-Appwrite-Project': projectId,
              'X-Appwrite-Key': apiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              key: 'state',
              size: 255,
              required: true
            })
          }
        );
        
        if (!stateResponse.ok) {
          console.error('Failed to create state attribute:', await stateResponse.text());
        } else {
          console.log('✅ State attribute created successfully');
        }
        
        // Create city attribute
        const cityResponse = await fetch(
          `${endpoint}/databases/${DATABASE_ID}/collections/${SHIPPING_COLLECTION_ID}/attributes/string`,
          {
            method: 'POST',
            headers: {
              'X-Appwrite-Project': projectId,
              'X-Appwrite-Key': apiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              key: 'city',
              size: 255,
              required: true
            })
          }
        );
        
        if (!cityResponse.ok) {
          console.error('Failed to create city attribute:', await cityResponse.text());
        } else {
          console.log('✅ City attribute created successfully');
        }
        
        // Create cost attribute
        const costResponse = await fetch(
          `${endpoint}/databases/${DATABASE_ID}/collections/${SHIPPING_COLLECTION_ID}/attributes/float`,
          {
            method: 'POST',
            headers: {
              'X-Appwrite-Project': projectId,
              'X-Appwrite-Key': apiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              key: 'cost',
              required: true,
              min: 0
            })
          }
        );
        
        if (!costResponse.ok) {
          console.error('Failed to create cost attribute:', await costResponse.text());
        } else {
          console.log('✅ Cost attribute created successfully');
        }
      } else {
        // Update collection permissions
        const updateResponse = await fetch(
          `${endpoint}/databases/${DATABASE_ID}/collections/${SHIPPING_COLLECTION_ID}`,
          {
            method: 'PUT',
            headers: {
              'X-Appwrite-Project': projectId,
              'X-Appwrite-Key': apiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: 'Shipping Locations',
              permissions: [
                'read("any")',
                'write("team:admin")'
              ],
              enabled: true
            })
          }
        );
        
        if (!updateResponse.ok) {
          throw new Error(`Failed to update collection permissions: ${await updateResponse.text()}`);
        }
        
        console.log('✅ Collection permissions updated successfully');
      }
      
      console.log('✅ Shipping locations collection setup complete!');
      console.log('Please refresh the page to see the changes.');
      return '✅ Shipping permissions fixed! Refresh the page.';
    } catch (error) {
      console.error('❌ Error fixing shipping permissions:', error);
      console.log('Please set up the collection manually:');
      console.log(getShippingLocationsSetupInstructions());
      return '❌ Error fixing shipping permissions. See console for manual instructions.';
    } finally {
      console.groupEnd();
    }
  };
}

/**
 * Add a new shipping location
 * @param location ShippingLocation object without id
 * @returns Promise with the created shipping location
 */
export const addShippingLocation = async (location: Omit<ShippingLocation, 'id' | 'created_at' | 'updated_at'>): Promise<ShippingLocation> => {
  try {
    const timestamp = new Date().toISOString();
    const data = {
      ...location,
      created_at: timestamp,
      updated_at: timestamp
    };

    const response = await databases.createDocument(
      DATABASE_ID,
      SHIPPING_COLLECTION_ID,
      ID.unique(),
      data
    );
    
    return {
      id: response.$id,
      state: response.state,
      city: response.city,
      cost: response.cost,
      created_at: response.$createdAt,
      updated_at: response.$updatedAt
    };
  } catch (error) {
    console.error('Error adding shipping location:', error);
    throw error;
  }
};

/**
 * Delete a shipping location by ID
 * @param id Shipping location ID
 * @returns Promise<boolean> whether the deletion was successful
 */
export const deleteShippingLocation = async (id: string): Promise<boolean> => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      SHIPPING_COLLECTION_ID,
      id
    );
    
    return true;
  } catch (error) {
    console.error('Error deleting shipping location:', error);
    throw error;
  }
};

/**
 * Calculate shipping cost based on state and city
 * @param state Customer's state
 * @param city Customer's city
 * @returns Promise with the shipping cost or null if not found
 */
export const calculateShippingCost = async (state: string, city: string): Promise<number | null> => {
  try {
    // First try to find an exact match for state and city
    try {
      const exactMatchResponse = await databases.listDocuments(
        DATABASE_ID,
        SHIPPING_COLLECTION_ID,
        [
          Query.equal('state', state),
          Query.equal('city', city),
          Query.limit(1)
        ]
      );
      
      if (exactMatchResponse.documents.length > 0) {
        return exactMatchResponse.documents[0].cost;
      }
    } catch (error) {
      console.error('Error finding exact shipping match:', error);
    }
    
    // If no exact match, try to find a match for just the state
    try {
      const stateMatchResponse = await databases.listDocuments(
        DATABASE_ID,
        SHIPPING_COLLECTION_ID,
        [
          Query.equal('state', state),
          Query.limit(1)
        ]
      );
      
      if (stateMatchResponse.documents.length > 0) {
        return stateMatchResponse.documents[0].cost;
      }
    } catch (error) {
      console.error('Error finding state shipping match:', error);
    }
    
    // If no state match either, return null (no shipping available)
    return null;
  } catch (error) {
    console.error('Error calculating shipping cost:', error);
    return null;
  }
};

/**
 * Check if the shipping_locations collection exists
 * @returns Promise<boolean> whether the collection exists
 */
export const checkShippingLocationsTable = async (): Promise<boolean> => {
  try {
    await databases.listDocuments(
      DATABASE_ID,
      SHIPPING_COLLECTION_ID,
      [Query.limit(1)]
    );
    
    return true;
  } catch (error: any) {
    // Collection doesn't exist error code in Appwrite is usually 404
    if (error?.code === 404) {
      return false;
    }
    
    console.error('Error checking shipping_locations collection:', error);
    return false;
  }
}; 