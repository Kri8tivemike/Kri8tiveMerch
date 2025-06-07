/**
 * Error handling utility for the application
 * Provides structured error logging and handling
 */

// Error severity levels
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Error categories
export enum ErrorCategory {
  AUTH = 'authentication',
  NETWORK = 'network',
  VALIDATION = 'validation',
  DATABASE = 'database',
  UI = 'ui',
  UNKNOWN = 'unknown'
}

// Error context interface
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

/**
 * Log an error with structured metadata
 */
export function logError(
  error: Error | string,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  category: ErrorCategory = ErrorCategory.UNKNOWN,
  context: ErrorContext = {}
) {
  // Create structured error object
  const errorObject = {
    message: typeof error === 'string' ? error : error.message,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    severity,
    category,
    ...context
  };

  // Log to console with appropriate styling based on severity
  const consoleStyles = {
    [ErrorSeverity.INFO]: 'color: #2563EB; font-weight: bold;',
    [ErrorSeverity.WARNING]: 'color: #F59E0B; font-weight: bold;',
    [ErrorSeverity.ERROR]: 'color: #DC2626; font-weight: bold;',
    [ErrorSeverity.CRITICAL]: 'color: #7F1D1D; background: #FECACA; font-weight: bold; padding: 2px 5px;'
  };

  // Log with appropriate console method
  if (severity === ErrorSeverity.INFO) {
    console.info(`%c${category.toUpperCase()}`, consoleStyles[severity], errorObject);
  } else if (severity === ErrorSeverity.WARNING) {
    console.warn(`%c${category.toUpperCase()}`, consoleStyles[severity], errorObject);
  } else {
    console.error(`%c${category.toUpperCase()}`, consoleStyles[severity], errorObject);
  }

  // In production, you could send this to a logging service
  if (import.meta.env.PROD) {
    // Example: send to a logging service
    // sendToLoggingService(errorObject);
  }

  return errorObject;
}

/**
 * Handle an authentication error
 */
export function handleAuthError(error: Error | string, context: ErrorContext = {}) {
  return logError(error, ErrorSeverity.ERROR, ErrorCategory.AUTH, context);
}

/**
 * Handle a network error
 */
export function handleNetworkError(error: Error | string, context: ErrorContext = {}) {
  return logError(error, ErrorSeverity.ERROR, ErrorCategory.NETWORK, context);
}

/**
 * Handle a validation error
 */
export function handleValidationError(error: Error | string, context: ErrorContext = {}) {
  return logError(error, ErrorSeverity.WARNING, ErrorCategory.VALIDATION, context);
}

/**
 * Format error message for user display
 * Converts technical errors to user-friendly messages
 */
export function formatErrorForUser(error: Error | string): string {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Map technical error messages to user-friendly ones
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  
  if (errorMessage.includes('timeout')) {
    return 'The request timed out. Please try again later.';
  }
  
  if (errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
    return 'This email is already registered. Please use a different email or try signing in.';
  }
  
  if (errorMessage.includes('invalid credentials') || errorMessage.includes('incorrect password')) {
    return 'The email or password you entered is incorrect. Please try again.';
  }
  
  if (errorMessage.includes('password') && (errorMessage.includes('weak') || errorMessage.includes('requirements'))) {
    return 'Your password does not meet the security requirements. Please use a stronger password.';
  }
  
  if (errorMessage.includes('not confirmed')) {
    return 'Your email address has not been confirmed. Please check your inbox for a verification email.';
  }
  
  // Default user-friendly message for unhandled errors
  if (errorMessage.includes('Failed to create user profile')) {
    return 'We couldn\'t create your account. This could be because the email is already in use or there was a server issue.';
  }
  
  // Default fallback for unknown errors
  return 'An unexpected error occurred. Please try again later or contact support if the problem persists.';
}

/**
 * Global error handler for unexpected errors
 */
export function setupGlobalErrorHandler() {
  if (typeof window !== 'undefined') {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      logError(
        event.reason || 'Unhandled Promise Rejection',
        ErrorSeverity.ERROR,
        ErrorCategory.UNKNOWN,
        { action: 'unhandledRejection' }
      );
    });

    // Handle uncaught exceptions
    window.addEventListener('error', (event) => {
      logError(
        event.error || event.message,
        ErrorSeverity.ERROR,
        ErrorCategory.UNKNOWN,
        { action: 'uncaughtException' }
      );
    });
  }
}

// Initialize global error handler
setupGlobalErrorHandler(); 