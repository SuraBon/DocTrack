import {
  OFFLINE_ROUTE_STORE,
  idbDelete,
  idbGet,
  idbGetAll,
  idbGetByIndex,
  idbPut,
  isIndexedDbAvailable,
  type RouteSampleRecord,
} from './offlineDb';
import { logTelemetry } from './telemetry';

export type { RouteSampleRecord } from './offlineDb';

type RouteSampleSyncState = 0 | 1;

const ACTIVE_ROUTES_KEY = 'shiptrack_active_routes';
const ROUTE_UPDATED_EVENT = 'shiptrack-route-samples-updated';
const ROUTE_TRACKING_UPDATED_EVENT = 'shiptrack-route-tracking-updated';
export const ROUTE_TRACKING_ERROR_EVENT = 'shiptrack-route-tracking-error';
const MIN_SAMPLE_INTERVAL_MS = 15_000;
const BACKGROUND_MIN_SAMPLE_INTERVAL_MS = 60_000;
const MIN_SAMPLE_DISTANCE_M = 25;
const MAX_ACCEPTED_ACCURACY_M = 150;
const MAX_STORED_ROUTE_SAMPLES = 2000;

const activeWatchIds = new Map<string, number>();
const lastSamples = new Map<string, RouteSampleRecord>();

function getSampleSyncState(sample: RouteSampleRecord): RouteSampleSyncState {
  return sample.syncState === 1 || sample.synced === true ? 1 : 0;
}

function normalizeRouteSample(sample: RouteSampleRecord): RouteSampleRecord {
  const syncState = getSampleSyncState(sample);
  return {
    ...sample,
    syncState,
    synced: syncState === 1,
  };
}

function isSampleUnsynced(sample: RouteSampleRecord): boolean {
  return getSampleSyncState(sample) === 0;
}

function isSampleSynced(sample: RouteSampleRecord): boolean {
  return getSampleSyncState(sample) === 1;
}

function dispatchRouteUpdated(trackingID: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ROUTE_UPDATED_EVENT, { detail: { trackingID } }));
}

function readFallbackSamples(): RouteSampleRecord[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const parsed = JSON.parse(localStorage.getItem('shiptrack_route_samples') ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isRouteSample).map(normalizeRouteSample) : [];
  } catch {
    return [];
  }
}

function saveFallbackSamples(samples: RouteSampleRecord[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('shiptrack_route_samples', JSON.stringify(samples.map(normalizeRouteSample).slice(-MAX_STORED_ROUTE_SAMPLES)));
  } catch {
    // Storage quota/private mode failure should not break the delivery flow.
  }
}

function isRouteSample(value: any): value is RouteSampleRecord {
  return value &&
    typeof value.id === 'string' &&
    typeof value.trackingID === 'string' &&
    typeof value.latitude === 'number' &&
    typeof value.longitude === 'number' &&
    typeof value.timestamp === 'string';
}

function getActiveRoutes(): string[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const parsed = JSON.parse(localStorage.getItem(ACTIVE_ROUTES_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function setActiveRoute(trackingID: string, active: boolean): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const current = new Set(getActiveRoutes());
    if (active) current.add(trackingID);
    else current.delete(trackingID);
    localStorage.setItem(ACTIVE_ROUTES_KEY, JSON.stringify(Array.from(current)));
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(ROUTE_TRACKING_UPDATED_EVENT));
  } catch {
    // Route tracking can continue for the current tab even if active route persistence fails.
  }
}

export function getActiveRouteIds(): string[] {
  return getActiveRoutes();
}

