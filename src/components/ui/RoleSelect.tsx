import React from 'react';
import { cn } from '../../lib/utils';

interface RoleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  className?: string;
}

export function RoleSelect({ error, className, ...props }: RoleSelectProps) {
  return (
    <select
      className={cn(
        'block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6',
        error && 'ring-red-500 focus:ring-red-500',
        className
      )}
      {...props}
    >
      <option value="">Select a role</option>
      <option value="user">My Account (Customer)</option>
      <option value="shop_manager">Shop Manager</option>
      <option value="super_admin">Super Admin</option>
    </select>
  );
}
