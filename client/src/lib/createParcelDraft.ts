const CREATE_PARCEL_DRAFT_KEY = 'shiptrack_create_parcel_draft';

export type CreateParcelDraft = {
  senderName: string;
  senderBranch: string;
  receiverName: string;
  receiverBranch: string;
  itemType: string;
  description: string;
  note: string;
};

export const EMPTY_CREATE_PARCEL_DRAFT: CreateParcelDraft = {
  senderName: '',
  senderBranch: '',
  receiverName: '',
  receiverBranch: '',
  itemType: '',
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
      itemType: String(parsed.itemType || ''),
      description: String(parsed.description || ''),
      note: String(parsed.note || ''),
    };
  } catch {
    return EMPTY_CREATE_PARCEL_DRAFT;
  }
}

export function saveCreateParcelDraft(draft: CreateParcelDraft): void {
  localStorage.setItem(CREATE_PARCEL_DRAFT_KEY, JSON.stringify(draft));
}

export function clearCreateParcelDraft(): void {
  localStorage.removeItem(CREATE_PARCEL_DRAFT_KEY);
}

