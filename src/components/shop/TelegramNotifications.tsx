import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, AlertCircle, Check } from 'lucide-react';
import Switch from '../Switch';
import axios from 'axios';

interface TelegramSettings {
  enabled: boolean;
  botToken: string;
  chatId: string;
  notifyOnNewOrder: boolean;
  notifyOnNewCustomer: boolean;
  notifyOnLowStock: boolean;
  notifyOnOrderStatusChange: boolean;
}

const TelegramNotifications: React.FC = () => {
  const [settings, setSettings] = useState<TelegramSettings>({
    enabled: false,
    botToken: '',
    chatId: '',
    notifyOnNewOrder: true,
    notifyOnNewCustomer: true,
    notifyOnLowStock: true,
    notifyOnOrderStatusChange: true
  });

  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [savedStatus, setSavedStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // Load existing settings from localStorage if available
  useEffect(() => {
    const savedChatId = localStorage.getItem('telegram_chat_id');
    const savedBotToken = localStorage.getItem('telegram_bot_token');
    
    if (savedChatId || savedBotToken) {
      setSettings(prev => ({
        ...prev,
        chatId: savedChatId || prev.chatId,
        botToken: savedBotToken || prev.botToken,
        enabled: !!(savedChatId && savedBotToken)
      }));
    }
  }, []);

  const handleChange = (field: keyof TelegramSettings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setSavedStatus('idle');
  };

  const handleSaveSettings = () => {
    try {
      // Save settings to localStorage
      if (settings.botToken) {
        localStorage.setItem('telegram_bot_token', settings.botToken);
      }
      
      if (settings.chatId) {
        localStorage.setItem('telegram_chat_id', settings.chatId);
      }
      
      setSavedStatus('saved');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSavedStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSavedStatus('error');
    }
  };

  const handleTestNotification = async () => {
    if (!settings.botToken || !settings.chatId) {
      setTestStatus('error');
      return;
    }
    
    setTestStatus('loading');
    
    try {
      // Prepare a test message
      const testMessage = `🧪 *TEST NOTIFICATION*\n\n` +
        `This is a test message from your Kri8tiveBlanks store dashboard.\n\n` +
        `⏱️ Time: ${new Date().toLocaleTimeString()}\n` +
        `📅 Date: ${new Date().toLocaleDateString()}\n\n` +
        `If you're seeing this, your Telegram notifications are working! 🎉`;
      
      // Send the actual message to Telegram
      const response = await axios.post(
        `https://api.telegram.org/bot${settings.botToken}/sendMessage`,
        {
          chat_id: settings.chatId,
          text: testMessage,
          parse_mode: 'Markdown'
        }
      );
      
      if (response.data.ok === true) {
        console.log('Telegram test notification sent successfully');
        setTestStatus('success');
      } else {
        console.error('Failed to send Telegram test message:', response.data);
        setTestStatus('error');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setTestStatus('error');
    }
    
    // Reset status after 3 seconds
    setTimeout(() => {
      setTestStatus('idle');
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Telegram Notifications</h3>
        </div>
        <Switch 
          name="telegram-enabled" 
          checked={settings.enabled} 
          onChange={(checked) => handleChange('enabled', checked)} 
        />
      </div>
      
      {settings.enabled && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure Telegram notifications to receive real-time updates about your store.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bot Token
              </label>
              <input 
                type="text"
                value={settings.botToken}
                onChange={(e) => handleChange('botToken', e.target.value)}
                placeholder="123456789:ABCdefGhIJklmNoPQRsTUVwxyZ"
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#111827] rounded-lg bg-white dark:bg-[#121212] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Create a bot via <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">@BotFather</a> and get the token.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Chat ID
              </label>
              <input 
                type="text"
                value={settings.chatId}
                onChange={(e) => handleChange('chatId', e.target.value)}
                placeholder="-1001234567890"
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#111827] rounded-lg bg-white dark:bg-[#121212] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Use <a href="https://t.me/getmyid_bot" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">@getmyid_bot</a> to get your chat ID.
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-[#121212] rounded-lg p-4">
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Notification Settings</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm text-gray-700 dark:text-gray-300">New Orders</label>
                <Switch 
                  name="notify-new-order" 
                  checked={settings.notifyOnNewOrder} 
                  onChange={(checked) => handleChange('notifyOnNewOrder', checked)} 
                />
              </div>
              
              <div className="flex justify-between items-center">
                <label className="text-sm text-gray-700 dark:text-gray-300">New Customers</label>
                <Switch 
                  name="notify-new-customer" 
                  checked={settings.notifyOnNewCustomer} 
                  onChange={(checked) => handleChange('notifyOnNewCustomer', checked)} 
                />
              </div>
              
              <div className="flex justify-between items-center">
                <label className="text-sm text-gray-700 dark:text-gray-300">Low Stock Alerts</label>
                <Switch 
                  name="notify-low-stock" 
                  checked={settings.notifyOnLowStock} 
                  onChange={(checked) => handleChange('notifyOnLowStock', checked)} 
                />
              </div>
              
              <div className="flex justify-between items-center">
                <label className="text-sm text-gray-700 dark:text-gray-300">Order Status Changes</label>
                <Switch 
                  name="notify-order-status" 
                  checked={settings.notifyOnOrderStatusChange} 
                  onChange={(checked) => handleChange('notifyOnOrderStatusChange', checked)} 
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={handleTestNotification}
              disabled={testStatus === 'loading' || !settings.botToken || !settings.chatId}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                testStatus === 'loading' || !settings.botToken || !settings.chatId 
                  ? 'bg-gray-300 dark:bg-[#222222] text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40'
              }`}
            >
              {testStatus === 'loading' ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                  Testing...
                </>
              ) : testStatus === 'success' ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Sent!
                </>
              ) : testStatus === 'error' ? (
                <>
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Failed
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Test
                </>
              )}
            </button>
            
            <button
              onClick={handleSaveSettings}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                savedStatus === 'saved'
                  ? 'bg-green-600 text-white'
                  : savedStatus === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {savedStatus === 'saved' ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : savedStatus === 'error' ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  Error
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelegramNotifications; 