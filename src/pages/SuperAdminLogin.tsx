import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { databases, testConnection as testAppwriteConnection } from '../lib/appwrite';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { Lock, LogIn, ShieldAlert, AlertCircle, Loader2, RefreshCw, BookOpen } from 'lucide-react';

export default function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>(null);
  const [showSetupInfo, setShowSetupInfo] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, signIn, refreshProfile } = useAuth();
  
  // Redirect authenticated super admins away from login page
  useEffect(() => {
    if (user && profile && profile.role === 'super_admin') {
      console.log('User already authenticated as super admin, redirecting to dashboard...');
      navigate('/super-admin', { replace: true });
    }
  }, [user, profile, navigate]);
  
  // Check connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log('Checking Appwrite connection...');
        
        // First check if environment variables are set
        const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
        const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
        const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        
        if (!endpoint || !projectId || !databaseId) {
          const missingVars = [];
          if (!endpoint) missingVars.push('VITE_APPWRITE_ENDPOINT');
          if (!projectId) missingVars.push('VITE_APPWRITE_PROJECT_ID');
          if (!databaseId) missingVars.push('VITE_APPWRITE_DATABASE_ID');
          
          const errorMsg = `Missing environment variables: ${missingVars.join(', ')}. Please create a .env file with the required Appwrite configuration. See ENVIRONMENT_SETUP.md for details.`;
          console.error('❌ Environment configuration error:', errorMsg);
          setError(errorMsg);
          
          toast({
            title: "Configuration Error",
            description: "Missing environment variables. Check console for details.",
            variant: "destructive"
          });
          return;
        }
        
        const isConnected = await testAppwriteConnection();
        
        if (isConnected) {
          console.log('Appwrite connection successful!');
          toast({
            title: "Connection Verified",
            description: "Successfully connected to Appwrite",
          });
        } else {
          console.error('Connection test failed');
          setError('Appwrite connection error: Could not connect to the server');
        }
      } catch (err: any) {
        console.error('Connection check error:', err);
        setError(`Connection error: ${err.message}`);
      }
    };
    
    checkConnection();
  }, [toast]);
  
  // Add timeout to prevent infinite loading state
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (loading) {
      timeoutId = setTimeout(() => {
        setLoading(false);
        setError('Login timed out. Please check your Appwrite connection and try again.');
        
        toast({
          title: "Login Timeout",
          description: "Connection to Appwrite timed out. Check console for details.",
          variant: "destructive"
        });
        
        console.error('Authentication timed out. Please check:');
        console.error('1. Your Appwrite server is running');
        console.error('2. API keys in .env match those from Appwrite');
        console.error('3. No CORS issues are blocking requests');
      }, 10000); // 10 second timeout
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, toast]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDebug(null);
    
    try {
      console.log('Attempting login with AuthContext...');
      
      // Use AuthContext signIn method with super_admin role validation
      const result = await signIn(email, password, 'super_admin');
      
      if (!result.success) {
        throw result.error || new Error('Authentication failed');
      }
      
      console.log('Authentication successful, refreshing profile...');
      
      // Refresh the profile to ensure AuthContext has the latest data
      await refreshProfile();
      
      console.log('Profile refreshed, navigating to dashboard...');
      toast({
        title: "Login Successful",
        description: "Welcome to the SuperAdmin Portal",
      });
      
      // Small delay to ensure AuthContext is updated before navigation
      setTimeout(() => {
        navigate('/super-admin');
      }, 100);
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Determine if this is a network/connection error
      const isConnectionError = error.message?.includes('network') || 
                                error.message?.includes('fetch') || 
                                error.message?.includes('timeout') ||
                                error.message?.includes('connection');
      
      if (isConnectionError) {
        const appwriteUrl = import.meta.env.VITE_APPWRITE_ENDPOINT || '';
        const isLocalInstance = appwriteUrl.includes('localhost') || appwriteUrl.includes('127.0.0.1');
        
        if (isLocalInstance) {
          setError(
            `Local Appwrite connection error. Make sure your Appwrite server is running at ${appwriteUrl} and check your browser's console for more details. ` +
            `CORS issues are common with local development - try using Chrome or disabling CORS protection temporarily.`
          );
        } else {
          setError('Connection error: ' + error.message);
        }
      } else if (error.message?.includes('Invalid credentials')) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else {
        setError(error.message || "Invalid credentials");
      }
      
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDebugLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Test database connection first
      const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
      
      try {
        // Try to list documents from the super_admins collection to test connection
        await databases.listDocuments(databaseId, 'super_admins', []);
        console.log('Database connection successful - super_admins collection accessible');
      } catch (err: any) {
        if (err.code === 404) {
          console.log('super_admins collection not found but connection successful');
        } else {
          throw new Error(`Database connection failed: ${err.message}`);
        }
      }
      
      toast({
        title: "Connection Test Successful",
        description: "Successfully connected to Appwrite services",
      });
      
      // Toggle setup info visibility
      setShowSetupInfo(!showSetupInfo);
      
    } catch (error: any) {
      console.error('Debug login error:', error);
      setError(`Connection test failed: ${error.message}`);
      
      toast({
        title: "Connection Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl">
        {/* Header Section */}
        <div className="bg-black p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white bg-opacity-10">
            <ShieldAlert className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-white">SuperAdmin Portal</h2>
          <p className="mt-1 text-sm text-gray-300">Secure access for system administrators</p>
        </div>
        
        {/* Form Section */}
        <div className="p-8">
          <div className="mb-6 flex items-center justify-center space-x-2 rounded-md bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-400">
            <Lock className="h-4 w-4" />
            <p>Authentication required for restricted area</p>
          </div>
          
          {error && (
            <div className="mb-6 flex items-start space-x-2 rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-400">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Connection Failed</p>
                <p className="mt-1">{error}</p>
                {error.includes('Missing environment variables') && (
                  <div className="mt-2 text-xs bg-red-100 dark:bg-red-900/30 p-2 rounded">
                    <p className="font-semibold">🚨 Environment Setup Required:</p>
                    <ol className="list-decimal ml-4 mt-1 space-y-1">
                      <li>Create a <code>.env</code> file in your project root</li>
                      <li>Add the required Appwrite configuration variables</li>
                      <li>Check <code>ENVIRONMENT_SETUP.md</code> for complete setup guide</li>
                      <li>Restart your development server after creating .env</li>
                    </ol>
                    <div className="mt-2 p-2 bg-gray-800 text-gray-200 rounded text-xs font-mono">
                      <div>VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1</div>
                      <div>VITE_APPWRITE_PROJECT_ID=67ea2c3b00309b589901</div>
                      <div>VITE_APPWRITE_DATABASE_ID=kri8tive_db</div>
                    </div>
                  </div>
                )}
                {error.includes('local') && (
                  <div className="mt-2 text-xs bg-red-100 dark:bg-red-900/30 p-2 rounded">
                    <p className="font-semibold">Try these solutions:</p>
                    <ol className="list-decimal ml-4 mt-1 space-y-1">
                      <li>Check your Appwrite server is running</li>
                      <li>Check API keys in your .env file</li>
                      <li>Try using Chrome browser</li>
                      <li>Restart your application</li>
                    </ol>
                  </div>
                )}
                {error.includes('Failed to fetch') && !error.includes('Missing environment variables') && (
                  <div className="mt-2 text-xs bg-red-100 dark:bg-red-900/30 p-2 rounded">
                    <p className="font-semibold">Network Connection Issues:</p>
                    <ol className="list-decimal ml-4 mt-1 space-y-1">
                      <li>Check your internet connection</li>
                      <li>Verify you can access https://cloud.appwrite.io</li>
                      <li>Try disabling VPN or proxy temporarily</li>
                      <li>Check if your firewall is blocking the connection</li>
                      <li>Ensure .env file exists with correct configuration</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {debug && (
            <div className="mb-6 rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-xs text-green-800 dark:text-green-400 font-mono overflow-auto max-h-40">
              <p className="font-medium text-sm mb-1">Debug Info</p>
              <pre>{JSON.stringify(debug, null, 2)}</pre>
            </div>
          )}
          
          {showSetupInfo && (
            <div className="mb-6 rounded-md bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30">
              <div className="flex items-start">
                <BookOpen className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">How to Create a Super Admin Account</h3>
                  <ol className="list-decimal ml-4 space-y-2">
                    <li>Register a normal account via the regular signup form</li>
                    <li>Verify your email address</li>
                    <li>Create a super admin profile using the Appwrite Console:
                      <ul className="list-disc ml-4 mt-1">
                        <li>Go to Database → Collections → super_admins</li>
                        <li>Create a new document with your user ID as the document ID</li>
                        <li>Set the required fields:
                          <div className="bg-gray-800 text-gray-200 dark:bg-gray-900 p-2 mt-1 rounded font-mono text-xs">
                            user_id: [your_user_id]<br/>
                            email: [your_email]<br/>
                            first_name: [your_first_name]<br/>
                            last_name: [your_last_name]<br/>
                            status: "Verified"<br/>
                            permissions: "[\"*\"]"<br/>
                            security_clearance: 5
                          </div>
                        </li>
                      </ul>
                    </li>
                    <li>Return to this login page and sign in with your credentials</li>
                  </ol>
                  <p className="mt-3 text-xs text-blue-700 dark:text-blue-400">
                    Note: This process is intentionally manual to ensure only authorized personnel can create admin accounts.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-3 shadow-sm 
                           focus:border-black focus:outline-none focus:ring-1 focus:ring-black
                           dark:bg-gray-700 dark:text-white dark:focus:border-gray-400 dark:focus:ring-gray-400"
                placeholder="admin@example.com"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-3 shadow-sm 
                           focus:border-black focus:outline-none focus:ring-1 focus:ring-black
                           dark:bg-gray-700 dark:text-white dark:focus:border-gray-400 dark:focus:ring-gray-400"
                placeholder="••••••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full transform rounded-md bg-black py-3 text-center font-medium text-white transition-all 
                         hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 
                         disabled:opacity-80 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-500"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-white mr-2" />
                  <span>Authenticating...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <LogIn className="mr-2 h-4 w-4" />
                  Access Secure Portal
                </span>
              )}
            </button>
            
            <div className="flex justify-between mt-4">
              <button
                type="button"
                onClick={handleDebugLogin}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center space-x-1"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                <span>{showSetupInfo ? "Hide Admin Guide" : "Test Connection & Show Admin Guide"}</span>
              </button>
            </div>
          </form>
          
          <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
            <p>This is a restricted area. Unauthorized access attempts will be logged and monitored.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 