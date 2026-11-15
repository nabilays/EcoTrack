import { WasteType } from '../types';

export function formatWeight(kg: number): string {
  return `${kg.toLocaleString('id-ID', {
    minimumFractionDigits: kg % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  })} kg`;
}

export function formatNumber(val: number): string {
  return val.toLocaleString('id-ID', {
    minimumFractionDigits: val % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  });
}

export function formatDateId(dateStr: string): string {
  if (!dateStr) return '-';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTimeId(isoStr: string): string {
  if (!isoStr) return '-';
  const parsed = new Date(isoStr);
  if (Number.isNaN(parsed.getTime())) return isoStr;
  return parsed.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateWasteCode(prefix: string, dateStr: string, sequence: number): string {
  const cleanDate = (dateStr || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  const seq = String(sequence).padStart(3, '0');
  return `${prefix}-${cleanDate}-${seq}`;
}

export function generateCategoryCode(type: WasteType, sequence: number): string {
  const typeTag = type === WasteType.ORGANIK ? 'ORG' : 'ANO';
  return `KAT-${typeTag}-${String(sequence).padStart(2, '0')}`;
}

export function generateProcessingCode(prefix: string, dateStr: string, sequence: number): string {
  const cleanDate = (dateStr || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  const seq = String(sequence).padStart(3, '0');
  return `${prefix}-${cleanDate}-${seq}`;
}

export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // YYYY-MM
}

export function formatMonthShort(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
}
