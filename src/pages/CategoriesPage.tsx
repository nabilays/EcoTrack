import React, { useMemo, useState } from 'react';
import { Eye, Leaf, Pencil, Plus, Recycle, Search, Trash2 } from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';
import { hasPermission } from '../services/apiClient';
import { WasteCategory, WasteType } from '../types';
import { formatWeight } from '../utils/formatters';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export const CategoriesPage: React.FC = () => {
  const {
    currentUser,
    categories,
    getCategoryTotalWeight,
    addCategory,
    updateCategory,
    deleteCategory,
    pushToast,
  } = useEcoTrack();

  const canWrite = hasPermission(currentUser, 'category:write');
  const canDelete = hasPermission(currentUser, 'category:delete');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | WasteType>('ALL');

  const [formOpen, setFormOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<WasteCategory | null>(null);
  const [detailCat, setDetailCat] = useState<WasteCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WasteCategory | null>(null);

  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<WasteType>(WasteType.ORGANIK);
  const [formDesc, setFormDesc] = useState('');
  const [formMethod, setFormMethod] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories.filter((c) => {
      if (typeFilter !== 'ALL' && c.type !== typeFilter) return false;
      if (q) {
        return (
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.standardMethod.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [categories, search, typeFilter]);

  const organicCategories = filtered.filter((c) => c.type === WasteType.ORGANIK);
  const inorganicCategories = filtered.filter((c) => c.type === WasteType.ANORGANIK);

  const openCreate = () => {
    setEditingCat(null);
    setFormName('');
    setFormType(WasteType.ORGANIK);
    setFormDesc('');
    setFormMethod('');
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (cat: WasteCategory) => {
    setEditingCat(cat);
    setFormName(cat.name);
    setFormType(cat.type);
    setFormDesc(cat.description);
    setFormMethod(cat.standardMethod);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formName.trim() || !formMethod.trim()) {
      setFormError('Nama kategori dan metode pengolahan standar wajib diisi.');
      return;
    }

    if (editingCat) {
      const res = updateCategory(editingCat.id, {
        name: formName.trim(),
        type: formType,
        description: formDesc.trim(),
        standardMethod: formMethod.trim(),
      });
      if (res.success) {
        pushToast('success', `Kategori "${formName.trim()}" berhasil diperbarui.`);
        setFormOpen(false);
      } else {
        setFormError(res.message || 'Gagal memperbarui kategori.');
      }
    } else {
      const res = addCategory({
        name: formName.trim(),
        type: formType,
        description: formDesc.trim(),
        standardMethod: formMethod.trim(),
      });
      if (res.success) {
        pushToast('success', `Kategori "${formName.trim()}" ditambahkan.`);
        setFormOpen(false);
      } else {
        setFormError(res.message || 'Gagal menambahkan kategori.');
      }
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const res = deleteCategory(deleteTarget.id);
    if (res.success) {
      pushToast('success', `Kategori "${deleteTarget.name}" dihapus.`);
    } else {
      pushToast('error', res.message || 'Gagal menghapus kategori.');
    }
    setDeleteTarget(null);
  };

  const renderGroup = (
    title: string,
    subtitle: string,
    items: WasteCategory[],
    Icon: React.ComponentType<{ className?: string }>
  ) => (
    <section className="rounded-xl border border-[#DCE4DE] bg-white">
      <div className="flex items-center justify-between border-b border-[#E6ECE7] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-[#2D6A4F]" />
          <div>
            <h2 className="text-base font-semibold text-[#14201A]">{title}</h2>
            <p className="text-xs text-[#55665C]">{subtitle}</p>
          </div>
        </div>
        <span className="font-mono text-xs font-medium text-[#55665C] tabular-nums">
          {items.length} kategori
        </span>
      </div>

      {items.length === 0 ? (
        <div className="p-6 text-center text-sm text-[#55665C]">
          Tidak ada kategori pada kelompok ini sesuai filter.
        </div>
      ) : (
        <div className="divide-y divide-[#E6ECE7]">
          {items.map((cat) => {
            const totalKg = getCategoryTotalWeight(cat.id);
            return (
              <div
                key={cat.id}
                className="flex flex-col justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#FAFBF9] sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-[#55665C]">
                    <span className="font-mono font-medium text-[#1B4332]">{cat.code}</span>
                    <span aria-hidden="true">·</span>
                    <span>Metode: {cat.standardMethod}</span>
                  </div>
                  <h3 className="mt-1 text-sm font-semibold text-[#14201A]">{cat.name}</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#55665C]">
                    {cat.description}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-5 sm:justify-end">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-[#6B7D72]">Total Terkumpul</p>
                    <p className="font-mono text-base font-semibold text-[#14201A] tabular-nums">
                      {formatWeight(totalKg)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDetailCat(cat)}
                      className="rounded-lg p-1.5 text-[#3E4E45] hover:bg-[#EDF2EE] hover:text-[#1B4332]"
                      title="Detail"
                      aria-label={`Detail ${cat.name}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="rounded-lg p-1.5 text-[#3E4E45] hover:bg-[#EDF2EE] hover:text-[#1B4332]"
                        title="Edit"
                        aria-label={`Edit ${cat.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(cat)}
                        className="rounded-lg p-1.5 text-[#7F1D1D] hover:bg-red-50"
                        title="Hapus"
                        aria-label={`Hapus ${cat.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#DCE4DE] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6B7D72]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode, nama kategori, atau metode..."
              className="w-full rounded-lg border border-[#CFDAD2] bg-white py-2 pr-3 pl-9 text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
            />
          </div>

          <div className="inline-flex rounded-lg bg-[#EDF2EE] p-1">
            {(['ALL', WasteType.ORGANIK, WasteType.ANORGANIK] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setTypeFilter(opt)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  typeFilter === opt
                    ? 'bg-white text-[#14201A] shadow-xs'
                    : 'text-[#55665C] hover:text-[#14201A]'
                }`}
              >
                {opt === 'ALL' ? 'Semua' : opt === WasteType.ORGANIK ? 'Organik' : 'Anorganik'}
              </button>
            ))}
          </div>
        </div>

        {canWrite && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-white hover:bg-[#132A1F] whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Kategori</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {(typeFilter === 'ALL' || typeFilter === WasteType.ORGANIK) &&
          renderGroup(
            'ORGANIK',
            'Sampah mudah terurai secara biologis (sisa makanan, daun, kulit buah)',
            organicCategories,
            Leaf
          )}

        {(typeFilter === 'ALL' || typeFilter === WasteType.ANORGANIK) &&
          renderGroup(
            'ANORGANIK',
            'Sampah bernilai daur ulang (plastik, kertas, kaca, logam)',
            inorganicCategories,
            Recycle
          )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingCat ? `Edit Kategori (${editingCat.code})` : 'Tambah Kategori Sampah'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                Nama Kategori *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Kardus"
                className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                Jenis Sampah *
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as WasteType)}
                className="w-full rounded-lg border border-[#CFDAD2] bg-white px-3 py-2 text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
              >
                <option value={WasteType.ORGANIK}>Organik</option>
                <option value={WasteType.ANORGANIK}>Anorganik</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
              Metode Pengolahan Standar *
            </label>
            <input
              type="text"
              required
              value={formMethod}
              onChange={(e) => setFormMethod(e.target.value)}
              placeholder="Contoh: Komposting Aerob / Bank Sampah"
              className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[#3E4E45]">Deskripsi</label>
            <textarea
              rows={3}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Penjelasan jenis material yang masuk ke kategori ini..."
              className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 border-t border-[#E6ECE7] pt-4">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-[#D8E2DC] px-4 py-2 text-sm font-medium text-[#3E4E45]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-white hover:bg-[#132A1F]"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={Boolean(detailCat)}
        onClose={() => setDetailCat(null)}
        title={detailCat?.name || 'Detail Kategori'}
        subtitle={detailCat?.code}
      >
        {detailCat && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E6ECE7] bg-[#FAFBF9] p-4">
              <div>
                <p className="text-xs text-[#55665C]">Jenis Sampah</p>
                <p className="mt-0.5 font-medium text-[#14201A]">{detailCat.type}</p>
              </div>
              <div>
                <p className="text-xs text-[#55665C]">Total Berat Tercatat</p>
                <p className="mt-0.5 font-mono font-semibold text-[#1B4332] tabular-nums">
                  {formatWeight(getCategoryTotalWeight(detailCat.id))}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-[#55665C]">Metode Pengolahan Standar</p>
                <p className="mt-0.5 font-medium text-[#14201A]">{detailCat.standardMethod}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-[#55665C]">Deskripsi</p>
              <p className="mt-1 text-[#3E4E45]">{detailCat.description || '-'}</p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Kategori Sampah?"
        message={
          deleteTarget
            ? `Apakah Anda yakin ingin menghapus kategori "${deleteTarget.name}" (${deleteTarget.code})?`
            : ''
        }
      />
    </div>
  );
};
