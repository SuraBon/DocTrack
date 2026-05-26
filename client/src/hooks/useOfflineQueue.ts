import { useEffect, useState } from 'react';
import { getOfflineQueue, type OfflineQueueItem } from '@/lib/offlineQueue';

export function useOfflineQueue() {
  const [items, setItems] = useState<OfflineQueueItem[]>([]);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void getOfflineQueue().then(queue => {
        if (active) setItems(queue);
      });
    };
    refresh();
    window.addEventListener('offline-queue-updated', refresh);
    window.addEventListener('offline-sync-complete', refresh);
    window.addEventListener('online', refresh);
    return () => {
      active = false;
      window.removeEventListener('offline-queue-updated', refresh);
      window.removeEventListener('offline-sync-complete', refresh);
      window.removeEventListener('online', refresh);
    };
  }, []);

  return items;
}
