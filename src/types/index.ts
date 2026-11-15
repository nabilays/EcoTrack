export enum UserRole {
  ADMIN = 'ADMIN',
  PETUGAS = 'PETUGAS',
  SISWA = 'SISWA',
}

export enum WasteType {
  ORGANIK = 'ORGANIK',
  ANORGANIK = 'ANORGANIK',
}

export enum ProcessingStatus {
  MENUNGGU = 'Menunggu',
  DIPROSES = 'Diproses',
  SELESAI = 'Selesai',
}

export enum UserStatus {
  AKTIF = 'Aktif',
  NONAKTIF = 'Nonaktif',
}

export type AppRoute =
  | 'dashboard'
  | 'waste-data'
  | 'categories'
  | 'processing'
  | 'reports'
  | 'users'
  | 'education'
  | 'events'
  | 'profile';

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  classOrUnit?: string;
  createdAt: string;
}

export type PublicUser = Omit<User, 'password'>;

export interface WasteCategory {
  id: string;
  code: string;
  type: WasteType;
  name: string;
  description: string;
  standardMethod: string;
  createdAt: string;
}

export interface WasteRecord {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  type: WasteType;
  weightKg: number;
  sourceLocation: string;
  recordedAt: string; // YYYY-MM-DD
  officerId: string;
  officerName: string;
  notes: string;
  createdAt: string;
}

export interface ProcessingRecord {
  id: string;
  code: string;
  wasteRecordId: string;
  processedWeightKg: number;
  method: string;
  result: string;
  status: ProcessingStatus;
  processedAt: string; // YYYY-MM-DD
  officerName: string;
  notes?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  target: string;
  timestamp: string;
}

export interface EducationArticle {
  id: string;
  title: string;
  category: 'Pemilahan' | 'Komposting' | 'Daur Ulang' | 'Kebijakan Sekolah';
  readTime: string;
  summary: string;
  steps: string[];
  impactFact: string;
}

export interface SchoolEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  description: string;
  targetParticipants: string;
  imageUrl?: string;
  registeredUserIds: string[];
}

export interface SystemSettings {
  schoolName: string;
  schoolAddress: string;
  academicYear: string;
  targetDiversionPercent: number;
  wasteCodePrefix: string;
  processingCodePrefix: string;
  autoAssignOfficer: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode: number;
}
