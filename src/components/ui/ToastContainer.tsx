import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useEcoTrack } from '../../context/EcoTrackContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useEcoTrack();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-2.5 rounded-xl border bg-white px-4 py-3 shadow-lg ${
            toast.type === 'error'
              ? 'border-red-200 text-red-900'
              : toast.type === 'success'
                ? 'border-[#C5D6CA] text-[#14201A]'
                : 'border-[#D8E2DC] text-[#14201A]'
          }`}
          role="status"
        >
          {toast.type === 'success' && (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#15803D]" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          )}
          {toast.type === 'info' && (
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2D6A4F]" />
          )}
          <p className="flex-1 text-sm leading-snug">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="rounded p-1 text-[#55665C] hover:bg-[#EDF2EE] hover:text-[#14201A]"
            aria-label="Tutup notifikasi"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
