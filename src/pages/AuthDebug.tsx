import { useState } from 'react';
import appwriteDebug from '../utils/debugTools';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loader2, AlertTriangle, InfoIcon, CheckCircle, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { account, databases } from '../lib/appwrite';

export default function AuthDebug() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [diagnosticOutput, setDiagnosticOutput] = useState<string[]>([]);

  const handleCheckUserStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter an email address');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    setDiagnosticOutput([]);
    
    try {
      // Store console logs
      const logs: string[] = [];
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      
      console.log = (...args) => {
        originalConsoleLog(...args);
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      };
      
      console.error = (...args) => {
        originalConsoleError(...args);
        logs.push('ERROR: ' + args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      };
      
      // Get user status info
      const status: any = {
        userFound: false,
        profile: null,
        diagnosis: '',
        permissions: {}
      };
      
      // Check if current user is logged in
      const currentUser = await account.get().catch(() => null);
      
      if (currentUser && currentUser.email === email) {
        status.userFound = true;
        status.diagnosis = 'User is logged in and active.';
        
        // Check if we can access role-based collections
        try {
          const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
          
          // Try to find user in role-based collections
          let profile = null;
          const collections = ['super_admins', 'shop_managers', 'customers'];
          
          for (const collectionId of collections) {
            try {
              const docs = await databases.listDocuments(
                databaseId,
                collectionId,
                [`user_id=${currentUser.$id}`]
              );
              if (docs.documents.length > 0) {
                profile = docs.documents[0];
                break;
              }
            } catch (err) {
              // Continue to next collection
            }
          }
          
          if (profile) {
            status.profile = profile;
            status.diagnosis += ' Profile found in database.';
          } else {
            status.diagnosis += ' No profile found in database yet.';
          }
        } catch (err) {
          status.diagnosis += ' Unable to access profile data due to permissions.';
        }
      } else {
        status.diagnosis = 'The email is not currently logged in. Please log in with this account to see complete status.';
      }
      
      // Run diagnostic on collections access
      await appwriteDebug.diagnoseAppwrite();
      
      // Restore console
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      
      setDiagnosticOutput(logs);
      setResult(status);
    } catch (err) {
      console.error('Error checking user status:', err);
      setError('An error occurred while checking user status');
    } finally {
      setLoading(false);
    }
  };

  const handleFixPermissions = async () => {
    setLoading(true);
    setError(null);
    setDiagnosticOutput([]);
    
    try {
      // Store console logs
      const logs: string[] = [];
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      
      console.log = (...args) => {
        originalConsoleLog(...args);
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      };
      
      console.error = (...args) => {
        originalConsoleError(...args);
        logs.push('ERROR: ' + args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      };
      
      // Run permission fix helper
      await appwriteDebug.fixPermissionIssues();
      
      // Restore console
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      
      setDiagnosticOutput(logs);
    } catch (err) {
      console.error('Error fixing permissions:', err);
      setError('An error occurred while fixing permissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Appwrite Diagnostics
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Check account status and fix common issues
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Information about Appwrite limitations */}
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-md flex">
            <InfoIcon className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Appwrite Account Check</p>
              <p className="text-sm mt-1">
                Due to Appwrite security limitations, you can only check your own account status when logged in. 
                Use these tools to diagnose common issues.
              </p>
            </div>
          </div>

          {user ? (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-md flex">
              <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Logged In</p>
                <p className="text-sm mt-1">
                  You are logged in as: <strong>{user.email}</strong>
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded-md flex">
              <AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Not Logged In</p>
                <p className="text-sm mt-1">
                  You are not currently logged in. For best results, log in with the account you want to check.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <form onSubmit={handleCheckUserStatus} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                isLoading={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Checking...
                  </>
                ) : (
                  'Check Account Status'
                )}
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Or fix permission issues
                </span>
              </div>
            </div>
            
            <Button 
              onClick={handleFixPermissions}
              className="w-full" 
              variant="outline"
              disabled={loading || !user}
            >
              <Lock className="h-4 w-4 mr-2" />
              Fix Collection Permissions
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}

          {diagnosticOutput.length > 0 && (
            <div className="mt-6 border dark:border-gray-700 rounded-md overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Diagnostic Output</h3>
              </div>
              <div className="px-4 py-3 bg-white dark:bg-gray-800">
                <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto max-h-60 dark:text-gray-300">
                  {diagnosticOutput.map((log, i) => (
                    <div key={i} className={log.startsWith('ERROR') ? 'text-red-500' : ''}>{log}</div>
                  ))}
                </pre>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <div className="border dark:border-gray-700 rounded-md overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">User Status</h3>
                </div>
                <div className="px-4 py-3 bg-white dark:bg-gray-800">
                  <p className="text-sm text-gray-900 dark:text-gray-300">
                    <span className="font-medium">Found:</span> {result.userFound ? 'Yes' : 'No'}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-gray-300">
                    <span className="font-medium">Diagnosis:</span> {result.diagnosis}
                  </p>
                </div>
              </div>

              {result.profile && (
                <div className="border dark:border-gray-700 rounded-md overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Data</h3>
                  </div>
                  <div className="px-4 py-3 bg-white dark:bg-gray-800">
                    <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto max-h-40 dark:text-gray-300">
                      {JSON.stringify(result.profile, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 