import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';
import { EcoTrackLogo } from '../components/ui/EcoTrackLogo';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@ecotrack.test', desc: 'Akses penuh sistem & manajemen akun' },
  { role: 'Petugas', email: 'petugas@ecotrack.test', desc: 'Operasional pencatatan & pengolahan' },
  { role: 'Siswa', email: 'siswa@ecotrack.test', desc: 'Statistik, edukasi & kegiatan sekolah' },
];

export const LoginPage: React.FC = () => {
  const { login } = useEcoTrack();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Masukkan username atau email sekolah Anda.');
      return;
    }
    if (!password) {
      setErrorMessage('Masukkan password akun Anda.');
      return;
    }

    const res = login(identifier, password, rememberMe);
    if (!res.success) {
      setErrorMessage(res.message || 'Gagal masuk ke sistem.');
    }
  };

  const handleQuickFill = (email: string) => {
    setIdentifier(email);
    setPassword('EcoTrack123!');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#F6F8F6] lg:grid lg:grid-cols-12">
      {/* Left Area: Editorial Facility Showcase */}
      <div className="relative flex min-h-[300px] flex-col justify-between overflow-hidden bg-[#132A1F] p-6 sm:p-10 lg:col-span-6 lg:min-h-screen lg:p-12 xl:col-span-7">
        <ImageWithFallback
          src="/src/assets/images/login_school_facility_1794675658837.jpg"
          alt="Fasilitas pemilahan sampah dan area hijau sekolah EcoTrack"
          className="absolute inset-0 h-full w-full object-cover"
          fallbackLabel="EcoTrack School Campus"
        />
        {/* Measured Dark Forest Green Overlay Scrim */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#132A1F]/95 via-[#1B4332]/75 to-[#1B4332]/60"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <EcoTrackLogo variant="light" showTagline />
        </div>

        <div className="relative z-10 mt-10 max-w-xl">
          <p className="text-xs font-medium tracking-wide text-[#B7E4C7]">
            Sistem Pengelolaan Sampah Sekolah Terpadu
          </p>
          <h1 className="mt-3 font-display text-2xl font-bold leading-tight text-white sm:text-4xl [text-wrap:balance]">
            Building a Cleaner and Greener School Together
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/85 sm:text-base">
            Catat timbulan sampah harian, pantau pemilahan organik dan anorganik, kelola proses
            komposting maupun bank sampah, serta hasilkan laporan sekolah secara terukur.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/20 pt-6">
            <div>
              <p className="font-mono text-xl font-semibold text-white tabular-nums">7 Kategori</p>
              <p className="mt-0.5 text-xs text-white/75">Standar Organik & Anorganik</p>
            </div>
            <div>
              <p className="font-mono text-xl font-semibold text-white tabular-nums">3 Peran</p>
              <p className="mt-0.5 text-xs text-white/75">Admin, Petugas & Siswa</p>
            </div>
            <div>
              <p className="font-mono text-xl font-semibold text-white tabular-nums">PDF & Excel</p>
              <p className="mt-0.5 text-xs text-white/75">Ekspor Laporan Terstruktur</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-8 hidden text-xs text-white/65 lg:block">
          EcoTrack · Smart School Waste Management
        </div>
      </div>

      {/* Right Area: Clean Login Form */}
      <div className="flex flex-col justify-center bg-[#FAFBF9] px-6 py-10 sm:px-12 lg:col-span-6 lg:px-14 xl:col-span-5">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#14201A] sm:text-3xl">
              Welcome Back!
            </h2>
            <p className="mt-2 text-sm text-[#55665C]">
              Masuk menggunakan akun resmi sekolah yang telah didaftarkan oleh Administrator.
            </p>
          </div>

          {errorMessage && (
            <div
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-identifier"
                className="mb-1.5 block text-sm font-medium text-[#14201A]"
              >
                Username atau Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#6B7D72]" />
                <input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="contoh: admin@ecotrack.test"
                  className="w-full rounded-lg border border-[#CFDAD2] bg-white py-2.5 pr-4 pl-10 text-sm text-[#14201A] placeholder:text-[#8A9990] focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/15 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-sm font-medium text-[#14201A]"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#6B7D72]" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full rounded-lg border border-[#CFDAD2] bg-white py-2.5 pr-11 pl-10 text-sm text-[#14201A] placeholder:text-[#8A9990] focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/15 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1.5 text-[#55665C] hover:bg-[#EDF2EE] hover:text-[#14201A]"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#3E4E45]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[#CFDAD2] text-[#1B4332] focus:ring-[#2D6A4F]"
                />
                <span>Remember Me</span>
              </label>
              <span className="text-xs text-[#6B7D72]">Akun dikelola Admin</span>
            </div>

            <button
              type="submit"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#132A1F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
            >
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Demo Accounts Box */}
          <div className="mt-8 rounded-xl border border-[#D8E2DC] bg-white p-4">
            <div className="flex items-center justify-between gap-2 border-b border-[#E6ECE7] pb-2.5">
              <p className="text-xs font-semibold text-[#14201A]">Akun Demo Prototipe</p>
              <span className="font-mono text-xs text-[#2D6A4F]">Pass: EcoTrack123!</span>
            </div>
            <div className="mt-3 space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickFill(acc.email)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-transparent bg-[#F6F8F6] px-3 py-2 text-left transition-colors hover:border-[#C5D6CA] hover:bg-[#EDF2EE]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-[#1B4332]">{acc.role}</span>
                      <span aria-hidden="true" className="text-[#8A9990]">
                        ·
                      </span>
                      <span className="truncate font-mono text-[#3E4E45]">{acc.email}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[#55665C]">{acc.desc}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-[#2D6A4F]">Isi</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#6B7D72]">
              Catatan: Autentikasi demo hanya untuk pengujian prototipe frontend, bukan autentikasi
              produksi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
