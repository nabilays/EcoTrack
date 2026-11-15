import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  SEED_ACTIVITIES,
  SEED_CATEGORIES,
  SEED_EDUCATION_ARTICLES,
  SEED_EVENTS,
  SEED_PROCESSING_RECORDS,
  SEED_SETTINGS,
  SEED_USERS,
  SEED_WASTE_RECORDS,
} from '../data/mockData';
import { authorizeAction, canAccessRoute } from '../services/apiClient';
import {
  ActivityLog,
  ApiResponse,
  AppRoute,
  EducationArticle,
  ProcessingRecord,
  ProcessingStatus,
  PublicUser,
  SchoolEvent,
  SystemSettings,
  User,
  UserRole,
  UserStatus,
  WasteCategory,
  WasteRecord,
  WasteType,
} from '../types';
import {
  formatMonthShort,
  generateCategoryCode,
  generateProcessingCode,
  generateWasteCode,
  getMonthKey,
} from '../utils/formatters';

const STORAGE_KEY = 'ecotrack_app_db_v3';
const AUTH_LOCAL_KEY = 'ecotrack_auth_user_local_v3';
const AUTH_SESSION_KEY = 'ecotrack_auth_user_session_v3';

interface PersistedDb {
  users: User[];
  categories: WasteCategory[];
  wasteRecords: WasteRecord[];
  processingRecords: ProcessingRecord[];
  activities: ActivityLog[];
  events: SchoolEvent[];
  settings: SystemSettings;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface WasteAllocationInfo {
  initialWeightKg: number;
  allocatedWeightKg: number;
  remainingWeightKg: number;
  completedWeightKg: number;
  inProgressWeightKg: number;
  waitingWeightKg: number;
  processingCount: number;
}

export type DataLoadStatus = 'ready' | 'loading' | 'error';

interface EcoTrackContextValue {
  currentUser: PublicUser | null;
  hasAnyUser: boolean;
  dataStatus: DataLoadStatus;
  dataError: string | null;
  retryLoadData: () => void;

  activeRoute: AppRoute;
  navigateTo: (route: AppRoute) => void;
  login: (identifier: string, password: string, rememberMe: boolean) => ApiResponse<PublicUser>;
  bootstrapFirstAdmin: (input: {
    fullName: string;
    username: string;
    email: string;
    password: string;
  }) => ApiResponse<PublicUser>;
  logout: () => void;

  users: User[];
  categories: WasteCategory[];
  wasteRecords: WasteRecord[];
  processingRecords: ProcessingRecord[];
  activities: ActivityLog[];
  articles: EducationArticle[];
  events: SchoolEvent[];
  settings: SystemSettings;

  toasts: ToastMessage[];
  pushToast: (type: ToastMessage['type'], message: string) => void;
  dismissToast: (id: string) => void;

  getWasteAllocation: (wasteRecordId: string) => WasteAllocationInfo;
  getCategoryTotalWeight: (categoryId: string) => number;

  // CRUD Waste Records
  addWasteRecord: (
    input: Omit<WasteRecord, 'id' | 'code' | 'createdAt' | 'officerId' | 'officerName'>
  ) => ApiResponse<WasteRecord>;
  updateWasteRecord: (
    id: string,
    input: Partial<Omit<WasteRecord, 'id' | 'code' | 'createdAt'>>
  ) => ApiResponse<WasteRecord>;
  deleteWasteRecord: (id: string) => ApiResponse<null>;

  // CRUD Categories
  addCategory: (
    input: Omit<WasteCategory, 'id' | 'code' | 'createdAt'>
  ) => ApiResponse<WasteCategory>;
  updateCategory: (
    id: string,
    input: Partial<Omit<WasteCategory, 'id' | 'code' | 'createdAt'>>
  ) => ApiResponse<WasteCategory>;
  deleteCategory: (id: string) => ApiResponse<null>;

  // CRUD Processing
  addProcessingRecord: (
    input: Omit<ProcessingRecord, 'id' | 'code' | 'createdAt' | 'officerName'>
  ) => ApiResponse<ProcessingRecord>;
  updateProcessingRecord: (
    id: string,
    input: Partial<Omit<ProcessingRecord, 'id' | 'code' | 'wasteRecordId' | 'createdAt'>>
  ) => ApiResponse<ProcessingRecord>;
  deleteProcessingRecord: (id: string) => ApiResponse<null>;

  // CRUD Users (Admin only)
  addUser: (input: Omit<User, 'id' | 'createdAt'>) => ApiResponse<User>;
  updateUser: (id: string, input: Partial<Omit<User, 'id' | 'createdAt'>>) => ApiResponse<User>;
  toggleUserStatus: (id: string) => ApiResponse<User>;
  deleteUser: (id: string) => ApiResponse<null>;

  // Profile & Settings
  updateOwnProfile: (input: {
    fullName: string;
    username: string;
    email: string;
    classOrUnit?: string;
    avatarUrl?: string;
  }) => ApiResponse<PublicUser>;
  changeOwnPassword: (currentPassword: string, newPassword: string) => ApiResponse<null>;
  updateSystemSettings: (input: SystemSettings) => ApiResponse<SystemSettings>;
  toggleEventRsvp: (eventId: string) => ApiResponse<SchoolEvent>;
  resetDemoData: () => ApiResponse<null>;
  resetAllAccountsAndData: () => ApiResponse<null>;

