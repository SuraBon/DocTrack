export const GAS_URL     = import.meta.env.VITE_GAS_URL     as string | undefined ?? '';
export const GAS_API_KEY = import.meta.env.VITE_GAS_API_KEY as string | undefined ?? '';
export const API_TIMEOUT_MS = 25_000;

// ── Branch list ──────────────────────────────────────────────────────────────

const DEFAULT_BRANCHES = [
  'MS', 'พระประแดง', 'บางนา', 'มีนบุรี', 'เลียบด่วน',
  'เดอะมอลล์บางกะปิ', 'วิภาวดี', 'พิบูลสงคราม', 'เซ็นทรัล พระราม 2',
  'เดอะมอลล์บางแค', 'มหาชัย', 'ศาลายา', 'กาญจนา',
];

const storedBranches = (() => {
  try {
    return JSON.parse(localStorage.getItem('branches') ?? 'null') as string[] | null;
  } catch {
    return null;
  }
})();

export let BRANCHES: string[] = storedBranches ?? DEFAULT_BRANCHES;

const CONFIG_UPDATED_EVENT = 'parcel-config-updated';

export function getBranches(): string[] {
  return BRANCHES;
}

export function setBranches(branches: string[]): void {
  BRANCHES = branches;
  localStorage.setItem('branches', JSON.stringify(branches));
  window.dispatchEvent(new Event(CONFIG_UPDATED_EVENT));
}

export function normalizeBranchList(branches: unknown): string[] {
  if (!Array.isArray(branches)) return [];
  const seen = new Set<string>();
  return branches
    .map(branch => String(branch || '').trim())
    .filter(branch => {
      if (!branch || seen.has(branch)) return false;
      seen.add(branch);
      return true;
    });
}

export function isConfigured(): boolean {
  return !!GAS_URL && BRANCHES.length > 0;
}

export function getGasUrl(): string {
  return GAS_URL;
}

export function onConfigUpdated(listener: () => void): () => void {
  window.addEventListener(CONFIG_UPDATED_EVENT, listener);
  return () => window.removeEventListener(CONFIG_UPDATED_EVENT, listener);
}

// ── Internal API helper ──────────────────────────────────────────────────────
