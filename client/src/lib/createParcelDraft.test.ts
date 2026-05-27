import { vi, describe, expect, it, beforeEach } from 'vitest';
import {
  loadCreateParcelDraft,
  loadCreateParcelDraftFromDb,
  saveCreateParcelDraft,
  clearCreateParcelDraft,
  EMPTY_CREATE_PARCEL_DRAFT,
  CreateParcelDraft,
} from './createParcelDraft';

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = String(value);
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    for (const key in store) delete store[key];
  }),
};

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
Object.defineProperty(globalThis, 'indexedDB', { value: undefined, writable: true });

describe('createParcelDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('returns empty draft when localStorage is empty', () => {
    const draft = loadCreateParcelDraft();
    expect(draft).toEqual(EMPTY_CREATE_PARCEL_DRAFT);
  });

  it('returns populated draft when loaded from legacy localStorage', () => {
    const mockDraft: CreateParcelDraft = {
      senderName: 'John Doe',
      senderBranch: 'Branch A',
      receiverName: 'Jane Smith',
      receiverBranch: 'Branch B',
      description: 'Documents',
      note: 'Fragile',
    };
    store.shiptrack_create_parcel_draft = JSON.stringify(mockDraft);

    const draft = loadCreateParcelDraft();
    expect(draft).toEqual(mockDraft);
  });

  it('handles corrupt legacy draft data gracefully', () => {
    store.shiptrack_create_parcel_draft = 'invalid-json';
    const draft = loadCreateParcelDraft();
    expect(draft).toEqual(EMPTY_CREATE_PARCEL_DRAFT);
  });

  it('saves draft correctly', async () => {
    const mockDraft: CreateParcelDraft = {
      senderName: 'Alice',
      senderBranch: 'Branch C',
      receiverName: 'Bob',
      receiverBranch: 'Branch D',
      description: 'Box',
      note: 'Urgent',
    };

    saveCreateParcelDraft(mockDraft);
    await new Promise(resolve => setTimeout(resolve, 0));
    // Since indexedDB is undefined, it falls back to localStorage immediately
    expect(JSON.parse(store.shiptrack_create_parcel_draft)).toEqual(mockDraft);
  });

  it('clears draft correctly', async () => {
    const mockDraft: CreateParcelDraft = {
      senderName: 'Alice',
      senderBranch: 'Branch C',
      receiverName: 'Bob',
      receiverBranch: 'Branch D',
      description: 'Box',
      note: 'Urgent',
    };

    saveCreateParcelDraft(mockDraft);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(store.shiptrack_create_parcel_draft).toBeDefined();

    clearCreateParcelDraft();
    expect(store.shiptrack_create_parcel_draft).toBeUndefined();
  });

  it('loads draft from database fallback when indexedDB is unavailable', async () => {
    const mockDraft: CreateParcelDraft = {
      senderName: 'Alice',
      senderBranch: 'Branch C',
      receiverName: 'Bob',
      receiverBranch: 'Branch D',
      description: 'Box',
      note: 'Urgent',
    };
    store.shiptrack_create_parcel_draft = JSON.stringify(mockDraft);

    const draft = await loadCreateParcelDraftFromDb();
    expect(draft).toEqual(mockDraft);
  });
});
