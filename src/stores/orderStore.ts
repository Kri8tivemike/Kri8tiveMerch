import { create } from 'zustand';
import { databases } from '../lib/appwrite';
import { Query } from 'appwrite';

interface Order {
  id: string;
  user_id: string;
  created_at: string;
  status: string;
  total: number;
  items: any[];
  [key: string]: any;
}

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  fetchOrders: (userId: string) => Promise<void>;
  getOrderById: (orderId: string) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,
  
  fetchOrders: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { documents } = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_ID,
        [
          Query.equal('user_id', userId),
          Query.orderDesc('created_at')
        ]
      );
      
      // Convert Appwrite documents to Order objects
      const ordersList = documents.map(doc => ({
        id: doc.$id,
        user_id: doc.user_id,
        created_at: doc.created_at,
        status: doc.status,
        total: doc.total,
        items: doc.items || [],
        ...doc
      }));
      
      set({ 
        orders: ordersList,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
        isLoading: false
      });
    }
  },
  
  getOrderById: async (orderId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const doc = await databases.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_ID,
        orderId
      );
      
      // Convert Appwrite document to Order object
      const order = {
        id: doc.$id,
        user_id: doc.user_id,
        created_at: doc.created_at,
        status: doc.status,
        total: doc.total,
        items: doc.items || [],
        ...doc
      };
      
      set({ isLoading: false });
      return order;
    } catch (error) {
      console.error('Error fetching order:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch order',
        isLoading: false
      });
      return null;
    }
  },
  
  updateOrderStatus: async (orderId: string, status: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_ID,
        orderId,
        { status }
      );
      
      // Update local state
      const orders = get().orders.map(order => 
        order.id === orderId ? { ...order, status } : order
      );
      
      set({ orders, isLoading: false });
    } catch (error) {
      console.error('Error updating order status:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update order status',
        isLoading: false
      });
    }
  }
}));