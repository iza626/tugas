import React from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { CheckCircle2, AlertTriangle, Info, XCircle, X, Radio } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast, isConnected } = useRealtime();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {/* Live sync pill */}
      <div className="self-end pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-300 shadow-lg">
        <Radio className={`w-3 h-3 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
        <span>{isConnected ? 'Database Realtime Aktif' : 'Menghubungkan Database...'}</span>
      </div>

      {toasts.map((toast) => {
        let borderClass = 'border-blue-500/30 bg-slate-900/95 text-white';
        let Icon = Info;
        let iconColor = 'text-blue-400';

        if (toast.type === 'success') {
          borderClass = 'border-emerald-500/40 bg-slate-900/95 text-white';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-400';
        } else if (toast.type === 'warning') {
          borderClass = 'border-amber-500/40 bg-slate-900/95 text-white';
          Icon = AlertTriangle;
          iconColor = 'text-amber-400';
        } else if (toast.type === 'error') {
          borderClass = 'border-rose-500/40 bg-slate-900/95 text-white';
          Icon = XCircle;
          iconColor = 'text-rose-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all transform duration-200 animate-in fade-in slide-in-from-top-2 ${borderClass}`}
          >
            <div className={`mt-0.5 p-1 rounded-lg bg-slate-800 ${iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-100 truncate">{toast.title}</h4>
                <span className="text-[10px] text-slate-400 font-mono">{toast.timestamp}</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
