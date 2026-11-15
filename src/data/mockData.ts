import {
  ActivityLog,
  EducationArticle,
  ProcessingRecord,
  SchoolEvent,
  SystemSettings,
  User,
  WasteCategory,
  WasteRecord,
} from '../types';

export const SEED_USERS: User[] = [];

export const SEED_CATEGORIES: WasteCategory[] = [];

export const SEED_WASTE_RECORDS: WasteRecord[] = [];

export const SEED_PROCESSING_RECORDS: ProcessingRecord[] = [];

export const SEED_ACTIVITIES: ActivityLog[] = [];

export const SEED_EVENTS: SchoolEvent[] = [];

export const SEED_EDUCATION_ARTICLES: EducationArticle[] = [
  {
    id: 'edu-1',
    title: 'Panduan Pemilahan 3 Tempat Sampah Sekolah',
    category: 'Pemilahan',
    readTime: 'Panduan Dasar',
    summary:
      'Memisahkan sampah sejak dari sumber di ruang kelas dan kantin menjaga material daur ulang tetap bersih dan mudah diolah.',
    steps: [
      'Wadah Organik: Khusus sisa makanan bebas bungkus plastik, daun kering, dan kulit buah.',
      'Wadah Anorganik: Khusus botol plastik kosong yang sudah dikosongkan, kertas bersih, kaleng, dan kaca utuh.',
      'Wadah Residu: Khusus tisu bekas, bungkus makanan berminyak, atau kemasan berlapis aluminium foil.',
    ],
    impactFact: 'Pemilahan dari sumber memudahkan proses komposting dan penyetoran bank sampah.',
  },
  {
    id: 'edu-2',
    title: 'Pengolahan Sampah Organik Menjadi Kompos & Eco-Enzyme',
    category: 'Komposting',
    readTime: 'Panduan Pengolahan',
    summary:
      'Sisa sayuran, kulit buah segar, dan guguran daun taman dapat dimanfaatkan kembali menjadi pupuk kompos atau cairan fermentasi.',
    steps: [
      'Pisahkan sampah organik dari plastik, karet, atau benda logam sebelum dimasukkan ke bak kompos.',
      'Campurkan sampah hijau (sisa makanan/buah) dengan sampah cokelat (daun kering) agar kelembapan seimbang.',
      'Catat berat awal dan hasil pengolahan secara berkala melalui modul Pengolahan EcoTrack.',
    ],
    impactFact: 'Pengomposan terstruktur menekan volume sampah organik yang berakhir di tempat pembuangan akhir.',
  },
  {
    id: 'edu-3',
    title: 'Persiapan Penyetoran Sampah Anorganik',
    category: 'Daur Ulang',
    readTime: 'Panduan Daur Ulang',
    summary:
      'Material plastik, kertas, kaca, dan logam perlu dipastikan dalam keadaan kering dan terpilah sebelum diolah atau disetor.',
    steps: [
      'Kosongkan sisa cairan pada botol plastik dan kaleng, lalu bilas ringan.',
      'Lipat kardus dan ikat kertas secara terpisah agar tidak bercampur dengan sampah basah.',
      'Simpan wadah kaca pada kotak pelindung terpisah demi keamanan petugas.',
    ],
    impactFact: 'Material anorganik yang bersih memiliki nilai guna ulang lebih tinggi.',
  },
];

export const SEED_SETTINGS: SystemSettings = {
  schoolName: 'EcoTrack School',
  schoolAddress: '',
  academicYear: '2026 / 2027',
  targetDiversionPercent: 0,
  wasteCodePrefix: 'SMP',
  processingCodePrefix: 'PR',
  autoAssignOfficer: true,
};
