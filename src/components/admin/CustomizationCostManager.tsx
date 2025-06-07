import React, { useState } from 'react';
import { Printer, Shirt } from 'lucide-react';
import PrintingTechniqueManager from './PrintingTechniqueManager';
import FabricQualityManager from './FabricQualityManager';
import { useToast } from '../../hooks/use-toast';

interface TabProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const Tab: React.FC<TabProps> = ({ isActive, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400'
    }`}
    tabIndex={0}
    aria-label={`${label} tab`}
    onKeyDown={(e) => e.key === 'Enter' && onClick()}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const CustomizationCostManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('printing');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const tabs = [
    {
      id: 'printing',
      label: 'Printing Technique',
      icon: <Printer className={`w-5 h-5 ${activeTab === 'printing' ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />,
      content: (
        <div className="p-6">
          <PrintingTechniqueManager />
        </div>
      ),
    },
    {
      id: 'fabric',
      label: 'Fabric Quality',
      icon: <Shirt className={`w-5 h-5 ${activeTab === 'fabric' ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />,
      content: (
        <div className="p-6">
          <FabricQualityManager />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Background Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-gray-700 dark:text-gray-200">Processing...</p>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            isActive={activeTab === tab.id}
            onClick={() => handleTabChange(tab.id)}
            icon={tab.icon}
            label={tab.label}
          />
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>

      {/* Description */}
      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded-lg text-sm">
        <h3 className="font-medium mb-2">About Customization Pricing</h3>
        <p>
          {activeTab === 'printing' ? 
            'Manage printing technique costs that apply to customized products. These costs are added to the base product price when customers request customization.' : 
            'Set fabric quality costs for different GSM (grams per square meter) options. Higher GSM values indicate better quality fabric.'}
        </p>
      </div>
    </div>
  );
};

export default CustomizationCostManager; 