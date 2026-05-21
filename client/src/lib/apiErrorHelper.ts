const DEFAULT_ERROR = 'เกิดข้อผิดพลาด กรุณาลองใหม่';

export function getServerErrorMessage(message: unknown, fallback = DEFAULT_ERROR): string {
  const text = String(message || '').trim();
  if (!text) return fallback;
  if (text.includes('API key is not configured on script properties')) {
    return 'ยังไม่ได้ตั้งค่า API Key ใน Google Apps Script Properties';
  }
  if (text === 'Unauthorized') {
    return 'API Key ไม่ถูกต้องหรือไม่มีสิทธิ์เข้าถึง';
  }
  return text;
}

export function getErrorMessage(err: unknown, fallback = DEFAULT_ERROR): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function isAuthErrorMessage(message: unknown): boolean {
  const text = String(message || '');
  return [
    'Authentication required (Missing Token)',
    'Invalid token signature',
    'Malformed token',
    'Token expired',
    'Session replaced',
  ].some(error => text.includes(error));
}
