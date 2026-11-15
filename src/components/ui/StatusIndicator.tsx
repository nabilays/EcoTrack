import React from 'react';
import { CheckCircle2, Clock, Loader2, ShieldAlert, Leaf, Recycle } from 'lucide-react';
import { ProcessingStatus, UserStatus, WasteType } from '../../types';

export const ProcessingStatusText: React.FC<{ status: ProcessingStatus }> = ({ status }) => {
  if (status === ProcessingStatus.SELESAI) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#15803D]">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        <span>Selesai</span>
      </span>
    );
  }
  if (status === ProcessingStatus.DIPROSES) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B45309]">
        <Loader2 className="h-3.5 w-3.5 shrink-0" />
        <span>Diproses</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#475569]">
      <Clock className="h-3.5 w-3.5 shrink-0" />
      <span>Menunggu</span>
    </span>
  );
};

export const WasteTypeText: React.FC<{ type: WasteType }> = ({ type }) => {
  if (type === WasteType.ORGANIK) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1B4332]">
        <Leaf className="h-3.5 w-3.5 shrink-0 text-[#2D6A4F]" />
        <span>Organik</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#365363]">
      <Recycle className="h-3.5 w-3.5 shrink-0 text-[#407963]" />
      <span>Anorganik</span>
    </span>
  );
};

export const UserStatusText: React.FC<{ status: UserStatus }> = ({ status }) => {
  if (status === UserStatus.AKTIF) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#15803D]">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        <span>Aktif</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B91C1C]">
      <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
      <span>Nonaktif</span>
    </span>
  );
};
