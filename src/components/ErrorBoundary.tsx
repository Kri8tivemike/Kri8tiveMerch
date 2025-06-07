import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorPage from './ErrorPage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log to analytics or monitoring service
    if (import.meta.env.PROD) {
      // In production, we might want to log this to a service
      // Example: Sentry.captureException(error);
    }
  }
  
  public resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      const isSchemaError = this.state.error?.message.includes('Unknown attribute') || 
                            this.state.error?.message.includes('document structure') || 
                            this.state.error?.message.includes('Invalid schema');
      
      // Determine if schema fix utilities are available
      const canFixSchema = typeof window !== 'undefined' && 
                           'fixCustomizationSchema' in window;
      
      return (
        <ErrorPage
          title={isSchemaError ? "Database Schema Error" : "Something went wrong"}
          message={
            isSchemaError 
              ? "We encountered an issue with the database schema, which might be due to recent updates or migration."
              : "An unexpected error occurred. Our team has been notified."
          }
          error={this.state.error || undefined}
          showHome={true}
          showFix={isSchemaError && canFixSchema}
          onFix={async () => {
            try {
              if (typeof window !== 'undefined' && 'fixCustomizationSchema' in window) {
                await (window as any).fixCustomizationSchema();
                // Reset the error state after fixing
                setTimeout(() => {
                  this.resetError();
                  window.location.reload();
                }, 1500);
              }
            } catch (error) {
              console.error('Failed to fix schema:', error);
              alert('Could not fix the schema automatically. Please contact support.');
            }
          }}
          fixText="Fix Database Schema"
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
