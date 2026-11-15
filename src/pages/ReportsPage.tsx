import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';
import { hasPermission } from '../services/apiClient';
import { ProcessingStatus, UserRole, WasteType } from '../types';
import { formatDateId, formatMonthShort, formatNumber, formatWeight, getMonthKey } from '../utils/formatters';
import { exportReportToExcel, exportReportToPDF } from '../utils/exportReports';
import { ProcessingStatusText, WasteTypeText } from '../components/ui/StatusIndicator';
import { DataErrorBanner, EmptyStatePanel } from '../components/ui/DataStateNotice';

export const ReportsPage: React.FC = () => {
  const {
    currentUser,
    dataStatus,
    dataError,
    retryLoadData,
    wasteRecords,
    processingRecords,
    categories,
    settings,
    pushToast,
  } = useEcoTrack();

  const canExport =
    hasPermission(currentUser, 'reports:full') ||
    hasPermission(currentUser, 'reports:operational');
  const isSiswa = currentUser?.role === UserRole.SISWA;

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'intake' | 'type' | 'processing'>('intake');

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const filteredWaste = useMemo(() => {
    return wasteRecords.filter((w) => {
      if (dateFrom && w.recordedAt < dateFrom) return false;
      if (dateTo && w.recordedAt > dateTo) return false;
      if (categoryFilter !== 'ALL' && w.categoryId !== categoryFilter) return false;
      return true;
    });
  }, [wasteRecords, dateFrom, dateTo, categoryFilter]);

  const filteredWasteIds = useMemo(
    () => new Set(filteredWaste.map((w) => w.id)),
    [filteredWaste]
  );

  const filteredProcessing = useMemo(() => {
    return processingRecords.filter((p) => {
      if (dateFrom && p.processedAt < dateFrom) return false;
      if (dateTo && p.processedAt > dateTo) return false;
      if (categoryFilter !== 'ALL' && !filteredWasteIds.has(p.wasteRecordId)) return false;
      return true;
    });
  }, [processingRecords, dateFrom, dateTo, categoryFilter, filteredWasteIds]);

  const summary = useMemo(() => {
    const totalIntakeKg = filteredWaste.reduce((acc, i) => acc + i.weightKg, 0);
    const organicKg = filteredWaste
      .filter((i) => i.type === WasteType.ORGANIK)
      .reduce((acc, i) => acc + i.weightKg, 0);
    const inorganicKg = filteredWaste
      .filter((i) => i.type === WasteType.ANORGANIK)
      .reduce((acc, i) => acc + i.weightKg, 0);
    const processedKg = filteredProcessing
      .filter((p) => p.status === ProcessingStatus.SELESAI)
      .reduce((acc, i) => acc + i.processedWeightKg, 0);
    const diversionPercent = totalIntakeKg > 0 ? (processedKg / totalIntakeKg) * 100 : 0;

    return {
      totalIntakeKg: Number(totalIntakeKg.toFixed(1)),
      organicKg: Number(organicKg.toFixed(1)),
      inorganicKg: Number(inorganicKg.toFixed(1)),
      processedKg: Number(processedKg.toFixed(1)),
      diversionPercent: Number(diversionPercent.toFixed(1)),
    };
  }, [filteredWaste, filteredProcessing]);

  const chartData = useMemo(() => {
    const map = new Map<string, { organik: number; anorganik: number; diolah: number }>();
    for (const w of filteredWaste) {
      const mk = getMonthKey(w.recordedAt);
      const curr = map.get(mk) || { organik: 0, anorganik: 0, diolah: 0 };
      if (w.type === WasteType.ORGANIK) curr.organik += w.weightKg;
      else curr.anorganik += w.weightKg;
      map.set(mk, curr);
    }
    for (const p of filteredProcessing) {
      if (p.status !== ProcessingStatus.SELESAI) continue;
      const mk = getMonthKey(p.processedAt);
      const curr = map.get(mk) || { organik: 0, anorganik: 0, diolah: 0 };
      curr.diolah += p.processedWeightKg;
      map.set(mk, curr);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mk, vals]) => ({
        label: formatMonthShort(mk),
        organik: Number(vals.organik.toFixed(1)),
        anorganik: Number(vals.anorganik.toFixed(1)),
        diolah: Number(vals.diolah.toFixed(1)),
      }));
  }, [filteredWaste, filteredProcessing]);

  const categoryBreakdown = useMemo(() => {
    return categories
      .filter((c) => categoryFilter === 'ALL' || c.id === categoryFilter)
      .map((cat) => {
        const items = filteredWaste.filter((w) => w.categoryId === cat.id);
        const totalKg = items.reduce((acc, i) => acc + i.weightKg, 0);
        return {
          category: cat,
          count: items.length,
          totalKg: Number(totalKg.toFixed(1)),
        };
      });
  }, [categories, filteredWaste, categoryFilter]);

  const periodLabel =
    dateFrom || dateTo
      ? `${dateFrom ? formatDateId(dateFrom) : 'Awal'} – ${dateTo ? formatDateId(dateTo) : 'Sekarang'}`
      : 'Semua Periode';

  const hasReportData = filteredWaste.length > 0 || filteredProcessing.length > 0;

  const handleExportPdf = () => {
    if (!currentUser) return;
    if (!hasReportData) {
      pushToast('info', 'Belum ada data aktual untuk diekspor ke PDF.');
      return;
    }
    exportReportToPDF({
      schoolName: settings.schoolName,
      generatedBy: currentUser.fullName,
      periodLabel,
      summary,
      wasteRecords: filteredWaste,
      processingRecords: filteredProcessing,
      categories,
    });
    pushToast('success', 'Laporan PDF berhasil diunduh.');
  };

  const handleExportExcel = () => {
    if (!currentUser) return;
    if (!hasReportData) {
      pushToast('info', 'Belum ada data aktual untuk diekspor ke Excel.');
      return;
    }
    exportReportToExcel({
      schoolName: settings.schoolName,
      generatedBy: currentUser.fullName,
      periodLabel,
      summary,
      wasteRecords: filteredWaste,
      processingRecords: filteredProcessing,
      categories,
    });
    pushToast('success', 'Laporan Excel (.xlsx) berhasil diunduh.');
  };

  const wasteMap = useMemo(
    () => new Map(wasteRecords.map((w) => [w.id, w])),
    [wasteRecords]
  );

  return (
    <div className="space-y-6">
      {dataStatus === 'error' && dataError && (
        <DataErrorBanner message={dataError} onRetry={retryLoadData} />
      )}

      {/* Filter & Export Bar */}
      <section className="rounded-xl border border-[#DCE4DE] bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex-1 lg:max-w-2xl">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#55665C]">Dari Tanggal</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-lg border border-[#CFDAD2] px-3 py-1.5 font-mono text-sm text-[#14201A]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#55665C]">Sampai Tanggal</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-lg border border-[#CFDAD2] px-3 py-1.5 font-mono text-sm text-[#14201A]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#55665C]">Kategori</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-lg border border-[#CFDAD2] bg-white px-3 py-1.5 text-sm text-[#14201A]"
              >
                <option value="ALL">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {canExport && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={!hasReportData}
                onClick={handleExportPdf}
                className="inline-flex items-center gap-2 rounded-lg border border-[#D8E2DC] bg-white px-3.5 py-2 text-sm font-medium text-[#14201A] hover:bg-[#F6F8F6] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
              >
                <FileText className="h-4 w-4 text-[#B91C1C]" />
                <span>Ekspor PDF</span>
              </button>
              <button
                type="button"
                disabled={!hasReportData}
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1B4332] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#132A1F] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Ekspor Excel</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-[#DCE4DE] bg-white p-4">
          <p className="text-xs text-[#55665C]">Total Sampah Masuk</p>
          <p className="mt-1.5 font-mono text-xl font-semibold text-[#14201A] tabular-nums">
            {formatWeight(summary.totalIntakeKg)}
          </p>
        </div>
        <div className="rounded-xl border border-[#DCE4DE] bg-white p-4">
          <p className="text-xs text-[#55665C]">Organik</p>
          <p className="mt-1.5 font-mono text-xl font-semibold text-[#1B4332] tabular-nums">
            {formatWeight(summary.organicKg)}
          </p>
        </div>
        <div className="rounded-xl border border-[#DCE4DE] bg-white p-4">
          <p className="text-xs text-[#55665C]">Anorganik</p>
          <p className="mt-1.5 font-mono text-xl font-semibold text-[#365363] tabular-nums">
            {formatWeight(summary.inorganicKg)}
          </p>
        </div>
        <div className="rounded-xl border border-[#DCE4DE] bg-white p-4">
          <p className="text-xs text-[#55665C]">Selesai Diolah</p>
          <p className="mt-1.5 font-mono text-xl font-semibold text-[#15803D] tabular-nums">
            {formatWeight(summary.processedKg)}
          </p>
        </div>
        <div className="rounded-xl border border-[#DCE4DE] bg-white p-4">
          <p className="text-xs text-[#55665C]">Tingkat Pengolahan</p>
          <p className="mt-1.5 font-mono text-xl font-semibold text-[#14201A] tabular-nums">
            {summary.diversionPercent}%
          </p>
        </div>
      </div>

      {/* Period Chart */}
      <section className="rounded-xl border border-[#DCE4DE] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#14201A]">
              Grafik Rekapitulasi Periode ({periodLabel})
            </h2>
            <p className="text-xs text-[#55665C]">
              Perbandingan timbulan organik, anorganik, dan sampah selesai diolah per bulan
            </p>
          </div>
          {canExport && <Download className="h-4 w-4 text-[#52796F]" />}
        </div>
        {chartData.length === 0 ? (
          <EmptyStatePanel
            title="Belum ada data laporan"
            description="Grafik laporan hanya dihitung dari data aktual sampah masuk dan pengolahan. Catat data sampah terlebih dahulu untuk melihat grafik periode."
          />
        ) : (
          <div className="h-[270px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6ECE7" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#55665C' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#55665C' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val) => `${formatNumber(Number(val ?? 0))} kg`} />
                <Bar dataKey="organik" name="Organik" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="anorganik" name="Anorganik" fill="#74A58E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="diolah" name="Selesai Diolah" fill="#1B4332" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Recap Tables */}
      <section className="overflow-hidden rounded-xl border border-[#DCE4DE] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6ECE7] px-5 py-3.5">
          <div className="inline-flex rounded-lg bg-[#EDF2EE] p-1">
            {!isSiswa && (
              <button
                type="button"
                onClick={() => setActiveTab('intake')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'intake'
                    ? 'bg-white text-[#14201A] shadow-xs'
                    : 'text-[#55665C] hover:text-[#14201A]'
                }`}
              >
                Rekap Sampah Masuk ({filteredWaste.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('type')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'type' || isSiswa
                  ? 'bg-white text-[#14201A] shadow-xs'
                  : 'text-[#55665C] hover:text-[#14201A]'
              }`}
            >
              Rekap Organik & Anorganik
            </button>
            {!isSiswa && (
              <button
                type="button"
                onClick={() => setActiveTab('processing')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'processing'
                    ? 'bg-white text-[#14201A] shadow-xs'
                    : 'text-[#55665C] hover:text-[#14201A]'
                }`}
              >
                Rekap Pengolahan ({filteredProcessing.length})
              </button>
            )}
          </div>
          <p className="text-xs text-[#6B7D72]">
            {isSiswa
              ? 'Statistik publik lingkungan sekolah'
              : currentUser?.role === UserRole.PETUGAS
                ? 'Laporan operasional pencatatan & pengolahan'
                : 'Laporan lengkap administrator'}
          </p>
        </div>

        <div className="overflow-x-auto">
          {!isSiswa && activeTab === 'intake' && (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E6ECE7] bg-[#FAFBF9] text-xs font-medium text-[#55665C]">
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Nama Sampah</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3 text-right">Berat (kg)</th>
                  <th className="px-4 py-3">Lokasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6ECE7]">
                {filteredWaste.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6">
                      <EmptyStatePanel
                        title="Belum ada data sampah masuk"
                        description="Rekapitulasi sampah masuk akan tampil setelah ada pencatatan aktual."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredWaste.map((w) => (
                    <tr key={w.id} className="hover:bg-[#FAFBF9]">
                      <td className="px-4 py-2.5 font-mono text-xs text-[#1B4332]">{w.code}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-[#55665C] tabular-nums">
                        {formatDateId(w.recordedAt)}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-[#14201A]">{w.name}</td>
                      <td className="px-4 py-2.5 text-[#3E4E45]">
                        {categoryMap.get(w.categoryId)?.name || '-'}
                      </td>
                      <td className="px-4 py-2.5">
                        <WasteTypeText type={w.type} />
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-[#14201A] tabular-nums">
                        {formatWeight(w.weightKg)}
                      </td>
                      <td className="px-4 py-2.5 text-[#3E4E45]">{w.sourceLocation}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {(isSiswa || activeTab === 'type') && (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E6ECE7] bg-[#FAFBF9] text-xs font-medium text-[#55665C]">
                  <th className="px-4 py-3">Kode Kategori</th>
                  <th className="px-4 py-3">Nama Kategori</th>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3">Metode Standar</th>
                  <th className="px-4 py-3 text-right">Jumlah Catatan</th>
                  <th className="px-4 py-3 text-right">Total Berat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6ECE7]">
                {categoryBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6">
                      <EmptyStatePanel
                        title="Belum ada data kategori"
                        description="Tambahkan kategori sampah terlebih dahulu untuk melihat rekapitulasi berdasarkan kategori."
                      />
                    </td>
                  </tr>
                ) : (
                  categoryBreakdown.map(({ category, count, totalKg }) => (
                    <tr key={category.id} className="hover:bg-[#FAFBF9]">
                      <td className="px-4 py-2.5 font-mono text-xs text-[#1B4332]">
                        {category.code}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-[#14201A]">{category.name}</td>
                      <td className="px-4 py-2.5">
                        <WasteTypeText type={category.type} />
                      </td>
                      <td className="px-4 py-2.5 text-[#3E4E45]">{category.standardMethod}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-[#3E4E45] tabular-nums">
                        {count}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-[#14201A] tabular-nums">
                        {formatWeight(totalKg)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {!isSiswa && activeTab === 'processing' && (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E6ECE7] bg-[#FAFBF9] text-xs font-medium text-[#55665C]">
                  <th className="px-4 py-3">Kode Olah</th>
                  <th className="px-4 py-3">Sumber Sampah</th>
                  <th className="px-4 py-3">Metode</th>
                  <th className="px-4 py-3 text-right">Berat Diolah</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Hasil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6ECE7]">
                {filteredProcessing.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6">
                      <EmptyStatePanel
                        title="Belum ada data pengolahan"
                        description="Rekapitulasi pengolahan akan muncul setelah ada proses pengolahan sampah yang dicatat."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredProcessing.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAFBF9]">
                      <td className="px-4 py-2.5 font-mono text-xs text-[#1B4332]">{p.code}</td>
                      <td className="px-4 py-2.5 font-medium text-[#14201A]">
                        {wasteMap.get(p.wasteRecordId)?.name || '-'}
                      </td>
                      <td className="px-4 py-2.5 text-[#3E4E45]">{p.method}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-[#14201A] tabular-nums">
                        {formatWeight(p.processedWeightKg)}
                      </td>
                      <td className="px-4 py-2.5">
                        <ProcessingStatusText status={p.status} />
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-[#55665C] tabular-nums">
                        {formatDateId(p.processedAt)}
                      </td>
                      <td className="px-4 py-2.5 text-[#3E4E45]">{p.result}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};
