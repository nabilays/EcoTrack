import React from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileSpreadsheet,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Recycle,
  Settings,
  Trash2,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { useEcoTrack } from '../../context/EcoTrackContext';
import { AppRoute, UserRole } from '../../types';
import { EcoTrackLogo } from '../ui/EcoTrackLogo';

interface NavItem {
  route: AppRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  [UserRole.ADMIN]: [
    { route: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { route: 'waste-data', label: 'Data Sampah', icon: Trash2 },
    { route: 'categories', label: 'Kategori Sampah', icon: FolderKanban },
    { route: 'processing', label: 'Pengolahan', icon: Recycle },
    { route: 'reports', label: 'Laporan', icon: FileSpreadsheet },
    { route: 'users', label: 'Manajemen Pengguna', icon: Users },
    { route: 'profile', label: 'Pengaturan', icon: Settings },
  ],
  [UserRole.PETUGAS]: [
    { route: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { route: 'waste-data', label: 'Data Sampah', icon: Trash2 },
    { route: 'categories', label: 'Kategori Sampah', icon: FolderKanban },
    { route: 'processing', label: 'Pengolahan', icon: Recycle },
    { route: 'reports', label: 'Laporan Operasional', icon: FileSpreadsheet },
  ],
  [UserRole.SISWA]: [
    { route: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { route: 'reports', label: 'Statistik Sampah', icon: BarChart3 },
    { route: 'categories', label: 'Kategori Sampah', icon: FolderKanban },
    { route: 'education', label: 'Edukasi Lingkungan', icon: BookOpen },
    { route: 'events', label: 'Kegiatan Sekolah', icon: CalendarDays },
  ],
};

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { currentUser, activeRoute, navigateTo, logout, settings } = useEcoTrack();
  if (!currentUser) return null;

  const navItems = NAV_BY_ROLE[currentUser.role] || [];

  const handleNav = (route: AppRoute) => {
    navigateTo(route);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-[#DCE4DE] bg-white">
      <div className="flex items-center justify-between border-b border-[#E6ECE7] px-5 py-4">
        <EcoTrackLogo variant="dark" showTagline />
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-1.5 text-[#55665C] hover:bg-[#EDF2EE] lg:hidden"
          aria-label="Tutup menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="border-b border-[#E6ECE7] px-5 py-3">
        <p className="truncate text-xs font-medium text-[#55665C]">{settings.schoolName}</p>
        <p className="mt-0.5 text-xs text-[#708277]">Tahun Ajaran {settings.academicYear}</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Navigasi utama">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === item.route;
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => handleNav(item.route)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#1B4332] text-white'
                  : 'text-[#3E4E45] hover:bg-[#EDF2EE] hover:text-[#14201A]'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-[#52796F]'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-[#E6ECE7] p-3 space-y-1">
        {currentUser.role !== UserRole.ADMIN && (
          <button
            type="button"
            onClick={() => handleNav('profile')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors whitespace-nowrap ${
              activeRoute === 'profile'
                ? 'bg-[#1B4332] text-white'
                : 'text-[#3E4E45] hover:bg-[#EDF2EE] hover:text-[#14201A]'
            }`}
          >
            <UserCircle
              className={`h-4 w-4 shrink-0 ${
                activeRoute === 'profile' ? 'text-white' : 'text-[#52796F]'
              }`}
            />
            <span>Profil Saya</span>
          </button>
        )}
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-[#7F1D1D] transition-colors hover:bg-red-50 whitespace-nowrap"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-[260px] shrink-0 lg:block">{sidebarContent}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#14201A]/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-50 w-[268px] max-w-[85vw]">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
};