function distanceMeters(a: RouteSampleRecord, b: RouteSampleRecord): number {
  const earthRadius = 6_371_000;
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

async function saveRouteSample(sample: RouteSampleRecord): Promise<void> {
  const normalized = normalizeRouteSample(sample);
  if (isIndexedDbAvailable() && await idbPut(OFFLINE_ROUTE_STORE, normalized)) {
    dispatchRouteUpdated(normalized.trackingID);
    return;
  }
  const next = [...readFallbackSamples(), normalized].slice(-MAX_STORED_ROUTE_SAMPLES);
  saveFallbackSamples(next);
  dispatchRouteUpdated(normalized.trackingID);
}

function shouldSaveSample(next: RouteSampleRecord): boolean {
  const previous = lastSamples.get(next.trackingID);
  if (!previous) return true;
  const elapsed = Date.parse(next.timestamp) - Date.parse(previous.timestamp);
  const minInterval = typeof document !== 'undefined' && document.visibilityState === 'hidden'
    ? BACKGROUND_MIN_SAMPLE_INTERVAL_MS
    : MIN_SAMPLE_INTERVAL_MS;
  if (elapsed < minInterval) return false;
  return distanceMeters(previous, next) >= MIN_SAMPLE_DISTANCE_M;
}

export function startRouteTracking(trackingID: string): boolean {
  if (!trackingID || activeWatchIds.has(trackingID)) return false;
  if (typeof navigator === 'undefined' || !navigator.geolocation) return false;

  let watchId: number;
  try {
    watchId = navigator.geolocation.watchPosition(
      position => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
        if (Number.isFinite(accuracy) && accuracy > MAX_ACCEPTED_ACCURACY_M) return;

        const sample: RouteSampleRecord = {
          id: `${trackingID}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          trackingID,
          latitude,
          longitude,
          accuracy,
          speed,
          heading,
          timestamp: new Date(position.timestamp || Date.now()).toISOString(),
          syncState: 0,
          synced: false,
        };
        if (!shouldSaveSample(sample)) return;
        lastSamples.set(trackingID, sample);
        void saveRouteSample(sample);
      },
      error => {
        const code = (error as GeolocationPositionError)?.code;
        const message = code === 1
          ? 'ไม่ได้รับอนุญาตให้ใช้ GPS'
          : code === 2
            ? 'ไม่สามารถระบุตำแหน่งได้'
            : code === 3
              ? 'หมดเวลาในการรับตำแหน่ง GPS'
              : 'เกิดข้อผิดพลาด GPS';
        logTelemetry({
          level: 'warn',
          name: 'route.tracking.geo_error',
          trackingID,
          message,
          data: { code },
        });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(ROUTE_TRACKING_ERROR_EVENT, {
            detail: { trackingID, code, message },
          }));
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10_000,
        timeout: 20_000,
      },
    );
  } catch {
    return false;
  }

  activeWatchIds.set(trackingID, watchId);
  setActiveRoute(trackingID, true);
  return true;
}

export function stopRouteTracking(trackingID: string): void {
  const watchId = activeWatchIds.get(trackingID);
  if (watchId !== undefined && typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
  activeWatchIds.delete(trackingID);
  setActiveRoute(trackingID, false);
}

async function readRouteSamplesForTracking(trackingID: string): Promise<RouteSampleRecord[]> {
  if (isIndexedDbAvailable()) {
    const indexed = await idbGetByIndex<RouteSampleRecord>(OFFLINE_ROUTE_STORE, 'trackingID', trackingID);
    if (indexed) {
      return indexed.map(normalizeRouteSample).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    }
  }
  return readFallbackSamples()
    .filter(sample => sample.trackingID === trackingID)
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

export async function getRouteSamples(trackingID: string): Promise<RouteSampleRecord[]> {
  return readRouteSamplesForTracking(trackingID);
}

export async function getUnsyncedRouteSamples(trackingID?: string): Promise<RouteSampleRecord[]> {
  if (isIndexedDbAvailable()) {
    if (trackingID) {
      const byTracking = await idbGetByIndex<RouteSampleRecord>(OFFLINE_ROUTE_STORE, 'trackingID', trackingID);
      if (byTracking) {
        return byTracking
          .map(normalizeRouteSample)
          .filter(isSampleUnsynced)
          .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
      }
    }
    const unsynced = await idbGetByIndex<RouteSampleRecord>(OFFLINE_ROUTE_STORE, 'syncState', 0);
    if (unsynced) {
      return unsynced
        .map(normalizeRouteSample)
        .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    }
  }

  return readFallbackSamples()
    .filter(sample => isSampleUnsynced(sample) && (!trackingID || sample.trackingID === trackingID))
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

export async function markRouteSamplesSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  if (isIndexedDbAvailable()) {
    const samples = (await Promise.all(ids.map(id => idbGet<RouteSampleRecord>(OFFLINE_ROUTE_STORE, id)))).filter(
      (sample): sample is RouteSampleRecord => !!sample,
    );
    await Promise.all(samples.map(sample => idbPut(OFFLINE_ROUTE_STORE, normalizeRouteSample({ ...sample, syncState: 1, synced: true }))));
    const trackingIds = new Set(samples.map(sample => sample.trackingID));
    trackingIds.forEach(dispatchRouteUpdated);
    if (samples.length > 0) return;
  }

  const idSet = new Set(ids);
  const fallbackSamples = readFallbackSamples();
  const nextSamples = fallbackSamples.map(sample => idSet.has(sample.id) ? normalizeRouteSample({ ...sample, syncState: 1, synced: true }) : sample);
  saveFallbackSamples(nextSamples);
  new Set(fallbackSamples.filter(sample => idSet.has(sample.id)).map(sample => sample.trackingID)).forEach(dispatchRouteUpdated);
}

export async function clearRouteSamples(trackingID: string): Promise<void> {
  const records = await getRouteSamples(trackingID);
  await Promise.all(records.map(record => idbDelete(OFFLINE_ROUTE_STORE, record.id)));
  saveFallbackSamples(readFallbackSamples().filter(sample => sample.trackingID !== trackingID));
  dispatchRouteUpdated(trackingID);
}

export async function purgeSyncedRouteSamples(olderThanDays: number = 3): Promise<void> {
  const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
  const records = await idbGetAll<RouteSampleRecord>(OFFLINE_ROUTE_STORE);
  if (records) {
    const toDelete = records.filter(sample => isSampleSynced(sample) && Date.parse(sample.timestamp) < cutoffTime);
    await Promise.all(toDelete.map(sample => idbDelete(OFFLINE_ROUTE_STORE, sample.id)));
  }

  const fallbackSamples = readFallbackSamples();
  const nextFallback = fallbackSamples.filter(
    sample => !(isSampleSynced(sample) && Date.parse(sample.timestamp) < cutoffTime)
  );
  if (nextFallback.length !== fallbackSamples.length) {
    saveFallbackSamples(nextFallback);
  }
}

export function resumeActiveRouteTracking(): void {
  for (const trackingID of getActiveRoutes()) {
    startRouteTracking(trackingID);
  }
}

export type RouteSyncSnapshot = {
  pendingRouteSampleCount: number;
  latestRouteSampleAt: string | null;
  pendingRoutes: RouteSyncRouteHealth[];
};

export type RouteSyncRouteHealth = {
  trackingID: string;
  pendingCount: number;
  latestSampleAt: string | null;
  active: boolean;
};

/** Lightweight status for header popover (avoids loading all samples per active route). */
export async function getRouteSyncSnapshot(): Promise<RouteSyncSnapshot> {
  const unsynced = await getUnsyncedRouteSamples();
  const latest = unsynced
    .map(sample => sample.timestamp)
    .filter(Boolean)
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
  const activeRouteIds = getActiveRoutes();
  const activeRouteSet = new Set(activeRouteIds);
  const pendingByTracking = new Map<string, RouteSyncRouteHealth>();
  for (const trackingID of activeRouteIds) {
    pendingByTracking.set(trackingID, { trackingID, pendingCount: 0, latestSampleAt: null, active: true });
  }
  for (const sample of unsynced) {
    const entry = pendingByTracking.get(sample.trackingID) ?? {
      trackingID: sample.trackingID,
      pendingCount: 0,
      latestSampleAt: null,
      active: activeRouteSet.has(sample.trackingID),
    };
    entry.pendingCount += 1;
    if (!entry.latestSampleAt || Date.parse(sample.timestamp) > Date.parse(entry.latestSampleAt)) {
      entry.latestSampleAt = sample.timestamp;
    }
    pendingByTracking.set(sample.trackingID, entry);
  }
  const pendingRoutes = Array.from(pendingByTracking.values())
    .sort((a, b) => {
      if (a.pendingCount !== b.pendingCount) return b.pendingCount - a.pendingCount;
      return Date.parse(b.latestSampleAt ?? '0') - Date.parse(a.latestSampleAt ?? '0');
    });
  return { pendingRouteSampleCount: unsynced.length, latestRouteSampleAt: latest, pendingRoutes };
}

export async function migrateRouteSamplesToIndexedDb(): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  const fallback = readFallbackSamples();
  if (fallback.length === 0) return;
  const existing = await idbGetAll<RouteSampleRecord>(OFFLINE_ROUTE_STORE);
  if (existing && existing.length > 0) return;
  for (const sample of fallback) {
    await idbPut(OFFLINE_ROUTE_STORE, normalizeRouteSample(sample));
  }
  saveFallbackSamples([]);
  logTelemetry({ level: 'info', name: 'route.samples.migrated', data: { count: fallback.length } });
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    void migrateRouteSamplesToIndexedDb();
    resumeActiveRouteTracking();
  });
}
