import { describe, expect, it } from 'vitest';
import { getServerErrorMessage, isNetworkErrorMessage } from './apiErrorHelper';

describe('apiErrorHelper', () => {
  it('maps setup and authorization backend errors to Thai user-facing messages', () => {
    expect(getServerErrorMessage('API key is not configured on script properties')).toBe(
      'ยังไม่ได้ตั้งค่า API Key ใน Google Apps Script Properties',
    );
    expect(getServerErrorMessage('Unauthorized')).toBe('API Key ไม่ถูกต้องหรือไม่มีสิทธิ์เข้าถึง');
  });

  it('correctly identifies network errors in Thai and English', () => {
    // Thai network errors
    expect(isNetworkErrorMessage('การเชื่อมต่อขัดข้อง')).toBe(true);
    expect(isNetworkErrorMessage('หมดเวลาการเชื่อมต่อ')).toBe(true);
    expect(isNetworkErrorMessage('ไม่มีอินเทอร์เน็ต')).toBe(true);

    // English network errors
    expect(isNetworkErrorMessage('Failed to fetch')).toBe(true);
    expect(isNetworkErrorMessage('TypeError: failed to fetch')).toBe(true);
    expect(isNetworkErrorMessage('network request failed')).toBe(true);
    expect(isNetworkErrorMessage('The user aborted a request.')).toBe(true);
    expect(isNetworkErrorMessage('Connection timed out')).toBe(true);
    expect(isNetworkErrorMessage('Device is offline')).toBe(true);

    // Non-network errors
    expect(isNetworkErrorMessage('Invalid token')).toBe(false);
    expect(isNetworkErrorMessage('Internal Server Error')).toBe(false);
    expect(isNetworkErrorMessage('')).toBe(false);
  });
});
