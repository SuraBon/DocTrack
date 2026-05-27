import StatusBadge from '@/components/StatusBadge';
import { Spinner } from '@/components/ui/spinner';
import { formatThaiDateTime } from '@/lib/dateUtils';
import {
  clearCreatedParcelHistory,
  removeCreatedParcelHistoryItem,
  type CreatedParcelHistoryItem,
} from '@/lib/createdParcelHistory';
import { toast } from 'sonner';

interface TrackCreatedHistoryProps {
  createdHistory: CreatedParcelHistoryItem[];
  isRefreshingHistory: boolean;
  handleRefreshHistory: () => Promise<void>;
  setTrackingId: (val: string) => void;
  handleSearch: (e?: React.FormEvent, searchId?: string) => Promise<void>;
  onHistoryItemDeleted: () => void;
}

export function TrackCreatedHistory({
  createdHistory,
  isRefreshingHistory,
  handleRefreshHistory,
  setTrackingId,
  handleSearch,
  onHistoryItemDeleted,
}: TrackCreatedHistoryProps) {
  return (
    <section className="app-card overflow-hidden">
      <div className="app-panel-header">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <span className="material-symbols-outlined text-base" aria-hidden="true">history</span>
            </div>
            <div className="min-w-0">
              <h2 className="app-section-title">ประวัติที่ฉันสร้างในเครื่องนี้</h2>
              <p className="truncate text-xs text-muted-foreground">เก็บไว้ในเครื่องนี้เท่านั้น กดรายการเพื่อดูสถานะล่าสุด</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-xs ring-1 ring-gray-100">
              {createdHistory.length}
            </span>
            <button
              type="button"
              onClick={handleRefreshHistory}
              disabled={isRefreshingHistory}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-white hover:text-primary disabled:opacity-50 flex items-center gap-1"
            >
              {isRefreshingHistory ? (
                <Spinner className="h-3.5 w-3.5" />
              ) : (
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">refresh</span>
              )}
              อัปเดตสถานะ
            </button>
            <button
              type="button"
              onClick={() => {
                clearCreatedParcelHistory();
                onHistoryItemDeleted();
                toast.success('ล้างประวัติในเครื่องนี้แล้ว');
              }}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-white hover:text-destructive"
            >
              ล้าง
            </button>
          </div>
        </div>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
        {createdHistory.slice(0, 9).map(item => (
          <div
            key={item.trackingID}
            className="group rounded-xl border border-gray-100 bg-gray-50 p-3 transition-all hover:border-primary/35 hover:bg-white"
          >
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setTrackingId(item.trackingID);
                  void handleSearch(undefined, item.trackingID);
                }}
                className="min-w-0 text-left"
              >
                <code className="block min-w-0 break-all rounded-md bg-white px-2.5 py-1 font-mono text-xs font-semibold text-foreground shadow-xs ring-1 ring-gray-100">
                  {item.trackingID}
                </code>
              </button>
              <div className="flex shrink-0 items-center gap-1">
                {item.status && <StatusBadge status={item.status} />}
                <button
                  type="button"
                  onClick={() => {
                    removeCreatedParcelHistoryItem(item.trackingID);
                    onHistoryItemDeleted();
                    toast.success('ลบออกจากประวัติในเครื่องนี้แล้ว');
                  }}
                  className="grid size-7 place-items-center rounded-md text-muted-foreground opacity-100 transition-colors hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label="ลบประวัติรายการนี้"
                  title="ลบออกจากประวัติ"
                >
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">close</span>
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setTrackingId(item.trackingID);
                void handleSearch(undefined, item.trackingID);
              }}
              className="mt-3 block w-full text-left"
            >
              <div className="grid gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.14)]" />
                  <span className="min-w-0 truncate text-xs font-semibold text-slate-600">
                    {item.senderBranch || item.senderName}
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(248,113,113,0.14)]" />
                  <span className="min-w-0 truncate text-sm font-black text-slate-800">
                    {item.receiverBranch || item.receiverName}
                  </span>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                <span className="material-symbols-outlined text-sm" aria-hidden="true">schedule</span>
                {formatThaiDateTime(item.createdAt)}
              </p>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
