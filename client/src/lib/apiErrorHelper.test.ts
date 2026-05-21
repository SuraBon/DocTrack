import { describe, expect, it } from 'vitest';
import { getServerErrorMessage } from './apiErrorHelper';

describe('apiErrorHelper', () => {
  it('maps setup and authorization backend errors to Thai user-facing messages', () => {
    expect(getServerErrorMessage('API key is not configured on script properties')).toBe(
      'ยังไม่ได้ตั้งค่า API Key ใน Google Apps Script Properties',
    );
    expect(getServerErrorMessage('Unauthorized')).toBe('API Key ไม่ถูกต้องหรือไม่มีสิทธิ์เข้าถึง');
  });
});
