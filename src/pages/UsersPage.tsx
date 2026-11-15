import React, { useMemo, useState } from 'react';
import {
  Eye,
  Pencil,
  Plus,
  Power,
  Search,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';
import { hasPermission } from '../services/apiClient';
import { User, UserRole, UserStatus } from '../types';
import { formatDateId } from '../utils/formatters';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { UserStatusText } from '../components/ui/StatusIndicator';
import { DataErrorBanner, EmptyStatePanel } from '../components/ui/DataStateNotice';

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Admin',
  PETUGAS: 'Petugas',
  SISWA: 'Siswa',
};

export const UsersPage: React.FC = () => {
  const {
    currentUser,
    dataStatus,
    dataError,
    retryLoadData,
    users,
    addUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    pushToast,
  } = useEcoTrack();

  const canManage = hasPermission(currentUser, 'users:manage');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL');

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.PETUGAS);
  const [status, setStatus] = useState<UserStatus>(UserStatus.AKTIF);
  const [classOrUnit, setClassOrUnit] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
      if (q) {
        return (
          u.fullName.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.classOrUnit?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-white p-10 text-center">
        <ShieldAlert className="h-8 w-8 text-red-600" />
        <h2 className="mt-3 text-lg font-semibold text-[#14201A]">Akses Dibatasi (403)</h2>
        <p className="mt-1 max-w-md text-sm text-[#55665C]">
          Halaman Manajemen Pengguna hanya dapat diakses oleh Administrator sekolah.
        </p>
      </div>
    );
  }

  const openCreate = () => {
    setEditingUser(null);
    setFullName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole(UserRole.PETUGAS);
    setStatus(UserStatus.AKTIF);
    setClassOrUnit('');
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setFullName(u.fullName);
    setUsername(u.username);
    setEmail(u.email);
    setPassword('');
    setRole(u.role);
    setStatus(u.status);
    setClassOrUnit(u.classOrUnit || '');
    setFormError(null);
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (editingUser) {
      const res = updateUser(editingUser.id, {
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        ...(password.trim() ? { password: password.trim() } : {}),
        role,
        status,
        classOrUnit: classOrUnit.trim(),
      });
      if (res.success) {
        pushToast('success', `Data pengguna "${fullName.trim()}" diperbarui.`);
        setFormOpen(false);
      } else {
        setFormError(res.message || 'Gagal memperbarui pengguna.');
      }
    } else {
      const res = addUser({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
        status,
        classOrUnit: classOrUnit.trim(),
      });
      if (res.success) {
        pushToast('success', `Pengguna "${fullName.trim()}" berhasil ditambahkan.`);
        setFormOpen(false);
      } else {
        setFormError(res.message || 'Gagal menambahkan pengguna.');
      }
    }
  };

  const handleToggleStatus = (u: User) => {
    const res = toggleUserStatus(u.id);
    if (res.success && res.data) {
      pushToast('info', `Status ${res.data.fullName} diubah menjadi ${res.data.status}.`);
    } else {
      pushToast('error', res.message || 'Gagal mengubah status.');
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const res = deleteUser(deleteTarget.id);
    if (res.success) {
      pushToast('success', `Akun "${deleteTarget.fullName}" telah dihapus.`);
    } else {
      pushToast('error', res.message || 'Gagal menghapus akun.');
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      {dataStatus === 'error' && dataError && (
        <DataErrorBanner message={dataError} onRetry={retryLoadData} />
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#DCE4DE] bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6B7D72]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, username, email, atau kelas/unit..."
              className="w-full rounded-lg border border-[#CFDAD2] py-2 pr-3 pl-9 text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'ALL' | UserRole)}
            className="rounded-lg border border-[#CFDAD2] bg-white px-3 py-2 text-sm text-[#14201A]"
          >
            <option value="ALL">Semua Role</option>
            <option value={UserRole.ADMIN}>Admin</option>
            <option value={UserRole.PETUGAS}>Petugas</option>
            <option value={UserRole.SISWA}>Siswa</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | UserStatus)}
            className="rounded-lg border border-[#CFDAD2] bg-white px-3 py-2 text-sm text-[#14201A]"
          >
            <option value="ALL">Semua Status</option>
            <option value={UserStatus.AKTIF}>Aktif</option>
            <option value={UserStatus.NONAKTIF}>Nonaktif</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-white hover:bg-[#132A1F] whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#DCE4DE] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E6ECE7] bg-[#FAFBF9] text-xs font-medium text-[#55665C]">
                <th className="px-4 py-3">Nama Lengkap</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6ECE7]">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6">
                    <EmptyStatePanel
                      title="Belum ada data pengguna"
                      description="Tambahkan akun Petugas dan Siswa untuk mulai mengoperasikan sistem."
                    />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#55665C]">
                    Tidak ada pengguna yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-[#FAFBF9]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#14201A]">
                          {u.fullName} {isSelf && <span className="text-xs text-[#2D6A4F]">(Anda)</span>}
                        </p>
                        {u.classOrUnit && (
                          <p className="text-xs text-[#6B7D72]">{u.classOrUnit}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#3E4E45]">{u.username}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#3E4E45]">{u.email}</td>
                      <td className="px-4 py-3 font-medium text-[#1B4332]">
                        {ROLE_LABEL[u.role]}
                      </td>
                      <td className="px-4 py-3">
                        <UserStatusText status={u.status} />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailUser(u)}
                            className="rounded-lg p-1.5 text-[#3E4E45] hover:bg-[#EDF2EE] hover:text-[#1B4332]"
                            title="Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(u)}
                            className="rounded-lg p-1.5 text-[#3E4E45] hover:bg-[#EDF2EE] hover:text-[#1B4332]"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => handleToggleStatus(u)}
                            className="rounded-lg p-1.5 text-[#3E4E45] hover:bg-[#EDF2EE] hover:text-[#1B4332] disabled:cursor-not-allowed disabled:opacity-40"
                            title={u.status === UserStatus.AKTIF ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => setDeleteTarget(u)}
                            className="rounded-lg p-1.5 text-[#7F1D1D] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingUser ? `Edit Pengguna (${editingUser.username})` : 'Tambah Pengguna Baru'}
        subtitle="Hanya Administrator yang dapat membuat dan mengelola akun sekolah."
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              {formError}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
              Nama Lengkap *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama lengkap"
              className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 text-sm text-[#14201A]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#3E4E45]">Username *</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 font-mono text-sm text-[#14201A]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#3E4E45]">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@sekolah.sch.id"
                className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 font-mono text-sm text-[#14201A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                {editingUser ? 'Password Baru (kosongkan jika tetap)' : 'Password *'}
              </label>
              <input
                type="password"
                required={!editingUser}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 text-sm text-[#14201A]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                Kelas / Unit Kerja
              </label>
              <input
                type="text"
                value={classOrUnit}
                onChange={(e) => setClassOrUnit(e.target.value)}
                placeholder="Kelas atau unit kerja"
                className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 text-sm text-[#14201A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#3E4E45]">Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-lg border border-[#CFDAD2] bg-white px-3 py-2 text-sm text-[#14201A]"
              >
                <option value={UserRole.ADMIN}>Admin</option>
                <option value={UserRole.PETUGAS}>Petugas</option>
                <option value={UserRole.SISWA}>Siswa</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#3E4E45]">Status Akun *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                className="w-full rounded-lg border border-[#CFDAD2] bg-white px-3 py-2 text-sm text-[#14201A]"
              >
                <option value={UserStatus.AKTIF}>Aktif</option>
                <option value={UserStatus.NONAKTIF}>Nonaktif</option>
              </select>
            </div>
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
              Simpan Pengguna
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={Boolean(detailUser)}
        onClose={() => setDetailUser(null)}
        title="Detail Akun Pengguna"
      >
        {detailUser && (
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E6ECE7] bg-[#FAFBF9] p-4 text-sm">
            <div>
              <p className="text-xs text-[#55665C]">Nama Lengkap</p>
              <p className="mt-0.5 font-medium text-[#14201A]">{detailUser.fullName}</p>
            </div>
            <div>
              <p className="text-xs text-[#55665C]">Role</p>
              <p className="mt-0.5 font-medium text-[#1B4332]">{ROLE_LABEL[detailUser.role]}</p>
            </div>
            <div>
              <p className="text-xs text-[#55665C]">Username</p>
              <p className="mt-0.5 font-mono text-xs text-[#14201A]">{detailUser.username}</p>
            </div>
            <div>
              <p className="text-xs text-[#55665C]">Email</p>
              <p className="mt-0.5 font-mono text-xs text-[#14201A]">{detailUser.email}</p>
            </div>
            <div>
              <p className="text-xs text-[#55665C]">Status Akun</p>
              <div className="mt-1">
                <UserStatusText status={detailUser.status} />
              </div>
            </div>
            <div>
              <p className="text-xs text-[#55665C]">Terdaftar Sejak</p>
              <p className="mt-0.5 font-mono text-xs text-[#14201A]">
                {formatDateId(detailUser.createdAt)}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-[#55665C]">Kelas / Unit</p>
              <p className="mt-0.5 text-[#14201A]">{detailUser.classOrUnit || '-'}</p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Akun Pengguna?"
        message={
          deleteTarget
            ? `Pengguna "${deleteTarget.fullName}" (${deleteTarget.email}) akan dihapus permanen dari sistem.`
            : ''
        }
      />
    </div>
  );
};
