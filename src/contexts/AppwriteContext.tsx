import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/appwrite';
import { Models } from 'appwrite';

type AppwriteUser = Models.User<Models.Preferences>;

type AppwriteContextType = {
  user: AppwriteUser | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  signOut: () => Promise<{ success: boolean; error?: any }>;
  createAccount: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: any }>;
  updateName: (name: string) => Promise<{ success: boolean; error?: any }>;
  updateEmail: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  updatePassword: (password: string, oldPassword: string) => Promise<{ success: boolean; error?: any }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: any }>;
  completePasswordRecovery: (userId: string, secret: string, password: string) => Promise<{ success: boolean; error?: any }>;
};

const AppwriteContext = createContext<AppwriteContextType | undefined>(undefined);

export const AppwriteProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppwriteUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check for existing session
        const { success, data } = await authService.getCurrentUser();
        if (success && data) {
          console.log('✅ Session restored successfully for user:', data.email);
          setUser(data);
        } else {
          console.log('🔑 No active session found');
          setUser(null);
        }
      } catch (err) {
        console.log('🔑 Session check failed:', err);
        // Don't set error for normal session expiry
        if (err instanceof Error && err.message.includes('401')) {
          setUser(null);
        } else {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        setLoading(false);
      }
    };

    // Small delay to ensure Appwrite SDK is ready
    const timer = setTimeout(checkUser, 100);
    return () => clearTimeout(timer);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await authService.signIn(email, password);
      if (result.success) {
        const userResult = await authService.getCurrentUser();
        if (userResult.success && userResult.data) {
          setUser(userResult.data);
        }
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const result = await authService.signOut();
      if (result.success) {
        setUser(null);
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const result = await authService.createAccount(email, password, name);
      if (result.success) {
        const userResult = await authService.getCurrentUser();
        if (userResult.success && userResult.data) {
          setUser(userResult.data);
        }
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const updateName = async (name: string) => {
    try {
      setLoading(true);
      const result = await authService.updateName(name);
      if (result.success && result.data) {
        setUser(result.data);
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const updateEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await authService.updateEmail(email, password);
      if (result.success && result.data) {
        setUser(result.data);
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (password: string, oldPassword: string) => {
    try {
      setLoading(true);
      const result = await authService.updatePassword(password, oldPassword);
      if (result.success && result.data) {
        setUser(result.data);
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      const result = await authService.forgotPassword(email);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const completePasswordRecovery = async (userId: string, secret: string, password: string) => {
    try {
      setLoading(true);
      const result = await authService.completePasswordRecovery(userId, secret, password);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppwriteContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signOut,
        createAccount,
        updateName,
        updateEmail,
        updatePassword,
        forgotPassword,
        completePasswordRecovery,
      }}
    >
      {children}
    </AppwriteContext.Provider>
  );
};

export const useAppwrite = () => {
  const context = useContext(AppwriteContext);
  if (context === undefined) {
    throw new Error('useAppwrite must be used within an AppwriteProvider');
  }
  return context;
}; 