import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-400 dark:text-green-300" />,
    error: <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-300" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-400 dark:text-yellow-300" />,
    info: <Info className="h-5 w-5 text-blue-400 dark:text-blue-300" />,
  };

  const styles = {
    success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/80 dark:text-green-100 dark:border-green-700',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/80 dark:text-red-100 dark:border-red-700',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/80 dark:text-yellow-100 dark:border-yellow-700',
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/80 dark:text-blue-100 dark:border-blue-700',
  };

  return (
    <div className={`rounded-md border p-4 ${styles[type]}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-4 flex flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            <span className="sr-only">Close</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>;
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4 w-full max-w-sm">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </div>
  );
}
