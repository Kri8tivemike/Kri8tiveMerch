/**
 * Type definitions for Paystack
 */

interface PaystackResponse {
  reference: string;
  status: string;
  trans: string;
  message: string;
  transaction: string;
  trxref: string;
}

interface PaystackPopSetupOptions {
  key: string;
  email: string;
  amount: number;
  ref?: string;
  metadata?: {
    custom_fields?: Array<{
      display_name: string;
      variable_name: string;
      value: string;
    }>;
    [key: string]: any;
  };
  currency?: string;
  callback?: (response: PaystackResponse) => void;
  onClose?: () => void;
  [key: string]: any;
}

interface PaystackPop {
  setup(options: PaystackPopSetupOptions): {
    openIframe(): void;
  };
}

declare global {
  interface Window {
    PaystackPop?: PaystackPop;
  }
} 