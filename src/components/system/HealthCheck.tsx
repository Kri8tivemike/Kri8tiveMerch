import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';
import { account, databases, storage } from '../../lib/appwrite';

interface HealthCheckResult {
  database: boolean;
  storage: boolean;
  auth: boolean;
  error?: string;
}

/**
 * Checks the health of Appwrite services
 * @returns Promise<HealthCheckResult> Health status of all services
 */
const checkAppwriteHealth = async (): Promise<HealthCheckResult> => {
  const result: HealthCheckResult = {
    database: false,
    storage: false,
    auth: false
  };

  try {
    // Check authentication service
    try {
      await account.get();
      result.auth = true;
    } catch (error: any) {
      // If user is not logged in, auth service is still working
      if (error.code === 401) {
        result.auth = true;
      } else {
        console.warn('Auth service check failed:', error.message);
        result.auth = false;
      }
    }

    // Check database service
    try {
      const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
          // Check role-based collections (customers, shop_managers, super_admins)
    await databases.listDocuments(databaseId, 'customers');
      result.database = true;
    } catch (error: any) {
      console.warn('Database service check failed:', error.message);
      result.database = false;
    }

    // Check storage service
    try {
      await storage.listFiles('default');
      result.storage = true;
    } catch (error: any) {
      // Storage might not have a default bucket, but if we get a 404, service is working
      if (error.code === 404) {
        result.storage = true;
      } else {
        console.warn('Storage service check failed:', error.message);
        result.storage = false;
      }
    }

  } catch (error: any) {
    result.error = error.message;
    console.error('Health check failed:', error);
  }

  return result;
};

export default function HealthCheck() {
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const result = await checkAppwriteHealth();
        setHealth(result);
      } catch (error) {
        console.error('Health check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  if (loading) {
    return (
      <Alert className="max-w-lg mx-auto mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Checking System Health</AlertTitle>
        <AlertDescription>Please wait...</AlertDescription>
      </Alert>
    );
  }

  if (!health) {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Health Check Failed</AlertTitle>
        <AlertDescription>Unable to determine system health</AlertDescription>
      </Alert>
    );
  }

  const allHealthy = health.database && health.storage && health.auth;

  return (
    <Alert 
      variant={allHealthy ? 'default' : 'destructive'} 
      className={`max-w-lg mx-auto mt-4 ${allHealthy ? 'bg-green-50' : ''}`}
    >
      {allHealthy ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      <AlertTitle className={allHealthy ? 'text-green-600' : ''}>
        Appwrite System Health Status
      </AlertTitle>
      <AlertDescription className={allHealthy ? 'text-green-700' : ''}>
        <ul className="mt-2 space-y-1">
          <li>Database: {health.database ? '✅' : '❌'}</li>
          <li>Storage: {health.storage ? '✅' : '❌'}</li>
          <li>Authentication: {health.auth ? '✅' : '❌'}</li>
          {health.error && <li className="text-red-600">Error: {health.error}</li>}
        </ul>
      </AlertDescription>
    </Alert>
  );
} 