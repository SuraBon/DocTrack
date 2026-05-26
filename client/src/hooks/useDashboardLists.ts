import { useMemo } from 'react';
import type { Parcel, ParcelSummary } from '@/types/parcel';
import {
  MESSENGER_BATCH_SIZE,
  STATS,
  getTimelineEvents,
  isParcelStale,
  sortAdminParcels,
  sortMessengerWork,
  wasAssignedToMe,
  type AdminSortMode,
} from '@/components/dashboard/DashboardComponents';
import { isAssignedToCurrentUser, isAvailableForMessenger } from '@/lib/deliveryAssignment';

type DashboardListsInput = {
  parcels: Parcel[];
  summary: ParcelSummary | null;
  statusFilter: string;
  defaultStatusFilter: string;
  debouncedSearch: string;
  isMessengerDashboard: boolean;
  currentEmployeeId: string;
  adminSort: AdminSortMode;
  currentPage: number;
  pageSize: number;
  totalCount: number;
};

export function useDashboardLists({
  parcels,
  summary,
  statusFilter,
  defaultStatusFilter,
  debouncedSearch,
  isMessengerDashboard,
  currentEmployeeId,
  adminSort,
  currentPage,
  pageSize,
  totalCount,
}: DashboardListsInput) {
  const stats = useMemo(() => {
    return STATS.map((stat) => ({
      ...stat,
      label: stat.label,
      count: summary?.[stat.key] ?? 0,
    }));
  }, [summary]);

  const filteredParcels = useMemo(() => {
    let f = parcels;
    if (!isMessengerDashboard && statusFilter !== defaultStatusFilter) {
      f = f.filter(p => p['สถานะ'] === statusFilter);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      f = f.filter(p =>
        p.TrackingID.toLowerCase().includes(q) ||
        p['ผู้ส่ง'].toLowerCase().includes(q) ||
        p['ผู้รับ'].toLowerCase().includes(q) ||
        p['สาขาผู้รับ'].toLowerCase().includes(q)
      );
    }
    return f;
  }, [parcels, statusFilter, defaultStatusFilter, debouncedSearch, isMessengerDashboard]);

  const messengerWaitingParcels = useMemo(
    () => filteredParcels
      .filter(isAvailableForMessenger)
      .sort(sortMessengerWork),
    [filteredParcels],
  );
  const messengerMineParcels = useMemo(
    () => filteredParcels
      .filter(parcel => isAssignedToCurrentUser(parcel, currentEmployeeId) && parcel['สถานะ'] !== 'ส่งสำเร็จ')
      .sort(sortMessengerWork),
    [filteredParcels, currentEmployeeId],
  );
  const messengerDoneParcels = useMemo(
    () => filteredParcels.filter(parcel => parcel['สถานะ'] === 'ส่งสำเร็จ' && wasAssignedToMe(parcel, currentEmployeeId)),
    [filteredParcels, currentEmployeeId],
  );
  const adminSortedParcels = useMemo(
    () => sortAdminParcels(filteredParcels, adminSort),
    [filteredParcels, adminSort],
  );
  const adminNeedsAttentionParcels = useMemo(
    () => adminSortedParcels
      .filter(parcel => parcel['สถานะ'] !== 'ส่งสำเร็จ' || isParcelStale(parcel))
      .sort((a, b) => {
        const staleDiff = Number(isParcelStale(b)) - Number(isParcelStale(a));
        if (staleDiff !== 0) return staleDiff;
        return sortMessengerWork(a, b);
      })
      .slice(0, 6),
    [adminSortedParcels],
  );

  const hasAdminFilters = Boolean(debouncedSearch || statusFilter !== defaultStatusFilter);
  const adminTotalCount = hasAdminFilters ? adminSortedParcels.length : (totalCount || adminSortedParcels.length);
  const backendTotalPages = Math.max(1, Math.ceil(adminTotalCount / pageSize));
  const { totalPages, paginatedParcels, startIndex, endIndex } = useMemo(() => {
    const total = backendTotalPages;
    const paginated = adminSortedParcels.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const start = adminSortedParcels.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, adminSortedParcels.length);
    return { totalPages: total, paginatedParcels: paginated, startIndex: start, endIndex: end };
  }, [adminSortedParcels, currentPage, pageSize, backendTotalPages]);

  const adminNeedsAttentionIds = useMemo(
    () => new Set(adminNeedsAttentionParcels.map(parcel => parcel.TrackingID)),
    [adminNeedsAttentionParcels],
  );
  const adminRegularParcels = useMemo(
    () => paginatedParcels.filter(parcel => !adminNeedsAttentionIds.has(parcel.TrackingID)),
    [paginatedParcels, adminNeedsAttentionIds],
  );

  return {
    stats,
    filteredParcels,
    messengerWaitingParcels,
    messengerMineParcels,
    messengerDoneParcels,
    adminSortedParcels,
    adminNeedsAttentionParcels,
    adminRegularParcels,
    adminTotalCount,
    totalPages,
    paginatedParcels,
    startIndex,
    endIndex,
    getTimelineEvents,
    messengerBatchSize: MESSENGER_BATCH_SIZE,
  };
}
