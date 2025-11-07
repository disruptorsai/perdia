import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 * Prevents entire app from crashing when a component errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1
    });

    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Call optional onReset callback
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI from props
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                {this.props.errorMessage || "An unexpected error occurred in this section."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Show error details in development */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Error Details:</p>
                    <p className="text-xs text-gray-600 font-mono break-all">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          Stack trace
                        </summary>
                        <pre className="text-xs text-gray-600 mt-2 overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button onClick={this.handleReset} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>

                  {this.state.errorCount > 2 && (
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = '/'}
                    >
                      Go to Dashboard
                    </Button>
                  )}
                </div>

                {/* Helpful message */}
                <p className="text-sm text-gray-500">
                  If this problem persists, try refreshing the page or contact support.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
