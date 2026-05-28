import type { User } from './parcel-service/types';

export const AUTH_SESSION_KEY = 'shiptrack_user';
const AUTH_LAST_ACTIVITY_KEY = 'shiptrack_last_activity_at';
const INTEGRITY_SALT = 'shiptrack_secure_salt_98765';

function calculateChecksum(payload: string): string {
  let hash = 0;
  const combined = payload + '_' + INTEGRITY_SALT;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  return btoa(hash.toString());
}

function safeParseUser(raw: string | null): User | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    if ('value' in parsed && 'checksum' in parsed) {
      const userObj = parsed.value;
      const checksum = parsed.checksum;
      const expectedChecksum = calculateChecksum(JSON.stringify(userObj));
      if (checksum !== expectedChecksum) {
        console.warn('Auth token integrity check failed! Session tampered.');
        clearAuthUser();
        return null;
      }
      if (!userObj || typeof userObj !== 'object') return null;
      if (!userObj.employeeId || !userObj.role) return null;
      return userObj as User;
    }

    if (!parsed.employeeId || !parsed.role) return null;
    return parsed as User;
  } catch {
    return null;
  }
}

function getSessionStorage(): Storage | null {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  } catch {
    return null;
  }
}

function getLocalStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

function serializeAuthUser(user: User, lastActivityAt = Date.now()): string {
  const serializedUser = JSON.stringify(user);
  const checksum = calculateChecksum(serializedUser);
  return JSON.stringify({
    value: user,
    checksum,
    lastActivityAt,
  });
}

function readWrappedLastActivity(raw: string | null): number | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const value = Number(parsed?.lastActivityAt);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function readAuthLastActivityAt(user?: User | null): number | null {
  const local = getLocalStorage();
  const session = getSessionStorage();
  const wrappedActivity =
    readWrappedLastActivity(local?.getItem(AUTH_SESSION_KEY) ?? null) ??
    readWrappedLastActivity(session?.getItem(AUTH_SESSION_KEY) ?? null);
  if (wrappedActivity) return wrappedActivity;
  const storedActivity = Number(local?.getItem(AUTH_LAST_ACTIVITY_KEY) ?? session?.getItem(AUTH_LAST_ACTIVITY_KEY) ?? '');
  if (Number.isFinite(storedActivity) && storedActivity > 0) return storedActivity;
  return typeof user?.issuedAt === 'number' ? user.issuedAt : null;
}

export function readAuthUser(): User | null {
  const session = getSessionStorage();
  const local = getLocalStorage();
  const localUser = safeParseUser(local?.getItem(AUTH_SESSION_KEY) ?? null);
  if (localUser) return localUser;

  const legacyUser = safeParseUser(session?.getItem(AUTH_SESSION_KEY) ?? null);
  if (legacyUser) {
    try {
      const lastActivityAt = readAuthLastActivityAt(legacyUser) ?? Date.now();
      local?.setItem(AUTH_SESSION_KEY, serializeAuthUser(legacyUser, lastActivityAt));
      local?.setItem(AUTH_LAST_ACTIVITY_KEY, String(lastActivityAt));
      session?.removeItem(AUTH_SESSION_KEY);
    } catch {
      // If local storage is unavailable, keep the session-only legacy token for this tab.
    }
    return legacyUser;
  }

  session?.removeItem(AUTH_SESSION_KEY);
  return null;
}

export function writeAuthUser(user: User): void {
  const local = getLocalStorage();
  const session = getSessionStorage();
  const lastActivityAt = Date.now();
  try {
    if (!local) throw new Error('localStorage unavailable');
    local?.setItem(AUTH_SESSION_KEY, serializeAuthUser(user, lastActivityAt));
    local?.setItem(AUTH_LAST_ACTIVITY_KEY, String(lastActivityAt));
  } catch {
    try {
      session?.setItem(AUTH_SESSION_KEY, serializeAuthUser(user, lastActivityAt));
      session?.setItem(AUTH_LAST_ACTIVITY_KEY, String(lastActivityAt));
    } catch {
      // Storage can fail in restricted/private contexts.
    }
  }
  session?.removeItem(AUTH_SESSION_KEY);
}

export function touchAuthActivity(user?: User | null): number | null {
  const activeUser = user ?? readAuthUser();
  if (!activeUser) return null;
  const now = Date.now();
  try {
    const local = getLocalStorage();
    if (!local) throw new Error('localStorage unavailable');
    local.setItem(AUTH_SESSION_KEY, serializeAuthUser(activeUser, now));
    local.setItem(AUTH_LAST_ACTIVITY_KEY, String(now));
  } catch {
    try {
      getSessionStorage()?.setItem(AUTH_SESSION_KEY, serializeAuthUser(activeUser, now));
      getSessionStorage()?.setItem(AUTH_LAST_ACTIVITY_KEY, String(now));
    } catch {
      return null;
    }
  }
  return now;
}

export function clearAuthUser(): void {
  getSessionStorage()?.removeItem(AUTH_SESSION_KEY);
  getSessionStorage()?.removeItem(AUTH_LAST_ACTIVITY_KEY);
  getLocalStorage()?.removeItem(AUTH_SESSION_KEY);
  getLocalStorage()?.removeItem(AUTH_LAST_ACTIVITY_KEY);
}

export function readAuthPayload(): { employeeId?: string; role?: string; token?: string } {
  const user = readAuthUser();
  if (!user) return {};
  touchAuthActivity(user);
  return {
    employeeId: user.employeeId,
    role: user.role,
    token: user.token,
  };
}
