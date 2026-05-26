import type { Parcel, ParcelStatus } from '@/types/parcel';
import {
  LEGACY_HISTORY_KEY,
  OFFLINE_HISTORY_STORE,
  type OfflineHistoryRecord,
  idbDelete,
  idbGetAll,
  idbPut,
  isIndexedDbAvailable,
} from './offlineDb';

const DEVICE_ID_KEY = 'shiptrack_device_id';
const CREATED_PARCELS_KEY = 'shiptrack_created_parcels';
const MAX_HISTORY_ITEMS = 50;

export interface CreatedParcelHistoryItem {
  trackingID: string;
  createdAt: string;
  senderName: string;
  senderBranch: string;
  receiverName: string;
  receiverBranch: string;
  status?: ParcelStatus;
  proofPhotoUrl?: string;
}

function createFallbackId(): string {
  return `device_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const next = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : createFallbackId();
    localStorage.setItem(DEVICE_ID_KEY, next);
    return next;
  } catch {
    return createFallbackId();
  }
}

export function getCreatedParcelHistory(): CreatedParcelHistoryItem[] {
  try {
    const raw = localStorage.getItem(CREATED_PARCELS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is CreatedParcelHistoryItem =>
        item &&
        typeof item.trackingID === 'string' &&
        typeof item.createdAt === 'string' &&
        typeof item.senderName === 'string' &&
        typeof item.senderBranch === 'string' &&
        typeof item.receiverName === 'string' &&
        typeof item.receiverBranch === 'string',
      )
      .map(item => ({
        ...item,
        proofPhotoUrl: typeof item.proofPhotoUrl === 'string' && item.proofPhotoUrl.trim()
          ? item.proofPhotoUrl
          : undefined,
      }))
      .slice(0, MAX_HISTORY_ITEMS);
  } catch {
    localStorage.removeItem(CREATED_PARCELS_KEY);
    return [];
  }
}

export async function getCreatedParcelHistoryFromDb(): Promise<CreatedParcelHistoryItem[]> {
  const records = await idbGetAll<OfflineHistoryRecord>(OFFLINE_HISTORY_STORE);
  if (records && records.length > 0) {
    return records
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, MAX_HISTORY_ITEMS);
  }
  const legacy = getCreatedParcelHistory();
  if (legacy.length > 0 && isIndexedDbAvailable()) {
    for (const item of legacy) {
      await idbPut(OFFLINE_HISTORY_STORE, { ...item, id: item.trackingID });
    }
    localStorage.removeItem(LEGACY_HISTORY_KEY);
  }
  return legacy;
}

function persistCreatedHistoryToDb(items: CreatedParcelHistoryItem[]): void {
  for (const item of items) {
    void idbPut(OFFLINE_HISTORY_STORE, { ...item, id: item.trackingID });
  }
}

export function saveCreatedParcelHistory(item: CreatedParcelHistoryItem): CreatedParcelHistoryItem[] {
  const next = [
    item,
    ...getCreatedParcelHistory().filter(existing => existing.trackingID !== item.trackingID),
  ].slice(0, MAX_HISTORY_ITEMS);
  localStorage.setItem(CREATED_PARCELS_KEY, JSON.stringify(next));
  persistCreatedHistoryToDb(next);
  window.dispatchEvent(new Event('doc-track-created-parcels-updated'));
  return next;
}

export function removeCreatedParcelHistoryItem(trackingID: string): CreatedParcelHistoryItem[] {
  const next = getCreatedParcelHistory().filter(item => item.trackingID !== trackingID);
  localStorage.setItem(CREATED_PARCELS_KEY, JSON.stringify(next));
  void idbDelete(OFFLINE_HISTORY_STORE, trackingID);
  window.dispatchEvent(new Event('doc-track-created-parcels-updated'));
  return next;
}

export function clearCreatedParcelHistory(): void {
  localStorage.removeItem(CREATED_PARCELS_KEY);
  void idbGetAll<OfflineHistoryRecord>(OFFLINE_HISTORY_STORE).then(records => {
    records?.forEach(record => void idbDelete(OFFLINE_HISTORY_STORE, record.id));
  });
  window.dispatchEvent(new Event('doc-track-created-parcels-updated'));
}

export function updateCreatedParcelHistoryFromParcel(parcel: Parcel): CreatedParcelHistoryItem[] {
  const existing = getCreatedParcelHistory();
  const index = existing.findIndex(item => item.trackingID === parcel.TrackingID);
  if (index === -1) return existing;
  const next = [...existing];
  next[index] = {
    ...next[index],
    status: parcel['สถานะ'],
    senderName: parcel['ผู้ส่ง'] || next[index].senderName,
    senderBranch: parcel['สาขาผู้ส่ง'] || next[index].senderBranch,
    receiverName: parcel['ผู้รับ'] || next[index].receiverName,
    receiverBranch: parcel['สาขาผู้รับ'] || next[index].receiverBranch,
    proofPhotoUrl: parcel['รูปยืนยัน'] || next[index].proofPhotoUrl,
  };
  localStorage.setItem(CREATED_PARCELS_KEY, JSON.stringify(next));
  persistCreatedHistoryToDb(next);
  window.dispatchEvent(new Event('doc-track-created-parcels-updated'));
  return next;
}

export function getCreatedParcelProofPhoto(trackingID: string): string | undefined {
  return getCreatedParcelHistory()
    .find(item => item.trackingID === trackingID)
    ?.proofPhotoUrl;
}
