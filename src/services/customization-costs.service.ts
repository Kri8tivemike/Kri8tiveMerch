import { databases, ID } from '../lib/appwrite';
import { ensureCustomizationCostCollections } from './database.service';

// Database IDs and Collection IDs
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
const PRINTING_TECHNIQUES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TECHNIQUES_COLLECTION_ID || 'printing_techniques';
const SIZE_PRICES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SIZE_PRICES_COLLECTION_ID || 'printing_sizes';
const FABRIC_QUALITIES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_FABRICS_COLLECTION_ID || 'fabric_qualities';

// Interfaces for data types

export interface PrintingTechnique {
  id: string;
  name: string;
  cost: number;
  design_area?: string;
  is_active?: boolean;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface SizePrice {
  id: string;
  size: string;
  cost: number;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface FabricQuality {
  id: string;
  quality: number;
  cost: number;
  active: boolean;
  $createdAt?: string;
  $updatedAt?: string;
}

// Printing Techniques
export const fetchPrintingTechniques = async (): Promise<PrintingTechnique[]> => {
  try {
    // Ensure collections exist first
    await ensureCustomizationCostCollections();
    
    const { documents } = await databases.listDocuments(
      DATABASE_ID,
      PRINTING_TECHNIQUES_COLLECTION_ID
    );
    
    // Map base_cost from server to cost for client
    return documents.map(doc => ({
      id: doc.$id,
      name: doc.name,
      cost: doc.base_cost,
      design_area: doc.design_area,
      is_active: doc.is_active,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt
    }));
  } catch (error) {
    console.error('Error fetching printing techniques:', error);
    throw error;
  }
};

export const fetchPrintingTechniqueById = async (techniqueId: string): Promise<PrintingTechnique | null> => {
  try {
    // Ensure collections exist first
    await ensureCustomizationCostCollections();
    
    const document = await databases.getDocument(
      DATABASE_ID,
      PRINTING_TECHNIQUES_COLLECTION_ID,
      techniqueId
    );
    
    // Map base_cost from server to cost for client
    return {
      id: document.$id,
      name: document.name,
      cost: document.base_cost,
      design_area: document.design_area,
      is_active: document.is_active,
      $createdAt: document.$createdAt,
      $updatedAt: document.$updatedAt
    };
  } catch (error) {
    console.error('Error fetching printing technique by ID:', error);
    return null;
  }
};

export const createPrintingTechnique = async (name: string, cost: number): Promise<PrintingTechnique> => {
  try {
    // Ensure collections exist first
    await ensureCustomizationCostCollections();
    
    const document = await databases.createDocument(
      DATABASE_ID,
      PRINTING_TECHNIQUES_COLLECTION_ID,
      ID.unique(),
      {
        name,
        base_cost: cost,
        is_active: true
      }
    );
    
    // Map the response back to our client model
    return {
      id: document.$id,
      name: document.name,
      cost: document.base_cost,
      design_area: document.design_area,
      is_active: document.is_active,
      $createdAt: document.$createdAt,
      $updatedAt: document.$updatedAt
    };
  } catch (error) {
    console.error('Error creating printing technique:', error);
    throw error;
  }
};

export const updatePrintingTechnique = async (id: string, name: string, cost: number): Promise<PrintingTechnique> => {
  try {
    const document = await databases.updateDocument(
      DATABASE_ID,
      PRINTING_TECHNIQUES_COLLECTION_ID,
      id,
      {
        name,
        base_cost: cost
      }
    );
    
    // Map the response back to our client model
    return {
      id: document.$id,
      name: document.name,
      cost: document.base_cost,
      design_area: document.design_area,
      is_active: document.is_active,
      $createdAt: document.$createdAt,
      $updatedAt: document.$updatedAt
    };
  } catch (error) {
    console.error('Error updating printing technique:', error);
    throw error;
  }
};

export const deletePrintingTechnique = async (id: string): Promise<void> => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      PRINTING_TECHNIQUES_COLLECTION_ID,
      id
    );
  } catch (error) {
    console.error('Error deleting printing technique:', error);
    throw error;
  }
};

