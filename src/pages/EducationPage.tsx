import React, { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, HelpCircle, Search, XCircle } from 'lucide-react';
import { useEcoTrack } from '../context/EcoTrackContext';

const SORTING_CHALLENGES = [
  {
    item: 'Kulit jeruk & sisa potongan buah kantin',
    answer: 'Organik',
    reason: 'Mudah terurai dan dapat diolah menjadi eco-enzyme atau kompos.',
  },
  {
    item: 'Botol minum plastik PET kosong yang sudah dibilas',
    answer: 'Anorganik',
    reason: 'Dapat dicacah atau disetorkan ke Bank Sampah Sekolah.',
  },
  {
    item: 'Kertas HVS bekas ulangan yang tidak terpakai',
    answer: 'Anorganik',
    reason: 'Bernilai daur ulang tinggi jika tetap kering dan bebas minyak.',
  },
  {
    item: 'Guguran daun kering di taman halaman',
    answer: 'Organik',
    reason: 'Bahan utama kompos daun dan pengisi lubang resapan biopori.',
  },
];

export const EducationPage: React.FC = () => {
  const { articles } = useEcoTrack();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('ALL');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      if (catFilter !== 'ALL' && a.category !== catFilter) return false;
      if (q) {
        return (
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.steps.some((s) => s.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [articles, search, catFilter]);

  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#DCE4DE] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6B7D72]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari materi pemilahan atau komposting..."
            className="w-full rounded-lg border border-[#CFDAD2] py-2 pr-3 pl-9 text-sm text-[#14201A] focus:border-[#2D6A4F] focus:outline-none"
          />
        </div>
        <div className="inline-flex flex-wrap rounded-lg bg-[#EDF2EE] p-1">
          {['ALL', 'Pemilahan', 'Komposting', 'Daur Ulang', 'Kebijakan Sekolah'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCatFilter(cat)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                catFilter === cat
                  ? 'bg-white text-[#14201A] shadow-xs'
                  : 'text-[#55665C] hover:text-[#14201A]'
              }`}
            >
              {cat === 'ALL' ? 'Semua Topik' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filtered.map((art) => (
          <article key={art.id} className="rounded-xl border border-[#DCE4DE] bg-white p-5">
            <div className="flex items-center gap-2 text-xs text-[#2D6A4F]">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="font-medium">{art.category}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#55665C]">{art.readTime}</span>
            </div>
            <h2 className="mt-2 text-lg font-semibold text-[#14201A]">{art.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#55665C]">{art.summary}</p>

            <ol className="mt-4 space-y-2 border-t border-[#E6ECE7] pt-3 text-sm text-[#3E4E45]">
              {art.steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-semibold text-[#1B4332]">
                    0{idx + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <p className="mt-4 rounded-lg bg-[#F6F8F6] px-3.5 py-2.5 text-xs text-[#1B4332]">
              <span className="font-semibold">Dampak Nyata:</span> {art.impactFact}
            </p>
          </article>
        ))}
      </div>

      {/* Interactive Sorting Practice */}
      <section className="rounded-xl border border-[#DCE4DE] bg-white p-5">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-[#2D6A4F]" />
          <h2 className="text-base font-semibold text-[#14201A]">
            Latihan Cepat Pemilahan Sampah Sekolah
          </h2>
        </div>
        <p className="mt-1 text-xs text-[#55665C]">
          Pilih tempat sampah yang tepat untuk setiap contoh barang berikut.
        </p>

        <div className="mt-4 divide-y divide-[#E6ECE7]">
          {SORTING_CHALLENGES.map((ch, idx) => {
            const picked = selectedAnswers[idx];
            const isCorrect = picked === ch.answer;
            return (
              <div
                key={idx}
                className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#14201A]">{ch.item}</p>
                  {picked && (
                    <p
                      className={`mt-1 flex items-center gap-1.5 text-xs ${
                        isCorrect ? 'text-[#15803D]' : 'text-[#B91C1C]'
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span>
                        {isCorrect ? 'Tepat!' : `Kurang tepat (seharusnya ${ch.answer}).`}{' '}
                        {ch.reason}
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {(['Organik', 'Anorganik'] as const).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() =>
                        setSelectedAnswers((prev) => ({ ...prev, [idx]: choice }))
                      }
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                        picked === choice
                          ? choice === ch.answer
                            ? 'border-[#15803D] bg-[#EDF2EE] text-[#15803D]'
                            : 'border-red-300 bg-red-50 text-red-800'
                          : 'border-[#D8E2DC] bg-white text-[#3E4E45] hover:bg-[#F6F8F6]'
                      }`}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
