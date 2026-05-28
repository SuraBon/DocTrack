// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from './parcel-service/types';
import { AUTH_SESSION_KEY, clearAuthUser, readAuthUser, writeAuthUser } from './authStorage';

const testUser: User = {
  employeeId: 'EMP001',
  name: 'Test User',
  role: 'ADMIN',
  token: 'EMP001:token:1:session',
  issuedAt: 1,
};

describe('authStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearAuthUser();
  });

  it('keeps auth in session storage when local storage rejects writes', () => {
    const originalSetItem = Storage.prototype.setItem;
    const localSetItem = vi.spyOn(Storage.prototype, 'setItem');
    localSetItem.mockImplementation(function setItem(key: string, value: string) {
      if (this === localStorage) throw new Error('quota exceeded');
      return originalSetItem.call(this, key, value);
    });

    writeAuthUser(testUser);

    expect(sessionStorage.getItem(AUTH_SESSION_KEY)).toBeTruthy();
    expect(readAuthUser()).toMatchObject({ employeeId: 'EMP001', role: 'ADMIN' });
  });

  it('moves session-only auth into local storage when local storage is available', () => {
    writeAuthUser(testUser);
    const sessionAuth = localStorage.getItem(AUTH_SESSION_KEY);
    expect(sessionAuth).toBeTruthy();

    sessionStorage.setItem(AUTH_SESSION_KEY, sessionAuth as string);
    localStorage.clear();

    expect(readAuthUser()).toMatchObject({ employeeId: 'EMP001', role: 'ADMIN' });
    expect(localStorage.getItem(AUTH_SESSION_KEY)).toBeTruthy();
    expect(sessionStorage.getItem(AUTH_SESSION_KEY)).toBeNull();
  });
});
