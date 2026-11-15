import React, { useState } from 'react';
import { KeyRound, LogOut, RotateCcw, Save, Settings, User as UserIcon } from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';
import { hasPermission } from '../services/apiClient';
import { UserRole } from '../types';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const ROLE_TEXT: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  PETUGAS: 'Petugas Operasional',
  SISWA: 'Siswa',
};

export const ProfileSettingsPage: React.FC = () => {
  const {
    currentUser,
    settings,
    updateOwnProfile,
    changeOwnPassword,
    updateSystemSettings,
    resetDemoData,
    resetAllAccountsAndData,
    logout,
    pushToast,
  } = useEcoTrack();

  const isAdmin = hasPermission(currentUser, 'settings:manage');

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [classOrUnit, setClassOrUnit] = useState(currentUser?.classOrUnit || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [schoolAddress, setSchoolAddress] = useState(settings.schoolAddress);
  const [academicYear, setAcademicYear] = useState(settings.academicYear);
  const [targetDiversion, setTargetDiversion] = useState(
    String(settings.targetDiversionPercent)
  );
  const [wastePrefix, setWastePrefix] = useState(settings.wasteCodePrefix);
  const [procPrefix, setProcPrefix] = useState(settings.processingCodePrefix);

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [wipeAccountsOpen, setWipeAccountsOpen] = useState(false);

  if (!currentUser) return null;

  const initials = currentUser.fullName
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      pushToast('error', 'Ukuran foto maksimal 1 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateOwnProfile({
      fullName,
      username,
      email,
      classOrUnit,
      avatarUrl,
    });
    if (res.success) {
      pushToast('success', 'Profil pengguna berhasil diperbarui.');
    } else {
      pushToast('error', res.message || 'Gagal memperbarui profil.');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      pushToast('error', 'Konfirmasi password baru tidak sama.');
      return;
    }
    const res = changeOwnPassword(currentPassword, newPassword);
    if (res.success) {
      pushToast('success', 'Password berhasil diubah.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      pushToast('error', res.message || 'Gagal mengubah password.');
    }
  };

  const handleSaveSystem = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateSystemSettings({
      ...settings,
      schoolName: schoolName.trim(),
      schoolAddress: schoolAddress.trim(),
      academicYear: academicYear.trim(),
      targetDiversionPercent: Number(targetDiversion),
      wasteCodePrefix: wastePrefix.trim().toUpperCase() || 'SMP',
      processingCodePrefix: procPrefix.trim().toUpperCase() || 'PR',
    });
    if (res.success) {
      pushToast('success', 'Pengaturan sistem sekolah berhasil disimpan.');
    } else {
      pushToast('error', res.message || 'Gagal menyimpan pengaturan.');
    }
  };

  const handleResetData = () => {
    const res = resetDemoData();
    if (res.success) {
      pushToast('info', 'Seluruh data operasional berhasil dikosongkan.');
    } else {
      pushToast('error', res.message || 'Gagal mengosongkan data.');
    }
  };

  const handleWipeAllAccounts = () => {
    const res = resetAllAccountsAndData();
    if (!res.success) {
      pushToast('error', res.message || 'Gagal menghapus seluruh akun.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Profile Information */}
        <section className="rounded-xl border border-[#DCE4DE] bg-white p-5 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between border-b border-[#E6ECE7] pb-3">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-[#2D6A4F]" />
              <h2 className="text-base font-semibold text-[#14201A]">Profil Pengguna</h2>
            </div>
            <span className="text-xs font-medium text-[#1B4332]">
              Role: {ROLE_TEXT[currentUser.role]}
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={currentUser.fullName}
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 rounded-xl border border-[#D8E2DC] object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#EDF2EE] text-lg font-semibold text-[#1B4332]">
                  {initials}
                </div>
              )}
              <div>
                <label className="inline-block cursor-pointer rounded-lg border border-[#D8E2DC] bg-white px-3 py-1.5 text-xs font-medium text-[#14201A] hover:bg-[#F6F8F6]">
                  <span>Unggah Foto Profil</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="ml-2 text-xs text-[#7F1D1D] hover:underline"
                  >
                    Hapus Foto
                  </button>
                )}
                <p className="mt-1 text-xs text-[#6B7D72]">Format JPG/PNG, maksimal 1 MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 text-sm text-[#14201A]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#3E4E45]">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 font-mono text-sm text-[#14201A]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#3E4E45]">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 font-mono text-sm text-[#14201A]"
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
                  className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 text-sm text-[#14201A]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E6ECE7] pt-4">
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-[#7F1D1D] hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout dari Sistem</span>
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-white hover:bg-[#132A1F]"
              >
                <Save className="h-4 w-4" />
                <span>Simpan Profil</span>
              </button>
            </div>
          </form>
        </section>

        {/* Change Password */}
        <section className="rounded-xl border border-[#DCE4DE] bg-white p-5 lg:col-span-5">
          <div className="mb-4 flex items-center gap-2 border-b border-[#E6ECE7] pb-3">
            <KeyRound className="h-4 w-4 text-[#2D6A4F]" />
            <h2 className="text-base font-semibold text-[#14201A]">Ubah Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                Password Saat Ini
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 text-sm text-[#14201A]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                Password Baru
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 text-sm text-[#14201A]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 text-sm text-[#14201A]"
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-lg border border-[#D8E2DC] bg-[#F6F8F6] px-4 py-2 text-sm font-medium text-[#14201A] hover:bg-[#EDF2EE]"
            >
              Perbarui Password
            </button>
          </form>
        </section>
      </div>

      {/* System Settings (Admin Only) */}
      {isAdmin && (
        <section className="rounded-xl border border-[#DCE4DE] bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#E6ECE7] pb-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-[#2D6A4F]" />
              <div>
                <h2 className="text-base font-semibold text-[#14201A]">Pengaturan Sistem</h2>
                <p className="text-xs text-[#55665C]">
                  Konfigurasi identitas sekolah, target pengolahan, dan format penomoran otomatis
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8E2DC] px-3 py-1.5 text-xs font-medium text-[#3E4E45] hover:bg-[#F6F8F6]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Kosongkan Data Operasional</span>
              </button>
              <button
                type="button"
                onClick={() => setWipeAccountsOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-[#7F1D1D] hover:bg-red-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Hapus Semua Akun &amp; Reset Total</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveSystem} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                  Nama Sekolah
                </label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 text-sm text-[#14201A]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                  Tahun Ajaran
                </label>
                <input
                  type="text"
                  required
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 font-mono text-sm text-[#14201A]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                  Target Pengolahan (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={targetDiversion}
                  onChange={(e) => setTargetDiversion(e.target.value)}
                  className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 font-mono text-sm text-[#14201A]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                  Alamat Sekolah
                </label>
                <input
                  type="text"
                  value={schoolAddress}
                  onChange={(e) => setSchoolAddress(e.target.value)}
                  placeholder="Masukkan alamat sekolah"
                  className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 text-sm text-[#14201A]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                    Prefix Sampah
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    required
                    value={wastePrefix}
                    onChange={(e) => setWastePrefix(e.target.value)}
                    className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 font-mono text-sm text-[#14201A]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                    Prefix Olah
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    required
                    value={procPrefix}
                    onChange={(e) => setProcPrefix(e.target.value)}
                    className="w-full rounded-lg border border-[#CFDAD2] px-3 py-2 font-mono text-sm text-[#14201A]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-[#E6ECE7] pt-4">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-white hover:bg-[#132A1F]"
              >
                <Save className="h-4 w-4" />
                <span>Simpan Pengaturan Sistem</span>
              </button>
            </div>
          </form>
        </section>
      )}

      <ConfirmDialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={handleResetData}
        title="Kosongkan Data Operasional?"
        message="Seluruh data sampah, pengolahan, kategori, kegiatan, dan akun pengguna selain akun Administrator Anda akan dikosongkan ke kondisi awal (0)."
        confirmLabel="Ya, Kosongkan Data"
        destructive
      />

      <ConfirmDialog
        open={wipeAccountsOpen}
        onClose={() => setWipeAccountsOpen(false)}
        onConfirm={handleWipeAllAccounts}
        title="Hapus Semua Akun & Reset Total?"
        message="Seluruh akun (termasuk akun Admin Anda, Petugas, dan Siswa) serta seluruh data operasional akan dihapus permanen. Anda akan langsung keluar ke halaman Login awal."
        confirmLabel="Ya, Hapus Semua Akun"
        destructive
      />
    </div>
  );
};
