import React from 'react';
import { CalendarDays, CheckCircle2, Clock, MapPin, Users } from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';
import { formatDateId } from '../utils/formatters';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { DataErrorBanner, EmptyStatePanel } from '../components/ui/DataStateNotice';

export const EventsPage: React.FC = () => {
  const {
    currentUser,
    dataStatus,
    dataError,
    retryLoadData,
    events,
    toggleEventRsvp,
    pushToast,
  } = useEcoTrack();
  if (!currentUser) return null;

  const handleRsvp = (eventId: string, title: string, currentlyJoined: boolean) => {
    const res = toggleEventRsvp(eventId);
    if (res.success) {
      pushToast(
        'success',
        currentlyJoined
          ? `Keikutsertaan pada "${title}" dibatalkan.`
          : `Anda terdaftar mengikuti "${title}".`
      );
    } else {
      pushToast('error', res.message || 'Gagal memperbarui keikutsertaan.');
    }
  };

  return (
    <div className="space-y-6">
      {dataStatus === 'error' && dataError && (
        <DataErrorBanner message={dataError} onRetry={retryLoadData} />
      )}

      <div className="rounded-xl border border-[#DCE4DE] bg-white p-5">
        <h2 className="text-base font-semibold text-[#14201A]">
          Agenda Kegiatan Lingkungan Sekolah
        </h2>
        <p className="mt-1 text-sm text-[#55665C]">
          Program kolaboratif warga sekolah dalam mendukung pengurangan sampah dan pengelolaan Bank
          Sampah Sekolah.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-[#DCE4DE] bg-white p-6">
          <EmptyStatePanel
            title="Belum ada kegiatan sekolah"
            description="Saat ini belum ada jadwal kegiatan lingkungan sekolah yang dipublikasikan."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {events.map((evt) => {
            const isJoined = evt.registeredUserIds.includes(currentUser.id);
            return (
              <article
                key={evt.id}
                className="flex flex-col overflow-hidden rounded-xl border border-[#DCE4DE] bg-white"
              >
                <ImageWithFallback
                  src={evt.imageUrl}
                  alt={evt.title}
                  className="h-44 w-full object-cover"
                  fallbackLabel={evt.title}
                />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#2D6A4F]">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span className="font-mono">{formatDateId(evt.date)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{evt.organizer}</span>
                  </div>

                  <h3 className="mt-2 text-base font-semibold text-[#14201A]">{evt.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[#55665C]">
                    {evt.description}
                  </p>

                  <div className="mt-4 space-y-1.5 border-t border-[#E6ECE7] pt-3 text-xs text-[#3E4E45]">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-[#52796F]" />
                      <span>{evt.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#52796F]" />
                      <span>{evt.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 shrink-0 text-[#52796F]" />
                      <span>
                        {evt.targetParticipants} · {evt.registeredUserIds.length} terdaftar
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRsvp(evt.id, evt.title, isJoined)}
                    className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isJoined
                        ? 'border border-[#2D6A4F] bg-[#EDF2EE] text-[#1B4332] hover:bg-[#DCE7DF]'
                        : 'bg-[#1B4332] text-white hover:bg-[#132A1F]'
                    }`}
                  >
                    {isJoined && <CheckCircle2 className="h-4 w-4" />}
                    <span>{isJoined ? 'Terdaftar Mengikuti' : 'Daftar Ikuti Kegiatan'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
