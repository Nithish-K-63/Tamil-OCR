import React from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('TamilOCR ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F5F2EB] dark:bg-[#120E17] text-[#1A1523] dark:text-[#F5F2EB] font-english">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl border bg-white dark:bg-[#1D1726] border-[#DFD7C7] dark:border-[#2C2237] shadow-lg text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif">Something went wrong</h2>
              <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] mt-1">
                The application encountered an unexpected display error.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-3 rounded-lg bg-black/5 dark:bg-white/5 text-left text-xs font-mono text-rose-700 dark:text-rose-300 break-words max-h-32 overflow-y-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl border border-[#DFD7C7] dark:border-[#2C2237] text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-xl bg-[#00737D] text-white text-xs font-semibold shadow-md shadow-[#00737D]/20 hover:bg-[#005F67] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
