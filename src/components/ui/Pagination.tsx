import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  if (totalItems === 0) return null;
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(totalItems, currentPage * pageSize);

  return (
    <div className="flex flex-col gap-3 border-t border-[#E6ECE7] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-[#55665C] tabular-nums">
        Menampilkan <span className="font-medium text-[#14201A]">{start}</span>–
        <span className="font-medium text-[#14201A]">{end}</span> dari{' '}
        <span className="font-medium text-[#14201A]">{totalItems}</span> data
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-[#D8E2DC] bg-white px-2.5 py-1.5 text-xs font-medium text-[#3E4E45] transition-colors hover:bg-[#F6F8F6] disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Sebelumnya</span>
        </button>
        <span className="px-2 text-xs font-medium text-[#3E4E45] tabular-nums whitespace-nowrap">
          Hal {currentPage} / {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-[#D8E2DC] bg-white px-2.5 py-1.5 text-xs font-medium text-[#3E4E45] transition-colors hover:bg-[#F6F8F6] disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
        >
          <span>Berikutnya</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
