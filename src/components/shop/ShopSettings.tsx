import { useState } from 'react';
import { Building2, Mail, Phone, Globe, Settings } from 'lucide-react';

interface ShopSettings {
  businessInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    taxId: string;
  };
  currency: string;
  timezone: string;
  orderNumberPrefix: string;
  emailNotifications: {
    newOrders: boolean;
    orderStatus: boolean;
    lowStock: boolean;
    customerReviews: boolean;
  };
}

const initialSettings: ShopSettings = {
  businessInfo: {
    name: 'Kri8tive',
    email: 'contact@kri8tive.com',
    phone: '+234 123 456 7890',
    address: '123 Victoria Island, Lagos, Nigeria',
    taxId: '12-3456789'
  },
  currency: 'NGN',
  timezone: 'Africa/Lagos',
  orderNumberPrefix: 'KRI',
  emailNotifications: {
    newOrders: true,
    orderStatus: true,
    lowStock: true,
    customerReviews: false
  }
};

export default function ShopSettings() {
  const [settings, setSettings] = useState<ShopSettings>(initialSettings);

  const handleBusinessInfoChange = (field: keyof typeof settings.businessInfo, value: string) => {
    setSettings(prev => ({
      ...prev,
      businessInfo: {
        ...prev.businessInfo,
        [field]: value
      }
    }));
  };

  const handleNotificationToggle = (field: keyof typeof settings.emailNotifications) => {
    setSettings(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [field]: !prev.emailNotifications[field]
      }
    }));
  };

  return (
    <div className="space-y-6" role="region" aria-label="Shop Settings">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="w-5 h-5" aria-hidden="true" />
          <h2 className="text-lg font-bold">Business Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
              Business Name
            </label>
            <input
              id="businessName"
              type="text"
              value={settings.businessInfo.name}
              onChange={(e) => handleBusinessInfoChange('name', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              placeholder="Enter business name"
              aria-label="Business Name"
            />
          </div>

          <div>
            <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">
              Tax ID / VAT Number
            </label>
            <input
              id="taxId"
              type="text"
              value={settings.businessInfo.taxId}
              onChange={(e) => handleBusinessInfoChange('taxId', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              placeholder="Enter tax ID or VAT number"
              aria-label="Tax ID or VAT Number"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="email"
                type="email"
                value={settings.businessInfo.email}
                onChange={(e) => handleBusinessInfoChange('email', e.target.value)}
                className="block w-full pl-10 rounded-md border-gray-300 focus:border-black focus:ring-black"
                placeholder="Enter business email"
                aria-label="Business Email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="phone"
                type="tel"
                value={settings.businessInfo.phone}
                onChange={(e) => handleBusinessInfoChange('phone', e.target.value)}
                className="block w-full pl-10 rounded-md border-gray-300 focus:border-black focus:ring-black"
                placeholder="Enter business phone"
                aria-label="Business Phone"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <textarea
              id="address"
              value={settings.businessInfo.address}
              onChange={(e) => handleBusinessInfoChange('address', e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              placeholder="Enter business address"
              aria-label="Business Address"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Globe className="w-5 h-5" aria-hidden="true" />
          <h2 className="text-lg font-bold">Regional Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
              Currency
            </label>
            <select
              id="currency"
              value={settings.currency}
              onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              aria-label="Select Currency"
            >
              <option value="NGN">NGN - Nigerian Naira</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
              Timezone
            </label>
            <select
              id="timezone"
              value={settings.timezone}
              onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              aria-label="Select Timezone"
            >
              <option value="Africa/Lagos">Lagos (WAT)</option>
              <option value="Africa/Abuja">Abuja (WAT)</option>
              <option value="Africa/Port_Harcourt">Port Harcourt (WAT)</option>
              <option value="Africa/Kano">Kano (WAT)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="Europe/London">London (GMT/BST)</option>
            </select>
          </div>

          <div>
            <label htmlFor="orderPrefix" className="block text-sm font-medium text-gray-700">
              Order Number Prefix
            </label>
            <input
              id="orderPrefix"
              type="text"
              value={settings.orderNumberPrefix}
              onChange={(e) => setSettings(prev => ({ ...prev, orderNumberPrefix: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
              placeholder="Enter order prefix"
              aria-label="Order Number Prefix"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5" aria-hidden="true" />
          <h2 className="text-lg font-bold">Email Notifications</h2>
        </div>

        <div className="space-y-4" role="group" aria-label="Email notification preferences">
          {Object.entries(settings.emailNotifications).map(([key, enabled]) => (
            <div key={key} className="flex items-center justify-between py-2">
              <label 
                htmlFor={`notification-${key}`} 
                className="font-medium capitalize cursor-pointer"
              >
                {key.replace(/([A-Z])/g, ' $1')}
              </label>
              <div className="relative inline-flex items-center">
                <input
                  id={`notification-${key}`}
                  type="checkbox"
                  checked={enabled}
                  onChange={() => handleNotificationToggle(key as keyof typeof settings.emailNotifications)}
                  className="sr-only peer"
                  aria-label={`${key.replace(/([A-Z])/g, ' $1')} notifications`}
                />
                <div 
                  className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/25 
                    rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white 
                    after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
                    after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                    after:transition-all peer-checked:bg-black"
                  aria-hidden="true"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
          aria-label="Save settings changes"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}