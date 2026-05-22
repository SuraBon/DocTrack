import { useEffect, useState } from 'react';
import { getBranches, loadBranches, onConfigUpdated } from '@/lib/parcelService';

export function useBranches() {
  const [branches, setBranches] = useState<string[]>(() => getBranches());
  const [loading, setLoading] = useState(false);

  const refreshBranches = async () => {
    setLoading(true);
    try {
      const nextBranches = await loadBranches();
      setBranches(nextBranches);
      return nextBranches;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const syncLocalBranches = () => setBranches(getBranches());
    const unsubscribe = onConfigUpdated(syncLocalBranches);
    void refreshBranches();
    return unsubscribe;
  }, []);

  return { branches, loading, refreshBranches };
}
