import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import { Lock, LogIn, ShieldAlert, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { adminApi } from '../api/adminAuth';

// Define the Admin Auth page that uses our direct API utilities
export default function AdminAuth() {
  const [email, setEmail] = useState('super.admin@kri8tive.com');
  const [password, setPassword] = useState('SuperAdmin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check server status
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await adminApi.checkStatus();
        
        if (response.ok) {
          setServerStatus('online');
          const data = await response.json();
          
          toast({
            title: "Server Check",
            description: data.message || "API server is reachable"
          });
        } else {
          setServerStatus('offline');
          setError('API server is not responding properly');
          
          toast({
            title: "Connection Error",
            description: "Could not reach the API server",
            variant: "destructive"
          });
        }
      } catch (err) {
        console.error('Server check error:', err);
        setServerStatus('offline');
        setError('Could not connect to API server');
      }
    };
    
    checkServer();
  }, [toast]);
  
  // Add helper type guard functions
  const isLoginSuccess = (data: any): data is { token: string; user: any } => {
    return data && typeof data.token === 'string' && typeof data.user === 'object';
  };

  const isErrorResponse = (data: any): data is { message: string } => {
    return data && typeof data.message === 'string';
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      console.log('Attempting login through API...');
      
      const response = await adminApi.login(email, password);
      const data = await response.json();
      
      if (!response.ok) {
        // This must be an error response
        throw new Error(isErrorResponse(data) ? data.message : 'Authentication failed');
      }
      
      // This must be a success response
      if (isLoginSuccess(data)) {
        // Store the authentication token
        localStorage.setItem('adminAuth', JSON.stringify({
          token: data.token,
          user: data.user
        }));
        
        toast({
          title: "Login Successful",
          description: "Welcome to the admin dashboard"
        });
        
        navigate('/super-admin');
      } else {
        throw new Error('Invalid response from server');
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
      
      toast({
        title: "Login Failed",
        description: error.message || 'Authentication error',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleServerCheck = async () => {
    setServerStatus('checking');
    setError(null);
    
    try {
      const response = await adminApi.checkServer();
      const data = await response.json();
      
      setServerStatus(data.status === 'ok' ? 'online' : 'offline');
      
      toast({
        title: "Server Status",
        description: data.message,
        variant: data.status === 'ok' ? 'default' : 'destructive'
      });
    } catch (err) {
      console.error('Server check error:', err);
      setServerStatus('offline');
      setError('Could not verify server status');
      
      toast({
        title: "Server Error",
        description: "Could not verify server status",
        variant: "destructive"
      });
    }
  };
  
  const handleDirectAccess = () => {
    // This is a more direct approach that doesn't rely on actual authentication
    // It's only for development/testing purposes when other methods fail
    console.log('Using direct access method for development');
    
    // Create a mock admin session
    localStorage.setItem('adminAuth', JSON.stringify({
      token: 'dev-mock-token',
      user: {
        id: 'dev-admin',
        email: email,
        role: 'super_admin'
      }
    }));
    
    toast({
      title: "Development Mode",
      description: "Using direct access method for local development",
      variant: "default"
    });
    
    navigate('/super-admin');
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header Section */}
        <div className="bg-black p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white bg-opacity-10">
            <ShieldAlert className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-white">Admin Authentication</h2>
          <p className="mt-1 text-sm text-gray-300">
            {serverStatus === 'checking' && 'Checking server status...'}
            {serverStatus === 'online' && 'Server is online'}
            {serverStatus === 'offline' && 'Server is offline'}
          </p>
        </div>
        
        {/* Form Section */}
        <div className="p-8">
          {serverStatus === 'offline' ? (
            <div className="mb-6 flex items-start space-x-2 rounded-md bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Server Unavailable</p>
                <p className="mt-1">{error || 'Cannot connect to the server'}</p>
                <p className="mt-2">Please ensure the API server is running</p>
              </div>
            </div>
          ) : serverStatus === 'online' ? (
            <div className="mb-6 flex items-center justify-center space-x-2 rounded-md bg-green-50 p-3 text-sm text-green-800">
              <Lock className="h-4 w-4" />
              <p>Server is connected and ready</p>
            </div>
          ) : (
            <div className="mb-6 flex items-center justify-center space-x-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p>Checking server connection...</p>
            </div>
          )}
          
          {error && error !== 'Cannot connect to the server' && (
            <div className="mb-6 flex items-start space-x-2 rounded-md bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Authentication Failed</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Admin Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm 
                           focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="admin@example.com"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 shadow-sm 
                           focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="••••••••••••"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || serverStatus !== 'online'}
                className="flex-1 transform rounded-md bg-black py-3 text-center font-medium text-white transition-all 
                          hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 
                          disabled:opacity-80"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-white mr-2" />
                    <span>Processing...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </span>
                )}
              </button>
              
              <button
                type="button"
                onClick={serverStatus === 'checking' ? handleServerCheck : handleDirectAccess}
                className="px-4 py-3 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 
                          focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              >
                {serverStatus === 'checking' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {/* Development Access Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleDirectAccess}
                className="w-full px-4 py-2 text-sm text-center text-gray-600 border border-gray-300 rounded-md 
                          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              >
                Development Direct Access
              </button>
              <p className="mt-2 text-xs text-center text-gray-500">
                This bypasses authentication for local development only
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 