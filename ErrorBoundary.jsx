import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center fade-in">
          <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center mb-6">
            <AlertTriangle size={40} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Щось пішло не так</h2>
          <p className="text-[var(--color-text-secondary)] mb-6 max-w-md">
            Під час завантаження сторінки виникла помилка. Спробуйте оновити сторінку.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="btn-primary"
            >
              <RefreshCw size={16} /> Спробувати знову
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="btn-secondary"
            >
              На головну
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
