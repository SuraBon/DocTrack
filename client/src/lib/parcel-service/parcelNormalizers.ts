import type { Parcel } from '@/types/parcel';

export function normalizeParcelStatus(parcel: Parcel): Parcel {
  const raw = parcel as Parcel & Record<string, unknown>;
  const getString = (keys: string[]) => {
    for (const key of keys) {
      const value = raw[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return undefined;
  };
  const proofPhoto = getString([
    'รูปยืนยัน',
    'รูปหลักฐาน',
    'รูปภาพ',
    'photoUrl',
    'photoURL',
    'PhotoUrl',
    'PhotoURL',
    'proofPhotoUrl',
    'proofPhoto',
    'imageUrl',
    'imageURL',
  ]);
  const normalizedEvents = Array.isArray(parcel.events)
    ? parcel.events.map(event => {
        const eventRaw = event as typeof event & Record<string, unknown>;
        const eventPhoto = [
          event.photoUrl,
          eventRaw['photoURL'],
          eventRaw['PhotoUrl'],
          eventRaw['PhotoURL'],
          eventRaw['proofPhotoUrl'],
          eventRaw['proofPhoto'],
          eventRaw['imageUrl'],
          eventRaw['imageURL'],
          eventRaw['รูปยืนยัน'],
          eventRaw['รูปหลักฐาน'],
        ].find((value): value is string => typeof value === 'string' && value.trim().length > 0);
        return eventPhoto ? { ...event, photoUrl: eventPhoto.trim() } : event;
      })
    : parcel.events;

  return {
    ...parcel,
    ...(proofPhoto ? { 'รูปยืนยัน': proofPhoto } : {}),
    ...(normalizedEvents ? { events: normalizedEvents } : {}),
  };
}

export function normalizeParcels(parcels: Parcel[]): Parcel[] {
  return parcels.map(normalizeParcelStatus);
}
