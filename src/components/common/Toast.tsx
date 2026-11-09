import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// Global Event Dispatcher for Toast
export const showToast = (message: string, type: ToastType = 'info', duration: number = 4000) => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('osera-toast', {
      detail: { id: Math.random().toString(36).substring(2, 9), message, type, duration }
    });
    window.dispatchEvent(event);
  }
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const { dir } = useLanguage();

  useEffect(() => {
    const handleToast = (e: any) => {
      const newToast: ToastMessage = e.detail;
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, newToast.duration || 4000);
    };

    window.addEventListener('osera-toast', handleToast);
    return () => window.removeEventListener('osera-toast', handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-20 sm:bottom-6 end-4 sm:end-6 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100%-2rem)] sm:w-full pointer-events-none pb-safe"
      dir={dir}
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border backdrop-blur-md flex items-center justify-between gap-3 animate-slide-up transition-all ${
              isSuccess
                ? 'bg-slate-950/95 text-white border-emerald-500/40'
                : isError
                ? 'bg-slate-950/95 text-white border-rose-500/40'
                : isWarning
                ? 'bg-slate-950/95 text-white border-amber-500/40'
                : 'bg-slate-950/95 text-white border-sky-500/40'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {isWarning && <AlertCircle className="w-5 h-5 text-amber-400" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-sky-400" />}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug break-words">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
