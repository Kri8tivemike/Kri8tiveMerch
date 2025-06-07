import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCcw } from 'lucide-react';

interface ErrorPageProps {
  title?: string;
  message?: string;
  error?: Error | string;
  showHome?: boolean;
  showFix?: boolean;
  onFix?: () => void;
  fixLoading?: boolean;
  fixText?: string;
}

export default function ErrorPage({
  title = 'An Error Occurred',
  message = 'We encountered an unexpected error.',
  error,
  showHome = true,
  showFix = false,
  onFix,
  fixLoading = false,
  fixText = 'Fix Issue'
}: ErrorPageProps) {
  const errorMessage = error ? (typeof error === 'string' ? error : error.message) : '';
  const isDbSchemaError = errorMessage.includes('Unknown attribute') || 
                         errorMessage.includes('document structure') || 
                         errorMessage.includes('Invalid schema');

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 py-16">
      <div className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 w-16 h-16 rounded-full flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">{message}</p>
      
      {errorMessage && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6 max-w-2xl overflow-auto">
          <code className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
            {errorMessage}
          </code>
        </div>
      )}
      
      {isDbSchemaError && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 max-w-lg mb-6">
          <p className="text-amber-800 dark:text-amber-200 font-medium">Database Schema Error</p>
          <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
            This appears to be a database schema issue. This can happen when the schema has been modified
            or during the migration from Supabase to Appwrite.
          </p>
        </div>
      )}
      
      <div className="flex flex-wrap gap-4 justify-center">
        {showHome && (
          <Link
            to="/"
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        )}
        
        <button
          onClick={() => window.location.reload()}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Reload Page
        </button>
        
        {showFix && onFix && (
          <button
            onClick={onFix}
            disabled={fixLoading}
            className={`flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              fixLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {fixLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Fixing...
              </>
            ) : (
              <>
                <RefreshCcw className="w-4 h-4 mr-2" />
                {fixText}
              </>
            )}
          </button>
        )}
        
        {isDbSchemaError && (
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && 'fixCustomizationSchema' in window) {
                (window as any).fixCustomizationSchema();
              } else {
                alert('Schema fix utilities are not available. Please contact support.');
              }
            }}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Fix Schema Issue
          </button>
        )}
      </div>
    </div>
  );
} 