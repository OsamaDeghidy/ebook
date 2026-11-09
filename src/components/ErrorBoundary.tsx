import React, { Component, ErrorInfo, ReactNode } from 'react';

export class ErrorBoundary extends Component<{children: ReactNode, fallback?: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className='p-6 sm:p-8 text-center text-rose-500 bg-rose-50/50 border border-rose-200 rounded-3xl m-4 max-w-lg mx-auto'>
          <h2 className='text-lg font-black mb-2 text-rose-800'>حدث خطأ غير متوقع / Something went wrong</h2>
          <p className='text-xs text-rose-600 mb-4'>تعذر تحميل هذا القسم بشكل صحيح، يرجى إعادة تحديث الصفحة.</p>
          <pre className='text-start bg-white p-3 rounded-xl text-[11px] font-mono border border-rose-100 overflow-auto max-h-32 text-slate-700' dir="ltr">{this.state.error?.message}</pre>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            إعادة تحميل الصفحة / Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
