import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';
import { hasPermission } from '../services/apiClient';
import { WasteRecord, WasteType } from '../types';
import { formatDateId, formatWeight } from '../utils/formatters';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Pagination } from '../components/ui/Pagination';
import { WasteTypeText } from '../components/ui/StatusIndicator';
import { DataErrorBanner, EmptyStatePanel } from '../components/ui/DataStateNotice';

type SortField = 'recordedAt' | 'weightKg' | 'name' | 'code';

export const WasteDataPage: React.FC = () => {
  const {
    currentUser,
    dataStatus,
    dataError,
    retryLoadData,
    wasteRecords,
    categories,
    getWasteAllocation,
    addWasteRecord,
    updateWasteRecord,
    deleteWasteRecord,
    navigateTo,
    pushToast,
  } = useEcoTrack();

  const canWrite = hasPermission(currentUser, 'waste:write');
  const canDelete = hasPermission(currentUser, 'waste:delete');
  const canManageCategories = hasPermission(currentUser, 'category:write');

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterType, setFilterType] = useState<'ALL' | WasteType>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('recordedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WasteRecord | null>(null);
  const [detailRecord, setDetailRecord] = useState<WasteRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WasteRecord | null>(null);

  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState(categories[0]?.id || '');
  const [formWeight, setFormWeight] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return wasteRecords
      .filter((item) => {
        if (filterCategory !== 'ALL' && item.categoryId !== filterCategory) return false;
        if (filterType !== 'ALL' && item.type !== filterType) return false;
        if (dateFrom && item.recordedAt < dateFrom) return false;
        if (dateTo && item.recordedAt > dateTo) return false;
        if (q) {
          const catName = categoryMap.get(item.categoryId)?.name.toLowerCase() || '';
          const match =
            item.code.toLowerCase().includes(q) ||
            item.name.toLowerCase().includes(q) ||
            item.sourceLocation.toLowerCase().includes(q) ||
            item.officerName.toLowerCase().includes(q) ||
            catName.includes(q);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'weightKg') cmp = a.weightKg - b.weightKg;
        else if (sortField === 'name') cmp = a.name.localeCompare(b.name);
        else if (sortField === 'code') cmp = a.code.localeCompare(b.code);
        else cmp = a.recordedAt.localeCompare(b.recordedAt);
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [
    wasteRecords,
    filterCategory,
    filterType,
    dateFrom,
    dateTo,
    search,
    sortField,
    sortDir,
    categoryMap,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecords = filteredRecords.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'recordedAt' ? 'desc' : 'asc');
    }
  };

  const openCreateModal = () => {
    setEditingRecord(null);
    setFormName('');
    setFormCategoryId(categories[0]?.id || '');
    setFormWeight('');
    setFormLocation('');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormNotes('');
    setFormError(null);
    setFormOpen(true);
  };

  const openEditModal = (rec: WasteRecord) => {
    setEditingRecord(rec);
    setFormName(rec.name);
    setFormCategoryId(rec.categoryId);
    setFormWeight(String(rec.weightKg));
    setFormLocation(rec.sourceLocation);
    setFormDate(rec.recordedAt);
    setFormNotes(rec.notes);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const cat = categoryMap.get(formCategoryId);
    if (!cat) {
      setFormError('Pilih kategori sampah yang valid.');
      return;
    }

    if (editingRecord) {
      const res = updateWasteRecord(editingRecord.id, {
        name: formName.trim(),
        categoryId: formCategoryId,
        type: cat.type,
        weightKg: Number(formWeight),
        sourceLocation: formLocation.trim(),
        recordedAt: formDate,
        notes: formNotes.trim(),
      });
      if (res.success) {
        pushToast('success', `Data sampah ${editingRecord.code} diperbarui.`);
        setFormOpen(false);
      } else {
        setFormError(res.message || 'Gagal memperbarui data.');
      }
    } else {
      const res = addWasteRecord({
        name: formName.trim(),
        categoryId: formCategoryId,
        type: cat.type,
        weightKg: Number(formWeight),
        sourceLocation: formLocation.trim(),
        recordedAt: formDate,
        notes: formNotes.trim(),
      });
      if (res.success && res.data) {
        pushToast('success', `Data sampah ${res.data.code} berhasil ditambahkan.`);
        setFormOpen(false);
      } else {
        setFormError(res.message || 'Gagal menyimpan data.');
      }
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const res = deleteWasteRecord(deleteTarget.id);
    if (res.success) {
      pushToast('success', `Data sampah ${deleteTarget.code} telah dihapus.`);
    } else {
      pushToast('error', res.message || 'Gagal menghapus data.');
    }
    setDeleteTarget(null);
  };

  const resetFilters = () => {
    setSearch('');
    setFilterCategory('ALL');
    setFilterType('ALL');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5">
      {dataStatus === 'error' && dataError && (
        <DataErrorBanner message={dataError} onRetry={retryLoadData} />
      )}

      {/* Toolbar */}
      <div className="rounded-xl border border-[#DCE4DE] bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6B7D72]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari kode, nama sampah, lokasi, atau petugas..."
              className="w-full rounded-lg border border-[#CFDAD2] bg-white py-2 pr-3 pl-9 text-sm text-[#14201A] placeholder:text-[#8A9990] focus:border-[#2D6A4F] focus:outline-none"
            />
          </div>
          {canWrite && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#132A1F] whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Data Sampah</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mt-3 grid grid-cols-1 gap-3 border-t border-[#E6ECE7] pt-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs text-[#55665C]">Jenis Sampah</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as 'ALL' | WasteType);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-[#CFDAD2] bg-white px-2.5 py-1.5 text-sm text-[#14201A]"
            >
              <option value="ALL">Semua Jenis</option>
              <option value={WasteType.ORGANIK}>Organik</option>
              <option value={WasteType.ANORGANIK}>Anorganik</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#55665C]">Kategori</label>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-[#CFDAD2] bg-white px-2.5 py-1.5 text-sm text-[#14201A]"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#55665C]">Dari Tanggal</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-[#CFDAD2] bg-white px-2.5 py-1.5 font-mono text-sm text-[#14201A]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#55665C]">Sampai Tanggal</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-[#CFDAD2] bg-white px-2.5 py-1.5 font-mono text-sm text-[#14201A]"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full rounded-lg border border-[#D8E2DC] bg-[#F6F8F6] px-3 py-1.5 text-sm font-medium text-[#3E4E45] hover:bg-[#EDF2EE]"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-xl border border-[#DCE4DE] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E6ECE7] bg-[#FAFBF9] text-xs font-medium text-[#55665C]">
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort('code')}
                    className="inline-flex items-center gap-1 hover:text-[#14201A]"
                  >
                    <span>Kode</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort('name')}
                    className="inline-flex items-center gap-1 hover:text-[#14201A]"
                  >
                    <span>Nama Sampah</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort('weightKg')}
                    className="inline-flex items-center gap-1 hover:text-[#14201A]"
                  >
                    <span>Berat</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3">Lokasi</th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort('recordedAt')}
                    className="inline-flex items-center gap-1 hover:text-[#14201A]"
                  >
                    <span>Tanggal</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6ECE7]">
              {wasteRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6">
                    <EmptyStatePanel
                      title="Belum ada data sampah"
                      description="Belum ada pencatatan sampah masuk. Tambahkan catatan baru untuk mulai memantau timbulan sampah sekolah."
                      action={
                        canWrite ? (
                          <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#1B4332] px-4 py-2 text-xs font-medium text-white hover:bg-[#132A1F]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Tambah Data Sampah</span>
                          </button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-[#55665C]">
                    Tidak ada data sampah yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((item) => {
                  const cat = categoryMap.get(item.categoryId);
                  const alloc = getWasteAllocation(item.id);
                  return (
                    <tr key={item.id} className="transition-colors hover:bg-[#FAFBF9]">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-[#1B4332] whitespace-nowrap">
                        {item.code}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#14201A]">{item.name}</p>
                        <p className="text-xs text-[#6B7D72]">
                          Petugas: {item.officerName} · Sisa belum diolah:{' '}
                          <span className="font-mono tabular-nums">
                            {formatWeight(alloc.remainingWeightKg)}
                          </span>
                        </p>
                      </td>
                      <td className="px-4 py-3 text-[#3E4E45] whitespace-nowrap">
                        {cat?.name || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <WasteTypeText type={item.type} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-[#14201A] tabular-nums whitespace-nowrap">
                        {formatWeight(item.weightKg)}
                      </td>
                      <td className="px-4 py-3 text-[#3E4E45]">{item.sourceLocation}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#55665C] tabular-nums whitespace-nowrap">
                        {formatDateId(item.recordedAt)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailRecord(item)}
                            className="rounded-lg p-1.5 text-[#3E4E45] hover:bg-[#EDF2EE] hover:text-[#1B4332]"
                            title="Detail"
                            aria-label={`Detail ${item.code}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canWrite && (
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="rounded-lg p-1.5 text-[#3E4E45] hover:bg-[#EDF2EE] hover:text-[#1B4332]"
                              title="Edit"
                              aria-label={`Edit ${item.code}`}
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
                              aria-label={`Hapus ${item.code}`}
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
          totalItems={filteredRecords.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingRecord ? `Edit Data Sampah (${editingRecord.code})` : 'Tambah Data Sampah Masuk'}
        subtitle="Kode sampah dibuat secara otomatis sesuai tanggal pencatatan."
      >
        {categories.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-[#3E4E45]">
              Kategori sampah belum tersedia. Tambahkan minimal satu kategori sampah sebelum
              mencatat data sampah masuk.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg border border-[#D8E2DC] px-4 py-2 text-sm font-medium text-[#3E4E45]"
              >
                Tutup
              </button>
              {canManageCategories && (
                <button
                  type="button"
                  onClick={() => {
                    setFormOpen(false);
                    navigateTo('categories');
                  }}
                  className="rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-white hover:bg-[#132A1F]"
                >
                  Buka Kategori Sampah
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                {formError}
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-[#3E4E45]">Nama Sampah *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Masukkan nama sampah"
                className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                  Kategori Sampah *
                </label>
                <select
                  value={formCategoryId || categories[0]?.id || ''}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-[#CFDAD2] bg-white px-3 py-2 text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} — {cat.type === WasteType.ORGANIK ? 'Organik' : 'Anorganik'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                  Berat (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={formWeight}
                  onChange={(e) => setFormWeight(e.target.value)}
                  placeholder="0.0"
                  className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 font-mono text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                  Sumber / Lokasi *
                </label>
                <input
                  type="text"
                  required
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Masukkan lokasi sumber"
                  className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                  Tanggal Pencatatan *
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 font-mono text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#3E4E45]">Keterangan</label>
              <textarea
                rows={3}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Catatan tambahan (opsional)..."
                className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 border-t border-[#E6ECE7] pt-4">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg border border-[#D8E2DC] px-4 py-2 text-sm font-medium text-[#3E4E45] hover:bg-[#F6F8F6]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-white hover:bg-[#132A1F]"
              >
                {editingRecord ? 'Simpan Perubahan' : 'Catat Sampah'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
        title="Detail Data Sampah"
        subtitle={detailRecord?.code}
      >
        {detailRecord && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E6ECE7] bg-[#FAFBF9] p-4">
              <div>
                <p className="text-xs text-[#55665C]">Nama Sampah</p>
                <p className="mt-0.5 font-medium text-[#14201A]">{detailRecord.name}</p>
              </div>
              <div>
                <p className="text-xs text-[#55665C]">Kategori & Jenis</p>
                <p className="mt-0.5 font-medium text-[#14201A]">
                  {categoryMap.get(detailRecord.categoryId)?.name || '-'} (
                  {detailRecord.type === WasteType.ORGANIK ? 'Organik' : 'Anorganik'})
                </p>
              </div>
              <div>
                <p className="text-xs text-[#55665C]">Berat Awal</p>
                <p className="mt-0.5 font-mono font-semibold text-[#14201A] tabular-nums">
                  {formatWeight(detailRecord.weightKg)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#55665C]">Sisa Belum Diolah</p>
                <p className="mt-0.5 font-mono font-semibold text-[#2D6A4F] tabular-nums">
                  {formatWeight(getWasteAllocation(detailRecord.id).remainingWeightKg)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#55665C]">Lokasi Sumber</p>
                <p className="mt-0.5 text-[#14201A]">{detailRecord.sourceLocation}</p>
              </div>
              <div>
                <p className="text-xs text-[#55665C]">Tanggal & Petugas</p>
                <p className="mt-0.5 text-[#14201A]">
                  {formatDateId(detailRecord.recordedAt)} · {detailRecord.officerName}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-[#55665C]">Keterangan</p>
              <p className="mt-1 rounded-lg border border-[#E6ECE7] bg-white p-3 text-[#3E4E45]">
                {detailRecord.notes || 'Tidak ada catatan tambahan.'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Data Sampah?"
        message={
          deleteTarget
            ? `Menghapus catatan ${deleteTarget.code} (${deleteTarget.name}) juga akan menghapus ${
                getWasteAllocation(deleteTarget.id).processingCount
              } riwayat pengolahan yang terhubung.`
            : ''
        }
        confirmLabel="Ya, Hapus"
      />
    </div>
  );
};
