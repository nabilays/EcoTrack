import React, { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  FolderKanban,
  Leaf,
  Loader2,
  Plus,
  Recycle,
  Scale,
  Users,
} from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';
import { ProcessingStatus, UserRole, WasteType } from '../types';
import { formatDateId, formatDateTimeId, formatNumber, formatWeight } from '../utils/formatters';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';

const KpiItem: React.FC<{
  label: string;
  value: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
}> = ({ label, value, subtext, icon: Icon }) => (
  <div className="rounded-xl border border-[#DCE4DE] bg-white p-5">
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs font-medium text-[#55665C]">{label}</p>
      <Icon className="h-4 w-4 shrink-0 text-[#52796F]" />
    </div>
    <p className="mt-2.5 font-mono text-2xl font-semibold tracking-tight text-[#14201A] tabular-nums">
      {value}
    </p>
    <p className="mt-1 text-xs text-[#6B7D72]">{subtext}</p>
  </div>
);

export const DashboardPage: React.FC = () => {
  const {
    currentUser,
    metrics,
    categories,
    wasteRecords,
    processingRecords,
    activities,
    articles,
    events,
    getWasteAllocation,
    addWasteRecord,
    navigateTo,
    pushToast,
    settings,
  } = useEcoTrack();

  // Quick Entry form state for Petugas
  const [quickName, setQuickName] = useState('');
  const [quickCategoryId, setQuickCategoryId] = useState(categories[0]?.id || '');
  const [quickWeight, setQuickWeight] = useState('');
  const [quickLocation, setQuickLocation] = useState('');
  const [quickDate, setQuickDate] = useState('2026-11-14');

  if (!currentUser) return null;

  const organicPercent =
    metrics.totalWasteKg > 0
      ? Number(((metrics.organicKg / metrics.totalWasteKg) * 100).toFixed(1))
      : 0;
  const inorganicPercent =
    metrics.totalWasteKg > 0
      ? Number(((metrics.inorganicKg / metrics.totalWasteKg) * 100).toFixed(1))
      : 0;

  const pieData = [
    { name: 'Organik', value: metrics.organicKg, color: '#2D6A4F' },
    { name: 'Anorganik', value: metrics.inorganicKg, color: '#74A58E' },
  ];

  const statusCounts = {
    menunggu: processingRecords.filter((p) => p.status === ProcessingStatus.MENUNGGU).length,
    diproses: processingRecords.filter((p) => p.status === ProcessingStatus.DIPROSES).length,
    selesai: processingRecords.filter((p) => p.status === ProcessingStatus.SELESAI).length,
  };

  const pendingWasteItems = wasteRecords
    .map((w) => ({ record: w, alloc: getWasteAllocation(w.id) }))
    .filter((item) => item.alloc.remainingWeightKg > 0);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categories.find((c) => c.id === quickCategoryId);
    const res = addWasteRecord({
      name: quickName.trim(),
      categoryId: quickCategoryId,
      type: cat?.type || WasteType.ORGANIK,
      weightKg: Number(quickWeight),
      sourceLocation: quickLocation.trim(),
      recordedAt: quickDate,
      notes: 'Dicatat melalui form pencatatan cepat.',
    });

    if (res.success && res.data) {
      pushToast('success', `Sampah "${res.data.code}" berhasil dicatat.`);
      setQuickName('');
      setQuickWeight('');
      setQuickLocation('');
    } else {
      pushToast('error', res.message || 'Gagal mencatat sampah.');
    }
  };

  // ==================== ADMIN DASHBOARD ====================
  if (currentUser.role === UserRole.ADMIN) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiItem
            label="Total Terkumpul"
            value={formatWeight(metrics.totalWasteKg)}
            subtext={`${wasteRecords.length} catatan masuk`}
            icon={Scale}
          />
          <KpiItem
            label="Sampah Organik"
            value={formatWeight(metrics.organicKg)}
            subtext={`${organicPercent}% dari total`}
            icon={Leaf}
          />
          <KpiItem
            label="Sampah Anorganik"
            value={formatWeight(metrics.inorganicKg)}
            subtext={`${inorganicPercent}% dari total`}
            icon={Recycle}
          />
          <KpiItem
            label="Sudah Diolah"
            value={formatWeight(metrics.processedDoneKg)}
            subtext={`Target ${settings.targetDiversionPercent}% diversi`}
            icon={CheckCircle2}
          />
          <KpiItem
            label="Kategori Sampah"
            value={String(metrics.totalCategories)}
            subtext="Organik & Anorganik"
            icon={FolderKanban}
          />
          <KpiItem
            label="Pengguna Aktif"
            value={String(metrics.activeUsersCount)}
            subtext="Admin, Petugas & Siswa"
            icon={Users}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="rounded-xl border border-[#DCE4DE] bg-white p-5 lg:col-span-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-[#14201A]">
                  Tren Sampah Bulanan Sekolah
                </h2>
                <p className="text-xs text-[#55665C]">
                  Perbandingan sampah masuk (organik & anorganik) serta volume selesai diolah (kg)
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('reports')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1B4332] hover:underline whitespace-nowrap"
              >
                <span>Lihat Laporan Lengkap</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.monthlySeries} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6ECE7" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#55665C' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#55665C' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#DCE4DE',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`${formatNumber(Number(val ?? 0))} kg`, undefined]}
                  />
                  <Bar dataKey="organik" name="Organik" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="anorganik" name="Anorganik" fill="#74A58E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="diolah" name="Selesai Diolah" fill="#1B4332" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-xl border border-[#DCE4DE] bg-white p-5 lg:col-span-4">
            <h2 className="text-base font-semibold text-[#14201A]">
              Komposisi Organik vs Anorganik
            </h2>
            <p className="text-xs text-[#55665C]">Distribusi berat keseluruhan sampah masuk</p>
            <div className="mt-2 h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `${formatNumber(Number(val ?? 0))} kg`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-2 border-t border-[#E6ECE7] pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-[#3E4E45]">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#2D6A4F]" />
                  <span>Organik</span>
                </span>
                <span className="font-mono font-medium text-[#14201A] tabular-nums">
                  {formatWeight(metrics.organicKg)} ({organicPercent}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-[#3E4E45]">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#74A58E]" />
                  <span>Anorganik</span>
                </span>
                <span className="font-mono font-medium text-[#14201A] tabular-nums">
                  {formatWeight(metrics.inorganicKg)} ({inorganicPercent}%)
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Row: Processing Status Summary + Recent Activities */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="rounded-xl border border-[#DCE4DE] bg-white p-5 lg:col-span-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#14201A]">Ringkasan Status Pengolahan</h2>
              <button
                type="button"
                onClick={() => navigateTo('processing')}
                className="text-xs font-medium text-[#1B4332] hover:underline whitespace-nowrap"
              >
                Kelola Pengolahan
              </button>
            </div>
            <div className="mt-4 divide-y divide-[#E6ECE7]">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-[#475569]" />
                  <div>
                    <p className="text-sm font-medium text-[#14201A]">Menunggu</p>
                    <p className="text-xs text-[#55665C]">{statusCounts.menunggu} batch terjadwal</p>
                  </div>
                </div>
                <span className="font-mono text-sm font-semibold text-[#14201A] tabular-nums">
                  {formatWeight(metrics.processingWaitingKg)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5">
                  <Loader2 className="h-4 w-4 text-[#B45309]" />
                  <div>
                    <p className="text-sm font-medium text-[#14201A]">Diproses</p>
                    <p className="text-xs text-[#55665C]">{statusCounts.diproses} batch berjalan</p>
                  </div>
                </div>
                <span className="font-mono text-sm font-semibold text-[#B45309] tabular-nums">
                  {formatWeight(metrics.processingInProgressKg)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#15803D]" />
                  <div>
                    <p className="text-sm font-medium text-[#14201A]">Selesai</p>
                    <p className="text-xs text-[#55665C]">{statusCounts.selesai} batch tuntas</p>
                  </div>
                </div>
                <span className="font-mono text-sm font-semibold text-[#15803D] tabular-nums">
                  {formatWeight(metrics.processedDoneKg)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3">
                <p className="text-xs text-[#55665C]">Sisa sampah masuk belum dialokasikan</p>
                <span className="font-mono text-sm font-medium text-[#14201A] tabular-nums">
                  {formatWeight(metrics.unallocatedWasteKg)}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#DCE4DE] bg-white p-5 lg:col-span-7">
            <h2 className="text-base font-semibold text-[#14201A]">Aktivitas Terbaru</h2>
            <p className="text-xs text-[#55665C]">Log pencatatan, pengolahan, dan pembaruan sistem</p>
            <div className="mt-4 divide-y divide-[#E6ECE7]">
              {activities.slice(0, 5).map((act) => (
                <div key={act.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm text-[#14201A]">
                      <span className="font-medium">{act.actorName}</span>{' '}
                      <span className="text-[#55665C]">{act.action.toLowerCase()}</span>
                    </p>
                    <p className="truncate text-xs text-[#2D6A4F]">{act.target}</p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-[#6B7D72] tabular-nums">
                    {formatDateTimeId(act.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ==================== PETUGAS DASHBOARD ====================
  if (currentUser.role === UserRole.PETUGAS) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiItem
            label="Total Sampah Dicatat"
            value={formatWeight(metrics.totalWasteKg)}
            subtext={`${wasteRecords.length} catatan masuk`}
            icon={Scale}
          />
          <KpiItem
            label="Belum Diproses"
            value={formatWeight(metrics.unallocatedWasteKg + metrics.processingWaitingKg)}
            subtext={`${pendingWasteItems.length} item perlu alokasi`}
            icon={Clock}
          />
          <KpiItem
            label="Sedang Diproses"
            value={formatWeight(metrics.processingInProgressKg)}
            subtext={`${statusCounts.diproses} batch berjalan`}
            icon={Loader2}
          />
          <KpiItem
            label="Selesai Diolah"
            value={formatWeight(metrics.processedDoneKg)}
            subtext={`${statusCounts.selesai} batch tuntas`}
            icon={CheckCircle2}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Quick Entry Form */}
          <section className="rounded-xl border border-[#DCE4DE] bg-white p-5 lg:col-span-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#14201A]">Pencatatan Sampah Cepat</h2>
                <p className="text-xs text-[#55665C]">Input langsung sampah masuk hari ini</p>
              </div>
              <Plus className="h-4 w-4 text-[#2D6A4F]" />
            </div>

            <form onSubmit={handleQuickAdd} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                  Nama Sampah
                </label>
                <input
                  type="text"
                  required
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  placeholder="Contoh: Sisa makanan kantin pagi"
                  className="w-full rounded-lg border border-[#CFDAD2] bg-white px-3 py-2 text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                    Kategori
                  </label>
                  <select
                    value={quickCategoryId}
                    onChange={(e) => setQuickCategoryId(e.target.value)}
                    className="w-full rounded-lg border border-[#CFDAD2] bg-white px-3 py-2 text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.type === WasteType.ORGANIK ? 'Organik' : 'Anorganik'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                    Berat (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={quickWeight}
                    onChange={(e) => setQuickWeight(e.target.value)}
                    placeholder="12.5"
                    className="w-full rounded-lg border border-[#CFDAD2] bg-white px-3 py-2 font-mono text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                    Lokasi / Sumber
                  </label>
                  <input
                    type="text"
                    required
                    value={quickLocation}
                    onChange={(e) => setQuickLocation(e.target.value)}
                    placeholder="Kantin Blok A"
                    className="w-full rounded-lg border border-[#CFDAD2] bg-white px-3 py-2 text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#3E4E45]">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={quickDate}
                    onChange={(e) => setQuickDate(e.target.value)}
                    className="w-full rounded-lg border border-[#CFDAD2] bg-white px-3 py-2 font-mono text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[#1B4332] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#132A1F]"
              >
                Simpan Catatan Sampah
              </button>
            </form>
          </section>

          {/* Operational Queue */}
          <section className="rounded-xl border border-[#DCE4DE] bg-white p-5 lg:col-span-7">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-[#14201A]">
                  Ringkasan Pekerjaan Operasional
                </h2>
                <p className="text-xs text-[#55665C]">
                  Sampah masuk yang masih memiliki sisa berat siap diolah
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('processing')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8E2DC] px-3 py-1.5 text-xs font-medium text-[#1B4332] hover:bg-[#EDF2EE] whitespace-nowrap shrink-0"
              >
                <span>Buka Pengolahan</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {pendingWasteItems.length === 0 ? (
              <div className="rounded-lg bg-[#F6F8F6] p-6 text-center text-sm text-[#55665C]">
                Seluruh sampah masuk sudah dialokasikan ke dalam jadwal pengolahan.
              </div>
            ) : (
              <div className="divide-y divide-[#E6ECE7]">
                {pendingWasteItems.slice(0, 5).map(({ record, alloc }) => (
                  <div
                    key={record.id}
                    className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-[#55665C]">
                        <span className="font-mono font-medium text-[#1B4332]">{record.code}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatDateId(record.recordedAt)}</span>
                      </div>
                      <p className="truncate text-sm font-medium text-[#14201A]">{record.name}</p>
                      <p className="text-xs text-[#55665C]">{record.sourceLocation}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="font-mono text-sm font-semibold text-[#B45309] tabular-nums">
                          {formatWeight(alloc.remainingWeightKg)} tersisa
                        </p>
                        <p className="font-mono text-xs text-[#6B7D72] tabular-nums">
                          dari {formatWeight(alloc.initialWeightKg)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigateTo('processing')}
                        className="rounded-lg bg-[#EDF2EE] px-3 py-1.5 text-xs font-medium text-[#1B4332] hover:bg-[#DCE7DF] whitespace-nowrap"
                      >
                        Proses
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Recent Activities */}
        <section className="rounded-xl border border-[#DCE4DE] bg-white p-5">
          <h2 className="text-base font-semibold text-[#14201A]">Aktivitas Operasional Terbaru</h2>
          <div className="mt-3 divide-y divide-[#E6ECE7]">
            {activities.slice(0, 5).map((act) => (
              <div
                key={act.id}
                className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm">
                  <span className="font-medium text-[#14201A]">{act.actorName}</span>{' '}
                  <span className="text-[#55665C]">{act.action.toLowerCase()}</span>{' '}
                  <span className="text-[#2D6A4F]">— {act.target}</span>
                </div>
                <span className="font-mono text-xs text-[#6B7D72] tabular-nums">
                  {formatDateTimeId(act.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // ==================== SISWA DASHBOARD ====================
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiItem
          label="Total Sampah Dikelola Sekolah"
          value={formatWeight(metrics.totalWasteKg)}
          subtext={`${formatWeight(metrics.processedDoneKg)} selesai diolah`}
          icon={Scale}
        />
        <KpiItem
          label="Persentase Sampah Organik"
          value={`${organicPercent}%`}
          subtext={`${formatWeight(metrics.organicKg)} sisa makanan, daun & kulit buah`}
          icon={Leaf}
        />
        <KpiItem
          label="Persentase Sampah Anorganik"
          value={`${inorganicPercent}%`}
          subtext={`${formatWeight(metrics.inorganicKg)} plastik, kertas, kaca & logam`}
          icon={Recycle}
        />
      </div>

      {/* Chart + Tips */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-[#DCE4DE] bg-white p-5 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#14201A]">
                Perkembangan Pengelolaan Sampah Sekolah
              </h2>
              <p className="text-xs text-[#55665C]">
                Total sampah masuk dan volume yang berhasil diolah setiap bulan
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('reports')}
              className="text-xs font-medium text-[#1B4332] hover:underline whitespace-nowrap"
            >
              Statistik Lengkap
            </button>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.monthlySeries} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6ECE7" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#55665C' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#55665C' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val) => `${formatNumber(Number(val ?? 0))} kg`} />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Sampah Masuk"
                  stroke="#52796F"
                  fill="#D8E2DC"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="diolah"
                  name="Selesai Diolah"
                  stroke="#1B4332"
                  fill="#95D5B2"
                  fillOpacity={0.45}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-[#DCE4DE] bg-white p-5 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#14201A]">Tips Pemilahan Sampah</h2>
            <button
              type="button"
              onClick={() => navigateTo('education')}
              className="text-xs font-medium text-[#1B4332] hover:underline whitespace-nowrap"
            >
              Buka Edukasi
            </button>
          </div>
          <div className="mt-4 divide-y divide-[#E6ECE7]">
            {articles.slice(0, 3).map((art) => (
              <div key={art.id} className="py-3">
                <p className="text-xs font-medium text-[#2D6A4F]">
                  {art.category} · {art.readTime}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[#14201A]">{art.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#55665C]">{art.summary}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Categories Overview + School Eco Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-[#DCE4DE] bg-white p-5 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#14201A]">Informasi Kategori Sampah</h2>
            <button
              type="button"
              onClick={() => navigateTo('categories')}
              className="text-xs font-medium text-[#1B4332] hover:underline whitespace-nowrap"
            >
              Semua Kategori
            </button>
          </div>
          <div className="mt-3 divide-y divide-[#E6ECE7]">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <span className="font-medium text-[#14201A]">{cat.name}</span>
                  <span className="ml-2 text-xs text-[#6B7D72]">
                    ({cat.type === WasteType.ORGANIK ? 'Organik' : 'Anorganik'})
                  </span>
                </div>
                <span className="text-xs text-[#55665C]">{cat.standardMethod}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#DCE4DE] bg-white p-5 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#14201A]">Kegiatan Lingkungan Sekolah</h2>
            <button
              type="button"
              onClick={() => navigateTo('events')}
              className="text-xs font-medium text-[#1B4332] hover:underline whitespace-nowrap"
            >
              Lihat Agenda
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {events.slice(0, 2).map((evt) => (
              <div key={evt.id} className="overflow-hidden rounded-xl border border-[#E6ECE7] bg-[#FAFBF9]">
                <ImageWithFallback
                  src={evt.imageUrl}
                  alt={evt.title}
                  className="h-32 w-full object-cover"
                  fallbackLabel={evt.title}
                />
                <div className="p-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-[#2D6A4F]">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span className="font-mono">{formatDateId(evt.date)}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#14201A]">{evt.title}</p>
                  <p className="mt-1 text-xs text-[#55665C]">{evt.location}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
