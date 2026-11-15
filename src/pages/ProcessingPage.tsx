import React, { useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';
import { hasPermission } from '../services/apiClient';
import { ProcessingRecord, ProcessingStatus } from '../types';
import { formatDateId, formatWeight } from '../utils/formatters';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ProcessingStatusText } from '../components/ui/StatusIndicator';
import { Pagination } from '../components/ui/Pagination';

const PROCESSING_METHODS = [
  'Komposting Aerob',
  'Fermentasi Eco-Enzyme',
  'Pencacahan & Pupuk Kompos',
  'Lubang Resapan Biopori',
  'Pencacahan & Bank Sampah',
  'Pengepakan & Daur Ulang Kertas',
  'Pengepresan & Bank Sampah Logam',
  'Pemilahan & Penyetoran Mitra Daur Ulang',
];

export const ProcessingPage: React.FC = () => {
  const {
    currentUser,
    wasteRecords,
    categories,
    processingRecords,
    getWasteAllocation,
    addProcessingRecord,
    updateProcessingRecord,
    deleteProcessingRecord,
    pushToast,
  } = useEcoTrack();

  const canWrite = hasPermission(currentUser, 'processing:write');
  const canDelete = hasPermission(currentUser, 'processing:delete');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProcessingStatus>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Create form state
  const availableWaste = useMemo(
    () =>
      wasteRecords.filter((w) => getWasteAllocation(w.id).remainingWeightKg > 0),
    [wasteRecords, getWasteAllocation]
  );

  const [selectedWasteId, setSelectedWasteId] = useState<string>(
    availableWaste[0]?.id || ''
  );
  const [processWeight, setProcessWeight] = useState('');
  const [method, setMethod] = useState(PROCESSING_METHODS[0]);
  const [resultText, setResultText] = useState('');
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.DIPROSES);
  const [processedAt, setProcessedAt] = useState('2026-11-14');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit / Detail / Delete modals
  const [editingRecord, setEditingRecord] = useState<ProcessingRecord | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editMethod, setEditMethod] = useState('');
  const [editResult, setEditResult] = useState('');
  const [editStatus, setEditStatus] = useState<ProcessingStatus>(ProcessingStatus.DIPROSES);
  const [editDate, setEditDate] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const [detailRecord, setDetailRecord] = useState<ProcessingRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProcessingRecord | null>(null);

  const wasteMap = useMemo(
    () => new Map(wasteRecords.map((w) => [w.id, w])),
    [wasteRecords]
  );
  const catMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const effectiveSelectedWasteId = useMemo(() => {
    if (selectedWasteId && availableWaste.some((w) => w.id === selectedWasteId)) {
      return selectedWasteId;
    }
    return availableWaste[0]?.id || '';
  }, [selectedWasteId, availableWaste]);

  const selectedWaste = wasteMap.get(effectiveSelectedWasteId) || null;
  const selectedAlloc = selectedWaste ? getWasteAllocation(selectedWaste.id) : null;

  const handleSelectWaste = (wasteId: string) => {
    setSelectedWasteId(wasteId);
    setFormError(null);
    const w = wasteMap.get(wasteId);
    if (w) {
      const cat = catMap.get(w.categoryId);
      if (cat && PROCESSING_METHODS.includes(cat.standardMethod)) {
        setMethod(cat.standardMethod);
      }
      const rem = getWasteAllocation(w.id).remainingWeightKg;
      setProcessWeight(rem > 0 ? String(rem) : '');
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!effectiveSelectedWasteId) {
      setFormError('Pilih catatan sampah masuk yang memiliki sisa berat tersedia.');
      return;
    }

    const weightVal = Number(processWeight);
    if (Number.isNaN(weightVal) || weightVal <= 0) {
      setFormError('Berat yang akan diolah harus lebih dari 0 kg.');
      return;
    }
    if (selectedAlloc && weightVal > selectedAlloc.remainingWeightKg + 0.001) {
      setFormError(
        `Berat melebihi sisa berat tersedia (${formatWeight(selectedAlloc.remainingWeightKg)}).`
      );
      return;
    }

    const res = addProcessingRecord({
      wasteRecordId: effectiveSelectedWasteId,
      processedWeightKg: weightVal,
      method,
      result: resultText.trim(),
      status,
      processedAt,
      notes: notes.trim(),
    });

    if (res.success && res.data) {
      pushToast('success', `Batch pengolahan ${res.data.code} berhasil dicatat.`);
      setProcessWeight('');
      setResultText('');
      setNotes('');
    } else {
      setFormError(res.message || 'Gagal mencatat pengolahan.');
    }
  };

  const openEditModal = (rec: ProcessingRecord) => {
    setEditingRecord(rec);
    setEditWeight(String(rec.processedWeightKg));
    setEditMethod(rec.method);
    setEditResult(rec.result);
    setEditStatus(rec.status);
    setEditDate(rec.processedAt);
    setEditError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setEditError(null);

    const res = updateProcessingRecord(editingRecord.id, {
      processedWeightKg: Number(editWeight),
      method: editMethod,
      result: editResult.trim(),
      status: editStatus,
      processedAt: editDate,
    });

    if (res.success) {
      pushToast('success', `Pengolahan ${editingRecord.code} diperbarui.`);
      setEditingRecord(null);
    } else {
      setEditError(res.message || 'Gagal memperbarui pengolahan.');
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const res = deleteProcessingRecord(deleteTarget.id);
    if (res.success) {
      pushToast('success', `Riwayat pengolahan ${deleteTarget.code} dihapus.`);
    } else {
      pushToast('error', res.message || 'Gagal menghapus riwayat pengolahan.');
    }
    setDeleteTarget(null);
  };

  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase();
    return processingRecords.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (q) {
        const w = wasteMap.get(p.wasteRecordId);
        const match =
          p.code.toLowerCase().includes(q) ||
          p.method.toLowerCase().includes(q) ||
          p.result.toLowerCase().includes(q) ||
          p.officerName.toLowerCase().includes(q) ||
          (w?.code.toLowerCase().includes(q) ?? false) ||
          (w?.name.toLowerCase().includes(q) ?? false);
        if (!match) return false;
      }
      return true;
    });
  }, [processingRecords, statusFilter, search, wasteMap]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedHistory = filteredHistory.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Processing Form Panel */}
      {canWrite && (
        <section className="rounded-xl border border-[#DCE4DE] bg-white p-5">
          <div className="mb-4 flex items-center justify-between border-b border-[#E6ECE7] pb-3">
            <div>
              <h2 className="text-base font-semibold text-[#14201A]">
                Catat Proses Pengolahan Sampah
              </h2>
              <p className="text-xs text-[#55665C]">
                Pilih sampah masuk yang masih memiliki sisa berat. Satu catatan sampah dapat diolah
                dalam beberapa batch hingga total berat awal terpenuhi.
              </p>
            </div>
            <Plus className="h-4 w-4 text-[#2D6A4F]" />
          </div>

          {availableWaste.length === 0 ? (
            <div className="rounded-lg bg-[#F6F8F6] p-5 text-sm text-[#55665C]">
              Seluruh catatan sampah masuk saat ini sudah dialokasikan 100% ke dalam riwayat
              pengolahan. Tambahkan data sampah masuk baru jika ingin membuat batch pengolahan baru.
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-6">
                  <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                    Pilih Catatan Sampah Masuk *
                  </label>
                  <select
                    value={effectiveSelectedWasteId}
                    onChange={(e) => handleSelectWaste(e.target.value)}
                    className="w-full rounded-lg border border-[#CFDAD2] bg-white px-3 py-2 text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
                  >
                    {availableWaste.map((w) => {
                      const alloc = getWasteAllocation(w.id);
                      return (
                        <option key={w.id} value={w.id}>
                          {w.code} — {w.name} (Sisa: {formatWeight(alloc.remainingWeightKg)} / Awal:{' '}
                          {formatWeight(w.weightKg)})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Live Weight Balance Readout */}
                {selectedWaste && selectedAlloc && (
                  <div className="grid grid-cols-3 gap-3 rounded-lg border border-[#E6ECE7] bg-[#FAFBF9] px-4 py-2.5 lg:col-span-6">
                    <div>
                      <p className="text-xs text-[#55665C]">Berat Awal</p>
                      <p className="font-mono text-sm font-semibold text-[#14201A] tabular-nums">
                        {formatWeight(selectedAlloc.initialWeightKg)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#55665C]">Sudah Dialokasikan</p>
                      <p className="font-mono text-sm font-semibold text-[#3E4E45] tabular-nums">
                        {formatWeight(selectedAlloc.allocatedWeightKg)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#55665C]">Sisa Tersedia</p>
                      <p className="font-mono text-sm font-semibold text-[#15803D] tabular-nums">
                        {formatWeight(selectedAlloc.remainingWeightKg)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                    Berat Akan Diolah (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max={selectedAlloc?.remainingWeightKg || undefined}
                    required
                    value={processWeight}
                    onChange={(e) => setProcessWeight(e.target.value)}
                    placeholder={
                      selectedAlloc ? `Maks ${selectedAlloc.remainingWeightKg}` : '0.0'
                    }
                    className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 font-mono text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                    Metode Pengolahan *
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full rounded-lg border border-[#CFDAD2] bg-white px-3 py-2 text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
                  >
                    {PROCESSING_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                    Status Pengolahan *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProcessingStatus)}
                    className="w-full rounded-lg border border-[#CFDAD2] bg-white px-3 py-2 text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
                  >
                    <option value={ProcessingStatus.MENUNGGU}>Menunggu</option>
                    <option value={ProcessingStatus.DIPROSES}>Diproses</option>
                    <option value={ProcessingStatus.SELESAI}>Selesai</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                    Tanggal Pengolahan *
                  </label>
                  <input
                    type="date"
                    required
                    value={processedAt}
                    onChange={(e) => setProcessedAt(e.target.value)}
                    className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 font-mono text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                    Hasil / Target Pengolahan *
                  </label>
                  <input
                    type="text"
                    required
                    value={resultText}
                    onChange={(e) => setResultText(e.target.value)}
                    placeholder="Contoh: 15 kg kompos siap pakai / disetor ke bank sampah mitra"
                    className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                    Catatan Tambahan
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Opsional..."
                    className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
                  />
                </div>

                <div className="flex items-end lg:col-span-2">
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#132A1F] whitespace-nowrap"
                  >
                    Simpan Batch
                  </button>
                </div>
              </div>
            </form>
          )}
        </section>
      )}

      {/* History Table */}
      <section className="overflow-hidden rounded-xl border border-[#DCE4DE] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#E6ECE7] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#14201A]">Riwayat Pengolahan Sampah</h2>
            <p className="text-xs text-[#55665C]">
              Seluruh batch pengolahan yang terhubung dengan catatan sampah masuk
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6B7D72]" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari kode olah, sumber, metode..."
                className="w-full rounded-lg border border-[#CFDAD2] py-1.5 pr-3 pl-9 text-sm text-[#14201A] sm:w-64 focus:border-[#2D6A4F] focus:outline-none"
              />
            </div>

            <div className="inline-flex rounded-lg bg-[#EDF2EE] p-1">
              {(
                [
                  'ALL',
                  ProcessingStatus.MENUNGGU,
                  ProcessingStatus.DIPROSES,
                  ProcessingStatus.SELESAI,
                ] as const
              ).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setStatusFilter(st);
                    setCurrentPage(1);
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-white text-[#14201A] shadow-xs'
                      : 'text-[#55665C] hover:text-[#14201A]'
                  }`}
                >
                  {st === 'ALL' ? 'Semua' : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E6ECE7] bg-[#FAFBF9] text-xs font-medium text-[#55665C]">
                <th className="px-4 py-3">Kode Olah</th>
                <th className="px-4 py-3">Sumber Sampah</th>
                <th className="px-4 py-3">Metode</th>
                <th className="px-4 py-3 text-right">Berat Diolah</th>
                <th className="px-4 py-3">Hasil Pengolahan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6ECE7]">
              {paginatedHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-[#55665C]">
                    Belum ada riwayat pengolahan untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                paginatedHistory.map((item) => {
                  const sourceWaste = wasteMap.get(item.wasteRecordId);
                  return (
                    <tr key={item.id} className="hover:bg-[#FAFBF9]">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-[#1B4332] whitespace-nowrap">
                        {item.code}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#14201A]">
                          {sourceWaste?.name || 'Data tidak ditemukan'}
                        </p>
                        <p className="font-mono text-xs text-[#6B7D72]">
                          {sourceWaste?.code} · Awal {formatWeight(sourceWaste?.weightKg || 0)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-[#3E4E45]">{item.method}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-[#14201A] tabular-nums whitespace-nowrap">
                        {formatWeight(item.processedWeightKg)}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-[#3E4E45]" title={item.result}>
                        {item.result}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <ProcessingStatusText status={item.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#55665C] tabular-nums whitespace-nowrap">
                        {formatDateId(item.processedAt)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailRecord(item)}
                            className="rounded-lg p-1.5 text-[#3E4E45] hover:bg-[#EDF2EE] hover:text-[#1B4332]"
                            title="Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canWrite && (
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="rounded-lg p-1.5 text-[#3E4E45] hover:bg-[#EDF2EE] hover:text-[#1B4332]"
                              title="Ubah Status / Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              className="rounded-lg p-1.5 text-[#7F1D1D] hover:bg-red-50"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filteredHistory.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </section>

      {/* Edit Modal */}
      <Modal
        open={Boolean(editingRecord)}
        onClose={() => setEditingRecord(null)}
        title={`Perbarui Pengolahan (${editingRecord?.code})`}
      >
        {editingRecord && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {editError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                {editError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                  Berat Diolah (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={editWeight}
                  onChange={(e) => setEditWeight(e.target.value)}
                  className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 font-mono text-sm text-[#14201A]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#3E4E45]">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ProcessingStatus)}
                  className="w-full rounded-lg border border-[#CFDAD2] bg-white px-3 py-2 text-sm text-[#14201A]"
                >
                  <option value={ProcessingStatus.MENUNGGU}>Menunggu</option>
                  <option value={ProcessingStatus.DIPROSES}>Diproses</option>
                  <option value={ProcessingStatus.SELESAI}>Selesai</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#3E4E45]">Metode</label>
                <select
                  value={editMethod}
                  onChange={(e) => setEditMethod(e.target.value)}
                  className="w-full rounded-lg border border-[#CFDAD2] bg-white px-3 py-2 text-sm text-[#14201A]"
                >
                  {PROCESSING_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                  Tanggal Pengolahan
                </label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 font-mono text-sm text-[#14201A]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                Hasil Pengolahan
              </label>
              <textarea
                rows={3}
                required
                value={editResult}
                onChange={(e) => setEditResult(e.target.value)}
                className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 text-sm text-[#14201A]"
              />
            </div>

            <div className="flex justify-end gap-2.5 border-t border-[#E6ECE7] pt-4">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="rounded-lg border border-[#D8E2DC] px-4 py-2 text-sm font-medium text-[#3E4E45]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-white hover:bg-[#132A1F]"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
        title="Detail Pengolahan Sampah"
        subtitle={detailRecord?.code}
      >
        {detailRecord && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E6ECE7] bg-[#FAFBF9] p-4">
              <div>
                <p className="text-xs text-[#55665C]">Sumber Sampah</p>
                <p className="mt-0.5 font-medium text-[#14201A]">
                  {wasteMap.get(detailRecord.wasteRecordId)?.name}
                </p>
                <p className="font-mono text-xs text-[#6B7D72]">
                  {wasteMap.get(detailRecord.wasteRecordId)?.code}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#55665C]">Status</p>
                <div className="mt-1">
                  <ProcessingStatusText status={detailRecord.status} />
                </div>
              </div>
              <div>
                <p className="text-xs text-[#55665C]">Berat Diolah</p>
                <p className="mt-0.5 font-mono font-semibold text-[#14201A] tabular-nums">
                  {formatWeight(detailRecord.processedWeightKg)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#55665C]">Tanggal & Petugas</p>
                <p className="mt-0.5 text-[#14201A]">
                  {formatDateId(detailRecord.processedAt)} · {detailRecord.officerName}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-[#55665C]">Metode</p>
                <p className="mt-0.5 font-medium text-[#14201A]">{detailRecord.method}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-[#55665C]">Hasil Pengolahan</p>
              <p className="mt-1 rounded-lg border border-[#E6ECE7] p-3 text-[#14201A]">
                {detailRecord.result}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Riwayat Pengolahan?"
        message={
          deleteTarget
            ? `Berat ${formatWeight(deleteTarget.processedWeightKg)} akan dikembalikan ke sisa berat sampah sumber.`
            : ''
        }
      />
    </div>
  );
};
