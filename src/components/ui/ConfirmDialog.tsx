import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Hapus',
  destructive = true,
}) => {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidthClass="max-w-md">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            destructive ? 'bg-red-50 text-red-700' : 'bg-[#EDF2EE] text-[#1B4332]'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
        </div>
        <p className="text-sm leading-relaxed text-[#3E4E45]">{message}</p>
      </div>
      <div className="mt-6 flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-[#D8E2DC] bg-white px-4 py-2 text-sm font-medium text-[#3E4E45] transition-colors hover:bg-[#F6F8F6] whitespace-nowrap shrink-0"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors whitespace-nowrap shrink-0 ${
            destructive
              ? 'bg-red-700 hover:bg-red-800'
              : 'bg-[#1B4332] hover:bg-[#132A1F]'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
