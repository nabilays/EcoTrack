import React from 'react';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';

interface DataErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export const DataErrorBanner: React.FC<DataErrorBannerProps> = ({ message, onRetry }) => (
  <div
    className="flex flex-col items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center"
    role="alert"
  >
    <div className="flex items-start gap-3">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
      <div>
        <p className="text-sm font-semibold text-red-900">Gagal Mengambil Data</p>
        <p className="text-xs text-red-800">{message}</p>
      </div>
    </div>
    <button
      type="button"
      onClick={onRetry}
      className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-100 whitespace-nowrap shrink-0"
    >
      <RefreshCw className="h-3.5 w-3.5" />
      <span>Coba Lagi</span>
    </button>
  </div>
);

interface EmptyStatePanelProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyStatePanel: React.FC<EmptyStatePanelProps> = ({
  title,
  description,
  action,
}) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#CFDAD2] bg-[#FAFBF9] px-6 py-10 text-center">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EDF2EE] text-[#2D6A4F]">
      <Inbox className="h-5 w-5" />
    </div>
    <p className="mt-3 text-sm font-semibold text-[#14201A]">{title}</p>
    <p className="mt-1 max-w-md text-xs leading-relaxed text-[#55665C]">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);
