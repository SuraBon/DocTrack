export type SystemRole = 'MESSENGER' | 'ADMIN';
export type AppRole = SystemRole | 'GUEST';

export const SYSTEM_ROLES: SystemRole[] = ['MESSENGER', 'ADMIN'];

export const ROLE_LABELS: Record<AppRole, string> = {
  MESSENGER: 'Messenger จัดส่ง',
  ADMIN: 'Admin',
  GUEST: 'Guest',
};

export function normalizeRole(role: unknown): AppRole {
  const normalized = String(role || '').trim().toUpperCase();

  if (normalized === 'ADMIN') return 'ADMIN';
  if (normalized === 'MESSENGER' || normalized === 'MANAGER') return 'MESSENGER';
  return 'GUEST';
}
