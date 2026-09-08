import React from 'react';
import { useUIStore } from '../../stores/useUIStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start space-x-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300',
              toast.type === 'success' && 'border-emerald-500/30 bg-slate-900/95 text-emerald-400',
              toast.type === 'error' && 'border-rose-500/30 bg-slate-900/95 text-rose-400',
              toast.type === 'warning' && 'border-amber-500/30 bg-slate-900/95 text-amber-400',
              toast.type === 'info' && 'border-blue-500/30 bg-slate-900/95 text-blue-400'
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-400" />}
              {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-400" />}
              {toast.type === 'info' && <Info className="h-5 w-5 text-blue-400" />}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white leading-snug">{toast.title}</h4>
              {toast.description && (
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white rounded-lg p-1 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
