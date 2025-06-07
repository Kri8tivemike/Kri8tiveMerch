import { account, databases, ID, Query } from '../lib/appwrite';

// Define types for order-related data
type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  user_id?: string;
  status: OrderStatus;
  total_amount: number;
  shipping_cost: number;
  shipping_address: any;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
  total: number;
  products_json: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  color_id?: string;
  size?: string;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    price: number;
    image_url?: string;
    description?: string;
  };
}

export interface PrintingTechnique {
  id: string;
  name: string;
  cost: number;
  description?: string;
  design_area?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  active: boolean;  // This is mapped from 'is_active' in the database
  is_active?: boolean;  // Adding this for schema compatibility
}

export interface SizePrice {
  id: string;
  size: string;
  cost: number;
  description?: string;
  created_at: string;
  updated_at: string;
  active: boolean;  // This is mapped from 'is_active' in the database
  is_active: boolean;  // Adding this for schema compatibility
}

export interface FabricQuality {
  id: string;
  quality: number;
  cost: number;
  description?: string;
  created_at: string;
  updated_at: string;
  active: boolean;  // This is mapped from 'is_active' in the database
  is_active: boolean;  // Adding this for schema compatibility
}

// Order status information with UI details
export const orderStatusConfig = {
  Pending: {
    label: 'Pending',
    icon: 'Package',
    bgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
    textClass: 'text-yellow-700 dark:text-yellow-400'
  },
  Processing: {
    label: 'Processing',
    icon: 'ShoppingBag',
    bgClass: 'bg-blue-50 dark:bg-blue-900/20',
    textClass: 'text-blue-700 dark:text-blue-400'
  },
  Shipped: {
    label: 'Shipped',
    icon: 'Truck',
    bgClass: 'bg-purple-50 dark:bg-purple-900/20',
    textClass: 'text-purple-700 dark:text-purple-400'
  },
  Delivered: {
    label: 'Delivered',
    icon: 'CheckCircle',
    bgClass: 'bg-green-50 dark:bg-green-900/20',
    textClass: 'text-green-700 dark:text-green-400'
  },
  Cancelled: {
    label: 'Cancelled',
    icon: 'XCircle',
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    textClass: 'text-red-600 dark:text-red-400'
  }
};

// Environment variables
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
const TECHNIQUES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TECHNIQUES_COLLECTION_ID || '';
const SIZES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SIZES_COLLECTION_ID || '';
const FABRICS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_FABRICS_COLLECTION_ID || '';
const ORDERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_ID || '';
const ORDER_ITEMS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ORDER_ITEMS_COLLECTION_ID || '';

// Customization Cost Functions
export async function getPrintingTechniques(): Promise<PrintingTechnique[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      TECHNIQUES_COLLECTION_ID,
      [
        Query.orderAsc('name')
      ]
    );
    
    // Map the database fields to the expected format
    return response.documents.map(tech => ({
      id: tech.$id,
      name: tech.name,
      cost: tech.base_cost,
      description: tech.description,
      design_area: tech.design_area,
      image_url: tech.image_url,
      created_at: tech.$createdAt,
      updated_at: tech.$updatedAt,
      active: true,
      is_active: true
    }));
  } catch (error) {
    console.error('Error fetching printing techniques:', error);
    // Return default data if API fails
    return [
      {
        id: 'dtf_printing',
        name: 'DTF Printing',
        cost: 5000,
        description: 'Direct-to-film printing for vibrant, durable designs with excellent wash resistance.',
        design_area: '10x10',
        image_url: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: true,
        is_active: true
      },
      {
        id: 'sublimation',
        name: 'Sublimation',
        cost: 6000,
        description: 'Full-color, edge-to-edge printing perfect for all-over designs and photographs.',
        design_area: '12x12',
        image_url: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: true,
        is_active: true
      },
      {
        id: 'flex_vinyl',
        name: 'Flex Vinyl',
        cost: 3500,
        description: 'Premium heat transfer vinyl for sharp, professional results with a smooth finish.',
        design_area: '10x10',
        image_url: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: true,
        is_active: true
      }
    ];
  }
}

