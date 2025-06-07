import React, { useState, useEffect } from 'react';
import { 
  Edit, 
  Trash2, 
  Search, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  X,
  ArrowUpDown,
  Eye,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { Product } from '../../types/product';

interface ProductManagerProps {
  products: Product[];
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSubmit: () => void;
  editingProductId: string | null;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  setEditingProductId: (id: string | null) => void;
  onView?: (id: string) => void;
}

const ProductManager: React.FC<ProductManagerProps> = ({
  products,
  loading,
  onEdit,
  onDelete,
  onSubmit,
  editingProductId,
  showForm,
  setShowForm,
  setEditingProductId,
  onView
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof Product>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter and sort products when products or search term changes
  useEffect(() => {
    let results = [...products];
    
    // Apply search filter
    if (searchTerm) {
      results = results.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    results.sort((a, b) => {
      // Handle special case for price (number)
      if (sortField === 'price') {
        return sortDirection === 'asc' 
          ? a.price - b.price 
          : b.price - a.price;
      }
      
      // Handle special case for stock (number)
      if (sortField === 'stock_quantity') {
        return sortDirection === 'asc' 
          ? a.stock_quantity - b.stock_quantity 
          : b.stock_quantity - a.stock_quantity;
      }
      
      // Handle string fields
      const aValue = String(a[sortField] || '');
      const bValue = String(b[sortField] || '');
      
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
    
    setFilteredProducts(results);
    setCurrentPage(1); // Reset to first page on filter/sort change
  }, [products, searchTerm, sortField, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  const handleSort = (field: keyof Product) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleView = (id: string) => {
    if (onView) {
      onView(id);
    } else {
      // Default behavior when no view handler is provided
      window.open(`/product/${id}`, '_blank');
    }
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      onDelete(id);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl shadow-md border border-gray-100 dark:border-[#111827] overflow-hidden">
      {/* Header section */}
      <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-[#111827]">
        <div className="flex items-center gap-3">
          <Eye className="w-6 h-6 text-blue-600 dark:text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Product Management</h2>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-[#111827] rounded-lg bg-white dark:bg-[#121212] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                onClick={() => setSearchTerm('')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setEditingProductId(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Table section */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-[#121212] text-gray-700 dark:text-gray-300 text-sm">
            <tr>
              <th className="px-6 py-3 text-left font-medium">
                <button 
                  className="flex items-center gap-1"
                  onClick={() => handleSort('name')}
                >
                  Product
                  <ArrowUpDown className={`w-4 h-4 ${sortField === 'name' ? 'text-blue-600' : 'text-gray-400'}`} />
                </button>
              </th>
              <th className="px-6 py-3 text-left font-medium">
                <button 
                  className="flex items-center gap-1"
                  onClick={() => handleSort('category')}
                >
                  Category
                  <ArrowUpDown className={`w-4 h-4 ${sortField === 'category' ? 'text-blue-600' : 'text-gray-400'}`} />
                </button>
              </th>
              <th className="px-6 py-3 text-left font-medium">
                <button 
                  className="flex items-center gap-1"
                  onClick={() => handleSort('price')}
                >
                  Price
                  <ArrowUpDown className={`w-4 h-4 ${sortField === 'price' ? 'text-blue-600' : 'text-gray-400'}`} />
                </button>
              </th>
              <th className="px-6 py-3 text-left font-medium">
                <button 
                  className="flex items-center gap-1"
                  onClick={() => handleSort('stock_quantity')}
                >
                  Stock
                  <ArrowUpDown className={`w-4 h-4 ${sortField === 'stock_quantity' ? 'text-blue-600' : 'text-gray-400'}`} />
                </button>
              </th>
              <th className="px-6 py-3 text-left font-medium">
                <button 
                  className="flex items-center gap-1"
                  onClick={() => handleSort('created_at')}
                >
                  Created
                  <ArrowUpDown className={`w-4 h-4 ${sortField === 'created_at' ? 'text-blue-600' : 'text-gray-400'}`} />
                </button>
              </th>
              <th className="px-6 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-[#111827]">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Loading products...
                </td>
              </tr>
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No products match your search' : 'No products found'}
                </td>
              </tr>
            ) : (
              currentItems.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-[#121212]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-[#111827] rounded-md flex items-center justify-center overflow-hidden">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              // Replace broken image with fallback icon
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement?.classList.add('fallback-product-image');
                            }}
                          />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                          {product.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {product.category || 'Uncategorized'}
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    ₦{product.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1
                      ${!product.stock_quantity || product.stock_quantity <= 0
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : product.stock_quantity > 10 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}
                    >
                      {!product.stock_quantity || product.stock_quantity <= 0 ? (
                        <>
                          <XCircle className="w-3 h-3" />
                          Out of stock
                        </>
                      ) : product.stock_quantity > 10 ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          {product.stock_quantity} in stock
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          {product.stock_quantity} in stock
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                    {new Date(product.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleView(product.id)}
                        className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full"
                        title="View product"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(product.id)}
                        className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                        title="Edit product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product.id)}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredProducts.length > 0 && (
        <div className="px-6 py-4 bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-[#111827] flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} products
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#121212]'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
              // Calculate page number for display
              let pageNum = currentPage;
              if (totalPages <= 5) {
                pageNum = index + 1;
              } else if (currentPage <= 3) {
                pageNum = index + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + index;
              } else {
                pageNum = currentPage - 2 + index;
              }
              
              return (
                <button
                  key={index}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-md flex items-center justify-center ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#121212]'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md ${
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#121212]'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager; 