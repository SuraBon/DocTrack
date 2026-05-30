import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { lazy, Suspense, useState } from 'react';
import Timeline from '@/components/Timeline';
import { Spinner } from '@/components/ui/spinner';
import type { Parcel } from '@/types/parcel';
import type { TimelineEvent } from '@/types/timeline';

const TrackingMap = lazy(() => import('@/components/TrackingMap'));

const MapFallback = () => (
  <div className="grid h-[62vh] max-h-[560px] min-h-[340px] place-items-center rounded-2xl bg-surface text-foreground shadow-sm shadow-slate-900/5">
    <div className="flex flex-col items-center gap-3">
      <Spinner className="h-7 w-7 text-primary" />
      <p className="text-sm font-black text-foreground">กำลังโหลดแผนที่...</p>
    </div>
  </div>
);

interface ParcelTimelineModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedParcel: Parcel | null;
  selectedTimelineEvents: TimelineEvent[];
  hasKnownBranches: boolean;
  onConfirmParcel: (trackingId: string) => void;
  onDeleteParcel: () => void;
}

export default function ParcelTimelineModal({
  isOpen,
  setIsOpen,
  selectedParcel,
  selectedTimelineEvents,
  hasKnownBranches,
}: ParcelTimelineModalProps) {
  const [isMapOpen, setIsMapOpen] = useState(false);

  if (!selectedParcel) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-[400px] max-h-[86vh] overflow-hidden rounded-[26px] border border-outline-variant bg-surface dark:bg-card p-0 shadow-2xl" showCloseButton={false}>
        <div className="flex max-h-[86vh] flex-col">
          <DialogHeader className="relative shrink-0 bg-primary px-5 py-5 text-primary-foreground">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-primary-foreground/10 text-primary-foreground transition-colors hover:bg-primary-foreground/20"
              aria-label="ปิดรายละเอียดรายการส่ง"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">close</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-lg" aria-hidden="true">history</span>
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-black leading-tight">ประวัติสถานะการจัดส่ง</DialogTitle>
                <p className="mt-1 text-xs text-primary-foreground/80">
                  <code className="font-mono font-semibold">{selectedParcel.TrackingID}</code>
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto bg-surface-container px-4 py-4">
            <div className="rounded-[28px] border border-outline-variant/60 bg-surface dark:bg-surface-container px-4 py-4 shadow-sm shadow-slate-900/5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/80 dark:bg-blue-950/20 dark:text-blue-300">
                    <span className="material-symbols-outlined text-base" aria-hidden="true">route</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-foreground">ประวัติสถานะการจัดส่ง</p>
                    <p className="mt-1 text-[10px] font-medium text-muted-foreground">แสดงสถานะล่าสุดด้านบน</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => hasKnownBranches && setIsMapOpen(true)}
                  disabled={!hasKnownBranches}
                  className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-2xl border border-outline-variant bg-surface px-3 text-xs font-semibold text-foreground transition-all hover:bg-surface-container active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  title={hasKnownBranches ? 'เปิดแผนที่' : 'ยังไม่มีตำแหน่ง GPS'}
                  aria-label={hasKnownBranches ? 'เปิดแผนที่' : 'ยังไม่มีตำแหน่ง GPS'}
                >
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">{hasKnownBranches ? 'map' : 'map_off'}</span>
                  แผนที่
                </button>
              </div>
              <Timeline events={selectedTimelineEvents} compact />
            </div>
          </div>
        </div>
      </DialogContent>

      {isMapOpen && (
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent
          showCloseButton={false}
          className="w-[calc(100vw-1rem)] max-w-3xl overflow-hidden rounded-[1.5rem] border border-outline-variant bg-surface dark:bg-card p-0 shadow-2xl"
        >
          <div className="flex max-h-[92vh] flex-col">
            <DialogHeader className="relative shrink-0 bg-primary px-5 py-5 text-primary-foreground">
              <button
                type="button"
                onClick={() => setIsMapOpen(false)}
                className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-primary-foreground/10 text-primary-foreground transition-colors hover:bg-primary-foreground/20"
                aria-label="ปิดแผนที่"
              >
                <span className="material-symbols-outlined text-2xl" aria-hidden="true">close</span>
              </button>
              <div className="flex flex-col gap-2">
                <DialogTitle className="font-display text-xl font-black leading-tight">
                  แผนที่การจัดส่ง
                </DialogTitle>
                <p className="break-all font-mono text-sm font-black tracking-wide text-primary-foreground/75">{selectedParcel.TrackingID}</p>
              </div>
            </DialogHeader>
            <div className="bg-surface-container px-4 py-4">
              <Suspense fallback={<MapFallback />}>
                <TrackingMap
                  events={selectedTimelineEvents}
                  trackingID={selectedParcel.TrackingID}
                  className="h-[62vh] max-h-[560px] min-h-[340px] rounded-2xl"
                  mapClassName="min-h-0"
                />
              </Suspense>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      )}
    </Dialog>
  );
}
