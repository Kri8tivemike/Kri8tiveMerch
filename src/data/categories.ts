export const categories = [
  'Electronics',
  'Clothing',
  'Books',
  'Home & Garden',
  'Sports & Outdoors',
  'Toys & Games',
  'Beauty & Personal Care',
  'Health & Wellness',
  'Automotive',
  'Pet Supplies'
] as const;

export type ProductCategory = typeof categories[number];

// Utility function to check if a string is a valid category
export function isValidCategory(category: string): category is ProductCategory {
  return categories.includes(category as ProductCategory);
}
