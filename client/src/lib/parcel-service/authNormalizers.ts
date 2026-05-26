import { normalizeRole } from '../roles';
import type { User } from './types';

function normalizeUser(user: User): User {
  return { ...user, role: normalizeRole(user.role) };
}

export function normalizeAuthResponse<T extends { user?: User; role?: string }>(res: T): T {
  if (res.user) res.user = normalizeUser(res.user);
  if (res.role) res.role = normalizeRole(res.role);
  return res;
}

// Errors from the backend that mean "this user/password is genuinely wrong"
// — includes brute force lockout messages
export const REAL_AUTH_ERRORS = [
  'รหัสผ่านไม่ถูกต้อง',
  'รหัสผ่านไม่ถูกต้อง',
  'ไม่พบผู้ใช้งาน',
  'ไม่พบรหัสพนักงาน',   // not registered
  'Invalid credentials',
  'Wrong password',
  'User not found',
  'บัญชีถูกล็อคชั่วคราว',
  'เหลือ',
];
