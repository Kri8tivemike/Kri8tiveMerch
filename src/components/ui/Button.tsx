import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ 
  variant = 'primary', 
  size = 'md',
  children, 
  className = '',
  type = 'button',
  isLoading = false,
  disabled,
  ...props 
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-primary-gold text-black focus:ring-primary-gold shadow-sm',
    secondary: 'bg-primary-emerald text-white focus:ring-primary-emerald',
    outline: 'bg-transparent border border-primary-gold text-primary-gold focus:ring-primary-gold',
    danger: 'bg-red-600 text-white focus:ring-red-500 shadow-sm',
    success: 'bg-green-600 text-white focus:ring-green-500 shadow-sm'
  };

  const sizes = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-8 py-2.5 text-sm',
    lg: 'px-10 py-3 text-base'
  };

  return (
    <button 
      ref={ref}
      type={type}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});