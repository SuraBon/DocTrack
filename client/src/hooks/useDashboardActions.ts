import { useState } from 'react';
import { useParcelStore } from '@/hooks/useParcelStore';
import { useAuth } from '@/contexts/AuthContext';
import { deleteParcel, releaseDelivery, startDelivery, syncRouteSamples } from '@/lib/parcelService';
import { startRouteTracking, stopRouteTracking } from '@/lib/routeTracking';
import { getActiveDeliveryAssignment, buildAssignmentNote } from '@/lib/deliveryAssignment';
import type { Parcel } from '@/types/parcel';
import { toast } from 'sonner';

import { GeoPosition, GeoStatus } from '@/hooks/useGeolocation';

export type MessengerView = 'waiting' | 'mine' | 'done';

export function useDashboardActions({
  messengerPosition,
  messengerGeoStatus,
  requestMessengerLocation,
  fetchData,
  loading,
}: {
  messengerPosition: GeoPosition | null;
  messengerGeoStatus: GeoStatus;
  requestMessengerLocation: () => void;
  fetchData: () => Promise<void>;
  loading: boolean;
}) {
  const { user } = useAuth();
  const { removeParcelLocally, updateParcelLocally, loadParcels } = useParcelStore();

  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isDeliveryDetailsOpen, setIsDeliveryDetailsOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [confirmTrackingId, setConfirmTrackingId] = useState<string | null>(null);
  const [isConfirmFlowOpen, setIsConfirmFlowOpen] = useState(false);
  const [messengerView, setMessengerView] = useState<MessengerView>('mine');
  const [startingDeliveryId, setStartingDeliveryId] = useState<string | null>(null);
  const [releasingDeliveryId, setReleasingDeliveryId] = useState<string | null>(null);

  const currentEmployeeId = String(user?.employeeId || '').trim().toUpperCase();

  const handleRefresh = async () => {
    if (loading) return;
    await fetchData();
    toast.success('อัปเดตข้อมูลเรียบร้อย');
  };

  const handleDelete = async () => {
    if (!selectedParcel) return;
    setIsDeleteConfirmOpen(true);
  };

  const openConfirmFlow = (trackingId: string) => {
    setIsTimelineOpen(false);
    setIsDeliveryDetailsOpen(false);
    setConfirmTrackingId(trackingId);
    setIsConfirmFlowOpen(true);
  };

  const handleStartDelivery = async (parcel: Parcel) => {
    if (startingDeliveryId) return;
    if (!messengerPosition && messengerGeoStatus !== 'loading') requestMessengerLocation();
    setStartingDeliveryId(parcel.TrackingID);
    const res = await startDelivery(
      parcel.TrackingID,
      messengerPosition?.latitude,
      messengerPosition?.longitude,
    );
    setStartingDeliveryId(null);

    if (!res.success) {
      const message = res.error?.includes('มีผู้รับงานแล้ว')
        ? 'งานนี้มีผู้รับแล้ว กรุณารีเฟรช'
        : res.error || 'รับงานไม่ได้ กรุณาลองใหม่';
      toast.error(message);
      return;
    }

    const startEvent = {
      id: `LOCAL-${Date.now()}`,
      trackingId: parcel.TrackingID,
      timestamp: new Date().toISOString(),
      eventType: 'START_DELIVERY' as const,
      location: parcel['สาขาผู้ส่ง'] || '',
      destLocation: parcel['สาขาผู้รับ'] || '',
      person: res.assignedToName || user?.name || user?.employeeId || '',
      note: buildAssignmentNote(res.assignedToId || currentEmployeeId),
      latitude: messengerPosition?.latitude,
      longitude: messengerPosition?.longitude,
    };
    const pickupEvent = res.autoPickedUp ? {
      id: `LOCAL-PICKUP-${Date.now()}`,
      trackingId: parcel.TrackingID,
      timestamp: new Date().toISOString(),
      eventType: 'PICKUP' as const,
      location: parcel['สาขาผู้ส่ง'] || '',
      destLocation: parcel['สาขาผู้รับ'] || '',
      person: res.assignedToName || user?.name || user?.employeeId || '',
      note: 'autoPickup=originGpsMatched',
      latitude: messengerPosition?.latitude,
      longitude: messengerPosition?.longitude,
    } : null;

    const hasLocalAssignment = Boolean(getActiveDeliveryAssignment(parcel));
    const nextEvents = res.alreadyStarted && hasLocalAssignment
      ? parcel.events
      : [...(parcel.events || []), startEvent, ...(pickupEvent ? [pickupEvent] : [])];
    updateParcelLocally(parcel.TrackingID, {
      'สถานะ': 'กำลังจัดส่ง',
      events: nextEvents,
    });
    startRouteTracking(parcel.TrackingID);
    setMessengerView('mine');
    toast.success(res.autoPickedUp ? 'รับงานและบันทึกรับของแล้ว' : (res.alreadyStarted ? 'งานนี้อยู่ในรายการที่ต้องส่งแล้ว' : 'รับงานสำเร็จ'));
    loadParcels(undefined, true).catch(() => {});
  };

  const handleReleaseDelivery = async (parcel: Parcel) => {
    if (releasingDeliveryId) return;
    setReleasingDeliveryId(parcel.TrackingID);
    const res = await releaseDelivery(parcel.TrackingID);
    setReleasingDeliveryId(null);

    if (!res.success) {
      toast.error(res.error || 'คืนงานไม่ได้ กรุณาลองใหม่');
      return;
    }

    const releaseEvent = {
      id: `LOCAL-RELEASE-${Date.now()}`,
      trackingId: parcel.TrackingID,
      timestamp: new Date().toISOString(),
      eventType: 'RELEASE_DELIVERY' as const,
      location: parcel['สาขาผู้ส่ง'] || '',
      destLocation: parcel['สาขาผู้รับ'] || '',
      person: user?.name || user?.employeeId || '',
      note: buildAssignmentNote(currentEmployeeId),
    };

    updateParcelLocally(parcel.TrackingID, {
      'สถานะ': 'รอจัดส่ง',
      events: [...(parcel.events || []), releaseEvent],
    });
    stopRouteTracking(parcel.TrackingID);
    void syncRouteSamples(parcel.TrackingID);
    setMessengerView('waiting');
    toast.success(res.alreadyReleased ? 'งานนี้พร้อมให้ผู้อื่นกดรับแล้ว' : 'คืนงานสำเร็จ');
    loadParcels(undefined, true).catch(() => {});
  };

  const executeDelete = async () => {
    if (!selectedParcel) return;
    const trackingID = selectedParcel.TrackingID;
    setIsTimelineOpen(false);
    setIsDeleteConfirmOpen(false);
    removeParcelLocally(trackingID);
    toast.success('กำลังลบรายการ...');
    const res = await deleteParcel(trackingID);
    if (res.success) {
      toast.success('ลบรายการสำเร็จ');
    } else {
      toast.error('ไม่สามารถลบรายการได้ จะทำการรีโหลดข้อมูล');
      loadParcels(undefined, true);
    }
  };

  return {
    selectedParcel,
    setSelectedParcel,
    isTimelineOpen,
    setIsTimelineOpen,
    isDeliveryDetailsOpen,
    setIsDeliveryDetailsOpen,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    confirmTrackingId,
    setConfirmTrackingId,
    isConfirmFlowOpen,
    setIsConfirmFlowOpen,
    messengerView,
    setMessengerView,
    startingDeliveryId,
    releasingDeliveryId,
    handleRefresh,
    handleDelete,
    executeDelete,
    openConfirmFlow,
    handleStartDelivery,
    handleReleaseDelivery,
  };
}
