import { useEffect, useState } from 'react';
import { productsService } from '../services/appwrite';
import { DatabaseService } from '../services/appwrite/database.service';

interface Product {
  $id: string;
  name: string;
  price: number;
  description: string;
  image_url?: string;
  category?: string;
  stock: number;
  sku: string;
  created_at: string;
  updated_at?: string;
}

export const AppwriteTest = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Create a query to sort by name
        const queries = [
          DatabaseService.limit(10),
          DatabaseService.orderAsc('name')
        ];
        
        const result = await productsService.list(queries);
        
        if (result.success) {
          // Type assertion with unknown intermediate step
          setProducts((result.data || []) as unknown as Product[]);
        } else {
          setError('Failed to load products');
          console.error(result.error);
        }
      } catch (err) {
        setError('An error occurred while fetching products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Appwrite Integration Test</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="ml-2 text-gray-600">Loading products...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
          <p className="text-sm mt-2">Check your Appwrite configuration and make sure the database is properly set up.</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <p>No products found.</p>
          <p className="text-sm mt-2">You may need to run the initialization script to add sample products.</p>
        </div>
      ) : (
        <div>
          <p className="text-green-600 mb-4">
            Successfully connected to Appwrite and loaded {products.length} products!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.$id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {product.image_url && (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-800">{product.name}</h2>
                  <p className="text-gray-600 text-sm mt-1">{product.description.substring(0, 100)}...</p>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-indigo-600 font-bold">${product.price.toFixed(2)}</span>
                    {product.category && (
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                        {product.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 