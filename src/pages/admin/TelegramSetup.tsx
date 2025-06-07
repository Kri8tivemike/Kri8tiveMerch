import { useState, useEffect } from 'react';
import { setTelegramChatId, sendTelegramNotification, sendOrderNotification } from '../../services/telegram.service';

export default function TelegramSetup() {
  const [chatId, setChatId] = useState('');
  const [status, setStatus] = useState('');
  const [testingStatus, setTestingStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testType, setTestType] = useState<'customization' | 'order'>('customization');

  // Load existing chat ID if available
  useEffect(() => {
    const savedChatId = localStorage.getItem('telegram_chat_id');
    if (savedChatId) {
      setChatId(savedChatId);
    }
  }, []);

  const handleSetup = async () => {
    if (!chatId) {
      setStatus('Please enter a chat ID');
      return;
    }
    
    try {
      setTelegramChatId(chatId);
      localStorage.setItem('telegram_chat_id', chatId);
      setStatus('Telegram notifications configured successfully!');
    } catch (error) {
      console.error('Setup error:', error);
      setStatus('Failed to configure Telegram notifications');
    }
  };
  
  // Test function to send a sample notification
  const handleTestNotification = async () => {
    setIsLoading(true);
    setTestingStatus(`Sending test ${testType} notification...`);
    
    try {
      let result = false;
      
      if (testType === 'customization') {
        // Send a test customization notification
        result = await sendTelegramNotification({
          customizationId: 'TEST-' + Math.floor(Math.random() * 10000),
          customerName: 'Test Customer',
          productInfo: 'Test Product',
          totalAmount: 5000,
          technique: 'DTF Printing',
          quantity: 1
        });
      } else {
        // Send a test order notification
        result = await sendOrderNotification({
          orderId: 'ORDER-' + Math.floor(Math.random() * 10000),
          customerName: 'Test Customer',
          orderTotal: 15000,
          orderItems: [
            { productName: 'Test T-Shirt', quantity: 2, price: 5000 },
            { productName: 'Test Hoodie', quantity: 1, price: 5000 }
          ],
          shippingCost: 0
        });
      }
      
      if (result) {
        setTestingStatus(`Test ${testType} notification sent successfully! Check your Telegram.`);
      } else {
        setTestingStatus(`Failed to send test ${testType} notification. Please check the console for errors.`);
      }
    } catch (error) {
      console.error('Test notification error:', error);
      setTestingStatus('Error sending test notification: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Telegram Notification Setup</h2>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="space-y-5">
          <div>
            <label htmlFor="chatId" className="block text-sm font-medium mb-1">
              Your Telegram Chat ID
            </label>
            <input
              id="chatId"
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter your Telegram chat ID"
            />
            <p className="mt-2 text-xs text-gray-600">
              1. Start by messaging <span className="font-medium">@Kri8tiveBot</span> on Telegram<br />
              2. Then visit the URL below to find your chat ID in the response:<br />
              <a 
                href="https://api.telegram.org/bot7508656696:AAHPPzMNi84h6q1Ip0uzKSA9MGwJaFUO1iU/getUpdates" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                https://api.telegram.org/bot7508656696:AAHPPzMNi84h6q1Ip0uzKSA9MGwJaFUO1iU/getUpdates
              </a>
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Test Notification Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="testType"
                  checked={testType === 'customization'}
                  onChange={() => setTestType('customization')}
                  className="mr-2"
                />
                <span className="text-sm">Customization</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="testType"
                  checked={testType === 'order'}
                  onChange={() => setTestType('order')}
                  className="mr-2"
                />
                <span className="text-sm">Order</span>
              </label>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleSetup}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Save Configuration
            </button>
            
            <button
              onClick={handleTestNotification}
              disabled={isLoading || !chatId}
              className={`px-4 py-2 rounded transition-colors ${
                isLoading || !chatId 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isLoading ? 'Sending...' : `Test ${testType.charAt(0).toUpperCase() + testType.slice(1)} Notification`}
            </button>
          </div>
          
          {status && (
            <div className={`text-sm font-medium p-3 rounded ${
              status.includes('successfully') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {status}
            </div>
          )}
          
          {testingStatus && (
            <div className={`text-sm font-medium p-3 rounded ${
              testingStatus.includes('successfully') 
                ? 'bg-green-100 text-green-800' 
                : testingStatus.includes('Sending')
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-red-100 text-red-800'
            }`}>
              {testingStatus}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 bg-blue-50 rounded-xl p-5 border border-blue-100">
        <h3 className="font-semibold mb-2">How to Use</h3>
        <ul className="space-y-2 text-sm">
          <li>• After setup, you'll receive notifications on Telegram for all new orders and customization requests</li>
          <li>• Make sure you've started a conversation with the bot (@Kri8tiveBot)</li>
          <li>• The notification will include customer info, product details, and order amount</li>
          <li>• Your bot token and chat ID (7283777882) are now configured</li>
        </ul>
      </div>
    </div>
  );
} 