  // Derived analytics
  metrics: {
    totalWasteKg: number;
    organicKg: number;
    inorganicKg: number;
    processedDoneKg: number;
    processingInProgressKg: number;
    processingWaitingKg: number;
    unallocatedWasteKg: number;
    totalCategories: number;
    activeUsersCount: number;
    monthlySeries: Array<{
      monthKey: string;
      label: string;
      organik: number;
      anorganik: number;
      total: number;
      diolah: number;
    }>;
  };
}

const EcoTrackContext = createContext<EcoTrackContextValue | null>(null);

function createEmptyDb(): PersistedDb {
  return {
    users: SEED_USERS,
    categories: SEED_CATEGORIES,
    wasteRecords: SEED_WASTE_RECORDS,
    processingRecords: SEED_PROCESSING_RECORDS,
    activities: SEED_ACTIVITIES,
    events: SEED_EVENTS,
    settings: SEED_SETTINGS,
  };
}

function loadInitialDb(): { db: PersistedDb; error: string | null } {
  try {
    localStorage.removeItem('ecotrack_prototype_db_v1');
    localStorage.removeItem('ecotrack_app_db_v2');
    localStorage.removeItem('ecotrack_auth_user_local');
    localStorage.removeItem('ecotrack_auth_user_local_v2');
    sessionStorage.removeItem('ecotrack_auth_user_session');
    sessionStorage.removeItem('ecotrack_auth_user_session_v2');

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { db: createEmptyDb(), error: null };
    }
    const parsed = JSON.parse(raw) as PersistedDb;
    if (
      !parsed ||
      !Array.isArray(parsed.users) ||
      !Array.isArray(parsed.categories) ||
      !Array.isArray(parsed.wasteRecords) ||
      !Array.isArray(parsed.processingRecords)
    ) {
      return {
        db: createEmptyDb(),
        error: 'Struktur penyimpanan lokal tidak valid dan gagal dibaca.',
      };
    }
    return {
      db: {
        users: parsed.users,
        categories: parsed.categories,
        wasteRecords: parsed.wasteRecords,
        processingRecords: parsed.processingRecords,
        activities: Array.isArray(parsed.activities) ? parsed.activities : [],
        events: Array.isArray(parsed.events) ? parsed.events : [],
        settings: parsed.settings || SEED_SETTINGS,
      },
      error: null,
    };
  } catch {
    return {
      db: createEmptyDb(),
      error: 'Gagal membaca data aplikasi dari penyimpanan lokal.',
    };
  }
}

function toPublicUser(user: User): PublicUser {
  const { password: _removed, ...rest } = user;
  return rest;
}