// Create a function to activate or deactivate a technique
export const toggleTechniqueActive = async (id: string, isActive: boolean): Promise<PrintingTechnique> => {
  try {
    const document = await databases.updateDocument(
      DATABASE_ID,
      PRINTING_TECHNIQUES_COLLECTION_ID,
      id,
      {
        is_active: isActive
      }
    );
    
    // Map the response back to our client model
    return {
      id: document.$id,
      name: document.name,
      cost: document.base_cost,
      design_area: document.design_area,
      is_active: document.is_active,
      $createdAt: document.$createdAt,
      $updatedAt: document.$updatedAt
    };
  } catch (error) {
    console.error('Error toggling technique active state:', error);
    throw error;
  }
};

// Size Prices
export const fetchSizePrices = async (): Promise<SizePrice[]> => {
  try {
    // Ensure collections exist first
    await ensureCustomizationCostCollections();
    
    const { documents } = await databases.listDocuments(
      DATABASE_ID,
      SIZE_PRICES_COLLECTION_ID
    );
    return documents as unknown as SizePrice[];
  } catch (error) {
    console.error('Error fetching size prices:', error);
    throw error;
  }
};

export const createSizePrice = async (size: string, cost: number): Promise<SizePrice> => {
  try {
    // Ensure collections exist first
    await ensureCustomizationCostCollections();
    
    const now = new Date().toISOString();
    const document = await databases.createDocument(
      DATABASE_ID,
      SIZE_PRICES_COLLECTION_ID,
      ID.unique(),
      {
        size,
        cost,
        created_at: now,
        updated_at: now
      }
    );
    return document as unknown as SizePrice;
  } catch (error) {
    console.error('Error creating size price:', error);
    throw error;
  }
};

export const updateSizePrice = async (id: string, size: string, cost: number): Promise<SizePrice> => {
  try {
    const now = new Date().toISOString();
    const document = await databases.updateDocument(
      DATABASE_ID,
      SIZE_PRICES_COLLECTION_ID,
      id,
      {
        size,
        cost,
        updated_at: now
      }
    );
    return document as unknown as SizePrice;
  } catch (error) {
    console.error('Error updating size price:', error);
    throw error;
  }
};

export const deleteSizePrice = async (id: string): Promise<void> => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      SIZE_PRICES_COLLECTION_ID,
      id
    );
  } catch (error) {
    console.error('Error deleting size price:', error);
    throw error;
  }
};

// Fabric Qualities
export const fetchFabricQualities = async (): Promise<FabricQuality[]> => {
  try {
    // Ensure collections exist first
    await ensureCustomizationCostCollections();
    
    const { documents } = await databases.listDocuments(
      DATABASE_ID,
      FABRIC_QUALITIES_COLLECTION_ID
    );
    
    return documents.map(doc => ({
      id: doc.$id,
      quality: doc.quality,
      cost: doc.cost,
      active: doc.active !== undefined ? doc.active : true,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt
    }));
  } catch (error) {
    console.error('Error fetching fabric qualities:', error);
    throw error;
  }
};

export const createFabricQuality = async (quality: number, cost: number, active: boolean = true): Promise<FabricQuality> => {
  try {
    // Ensure collections exist first
    await ensureCustomizationCostCollections();
    
    const document = await databases.createDocument(
      DATABASE_ID,
      FABRIC_QUALITIES_COLLECTION_ID,
      ID.unique(),
      {
        quality,
        cost,
        active
      }
    );
    
    return {
      id: document.$id,
      quality: document.quality,
      cost: document.cost,
      active: document.active,
      $createdAt: document.$createdAt,
      $updatedAt: document.$updatedAt
    };
  } catch (error) {
    console.error('Error creating fabric quality:', error);
    throw error;
  }
};

export const updateFabricQuality = async (id: string, quality: number, cost: number, active: boolean = true): Promise<FabricQuality> => {
  try {
    const document = await databases.updateDocument(
      DATABASE_ID,
      FABRIC_QUALITIES_COLLECTION_ID,
      id,
      {
        quality,
        cost,
        active
      }
    );
    
    return {
      id: document.$id,
      quality: document.quality,
      cost: document.cost,
      active: document.active !== undefined ? document.active : true,
      $createdAt: document.$createdAt,
      $updatedAt: document.$updatedAt
    };
  } catch (error) {
    console.error('Error updating fabric quality:', error);
    throw error;
  }
};

export const deleteFabricQuality = async (id: string): Promise<void> => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      FABRIC_QUALITIES_COLLECTION_ID,
      id
    );
  } catch (error) {
    console.error('Error deleting fabric quality:', error);
    throw error;
  }
}; 