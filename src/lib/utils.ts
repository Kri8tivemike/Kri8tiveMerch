import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency with the specified locale and currency symbol
 * 
 * @param amount The amount to format
 * @param locale The locale to use for formatting (default: 'en-NG')
 * @param currency The currency code to use (default: 'NGN')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, locale = 'en-NG', currency = 'NGN'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
