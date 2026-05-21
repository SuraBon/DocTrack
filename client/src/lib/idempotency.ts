import { getDeviceId } from './createdParcelHistory';

export function createIdempotencyKey(action: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${action}:${getDeviceId()}:${Date.now()}:${random}`;
}

