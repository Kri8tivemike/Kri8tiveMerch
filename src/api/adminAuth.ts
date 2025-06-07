/**
 * Mock API handlers for admin authentication
 * 
 * These functions simulate API endpoints for authentication
 * In a real application, these would be actual API routes on a server
 */

import { account } from '../lib/appwrite';

// Type definitions for API responses
type ApiResponse<T> = {
  ok: boolean;
  status: number;
  json: () => Promise<T>;
};

type StatusResponse = {
  status: 'ok' | 'error' | 'warning';
  message: string;
};

type LoginErrorResponse = {
  message: string;
};

type LoginSuccessResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
};

// Export mock API functions for direct use in components instead of fetch overriding
export const adminApi = {
  // Login admin user
  async login(email: string, password: string): Promise<ApiResponse<LoginSuccessResponse | LoginErrorResponse>> {
    try {
      console.log('Mock API: Handling admin login for', email);
      
      // Try to sign in with Appwrite
      try {
        const session = await account.createEmailPasswordSession(email, password);
        
        if (!session) {
          return {
            ok: false,
            status: 401,
            json: async () => ({ message: 'Authentication failed: Invalid credentials' })
          };
        }
        
        const user = await account.get();
        
        if (!user) {
          return {
            ok: false,
            status: 500,
            json: async () => ({ message: 'Failed to create user session' })
          };
        }
        
        // In a real app, you'd verify the user role in a database collection
        // For now, we'll use a simplified approach with specific email domain for admins
        if (!email.endsWith('@kri8tive.com')) {
          return {
            ok: false,
            status: 403,
            json: async () => ({ message: 'Unauthorized: User is not an admin' })
          };
        }
        
        // Return success response
        return {
          ok: true,
          status: 200,
          json: async () => ({
            token: session.secret,
            user: {
              id: user.$id,
              email: user.email,
              role: 'super_admin'
            }
          })
        };
        
      } catch (error: any) {
        console.error('Error during auth:', error);
        
        // Fallback for development - pretend it worked
        if (email === 'super.admin@kri8tive.com' && password === 'SuperAdmin123') {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              token: 'mock-dev-token',
              user: {
                id: 'mock-user-id',
                email,
                role: 'super_admin'
              }
            })
          };
        }
        
        return {
          ok: false,
          status: 401,
          json: async () => ({ message: `Authentication error: ${error.message || 'Invalid credentials'}` })
        };
      }
    } catch (error: any) {
      console.error('Admin login handler error:', error);
      return {
        ok: false,
        status: 500,
        json: async () => ({ message: `Server error: ${error.message}` })
      };
    }
  },
  
  // Check admin API status
  async checkStatus(): Promise<ApiResponse<StatusResponse>> {
    try {
      // Try to connect to Appwrite
      try {
        await account.getSession('current');
        
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: 'ok', message: 'Admin API is available' })
        };
      } catch (error) {
        console.error('Status check error:', error);
        
        // Fallback for development
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: 'ok', message: 'Mock API is available for development' })
        };
      }
    } catch (error: any) {
      return {
        ok: false,
        status: 500,
        json: async () => ({ status: 'error', message: `API status check failed: ${error.message}` })
      };
    }
  },
  
  // Check server status
  async checkServer(): Promise<ApiResponse<StatusResponse>> {
    try {
      // Try to connect to Appwrite
      try {
        // Just check if we can access Appwrite account API
        await account.get();
        
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: 'ok', message: 'Server is running normally' })
        };
      } catch (error) {
        console.error('Server check error:', error);
        
        // Fallback for development
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: 'ok', message: 'Development mode: simulated server is available' })
        };
      }
    } catch (error: any) {
      return {
        ok: false,
        status: 500,
        json: async () => ({ status: 'error', message: `Server check failed: ${error.message}` })
      };
    }
  }
}; 