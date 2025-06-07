import { CustomizationStatus } from "../lib/actions/customization";
import { Product } from './product';

// Define PrintingTechnique interface
export interface PrintingTechnique {
  id: string;
  name: string;
  description?: string;
  cost: number;
  design_area?: string;
  available?: boolean;
  created_at: string;
  updated_at: string;
}

// Define FabricQuality interface
export interface FabricQuality {
  id: string;
  quality: number;
  cost: number;
  created_at: string;
  updated_at: string;
}

// Define SizePrice interface
export interface SizePrice {
  id: string;
  size: string;
  cost: number;
  created_at: string;
  updated_at: string;
}

// Define the CustomizationRequest interface
export interface CustomizationRequest {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  created_at: string;
  updated_at?: string;
  
  // Product customization details
  product_id?: string;
  product?: Product;
  product_name?: string;
  product_price?: number;
  product_size?: string;
  product_cost?: number;
  
  // Personal item customization details
  item_type?: string;
  
  // Common customization fields
  size: string;
  color?: string;
  material?: string;
  material_id?: string;
  technique_id: string;
  technique_name?: string;
  technique_cost: number;
  technique?: string;
  fabric_cost?: number;
  fabric_quality?: number | string;
  fabric_purchase_option?: 'help_buy' | 'already_have' | 'help_me_buy';
  design_url: string;
  image_url?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  base_cost?: number;
  
  // Customer contact information
  phone_number?: string;
  whatsapp_number?: string;
  delivery_address?: string;
  
  // Request status
  status: CustomizationStatus;
  notes?: string;
  admin_notes?: string;
  
  // Required by Appwrite schema
  title?: string;
  description?: string;
  
  // Payment information
  payment_reference?: string;
  payment_completed?: boolean;
}

export interface CustomizationFormData {
  user_id?: string;
  user_name?: string;
  user_email?: string;
  title?: string;
  description?: string;
  phone_number?: string;
  whatsapp_number?: string;
  delivery_address?: string;
  product_id?: string;
  product?: Product | null;
  product_name?: string;
  product_price?: number;
  product_size?: string;
  product_cost?: number;
  size?: string;
  color?: string;
  technique_id?: string;
  technique_name?: string;
  design_url?: string;
  image_url?: string;
  item_type?: string;
  material_id?: string | null;
  material?: string;
  notes?: string;
  admin_notes?: string;
  technique_cost?: number;
  fabric_cost?: number;
  fabric_quality?: number | null;
  fabric_purchase_option?: 'help_buy' | 'already_have' | 'help_me_buy';
  unit_cost?: number;
  quantity?: number;
  total_cost?: number;
  status?: CustomizationStatus;
  created_at?: string;
  updated_at?: string;
  payment_reference?: string;
  payment_completed?: boolean;
}

export interface CustomizationRequestData {
  product_id?: string;
  product_name?: string;
  product_price?: number;
  product_size?: string;
  product_cost?: number;
  size: string;
  color?: string;
  technique_id: string;
  technique_name?: string;
  design_url: string;
  item_type?: string;
  material_id?: string | null;
  notes?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  technique_cost: number;
  fabric_cost?: number;
  fabric_quality?: number | null;
  fabric_purchase_option?: 'help_buy' | 'already_have' | 'help_me_buy';
  phone_number?: string;
  whatsapp_number?: string;
  delivery_address?: string;
} 