import { useEffect, useState } from 'react';
import { getRouteSamples, type RouteSampleRecord } from '@/lib/routeTracking';

export function useRouteSamples(trackingID?: string) {
  const [samples, setSamples] = useState<RouteSampleRecord[]>([]);

  useEffect(() => {
    if (!trackingID) {
      setSamples([]);
      return;
    }

    let active = true;
    const refresh = () => {
      void getRouteSamples(trackingID).then(next => {
        if (active) setSamples(next);
      });
    };

    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ trackingID?: string }>).detail;
      if (!detail?.trackingID || detail.trackingID === trackingID) refresh();
    };

    refresh();
    window.addEventListener('shiptrack-route-samples-updated', handleUpdate);
    return () => {
      active = false;
      window.removeEventListener('shiptrack-route-samples-updated', handleUpdate);
    };
  }, [trackingID]);

  return samples;
}
