import { useState } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  message: string;
  type: ToastType;
  id: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now();
    const newToast: Toast = { message, type, id };
    
    setToasts(currentToasts => [...currentToasts, newToast]);

    // Automatically remove the toast after 3 seconds
    setTimeout(() => {
      setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
    }, 3000);
  };

  return { showToast, toasts };
}
