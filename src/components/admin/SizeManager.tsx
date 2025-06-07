import React, { useState } from 'react';
import { Pencil, Trash2, Plus, Save, X, ArrowRight } from 'lucide-react';

interface SizePrice {
  id: string;
  size: string;
  cost: number;
}

interface EditingSize extends SizePrice {
  isNew?: boolean;
}

const SizeManager: React.FC = () => {
  const [sizes, setSizes] = useState<SizePrice[]>([
    {
      id: '1',
      size: '10x10',
      cost: 0
    },
    {
      id: '2',
      size: '12x12',
      cost: 0
    },
    {
      id: '3',
      size: '15x15',
      cost: 0
    },
    {
      id: '4',
      size: '20x20',
      cost: 0
    }
  ]);

  const [editingSize, setEditingSize] = useState<EditingSize | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleEdit = (size: SizePrice) => {
    setEditingSize(size);
    setShowAddForm(false);
  };

  const handleAdd = () => {
    setShowAddForm(true);
    setEditingSize({
      id: Date.now().toString(),
      size: '',
      cost: 0,
      isNew: true
    });
  };

  const handleSave = (size: EditingSize) => {
    if (size.isNew) {
      setSizes([...sizes, size]);
    } else {
      setSizes(sizes.map(s => s.id === size.id ? size : s));
    }
    setEditingSize(null);
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    setSizes(sizes.filter(s => s.id !== id));
  };

  const handleCancel = () => {
    setEditingSize(null);
    setShowAddForm(false);
  };

  const validateSize = (value: string) => {
    // Allow format like "10x10", "10X10", "10 x 10"
    return value.replace(/\s+/g, '').toLowerCase();
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mb-6">
        <h3 className="text-blue-800 font-medium mb-2">Print Size Management</h3>
        <p className="text-sm text-blue-700">
          Define different print sizes with their associated costs. These sizes will be available as options in the customization form.
        </p>
      </div>
      
      {/* Add New Size Button */}
      <div className="flex justify-end">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Size</span>
        </button>
      </div>

      {/* Sizes List */}
      <div className="grid gap-4">
        {sizes.map(size => (
          <div
            key={size.id}
            className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-all duration-200"
          >
            {editingSize?.id === size.id ? (
              // Edit Form
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size (inches)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editingSize.size}
                      onChange={e => setEditingSize({
                        ...editingSize,
                        size: validateSize(e.target.value)
                      })}
                      placeholder="e.g., 10x10"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                      inches
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost (₦)
                  </label>
                  <input
                    type="number"
                    value={editingSize.cost}
                    onChange={e => setEditingSize({
                      ...editingSize,
                      cost: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleSave(editingSize)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all shadow-sm"
                  >
                    <Save className="w-5 h-5" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
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
                  <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {size.size} inches
                    </h3>
                    <p className="text-sm text-gray-500">Cost per print</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    ₦{size.cost}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(size)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                    title="Edit size"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(size.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                    title="Delete size"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Size Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 mt-4 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New Size</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size (inches)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={editingSize?.size || ''}
                  onChange={e => setEditingSize({
                    ...editingSize!,
                    size: validateSize(e.target.value)
                  })}
                  placeholder="e.g., 10x10"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                  inches
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost (₦)
              </label>
              <input
                type="number"
                value={editingSize?.cost || 0}
                onChange={e => setEditingSize({
                  ...editingSize!,
                  cost: parseFloat(e.target.value) || 0
                })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => handleSave(editingSize!)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all shadow-sm"
              >
                <Save className="w-5 h-5" />
                <span>Save</span>
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                <X className="w-5 h-5" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SizeManager; 