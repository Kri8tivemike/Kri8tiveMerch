import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brush, Info, ArrowRight, Shirt, Package } from 'lucide-react';
import YourItemCustomizationForm from '../components/customization/YourItemCustomizationForm';

export default function BringYourOwnItem() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {!showForm ? (
          <div className="space-y-8">
            {/* Header Section */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Bring Your Own Item
              </h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Have your own item that you'd like to customize? We can help! Our expert team will work with you to create the perfect design on your personal items.
              </p>
            </div>

            {/* Guidelines Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Important Guidelines
              </h2>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Accepted Items</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <li>• T-shirts and Polos</li>
                      <li>• Hoodies and Sweatshirts</li>
                      <li>• Canvas Bags and Totes</li>
                      <li>• Sports Jerseys</li>
                      <li>• Face Caps and Hats</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Item Requirements</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <li>• Clean and unwashed</li>
                      <li>• Free from damage</li>
                      <li>• Suitable for printing</li>
                      <li>• Within size limitations</li>
                      <li>• Proper fabric composition</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-4 rounded-lg text-sm">
                  <strong>Note:</strong> We reserve the right to decline items that don't meet our requirements or aren't suitable for customization.
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Brush className="w-5 h-5 mr-2" />
                Start Customization
              </button>
              <button
                onClick={() => navigate('/customize')}
                className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Shirt className="w-5 h-5 mr-2" />
                Browse Our Products
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setShowForm(false)}
              className="mb-6 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center"
            >
              <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
              Back to Guidelines
            </button>
            <YourItemCustomizationForm />
          </div>
        )}
      </div>
    </div>
  );
} 