export async function getSizePrices(): Promise<SizePrice[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      SIZES_COLLECTION_ID,
      [
        // Removing Query.orderAsc('cost') since this attribute is not found in schema
      ]
    );
    
    return response.documents.map(size => ({
      id: size.$id,
      size: size.size,
      cost: size.cost,
      description: size.description,
      created_at: size.$createdAt,
      updated_at: size.$updatedAt,
      active: true,
      is_active: true
    }));
  } catch (error) {
    console.error('Error fetching size prices:', error);
    // Return default data if API fails
    return [
      {
        id: 'size_10x10',
        size: '10x10',
        cost: 2000,
        description: 'Standard size for small designs',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: true,
        is_active: true
      },
      {
        id: 'size_12x12',
        size: '12x12',
        cost: 3000,
        description: 'Medium size for standard designs',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: true,
        is_active: true
      },
      {
        id: 'size_15x15',
        size: '15x15',
        cost: 4000,
        description: 'Large size for detailed designs',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: true,
        is_active: true
      }
    ];
  }
}

export async function getFabricQualities(): Promise<FabricQuality[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      FABRICS_COLLECTION_ID,
      [
        Query.orderAsc('quality')
      ]
    );
    
    return response.documents.map(fabric => ({
      id: fabric.$id,
      quality: fabric.quality,
      cost: fabric.cost,
      description: fabric.description,
      created_at: fabric.$createdAt,
      updated_at: fabric.$updatedAt,
      active: true,
      is_active: true
    }));
  } catch (error) {
    console.error('Error fetching fabric qualities:', error);
    // Return default data if API fails
    return [
      {
        id: 'fabric_180',
        quality: 180,
        cost: 1500,
        description: 'Lightweight fabric (180 GSM)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: true,
        is_active: true
      },
      {
        id: 'fabric_200',
        quality: 200,
        cost: 2000,
        description: 'Medium weight fabric (200 GSM)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: true,
        is_active: true
      },
      {
        id: 'fabric_220',
        quality: 220,
        cost: 2500,
        description: 'Heavyweight fabric (220 GSM)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: true,
        is_active: true
      }
    ];
  }
}

interface CreateOrderInput {
  items: {
    product_id: string;
    quantity: number;
    price: number;
    color_id?: string;
    size?: string;
  }[];
  total_amount: number;
  shipping_cost: number;
  shipping_address: {
    first_name: string;
    last_name: string;
    email: string;
    address: string;
    city: string;
    country: string;
    postal_code: string;
    phone: string;
  };
}

