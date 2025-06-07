import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { logError, ErrorSeverity, ErrorCategory } from '../utils/errorHandler';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export function RouteError() {
  const error = useRouteError();
  
  useEffect(() => {
    // Log the route error
    logError(
      error instanceof Error ? error : 'Route error occurred',
      ErrorSeverity.ERROR,
      ErrorCategory.UI,
      {
        component: 'RouteError',
        action: 'routeError',
        additionalData: { error }
      }
    );
  }, [error]);
  
  // Extract error details
  let errorMessage = 'An unexpected error occurred';
  let errorStatus = '';
  
  if (isRouteErrorResponse(error)) {
    errorStatus = `${error.status}`;
    errorMessage = error.statusText || errorMessage;
    
    // Handle common HTTP errors
    if (error.status === 404) {
      errorMessage = 'The page you are looking for could not be found.';
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission to access this page.';
    } else if (error.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          
          {errorStatus && (
            <h1 className="mt-3 text-3xl font-extrabold text-gray-900">{errorStatus}</h1>
          )}
          
          <h2 className="mt-3 text-lg font-medium text-gray-900">Page Error</h2>
          <p className="mt-2 text-sm text-gray-500">{errorMessage}</p>
          
          {/* Show error details in development */}
          {import.meta.env.DEV && error instanceof Error && error.stack && (
            <div className="mt-4 p-4 bg-red-50 rounded-md text-left">
              <p className="text-sm font-medium text-red-800">{error.toString()}</p>
              <pre className="mt-2 text-xs overflow-auto max-h-40 bg-gray-100 p-2 rounded">
                {error.stack}
              </pre>
            </div>
          )}
          
          <div className="mt-6 flex justify-center space-x-4">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Homepage
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
