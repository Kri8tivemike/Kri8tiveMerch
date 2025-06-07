import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  error: string | null;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  if (!error) return null;

  return (
    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-medium text-red-900 dark:text-red-100">Error</h3>
          <p className="text-sm text-red-700 dark:text-red-200 mt-1">{error}</p>
        </div>
      </div>
    </div>
  );
}; 