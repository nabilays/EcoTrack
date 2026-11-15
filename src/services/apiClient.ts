import { ApiResponse, AppRoute, PublicUser, UserRole } from '../types';

/**
 * Konfigurasi Endpoint REST API untuk integrasi tahap selanjutnya dengan Backend PHP & MySQL.
 * Saat ini berjalan menggunakan Prototype In-Memory/LocalStorage Adapter,
 * dengan pola otorisasi & kontrak endpoint yang siap dihubungkan ke PHP REST API.
 */
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  mode: 'prototype' as 'prototype' | 'rest',
  endpoints: {
    login: '/auth/login.php',
    logout: '/auth/logout.php',
    profile: '/auth/profile.php',
    wasteRecords: '/waste-records.php',
    categories: '/categories.php',
    processing: '/processing.php',
    reports: '/reports.php',
    users: '/users.php',
    settings: '/settings.php',
    events: '/events.php',
  },
};

/**
 * Matriks Hak Akses Rute per Role (Backend-ready Route & Action Guard)
 */
export const ROLE_ALLOWED_ROUTES: Record<UserRole, AppRoute[]> = {
  [UserRole.ADMIN]: [
    'dashboard',
    'waste-data',
    'categories',
    'processing',
    'reports',
    'users',
    'profile',
  ],
  [UserRole.PETUGAS]: [
    'dashboard',
    'waste-data',
    'categories',
    'processing',
    'reports',
    'profile',
  ],
  [UserRole.SISWA]: [
    'dashboard',
    'reports',
    'categories',
    'education',
    'events',
    'profile',
  ],
};

export type PermissionAction =
  | 'waste:read'
  | 'waste:write'
  | 'waste:delete'
  | 'category:read'
  | 'category:write'
  | 'category:delete'
  | 'processing:read'
  | 'processing:write'
  | 'processing:delete'
  | 'reports:full'
  | 'reports:operational'
  | 'reports:public'
  | 'users:manage'
  | 'settings:manage'
  | 'events:rsvp';

const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  [UserRole.ADMIN]: [
    'waste:read',
    'waste:write',
    'waste:delete',
    'category:read',
    'category:write',
    'category:delete',
    'processing:read',
    'processing:write',
    'processing:delete',
    'reports:full',
    'reports:operational',
    'reports:public',
    'users:manage',
    'settings:manage',
    'events:rsvp',
  ],
  [UserRole.PETUGAS]: [
    'waste:read',
    'waste:write',
    'waste:delete',
    'category:read',
    'processing:read',
    'processing:write',
    'reports:operational',
    'reports:public',
    'events:rsvp',
  ],
  [UserRole.SISWA]: [
    'category:read',
    'reports:public',
    'events:rsvp',
  ],
};

export function hasPermission(user: PublicUser | null, action: PermissionAction): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.includes(action) ?? false;
}

export function canAccessRoute(user: PublicUser | null, route: AppRoute): boolean {
  if (!user) return false;
  return ROLE_ALLOWED_ROUTES[user.role]?.includes(route) ?? false;
}

export function authorizeAction<T>(
  user: PublicUser | null,
  action: PermissionAction,
  executor: () => T
): ApiResponse<T> {
  if (!user) {
    return {
      success: false,
      statusCode: 401,
      message: 'Sesi tidak valid. Silakan login kembali.',
    };
  }
  if (!hasPermission(user, action)) {
    return {
      success: false,
      statusCode: 403,
      message: `Akses ditolak (403): Role ${user.role} tidak memiliki izin untuk aksi "${action}".`,
    };
  }
  try {
    const data = executor();
    return {
      success: true,
      statusCode: 200,
      data,
    };
  } catch (err) {
    return {
      success: false,
      statusCode: 400,
      message: err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses permintaan.',
    };
  }
}

/**
 * Helper placeholder untuk transisi ke fetch() PHP REST API di masa mendatang.
 */
export async function restRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json();
  return {
    success: response.ok,
    statusCode: response.status,
    data: payload.data,
    message: payload.message,
  };
}