async function validateAndLockStock(items: CreateOrderInput['items']): Promise<{success: boolean; message?: string}> {
  // In Appwrite, we need to implement this logic manually without stored procedures
  console.log('Items to validate:', items);
  
  try {
    // Get all product IDs
    const productIds = items.map(item => item.product_id);
    
    // Fetch products to check stock
    const productsCollection = import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID || '';
    const response = await databases.listDocuments(
      DATABASE_ID,
      productsCollection,
      [Query.equal('$id', productIds)]
    );
    
    const products = response.documents;
    
    // Create a map for easy lookup
    const productMap = products.reduce((map, product) => {
      map[product.$id] = product;
      return map;
    }, {} as Record<string, any>);
    
    // Check stock for each item
    for (const item of items) {
      const product = productMap[item.product_id];
      
      // Product not found
      if (!product) {
        return { 
          success: false, 
          message: `Product with ID ${item.product_id} not found` 
        };
      }
      
      // Check stock
      if (product.stock < item.quantity) {
        return { 
          success: false, 
          message: `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        };
      }
    }
    
    // All checks passed
    return { success: true };
  } catch (error) {
    console.error('Unexpected error during stock validation:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

export async function createOrder(input: CreateOrderInput, paymentReference?: string): Promise<Order> {
  // Get current user
  let userId = null;
  try {
    const user = await account.get();
    userId = user.$id;
  } catch (error) {
    console.log('No authenticated user, continuing as guest');
  }
  
  try {
    // Validate stock first
    const stockValid = await validateAndLockStock(input.items);
    if (!stockValid.success) {
      // If there's a payment reference but stock validation failed, we should log this for reconciliation
      if (paymentReference) {
        console.warn(`Payment received (${paymentReference}) but order creation failed due to stock issues: ${stockValid.message}`);
      }
      throw new Error(stockValid.message || 'Stock validation failed');
    }

    console.log('Creating order with data:', {
      user_id: userId,
      status: 'Pending',
      total_amount: input.total_amount,
      shipping_cost: input.shipping_cost,
      shipping_address: input.shipping_address,
      paymentReference
    });

    // Prepare order data
    const orderData: {
      status: OrderStatus;
      shipping_cost: number;
      shipping_address: string;
      products_json: string;
      total: number;
      total_amount: number;
      payment_reference?: string;
      user_id?: string;
      created_at: string;
      updated_at: string;
    } = {
      status: 'Pending',
      shipping_cost: input.shipping_cost,
      shipping_address: JSON.stringify(input.shipping_address),
      products_json: JSON.stringify(input.items),
      total: input.total_amount + input.shipping_cost,
      total_amount: input.total_amount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add payment reference if provided
    if (paymentReference) {
      orderData.payment_reference = paymentReference;
    }

    // Add user_id if authenticated
    if (userId) {
      orderData.user_id = userId;
    }

    // Create order
    const order = await databases.createDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      ID.unique(),
      orderData
    );

    if (!order) {
      throw new Error('Failed to create order: No data returned');
    }

    console.log('Order created successfully:', order);

    // Create order items
    for (const item of input.items) {
      const orderItemData = {
        order_id: order.$id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        color_id: item.color_id,
        size: item.size,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await databases.createDocument(
        DATABASE_ID,
        ORDER_ITEMS_COLLECTION_ID,
        ID.unique(),
        orderItemData
      );
      
      // Update product stock (in a real-world scenario, you'd want to use a transaction here)
      const productsCollection = import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID || '';
      const product = await databases.getDocument(
        DATABASE_ID,
        productsCollection,
        item.product_id
      );
      
      // Update stock
      const newStock = Math.max(0, (product.stock || 0) - item.quantity);
      await databases.updateDocument(
        DATABASE_ID,
        productsCollection,
        item.product_id,
        { stock: newStock }
      );
    }

    return {
      id: order.$id,
      user_id: order.user_id,
      status: order.status,
      total_amount: order.total_amount,
      shipping_cost: order.shipping_cost,
      shipping_address: order.shipping_address,
      payment_reference: order.payment_reference,
      created_at: order.$createdAt,
      updated_at: order.$updatedAt,
      total: order.total,
      products_json: order.products_json
    };
  } catch (error) {
    console.error('Order creation failed:', error);
    throw error;
  }
}

export async function getOrder(orderId: string): Promise<Order & { items: OrderItem[] }> {
  try {
    // Fetch the order
    const order = await databases.getDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      orderId
    );
    
    // Fetch the order items
    const itemsResponse = await databases.listDocuments(
      DATABASE_ID,
      ORDER_ITEMS_COLLECTION_ID,
      [Query.equal('order_id', orderId)]
    );
    
    // Get product details for each item
    const productsCollection = import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID || '';
    const productIds = itemsResponse.documents.map(item => item.product_id);
    
    let products: any[] = [];
    if (productIds.length > 0) {
      const productsResponse = await databases.listDocuments(
        DATABASE_ID,
        productsCollection,
        [Query.equal('$id', productIds)]
      );
      products = productsResponse.documents;
    }
    
    // Create lookup map for products
    const productMap = products.reduce((map, product) => {
      map[product.$id] = product;
      return map;
    }, {} as Record<string, any>);
    
    // Map item data with product details
    const orderItems = itemsResponse.documents.map(item => {
      const product = productMap[item.product_id] || {
        id: item.product_id,
        name: 'Product not available',
        price: item.price,
        image_url: ''
      };
      return {
        id: item.$id,
        order_id: item.order_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        color_id: item.color_id,
        size: item.size,
        created_at: item.$createdAt,
        updated_at: item.$updatedAt,
        product: product
      };
    });
    
    return {
      id: order.$id,
      user_id: order.user_id,
      status: order.status,
      total_amount: order.total_amount,
      shipping_cost: order.shipping_cost,
      shipping_address: typeof order.shipping_address === 'string' ? 
        JSON.parse(order.shipping_address) : order.shipping_address,
      payment_reference: order.payment_reference,
      created_at: order.$createdAt,
      updated_at: order.$updatedAt,
      total: order.total || order.total_amount,
      products_json: order.products_json || JSON.stringify([]),
      items: orderItems
    };
  } catch (error) {
    console.error('Failed to fetch order:', error);
    throw new Error('Failed to fetch order');
  }
}

export async function getUserOrders(): Promise<(Order & { items: OrderItem[] })[]> {
  try {
    // Get current user
    const user = await account.get();
    
    if (!user) {
      throw new Error('You must be logged in to view orders');
    }
    
    // Fetch user's orders - set a high limit to get all orders
    const ordersResponse = await databases.listDocuments(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      [
        Query.equal('user_id', user.$id),
        Query.orderDesc('$createdAt'),
        Query.limit(1000) // Set a high limit to fetch all orders
      ]
    );
    
    const orders = ordersResponse.documents;
    
    if (!orders || orders.length === 0) {
      return [];
    }
    
    const orderIds = orders.map(order => order.$id);
    
    // Get all order items for these orders with a high limit
    const orderItemsResponse = await databases.listDocuments(
      DATABASE_ID,
      ORDER_ITEMS_COLLECTION_ID,
      [
        Query.equal('order_id', orderIds),
        Query.limit(5000) // Set a high limit to fetch all order items
      ]
    );
    
    // Collect all product IDs to fetch
    const productIds = orderItemsResponse.documents.map(item => item.product_id);
    
    // Fetch all products in a single call if there are any products
    let productMap: Record<string, any> = {};
    if (productIds.length > 0) {
      try {
        const productsResponse = await databases.listDocuments(
          DATABASE_ID,
          import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID || '',
          [
            Query.equal('$id', productIds),
            Query.limit(5000)
          ]
        );
        
        // Create a map of product ID to product data
        productMap = productsResponse.documents.reduce((map, product) => {
          map[product.$id] = {
            id: product.$id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            description: product.description
          };
          return map;
        }, {} as Record<string, any>);
      } catch (error) {
        console.error('Error fetching products:', error);
        // Continue without product details if products fetch fails
      }
    }
    
    // Group items by order ID and add product details
    const itemsByOrder = orderItemsResponse.documents.reduce((grouped, item) => {
      if (!grouped[item.order_id]) {
        grouped[item.order_id] = [];
      }
      
      const product = productMap[item.product_id] || {
        id: item.product_id,
        name: 'Product not available',
        price: item.price,
        image_url: ''
      };
      
      grouped[item.order_id].push({
        id: item.$id,
        order_id: item.order_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        color_id: item.color_id,
        size: item.size,
        created_at: item.$createdAt,
        updated_at: item.$updatedAt,
        product: product
      });
      return grouped;
    }, {} as Record<string, OrderItem[]>);
    
    // Map orders with their items
    return orders.map(order => ({
      id: order.$id,
      user_id: order.user_id,
      status: order.status,
      total_amount: order.total_amount,
      shipping_cost: order.shipping_cost,
      shipping_address: typeof order.shipping_address === 'string' ? 
        JSON.parse(order.shipping_address) : order.shipping_address,
      payment_reference: order.payment_reference,
      created_at: order.$createdAt,
      updated_at: order.$updatedAt,
      total: order.total || order.total_amount,
      products_json: order.products_json || JSON.stringify([]),
      items: itemsByOrder[order.$id] || []
    }));
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    throw new Error('Failed to fetch orders');
  }
}

// Function to update order status
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  try {
    const updatedOrder = await databases.updateDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      orderId,
      {
        status,
        updated_at: new Date().toISOString()
      }
    );
    
    return {
      id: updatedOrder.$id,
      user_id: updatedOrder.user_id,
      status: updatedOrder.status,
      total_amount: updatedOrder.total_amount,
      shipping_cost: updatedOrder.shipping_cost,
      shipping_address: updatedOrder.shipping_address,
      payment_reference: updatedOrder.payment_reference,
      created_at: updatedOrder.$createdAt,
      updated_at: updatedOrder.$updatedAt,
      total: updatedOrder.total,
      products_json: updatedOrder.products_json
    };
  } catch (error) {
    console.error('Failed to update order status:', error);
    throw new Error('Failed to update order status');
  }
} 