export const EcoTrackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = useMemo(() => loadInitialDb(), []);
  const [db, setDb] = useState<PersistedDb>(initial.db);
  const [dataStatus, setDataStatus] = useState<DataLoadStatus>(
    initial.error ? 'error' : 'ready'
  );
  const [dataError, setDataError] = useState<string | null>(initial.error);

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem(AUTH_LOCAL_KEY) || sessionStorage.getItem(AUTH_SESSION_KEY) || null;
  });
  const [activeRoute, setActiveRoute] = useState<AppRoute>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    if (dataStatus !== 'ready') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // ignore storage quota errors
    }
  }, [db, dataStatus]);

  const retryLoadData = useCallback(() => {
    setDataStatus('loading');
    const result = loadInitialDb();
    if (result.error) {
      setDataError(result.error);
      setDataStatus('error');
    } else {
      setDb(result.db);
      setDataError(null);
      setDataStatus('ready');
    }
  }, []);

  const currentUser = useMemo<PublicUser | null>(() => {
    if (!currentUserId) return null;
    const found = db.users.find((u) => u.id === currentUserId);
    if (!found || found.status !== UserStatus.AKTIF) return null;
    return toPublicUser(found);
  }, [currentUserId, db.users]);

  const pushToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const appendActivity = useCallback(
    (actorName: string, actorRole: UserRole, action: string, target: string) => {
      const log: ActivityLog = {
        id: `act-${Date.now()}`,
        actorName,
        actorRole,
        action,
        target,
        timestamp: new Date().toISOString(),
      };
      return log;
    },
    []
  );

  const navigateTo = useCallback(
    (route: AppRoute) => {
      if (!currentUser) return;
      if (!canAccessRoute(currentUser, route)) {
        pushToast('error', 'Anda tidak memiliki hak akses untuk membuka halaman tersebut.');
        setActiveRoute('dashboard');
        return;
      }
      setActiveRoute(route);
    },
    [currentUser, pushToast]
  );

  const login = useCallback(
    (identifier: string, password: string, rememberMe: boolean): ApiResponse<PublicUser> => {
      const cleanId = identifier.trim().toLowerCase();
      if (!cleanId || !password) {
        return {
          success: false,
          statusCode: 400,
          message: 'Username/email dan password wajib diisi.',
        };
      }

      if (db.users.length === 0) {
        return {
          success: false,
          statusCode: 404,
          message: 'Belum ada akun pengguna terdaftar. Silakan buat akun Administrator pertama.',
        };
      }

      const matched = db.users.find(
        (u) => u.email.toLowerCase() === cleanId || u.username.toLowerCase() === cleanId
      );

      if (!matched || matched.password !== password) {
        return {
          success: false,
          statusCode: 401,
          message: 'Username/email atau password tidak sesuai.',
        };
      }

      if (matched.status !== UserStatus.AKTIF) {
        return {
          success: false,
          statusCode: 403,
          message: 'Akun Anda saat ini berstatus Nonaktif. Hubungi Admin sekolah.',
        };
      }

      setCurrentUserId(matched.id);
      setActiveRoute('dashboard');
      if (rememberMe) {
        localStorage.setItem(AUTH_LOCAL_KEY, matched.id);
        sessionStorage.removeItem(AUTH_SESSION_KEY);
      } else {
        sessionStorage.setItem(AUTH_SESSION_KEY, matched.id);
        localStorage.removeItem(AUTH_LOCAL_KEY);
      }

      return {
        success: true,
        statusCode: 200,
        data: toPublicUser(matched),
      };
    },
    [db.users]
  );

  /**
   * Inisialisasi akun Administrator pertama hanya diizinkan saat belum ada satu pun akun
   * di dalam sistem (bukan registrasi publik).
   */
  const bootstrapFirstAdmin = useCallback(
    (input: {
      fullName: string;
      username: string;
      email: string;
      password: string;
    }): ApiResponse<PublicUser> => {
      if (db.users.length > 0) {
        return {
          success: false,
          statusCode: 403,
          message: 'Sistem sudah memiliki pengguna. Hubungi Administrator untuk pembuatan akun.',
        };
      }
      if (!input.fullName.trim() || !input.username.trim() || !input.email.trim()) {
        return {
          success: false,
          statusCode: 400,
          message: 'Nama lengkap, username, dan email wajib diisi.',
        };
      }
      if (input.password.length < 6) {
        return {
          success: false,
          statusCode: 400,
          message: 'Password minimal 6 karakter.',
        };
      }

      const firstAdmin: User = {
        id: `usr-${Date.now()}`,
        fullName: input.fullName.trim(),
        username: input.username.trim(),
        email: input.email.trim(),
        password: input.password,
        role: UserRole.ADMIN,
        status: UserStatus.AKTIF,
        classOrUnit: 'Administrator Sekolah',
        createdAt: new Date().toISOString(),
      };

      setDb((prev) => ({
        ...prev,
        users: [firstAdmin],
      }));
      setCurrentUserId(firstAdmin.id);
      setActiveRoute('dashboard');
      localStorage.setItem(AUTH_LOCAL_KEY, firstAdmin.id);
      setDataStatus('ready');
      setDataError(null);

      return {
        success: true,
        statusCode: 201,
        data: toPublicUser(firstAdmin),
      };
    },
    [db.users.length]
  );

  const logout = useCallback(() => {
    setCurrentUserId(null);
    setActiveRoute('dashboard');
    localStorage.removeItem(AUTH_LOCAL_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
  }, []);

  const getWasteAllocation = useCallback(
    (wasteRecordId: string): WasteAllocationInfo => {
      const waste = db.wasteRecords.find((w) => w.id === wasteRecordId);
      const initialWeightKg = waste ? waste.weightKg : 0;
      const related = db.processingRecords.filter((p) => p.wasteRecordId === wasteRecordId);

      let allocatedWeightKg = 0;
      let completedWeightKg = 0;
      let inProgressWeightKg = 0;
      let waitingWeightKg = 0;

      for (const item of related) {
        allocatedWeightKg += item.processedWeightKg;
        if (item.status === ProcessingStatus.SELESAI) completedWeightKg += item.processedWeightKg;
        else if (item.status === ProcessingStatus.DIPROSES) inProgressWeightKg += item.processedWeightKg;
        else waitingWeightKg += item.processedWeightKg;
      }

      allocatedWeightKg = Number(allocatedWeightKg.toFixed(2));
      const remainingWeightKg = Math.max(0, Number((initialWeightKg - allocatedWeightKg).toFixed(2)));

      return {
        initialWeightKg,
        allocatedWeightKg,
        remainingWeightKg,
        completedWeightKg: Number(completedWeightKg.toFixed(2)),
        inProgressWeightKg: Number(inProgressWeightKg.toFixed(2)),
        waitingWeightKg: Number(waitingWeightKg.toFixed(2)),
        processingCount: related.length,
      };
    },
    [db.wasteRecords, db.processingRecords]
  );

  const getCategoryTotalWeight = useCallback(
    (categoryId: string): number => {
      return Number(
        db.wasteRecords
          .filter((w) => w.categoryId === categoryId)
          .reduce((acc, item) => acc + item.weightKg, 0)
          .toFixed(2)
      );
    },
    [db.wasteRecords]
  );

  // --- WASTE RECORDS CRUD ---
  const addWasteRecord = useCallback(
    (
      input: Omit<WasteRecord, 'id' | 'code' | 'createdAt' | 'officerId' | 'officerName'>
    ): ApiResponse<WasteRecord> => {
      return authorizeAction(currentUser, 'waste:write', () => {
        if (!input.name.trim()) throw new Error('Nama sampah wajib diisi.');
        if (!input.categoryId) throw new Error('Kategori sampah wajib dipilih.');
        if (Number(input.weightKg) <= 0) throw new Error('Berat sampah harus lebih dari 0 kg.');
        if (!input.sourceLocation.trim()) throw new Error('Sumber/lokasi sampah wajib diisi.');

        const category = db.categories.find((c) => c.id === input.categoryId);
        if (!category) throw new Error('Kategori sampah tidak ditemukan.');

        const code = generateWasteCode(
          db.settings.wasteCodePrefix,
          input.recordedAt,
          db.wasteRecords.length + 1
        );

        const created: WasteRecord = {
          ...input,
          type: category.type,
          weightKg: Number(Number(input.weightKg).toFixed(2)),
          id: `wst-${Date.now()}`,
          code,
          officerId: currentUser!.id,
          officerName: currentUser!.fullName,
          createdAt: new Date().toISOString(),
        };

        const log = appendActivity(
          currentUser!.fullName,
          currentUser!.role,
          'Mencatat sampah masuk',
          `${created.code} (${created.name}, ${created.weightKg} kg)`
        );

        setDb((prev) => ({
          ...prev,
          wasteRecords: [created, ...prev.wasteRecords],
          activities: [log, ...prev.activities].slice(0, 30),
        }));

        return created;
      });
    },
    [currentUser, db.categories, db.settings.wasteCodePrefix, db.wasteRecords.length, appendActivity]
  );

  const updateWasteRecord = useCallback(
    (
      id: string,
      input: Partial<Omit<WasteRecord, 'id' | 'code' | 'createdAt'>>
    ): ApiResponse<WasteRecord> => {
      return authorizeAction(currentUser, 'waste:write', () => {
        const existing = db.wasteRecords.find((w) => w.id === id);
        if (!existing) throw new Error('Data sampah tidak ditemukan.');

        const alloc = getWasteAllocation(id);
        const nextWeight = input.weightKg !== undefined ? Number(input.weightKg) : existing.weightKg;
        if (nextWeight <= 0) throw new Error('Berat sampah harus lebih dari 0 kg.');
        if (nextWeight < alloc.allocatedWeightKg) {
          throw new Error(
            `Berat tidak boleh kurang dari total berat yang sudah masuk pengolahan (${alloc.allocatedWeightKg} kg).`
          );
        }

        const nextCategoryId = input.categoryId || existing.categoryId;
        const category = db.categories.find((c) => c.id === nextCategoryId);
        if (!category) throw new Error('Kategori tidak valid.');

        const updated: WasteRecord = {
          ...existing,
          ...input,
          categoryId: nextCategoryId,
          type: category.type,
          weightKg: Number(nextWeight.toFixed(2)),
        };

        const log = appendActivity(
          currentUser!.fullName,
          currentUser!.role,
          'Memperbarui data sampah',
          `${updated.code} (${updated.name})`
        );

        setDb((prev) => ({
          ...prev,
          wasteRecords: prev.wasteRecords.map((w) => (w.id === id ? updated : w)),
          activities: [log, ...prev.activities].slice(0, 30),
        }));

        return updated;
      });
    },
    [currentUser, db.wasteRecords, db.categories, getWasteAllocation, appendActivity]
  );

  const deleteWasteRecord = useCallback(
    (id: string): ApiResponse<null> => {
      return authorizeAction(currentUser, 'waste:delete', () => {
        const existing = db.wasteRecords.find((w) => w.id === id);
        if (!existing) throw new Error('Data sampah tidak ditemukan.');

        const log = appendActivity(
          currentUser!.fullName,
          currentUser!.role,
          'Menghapus data sampah',
          `${existing.code} (${existing.name})`
        );

        setDb((prev) => ({
          ...prev,
          wasteRecords: prev.wasteRecords.filter((w) => w.id !== id),
          processingRecords: prev.processingRecords.filter((p) => p.wasteRecordId !== id),
          activities: [log, ...prev.activities].slice(0, 30),
        }));

        return null;
      });
    },
    [currentUser, db.wasteRecords, appendActivity]
  );

  // --- CATEGORIES CRUD ---
  const addCategory = useCallback(
    (input: Omit<WasteCategory, 'id' | 'code' | 'createdAt'>): ApiResponse<WasteCategory> => {
      return authorizeAction(currentUser, 'category:write', () => {
        if (!input.name.trim()) throw new Error('Nama kategori wajib diisi.');
        const sameTypeCount = db.categories.filter((c) => c.type === input.type).length;
        const created: WasteCategory = {
          ...input,
          id: `cat-${Date.now()}`,
          code: generateCategoryCode(input.type, sameTypeCount + 1),
          createdAt: new Date().toISOString(),
        };

        const log = appendActivity(
          currentUser!.fullName,
          currentUser!.role,
          'Menambahkan kategori sampah',
          `${created.code} (${created.name})`
        );

        setDb((prev) => ({
          ...prev,
          categories: [...prev.categories, created],
          activities: [log, ...prev.activities].slice(0, 30),
        }));

        return created;
      });
    },
    [currentUser, db.categories, appendActivity]
  );

  const updateCategory = useCallback(
    (
      id: string,
      input: Partial<Omit<WasteCategory, 'id' | 'code' | 'createdAt'>>
    ): ApiResponse<WasteCategory> => {
      return authorizeAction(currentUser, 'category:write', () => {
        const existing = db.categories.find((c) => c.id === id);
        if (!existing) throw new Error('Kategori tidak ditemukan.');

        const updated: WasteCategory = { ...existing, ...input };
        const log = appendActivity(
          currentUser!.fullName,
          currentUser!.role,
          'Memperbarui kategori sampah',
          `${updated.code} (${updated.name})`
        );

        setDb((prev) => ({
          ...prev,
          categories: prev.categories.map((c) => (c.id === id ? updated : c)),
          wasteRecords: prev.wasteRecords.map((w) =>
            w.categoryId === id ? { ...w, type: updated.type } : w
          ),
          activities: [log, ...prev.activities].slice(0, 30),
        }));

        return updated;
      });
    },
    [currentUser, db.categories, appendActivity]
  );

  const deleteCategory = useCallback(
    (id: string): ApiResponse<null> => {
      return authorizeAction(currentUser, 'category:delete', () => {
        const existing = db.categories.find((c) => c.id === id);
        if (!existing) throw new Error('Kategori tidak ditemukan.');
        const usedByRecords = db.wasteRecords.some((w) => w.categoryId === id);
        if (usedByRecords) {
          throw new Error(
            'Kategori tidak dapat dihapus karena masih digunakan oleh catatan data sampah.'
          );
        }

        const log = appendActivity(
          currentUser!.fullName,
          currentUser!.role,
          'Menghapus kategori sampah',
          `${existing.code} (${existing.name})`
        );

        setDb((prev) => ({
          ...prev,
          categories: prev.categories.filter((c) => c.id !== id),
          activities: [log, ...prev.activities].slice(0, 30),
        }));

        return null;
      });
    },
    [currentUser, db.categories, db.wasteRecords, appendActivity]
  );

  // --- PROCESSING CRUD ---
  const addProcessingRecord = useCallback(
    (
      input: Omit<ProcessingRecord, 'id' | 'code' | 'createdAt' | 'officerName'>
    ): ApiResponse<ProcessingRecord> => {
      return authorizeAction(currentUser, 'processing:write', () => {
        const waste = db.wasteRecords.find((w) => w.id === input.wasteRecordId);
        if (!waste) throw new Error('Catatan sampah sumber tidak ditemukan.');

        const weight = Number(input.processedWeightKg);
        if (Number.isNaN(weight) || weight <= 0) {
          throw new Error('Berat yang diolah harus lebih dari 0 kg.');
        }

        const alloc = getWasteAllocation(waste.id);
        if (weight > alloc.remainingWeightKg + 0.001) {
          throw new Error(
            `Berat olah (${weight} kg) melebihi sisa berat sampah yang tersedia (${alloc.remainingWeightKg} kg).`
          );
        }

        if (!input.method.trim()) throw new Error('Metode pengolahan wajib dipilih.');
        if (!input.result.trim()) throw new Error('Hasil/rencana pengolahan wajib diisi.');

        const created: ProcessingRecord = {
          ...input,
          processedWeightKg: Number(weight.toFixed(2)),
          id: `prc-${Date.now()}`,
          code: generateProcessingCode(
            db.settings.processingCodePrefix,
            input.processedAt,
            db.processingRecords.length + 1
          ),
          officerName: currentUser!.fullName,
          createdAt: new Date().toISOString(),
        };

        const log = appendActivity(
          currentUser!.fullName,
          currentUser!.role,
          `Mencatat pengolahan (${created.status})`,
          `${created.code} untuk ${waste.code} (${created.processedWeightKg} kg)`
        );

        setDb((prev) => ({
          ...prev,
          processingRecords: [created, ...prev.processingRecords],
          activities: [log, ...prev.activities].slice(0, 30),
        }));

        return created;
      });
    },
    [
      currentUser,
      db.wasteRecords,
      db.processingRecords.length,
      db.settings.processingCodePrefix,
      getWasteAllocation,
      appendActivity,
    ]
  );

  const updateProcessingRecord = useCallback(
    (
      id: string,
      input: Partial<Omit<ProcessingRecord, 'id' | 'code' | 'wasteRecordId' | 'createdAt'>>
    ): ApiResponse<ProcessingRecord> => {
      return authorizeAction(currentUser, 'processing:write', () => {
        const existing = db.processingRecords.find((p) => p.id === id);
        if (!existing) throw new Error('Catatan pengolahan tidak ditemukan.');

        const nextWeight =
          input.processedWeightKg !== undefined
            ? Number(input.processedWeightKg)
            : existing.processedWeightKg;

        if (nextWeight <= 0) throw new Error('Berat pengolahan harus lebih dari 0 kg.');

        const alloc = getWasteAllocation(existing.wasteRecordId);
        const maxEditableWeight = Number((alloc.remainingWeightKg + existing.processedWeightKg).toFixed(2));
        if (nextWeight > maxEditableWeight + 0.001) {
          throw new Error(
            `Total berat diolah melebihi berat awal sampah. Maksimal yang dapat diisi: ${maxEditableWeight} kg.`
          );
        }

        const updated: ProcessingRecord = {
          ...existing,
          ...input,
          processedWeightKg: Number(nextWeight.toFixed(2)),
        };

        const log = appendActivity(
          currentUser!.fullName,
          currentUser!.role,
          `Memperbarui status pengolahan (${updated.status})`,
          `${updated.code} (${updated.processedWeightKg} kg)`
        );

        setDb((prev) => ({
          ...prev,
          processingRecords: prev.processingRecords.map((p) => (p.id === id ? updated : p)),
          activities: [log, ...prev.activities].slice(0, 30),
        }));

        return updated;
      });
    },
    [currentUser, db.processingRecords, getWasteAllocation, appendActivity]
  );

  const deleteProcessingRecord = useCallback(
    (id: string): ApiResponse<null> => {
      return authorizeAction(currentUser, 'processing:delete', () => {
        const existing = db.processingRecords.find((p) => p.id === id);
        if (!existing) throw new Error('Catatan pengolahan tidak ditemukan.');

        const log = appendActivity(
          currentUser!.fullName,
          currentUser!.role,
          'Menghapus riwayat pengolahan',
          `${existing.code}`
        );

        setDb((prev) => ({
          ...prev,
          processingRecords: prev.processingRecords.filter((p) => p.id !== id),
          activities: [log, ...prev.activities].slice(0, 30),
        }));

        return null;
      });
    },
    [currentUser, db.processingRecords, appendActivity]
  );

  // --- USERS CRUD (ADMIN ONLY) ---
  const addUser = useCallback(
    (input: Omit<User, 'id' | 'createdAt'>): ApiResponse<User> => {
      return authorizeAction(currentUser, 'users:manage', () => {
        if (!input.fullName.trim() || !input.username.trim() || !input.email.trim()) {
          throw new Error('Nama lengkap, username, dan email wajib diisi.');
        }
        if (input.password.length < 6) {
          throw new Error('Password minimal 6 karakter.');
        }
        const duplicate = db.users.some(
          (u) =>
            u.email.toLowerCase() === input.email.trim().toLowerCase() ||
            u.username.toLowerCase() === input.username.trim().toLowerCase()
        );
        if (duplicate) {
          throw new Error('Username atau email sudah terdaftar.');
        }

        const created: User = {
          ...input,
          id: `usr-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };

        const log = appendActivity(
          currentUser!.fullName,
          currentUser!.role,
          'Menambahkan pengguna baru',
          `${created.fullName} (${created.role})`
        );

        setDb((prev) => ({
          ...prev,
          users: [created, ...prev.users],
          activities: [log, ...prev.activities].slice(0, 30),
        }));

        return created;
      });
    },
    [currentUser, db.users, appendActivity]
  );

  const updateUser = useCallback(
    (id: string, input: Partial<Omit<User, 'id' | 'createdAt'>>): ApiResponse<User> => {
      return authorizeAction(currentUser, 'users:manage', () => {
        const existing = db.users.find((u) => u.id === id);
        if (!existing) throw new Error('Pengguna tidak ditemukan.');

        const nextEmail = (input.email ?? existing.email).trim().toLowerCase();
        const nextUsername = (input.username ?? existing.username).trim().toLowerCase();
        const duplicate = db.users.some(
          (u) =>
            u.id !== id &&
            (u.email.toLowerCase() === nextEmail || u.username.toLowerCase() === nextUsername)
        );
        if (duplicate) throw new Error('Username atau email sudah digunakan pengguna lain.');

        const updated: User = {
          ...existing,
          ...input,
          password: input.password && input.password.trim() ? input.password : existing.password,
        };

        const log = appendActivity(
          currentUser!.fullName,
          currentUser!.role,
          'Memperbarui akun pengguna',
          `${updated.fullName} (${updated.role})`
        );

        setDb((prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === id ? updated : u)),
          activities: [log, ...prev.activities].slice(0, 30),
        }));

        return updated;
      });
    },
    [currentUser, db.users, appendActivity]
  );

  const toggleUserStatus = useCallback(
    (id: string): ApiResponse<User> => {
      return authorizeAction(currentUser, 'users:manage', () => {
        if (id === currentUser!.id) {
          throw new Error('Tidak dapat menonaktifkan akun Anda sendiri yang sedang login.');
        }
        const existing = db.users.find((u) => u.id === id);
        if (!existing) throw new Error('Pengguna tidak ditemukan.');

        const nextStatus =
          existing.status === UserStatus.AKTIF ? UserStatus.NONAKTIF : UserStatus.AKTIF;
        const updated: User = { ...existing, status: nextStatus };

        const log = appendActivity(
          currentUser!.fullName,
          currentUser!.role,
          `Mengubah status akun menjadi ${nextStatus}`,
          updated.fullName
        );

        setDb((prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === id ? updated : u)),
          activities: [log, ...prev.activities].slice(0, 30),
        }));

        return updated;
      });
    },
    [currentUser, db.users, appendActivity]
  );

  const deleteUser = useCallback(
    (id: string): ApiResponse<null> => {
      return authorizeAction(currentUser, 'users:manage', () => {
        if (id === currentUser!.id) {
          throw new Error('Tidak dapat menghapus akun Anda sendiri yang sedang digunakan.');
        }
        const existing = db.users.find((u) => u.id === id);
        if (!existing) throw new Error('Pengguna tidak ditemukan.');

        const log = appendActivity(
          currentUser!.fullName,
          currentUser!.role,
          'Menghapus akun pengguna',
          `${existing.fullName} (${existing.email})`
        );

        setDb((prev) => ({
          ...prev,
          users: prev.users.filter((u) => u.id !== id),
          activities: [log, ...prev.activities].slice(0, 30),
        }));

        return null;
      });
    },
    [currentUser, db.users, appendActivity]
  );

  // --- PROFILE & SYSTEM SETTINGS ---
  const updateOwnProfile = useCallback(
    (input: {
      fullName: string;
      username: string;
      email: string;
      classOrUnit?: string;
      avatarUrl?: string;
    }): ApiResponse<PublicUser> => {
      if (!currentUser) {
        return { success: false, statusCode: 401, message: 'Sesi tidak valid.' };
      }
      const duplicate = db.users.some(
        (u) =>
          u.id !== currentUser.id &&
          (u.email.toLowerCase() === input.email.trim().toLowerCase() ||
            u.username.toLowerCase() === input.username.trim().toLowerCase())
      );
      if (duplicate) {
        return {
          success: false,
          statusCode: 400,
          message: 'Username atau email sudah digunakan pengguna lain.',
        };
      }

      let updatedUser: User | null = null;
      setDb((prev) => ({
        ...prev,
        users: prev.users.map((u) => {
          if (u.id !== currentUser.id) return u;
          updatedUser = {
            ...u,
            fullName: input.fullName.trim(),
            username: input.username.trim(),
            email: input.email.trim(),
            classOrUnit: input.classOrUnit?.trim() || u.classOrUnit,
            avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl : u.avatarUrl,
          };
          return updatedUser;
        }),
      }));

      return {
        success: true,
        statusCode: 200,
        data: toPublicUser(updatedUser!),
      };
    },
    [currentUser, db.users]
  );

  const changeOwnPassword = useCallback(
    (currentPassword: string, newPassword: string): ApiResponse<null> => {
      if (!currentUser) {
        return { success: false, statusCode: 401, message: 'Sesi tidak valid.' };
      }
      const user = db.users.find((u) => u.id === currentUser.id);
      if (!user) return { success: false, statusCode: 404, message: 'Akun tidak ditemukan.' };
      if (user.password !== currentPassword) {
        return { success: false, statusCode: 400, message: 'Password saat ini tidak sesuai.' };
      }
      if (newPassword.length < 6) {
        return { success: false, statusCode: 400, message: 'Password baru minimal 6 karakter.' };
      }

      setDb((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === currentUser.id ? { ...u, password: newPassword } : u
        ),
      }));
      return { success: true, statusCode: 200, data: null };
    },
    [currentUser, db.users]
  );

  const updateSystemSettings = useCallback(
    (input: SystemSettings): ApiResponse<SystemSettings> => {
      return authorizeAction(currentUser, 'settings:manage', () => {
        const log = appendActivity(
          currentUser!.fullName,
          currentUser!.role,
          'Memperbarui pengaturan sistem',
          input.schoolName
        );
        setDb((prev) => ({
          ...prev,
          settings: input,
          activities: [log, ...prev.activities].slice(0, 30),
        }));
        return input;
      });
    },
    [currentUser, appendActivity]
  );

  const toggleEventRsvp = useCallback(
    (eventId: string): ApiResponse<SchoolEvent> => {
      return authorizeAction(currentUser, 'events:rsvp', () => {
        const existing = db.events.find((e) => e.id === eventId);
        if (!existing) throw new Error('Kegiatan tidak ditemukan.');
        const isRegistered = existing.registeredUserIds.includes(currentUser!.id);
        const updated: SchoolEvent = {
          ...existing,
          registeredUserIds: isRegistered
            ? existing.registeredUserIds.filter((uid) => uid !== currentUser!.id)
            : [...existing.registeredUserIds, currentUser!.id],
        };
        setDb((prev) => ({
          ...prev,
          events: prev.events.map((e) => (e.id === eventId ? updated : e)),
        }));
        return updated;
      });
    },
    [currentUser, db.events]
  );

  const resetDemoData = useCallback((): ApiResponse<null> => {
    return authorizeAction(currentUser, 'settings:manage', () => {
      const currentAdmin = db.users.find((u) => u.id === currentUser!.id);
      setDb({
        users: currentAdmin ? [currentAdmin] : [],
        categories: [],
        wasteRecords: [],
        processingRecords: [],
        activities: [],
        events: [],
        settings: SEED_SETTINGS,
      });
      return null;
    });
  }, [currentUser, db.users]);

  const resetAllAccountsAndData = useCallback((): ApiResponse<null> => {
    return authorizeAction(currentUser, 'settings:manage', () => {
      const empty = createEmptyDb();
      setDb(empty);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
      } catch {
        // ignore storage quota errors
      }
      setCurrentUserId(null);
      setActiveRoute('dashboard');
      localStorage.removeItem(AUTH_LOCAL_KEY);
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    });
  }, [currentUser]);

  // --- DERIVED METRICS ---
  const metrics = useMemo(() => {
    let totalWasteKg = 0;
    let organicKg = 0;
    let inorganicKg = 0;
    let unallocatedWasteKg = 0;

    const monthBucket = new Map<
      string,
      { organik: number; anorganik: number; diolah: number }
    >();

    for (const w of db.wasteRecords) {
      totalWasteKg += w.weightKg;
      if (w.type === WasteType.ORGANIK) organicKg += w.weightKg;
      else inorganicKg += w.weightKg;

      const alloc = getWasteAllocation(w.id);
      unallocatedWasteKg += alloc.remainingWeightKg;

      const mk = getMonthKey(w.recordedAt);
      const curr = monthBucket.get(mk) || { organik: 0, anorganik: 0, diolah: 0 };
      if (w.type === WasteType.ORGANIK) curr.organik += w.weightKg;
      else curr.anorganik += w.weightKg;
      monthBucket.set(mk, curr);
    }

    let processedDoneKg = 0;
    let processingInProgressKg = 0;
    let processingWaitingKg = 0;

    for (const p of db.processingRecords) {
      if (p.status === ProcessingStatus.SELESAI) {
        processedDoneKg += p.processedWeightKg;
        const mk = getMonthKey(p.processedAt);
        const curr = monthBucket.get(mk) || { organik: 0, anorganik: 0, diolah: 0 };
        curr.diolah += p.processedWeightKg;
        monthBucket.set(mk, curr);
      } else if (p.status === ProcessingStatus.DIPROSES) {
        processingInProgressKg += p.processedWeightKg;
      } else {
        processingWaitingKg += p.processedWeightKg;
      }
    }

    const monthlySeries = Array.from(monthBucket.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, vals]) => ({
        monthKey,
        label: formatMonthShort(monthKey),
        organik: Number(vals.organik.toFixed(1)),
        anorganik: Number(vals.anorganik.toFixed(1)),
        total: Number((vals.organik + vals.anorganik).toFixed(1)),
        diolah: Number(vals.diolah.toFixed(1)),
      }));

    return {
      totalWasteKg: Number(totalWasteKg.toFixed(1)),
      organicKg: Number(organicKg.toFixed(1)),
      inorganicKg: Number(inorganicKg.toFixed(1)),
      processedDoneKg: Number(processedDoneKg.toFixed(1)),
      processingInProgressKg: Number(processingInProgressKg.toFixed(1)),
      processingWaitingKg: Number(processingWaitingKg.toFixed(1)),
      unallocatedWasteKg: Number(unallocatedWasteKg.toFixed(1)),
      totalCategories: db.categories.length,
      activeUsersCount: db.users.filter((u) => u.status === UserStatus.AKTIF).length,
      monthlySeries,
    };
  }, [db.wasteRecords, db.processingRecords, db.categories.length, db.users, getWasteAllocation]);

  const value: EcoTrackContextValue = {
    currentUser,
    hasAnyUser: db.users.length > 0,
    dataStatus,
    dataError,
    retryLoadData,
    activeRoute,
    navigateTo,
    login,
    bootstrapFirstAdmin,
    logout,
    users: db.users,
    categories: db.categories,
    wasteRecords: db.wasteRecords,
    processingRecords: db.processingRecords,
    activities: db.activities,
    articles: SEED_EDUCATION_ARTICLES,
    events: db.events,
    settings: db.settings,
    toasts,
    pushToast,
    dismissToast,
    getWasteAllocation,
    getCategoryTotalWeight,
    addWasteRecord,
    updateWasteRecord,
    deleteWasteRecord,
    addCategory,
    updateCategory,
    deleteCategory,
    addProcessingRecord,
    updateProcessingRecord,
    deleteProcessingRecord,
    addUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    updateOwnProfile,
    changeOwnPassword,
    updateSystemSettings,
    toggleEventRsvp,
    resetDemoData,
    resetAllAccountsAndData,
    metrics,
  };

  return <EcoTrackContext.Provider value={value}>{children}</EcoTrackContext.Provider>;
};

export function useEcoTrack(): EcoTrackContextValue {
  const ctx = useContext(EcoTrackContext);
  if (!ctx) throw new Error('useEcoTrack must be used inside EcoTrackProvider');
  return ctx;
}
