// Telegram notification service
import axios from 'axios';

export interface TelegramNotificationOptions {
  customizationId: string;
  customerName?: string;
  productInfo: string;
  totalAmount: number;
  technique?: string;
  quantity: number;
}

export interface OrderNotificationOptions {
  orderId: string;
  customerName?: string;
  orderTotal: number;
  orderItems: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  shippingCost?: number;
}

// Your bot token from the Telegram BotFather
const TELEGRAM_BOT_TOKEN = "7508656696:AAHPPzMNi84h6q1Ip0uzKSA9MGwJaFUO1iU";

// Your personal Telegram chat ID (retrieved from the Telegram API response)
let TELEGRAM_CHAT_ID = "7283777882"; // This is your default chat ID from the API response

export const sendTelegramNotification = async (options: TelegramNotificationOptions): Promise<boolean> => {
  try {
    const { customizationId, customerName, productInfo, totalAmount, technique, quantity } = options;
    
    if (!TELEGRAM_CHAT_ID) {
      console.error('Telegram chat ID not configured');
      return false;
    }
    
    // Format currency for display
    const formattedAmount = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(totalAmount);
    
    // Create a formatted message
    const message = `🔔 *NEW CUSTOMIZATION ORDER*\n\n` +
      `🆔 Order ID: \`${customizationId}\`\n` +
      `👤 Customer: ${customerName || 'Customer'}\n` +
      `🛍️ Product: ${productInfo}\n` +
      `🖌️ Technique: ${technique || 'Not specified'}\n` +
      `🔢 Quantity: ${quantity}\n` +
      `💰 Total Amount: *${formattedAmount}*\n\n` +
      `View full details in your admin dashboard.`;
    
    return sendTelegramMessage(message);
  } catch (error) {
    console.error('Failed to send customization notification:', error);
    return false;
  }
};

// New function to send order confirmations
export const sendOrderNotification = async (options: OrderNotificationOptions): Promise<boolean> => {
  try {
    const { orderId, customerName, orderTotal, orderItems, shippingCost = 0 } = options;
    
    if (!TELEGRAM_CHAT_ID) {
      console.error('Telegram chat ID not configured');
      return false;
    }
    
    // Format currency for display
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
      }).format(amount);
    };
    
    // Build items list
    let itemsList = '';
    orderItems.forEach(item => {
      itemsList += `• ${item.quantity}× ${item.productName} - ${formatCurrency(item.price * item.quantity)}\n`;
    });
    
    // Create a formatted message
    const message = `🛒 *NEW ORDER RECEIVED*\n\n` +
      `🆔 Order ID: \`${orderId}\`\n` +
      `👤 Customer: ${customerName || 'Customer'}\n\n` +
      `📦 *Items:*\n${itemsList}\n` +
      `🚚 Shipping: ${shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}\n` +
      `💰 Total Amount: *${formatCurrency(orderTotal)}*\n\n` +
      `View full details in your admin dashboard.`;
    
    return sendTelegramMessage(message);
  } catch (error) {
    console.error('Failed to send order notification:', error);
    return false;
  }
};

// Common function to send messages to Telegram
const sendTelegramMessage = async (message: string): Promise<boolean> => {
  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      }
    );
    
    console.log('Telegram notification sent successfully');
    return response.data.ok === true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
};

// Function to set your chat ID after retrieving it
export const setTelegramChatId = (chatId: string) => {
  TELEGRAM_CHAT_ID = chatId;
  // Also save to localStorage for persistence
  if (typeof window !== 'undefined') {
    localStorage.setItem('telegram_chat_id', chatId);
  }
}; 