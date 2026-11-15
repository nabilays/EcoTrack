import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ProcessingRecord, WasteCategory, WasteRecord } from '../types';
import { formatDateId, formatNumber } from './formatters';

interface ExportReportPayload {
  schoolName: string;
  generatedBy: string;
  periodLabel: string;
  summary: {
    totalIntakeKg: number;
    organicKg: number;
    inorganicKg: number;
    processedKg: number;
    diversionPercent: number;
  };
  wasteRecords: WasteRecord[];
  processingRecords: ProcessingRecord[];
  categories: WasteCategory[];
}

export function exportReportToPDF(payload: ExportReportPayload): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const catMap = new Map(payload.categories.map((c) => [c.id, c.name]));
  const wasteMap = new Map(payload.wasteRecords.map((w) => [w.id, w]));

  doc.setFillColor(27, 67, 50);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('EcoTrack — Laporan Pengelolaan Sampah Sekolah', 14, 12);
  doc.setFontSize(9);
  doc.text(`${payload.schoolName} | Periode: ${payload.periodLabel}`, 14, 19);
  doc.text(`Dicetak oleh: ${payload.generatedBy} (${new Date().toLocaleDateString('id-ID')})`, 14, 24);

  doc.setTextColor(20, 32, 26);
  doc.setFontSize(11);
  doc.text('1. Ringkasan Rekapitulasi', 14, 38);

  autoTable(doc, {
    startY: 42,
    head: [['Indikator', 'Nilai']],
    body: [
      ['Total Sampah Masuk', `${formatNumber(payload.summary.totalIntakeKg)} kg`],
      ['Total Sampah Organik', `${formatNumber(payload.summary.organicKg)} kg`],
      ['Total Sampah Anorganik', `${formatNumber(payload.summary.inorganicKg)} kg`],
      ['Total Sampah Diolah', `${formatNumber(payload.summary.processedKg)} kg`],
      ['Tingkat Pengolahan', `${payload.summary.diversionPercent.toFixed(1)}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [45, 106, 79], textColor: 255, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  const afterSummaryY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.text('2. Rekapitulasi Sampah Masuk', 14, afterSummaryY);

  autoTable(doc, {
    startY: afterSummaryY + 4,
    head: [['Kode', 'Tanggal', 'Nama Sampah', 'Kategori', 'Jenis', 'Berat (kg)', 'Lokasi']],
    body: payload.wasteRecords.map((w) => [
      w.code,
      formatDateId(w.recordedAt),
      w.name,
      catMap.get(w.categoryId) || '-',
      w.type,
      formatNumber(w.weightKg),
      w.sourceLocation,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [27, 67, 50], textColor: 255, fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  const afterWasteY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  if (afterWasteY > 245) {
    doc.addPage();
  }
  const procStartY = afterWasteY > 245 ? 18 : afterWasteY;
  doc.setFontSize(11);
  doc.text('3. Rekapitulasi Pengolahan Sampah', 14, procStartY);

  autoTable(doc, {
    startY: procStartY + 4,
    head: [['Kode Olah', 'Tanggal', 'Sumber Sampah', 'Metode', 'Berat (kg)', 'Status', 'Hasil']],
    body: payload.processingRecords.map((p) => [
      p.code,
      formatDateId(p.processedAt),
      wasteMap.get(p.wasteRecordId)?.code || '-',
      p.method,
      formatNumber(p.processedWeightKg),
      p.status,
      p.result,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [64, 121, 99], textColor: 255, fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  doc.save(`EcoTrack-Laporan-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportReportToExcel(payload: ExportReportPayload): void {
  const catMap = new Map(payload.categories.map((c) => [c.id, c.name]));
  const wasteMap = new Map(payload.wasteRecords.map((w) => [w.id, w]));

  const summarySheet = XLSX.utils.json_to_sheet([
    { Indikator: 'Sekolah', Nilai: payload.schoolName },
    { Indikator: 'Periode', Nilai: payload.periodLabel },
    { Indikator: 'Total Sampah Masuk (kg)', Nilai: payload.summary.totalIntakeKg },
    { Indikator: 'Sampah Organik (kg)', Nilai: payload.summary.organicKg },
    { Indikator: 'Sampah Anorganik (kg)', Nilai: payload.summary.inorganicKg },
    { Indikator: 'Total Sampah Diolah (kg)', Nilai: payload.summary.processedKg },
    { Indikator: 'Tingkat Pengolahan (%)', Nilai: Number(payload.summary.diversionPercent.toFixed(1)) },
  ]);

  const wasteSheet = XLSX.utils.json_to_sheet(
    payload.wasteRecords.map((w) => ({
      'Kode Sampah': w.code,
      'Tanggal Pencatatan': w.recordedAt,
      'Nama Sampah': w.name,
      Kategori: catMap.get(w.categoryId) || '-',
      'Jenis Sampah': w.type,
      'Berat (kg)': w.weightKg,
      'Lokasi / Sumber': w.sourceLocation,
      'Petugas Pencatat': w.officerName,
      Keterangan: w.notes,
    }))
  );

  const processingSheet = XLSX.utils.json_to_sheet(
    payload.processingRecords.map((p) => ({
      'Kode Pengolahan': p.code,
      'Kode Sampah': wasteMap.get(p.wasteRecordId)?.code || '-',
      'Nama Sampah': wasteMap.get(p.wasteRecordId)?.name || '-',
      'Tanggal Olah': p.processedAt,
      'Berat Diolah (kg)': p.processedWeightKg,
      Metode: p.method,
      Status: p.status,
      Hasil: p.result,
      Petugas: p.officerName,
    }))
  );

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Ringkasan');
  XLSX.utils.book_append_sheet(wb, wasteSheet, 'Sampah Masuk');
  XLSX.utils.book_append_sheet(wb, processingSheet, 'Pengolahan');

  XLSX.writeFile(wb, `EcoTrack-Laporan-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
