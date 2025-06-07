import { create } from 'zustand';
import { account, ID } from '../lib/appwrite';

interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  isAdmin: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const session = await account.createSession(email, password);
      const user = await account.get();
      
      set({
        user: {
          id: user.$id,
          email: user.email,
          fullName: user.name,
          role: 'user', // Default role, should be updated from profile
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to login',
        isLoading: false
      });
    }
  },

  register: async (email, password, fullName) => {
    set({ isLoading: true, error: null });
    try {
      // Create user account
      const user = await account.create(
        ID.unique(),
        email,
        password,
        fullName
      );
      
      // Create email session (login)
      await account.createSession(email, password);
      
      set({
        user: {
          id: user.$id,
          email: user.email,
          fullName: user.name,
          role: 'user',
        },
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to register',
        isLoading: false
      });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await account.deleteSession('current');
      set({ 
        user: null, 
        isAuthenticated: false, 
        isAdmin: false,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to logout',
        isLoading: false
      });
    }
  }
}));