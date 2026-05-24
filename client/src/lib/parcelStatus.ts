import type { Parcel, ParcelSummary } from '@/types/parcel';

/**
 * Derives the real display status of a parcel.
 *
 * Priority: use the structured `events` array when available (more reliable).
 * A parcel marked 'ส่งสำเร็จ' in the backend may actually still be
 * 'กำลังจัดส่ง' if the last recorded action was a FORWARD, not a delivery.
 */
export function applyDerivedStatus(parcel: Parcel): Parcel {
  if (parcel['สถานะ'] !== 'ส่งสำเร็จ') return parcel;

  // ── Primary: use structured events array ──────────────────────────────────
  if (Array.isArray(parcel.events) && parcel.events.length > 0) {
    // Find the last meaningful event (ignore CREATED)
    const actionEvents = parcel.events.filter(
      e => e.eventType === 'FORWARD' || e.eventType === 'START_DELIVERY' || e.eventType === 'PICKUP' || e.eventType === 'RELEASE_DELIVERY' || e.eventType === 'DELIVERED' || e.eventType === 'PROXY'
    );
    if (actionEvents.length > 0) {
      const lastEvent = actionEvents[actionEvents.length - 1];
      if (lastEvent.eventType === 'FORWARD' || lastEvent.eventType === 'START_DELIVERY' || lastEvent.eventType === 'PICKUP') {
        return { ...parcel, 'สถานะ': 'กำลังจัดส่ง' };
      }
      if (lastEvent.eventType === 'RELEASE_DELIVERY') {
        return { ...parcel, 'สถานะ': 'รอจัดส่ง' };
      }
      // DELIVERED or PROXY → truly delivered
      return parcel;

    }
  }

  return parcel;
}

export function applyDerivedStatuses(parcels: Parcel[]): Parcel[] {
  return parcels.map(applyDerivedStatus);
}

export function summarizeParcels(parcels: Parcel[]): ParcelSummary {
  // Apply derived statuses first so forwarded parcels count correctly
  const derived = applyDerivedStatuses(parcels);
  const summary: ParcelSummary = { total: 0, pending: 0, transit: 0, delivered: 0 };
  for (const parcel of derived) {
    summary.total++;
    if (parcel['สถานะ'] === 'รอจัดส่ง')    summary.pending++;
    else if (parcel['สถานะ'] === 'กำลังจัดส่ง') summary.transit++;
    else if (parcel['สถานะ'] === 'ส่งสำเร็จ')   summary.delivered++;
  }
  return summary;
}
