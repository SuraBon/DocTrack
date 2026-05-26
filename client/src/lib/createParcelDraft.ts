import {
  LEGACY_DRAFT_KEY,
  OFFLINE_DRAFT_STORE,
  type OfflineDraftRecord,
  idbDelete,
  idbGet,
  idbPut,
  isIndexedDbAvailable,
} from './offlineDb';

const CREATE_PARCEL_DRAFT_KEY = 'shiptrack_create_parcel_draft';

export type CreateParcelDraft = {
  senderName: string;
  senderBranch: string;
  receiverName: string;
  receiverBranch: string;
  description: string;
  note: string;
};

export const EMPTY_CREATE_PARCEL_DRAFT: CreateParcelDraft = {
  senderName: '',
  senderBranch: '',
  receiverName: '',
  receiverBranch: '',
  description: '',
  note: '',
};

export function loadCreateParcelDraft(): CreateParcelDraft {
  try {
    const raw = localStorage.getItem(CREATE_PARCEL_DRAFT_KEY);
    if (!raw) return EMPTY_CREATE_PARCEL_DRAFT;
    const parsed = JSON.parse(raw) as Partial<CreateParcelDraft>;
    return {
      ...EMPTY_CREATE_PARCEL_DRAFT,
      senderName: String(parsed.senderName || ''),
      senderBranch: String(parsed.senderBranch || ''),
      receiverName: String(parsed.receiverName || ''),
      receiverBranch: String(parsed.receiverBranch || ''),
      description: String(parsed.description || ''),
      note: String(parsed.note || ''),
    };
  } catch {
    return EMPTY_CREATE_PARCEL_DRAFT;
  }
}

export async function loadCreateParcelDraftFromDb(): Promise<CreateParcelDraft> {
  const record = await idbGet<OfflineDraftRecord>(OFFLINE_DRAFT_STORE, 'createParcel');
  if (record?.value) return record.value;
  const legacy = loadCreateParcelDraft();
  if (isIndexedDbAvailable()) {
    await idbPut(OFFLINE_DRAFT_STORE, {
      id: 'createParcel',
      value: legacy,
      updatedAt: new Date().toISOString(),
    });
    localStorage.removeItem(LEGACY_DRAFT_KEY);
  }
  return legacy;
}

export function saveCreateParcelDraft(draft: CreateParcelDraft): void {
  void idbPut(OFFLINE_DRAFT_STORE, {
    id: 'createParcel',
    value: draft,
    updatedAt: new Date().toISOString(),
  }).then(saved => {
    if (!saved) localStorage.setItem(CREATE_PARCEL_DRAFT_KEY, JSON.stringify(draft));
  });
}

export function clearCreateParcelDraft(): void {
  localStorage.removeItem(CREATE_PARCEL_DRAFT_KEY);
  void idbDelete(OFFLINE_DRAFT_STORE, 'createParcel');
}
