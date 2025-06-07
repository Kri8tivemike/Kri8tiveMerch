import { DatabaseService } from './database.service';
import { authService } from './auth.service';

// Export auth service
export { authService };

// Create database ID variable - to be filled after database creation
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';

// Create and export database services for each collection
// These will be created once we've set up the collections in Appwrite
export const productsService = new DatabaseService(DATABASE_ID, 'products');
export const ordersService = new DatabaseService(DATABASE_ID, 'orders');
export const usersService = new DatabaseService(DATABASE_ID, 'users');
export const categoriesService = new DatabaseService(DATABASE_ID, 'categories');

// Export the DatabaseService class for creating custom services as needed
export { DatabaseService }; 