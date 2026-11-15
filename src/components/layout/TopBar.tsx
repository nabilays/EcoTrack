import React from 'react';
import { Menu } from 'lucide-react';
import { useEcoTrack } from '../../context/EcoTrackContext';
import { AppRoute, UserRole } from '../../types';

const ROUTE_TITLES: Record<AppRoute, Record<UserRole, string>> = {
  dashboard: {
    ADMIN: 'Dashboard Administrator',
    PETUGAS: 'Dashboard Operasional',
    SISWA: 'Dashboard Lingkungan Sekolah',
  },
  'waste-data': {
    ADMIN: 'Data Sampah Masuk',
    PETUGAS: 'Data Sampah Masuk',
    SISWA: 'Data Sampah',
  },
  categories: {
    ADMIN: 'Kategori Sampah',
    PETUGAS: 'Kategori Sampah',
    SISWA: 'Kategori Sampah Sekolah',
  },
  processing: {
    ADMIN: 'Pengolahan Sampah',
    PETUGAS: 'Pengolahan Sampah',
    SISWA: 'Pengolahan Sampah',
  },
  reports: {
    ADMIN: 'Laporan Pengelolaan Sampah',
    PETUGAS: 'Laporan Operasional',
    SISWA: 'Statistik Sampah Sekolah',
  },
  users: {
    ADMIN: 'Manajemen Pengguna',
    PETUGAS: 'Manajemen Pengguna',
    SISWA: 'Manajemen Pengguna',
  },
  education: {
    ADMIN: 'Edukasi Lingkungan',
    PETUGAS: 'Edukasi Lingkungan',
    SISWA: 'Edukasi Lingkungan & Pemilahan',
  },
  events: {
    ADMIN: 'Kegiatan Sekolah',
    PETUGAS: 'Kegiatan Sekolah',
    SISWA: 'Kegiatan Lingkungan Sekolah',
  },
  profile: {
    ADMIN: 'Pengaturan & Profil',
    PETUGAS: 'Profil Pengguna',
    SISWA: 'Profil Siswa',
  },
};

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  PETUGAS: 'Petugas Operasional',
  SISWA: 'Siswa',
};

interface TopBarProps {
  onOpenMobileMenu: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileMenu }) => {
  const { currentUser, activeRoute, navigateTo } = useEcoTrack();
  if (!currentUser) return null;

  const pageTitle = ROUTE_TITLES[activeRoute]?.[currentUser.role] || 'EcoTrack';

  const initials = currentUser.fullName
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[#DCE4DE] bg-white px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-[#3E4E45] hover:bg-[#EDF2EE] lg:hidden"
          aria-label="Buka menu navigasi"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-[#55665C]">
            <span>EcoTrack</span>
            <span aria-hidden="true">/</span>
            <span className="truncate font-medium text-[#2D6A4F]">{pageTitle}</span>
          </div>
          <h1 className="truncate text-base font-semibold text-[#14201A] sm:text-lg">
            {pageTitle}
          </h1>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigateTo('profile')}
        className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[#F6F8F6] shrink-0"
      >
        <div className="hidden text-right sm:block">
          <p className="max-w-[180px] truncate text-sm font-medium text-[#14201A]">
            {currentUser.fullName}
          </p>
          <p className="text-xs text-[#55665C]">{ROLE_LABELS[currentUser.role]}</p>
        </div>
        {currentUser.avatarUrl ? (
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.fullName}
            referrerPolicy="no-referrer"
            className="h-9 w-9 rounded-lg border border-[#D8E2DC] object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EDF2EE] text-xs font-semibold text-[#1B4332]">
            {initials}
          </div>
        )}
      </button>
    </header>
  );
};
