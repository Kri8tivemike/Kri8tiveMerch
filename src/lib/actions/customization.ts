/**
 * Types for customization requests
 */

// Base customization request data interface
export interface CustomizationRequestData {
  product_id?: string;
  size: string;
  color?: string;
  technique_id: string;
  technique_name?: string;
  design_url: string;
  notes?: string;
  phone_number?: string;
  whatsapp_number?: string;
  delivery_address?: string;
  item_type?: string;
  material_id?: string | null;
  fabric_purchase_option?: 'help_buy' | 'already_have' | 'help_me_buy';
  fabric_quality?: number | string | null;
  technique_cost?: number;
  fabric_cost?: number;
  unit_cost?: number;
  quantity?: number;
  total_cost?: number;
}

// Customization request status
export type CustomizationStatus = 'Pending' | 'approved' | 'rejected' | 'completed';

// Complete customization request with additional fields from the database
export interface CustomizationRequest extends CustomizationRequestData {
  id: string;
  user_id: string;
  status: CustomizationStatus;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  admin_notes?: string;
  image_url?: string;
  material?: string;
  product?: {
    id: string;
    name: string;
    image_url?: string;
    price?: number;
  } | null;
  title?: string;
  description?: string;
  payment_reference?: string;
  payment_completed?: boolean;
}

// Cost breakdown for customization
export interface CostBreakdown {
  product_cost: number;
  technique_cost: number;
  fabric_cost: number;
  unit_cost: number;
  quantity: number;
  total_cost: number;
} 