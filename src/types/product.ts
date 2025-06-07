import { ProductCategory } from '../data/categories';

export interface ProductColor {
  id: string;
  product_id: string;
  name: string;
  hex: string;
  image_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  stock_quantity: number;
  stock?: number;
  sku: string;
  created_at: string;
  updated_at?: string;
  customizable?: boolean | string;
  colors?: ProductColor[];
  sizes?: string[];
  selectedSize?: string;
  rating?: number;
  rating_count?: number;
  compare_at_price?: number;
  gallery_images?: string[];
  user_id?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface ProductSort {
  field: keyof Product;
  direction: 'asc' | 'desc';
}

export interface ProductListProps {
  filters?: ProductFilters;
  sort?: ProductSort;
  onProductClick?: (product: Product) => void;
  className?: string;
  isAdminView?: boolean;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  stock_quantity: number;
  sku?: string;
  colors?: Array<{
    name: string;
    hex: string;
  }>;
  sizes?: string[];
  customizable?: boolean | string;
  user_id?: string;
}

export interface ProductStats {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}