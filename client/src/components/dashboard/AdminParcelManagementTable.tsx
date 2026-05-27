import { useMemo, useState } from 'react';
import { ClipboardList, Edit3, Loader2, PackageCheck, Trash2, Undo2 } from 'lucide-react';
import type { Parcel } from '@/types/parcel';
import StatusBadge from '@/components/StatusBadge';
import { Checkbox } from '@/components/ui/checkbox';
import { formatThaiDateTime } from '@/lib/dateUtils';
import { translateSystemNote } from '@/lib/translationUtils';
import { getActiveDeliveryAssignment } from '@/lib/deliveryAssignment';
import {
  getCleanNote,
  getLatestTimelineSummary,
  isParcelStale,
} from './DashboardComponents';

type AdminParcelManagementTableProps = {
  parcels: Parcel[];
  onOpen: (parcel: Parcel) => void;
  onEdit: (parcel: Parcel) => void;
  onConfirm: (parcel: Parcel) => void;
  onDelete: (parcel: Parcel) => void;
  onReleaseDelivery: (parcel: Parcel) => void;
  releasingDeliveryId: string | null;
  selectedIds: Set<string>;
  onToggleSelected: (trackingId: string, checked: boolean) => void;
  onToggleAllVisible: (parcels: Parcel[], checked: boolean) => void;
};

const VIRTUAL_ROW_HEIGHT = 112;
const VIRTUAL_VIEWPORT_HEIGHT = 640;
const VIRTUAL_OVERSCAN_ROWS = 6;
const getParcelValue = (parcel: Parcel, key: string) => (((parcel as unknown) as Record<string, unknown>)[key] as string | undefined);

export const AdminParcelManagementTable = ({
  parcels,
  onOpen,
  onEdit,
  onConfirm,
  onDelete,
  onReleaseDelivery,
  releasingDeliveryId,
  selectedIds,
  onToggleSelected,
  onToggleAllVisible,
}: AdminParcelManagementTableProps) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [scrollTop, setScrollTop] = useState(0);

  const shouldVirtualize = parcels.length > 40 && expandedIds.size === 0;
  const startIndex = shouldVirtualize
    ? Math.max(0, Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN_ROWS)
    : 0;
  const visibleCount = shouldVirtualize
    ? Math.ceil(VIRTUAL_VIEWPORT_HEIGHT / VIRTUAL_ROW_HEIGHT) + (VIRTUAL_OVERSCAN_ROWS * 2)
    : parcels.length;
  const visibleParcels = useMemo(
    () => parcels.slice(startIndex, startIndex + visibleCount),
    [parcels, startIndex, visibleCount],
  );
  const topSpacerHeight = shouldVirtualize ? startIndex * VIRTUAL_ROW_HEIGHT : 0;
  const bottomSpacerHeight = shouldVirtualize
    ? Math.max(0, (parcels.length - startIndex - visibleParcels.length) * VIRTUAL_ROW_HEIGHT)
    : 0;
  const allVisibleSelected = parcels.length > 0 && parcels.every(parcel => selectedIds.has(parcel.TrackingID));
  const someVisibleSelected = !allVisibleSelected && parcels.some(parcel => selectedIds.has(parcel.TrackingID));

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedIds(next);
  };

  return (
    <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:block">
      <div
        className="overflow-auto"
        style={{ maxHeight: shouldVirtualize ? VIRTUAL_VIEWPORT_HEIGHT : undefined }}
        onScroll={(event) => {
          if (shouldVirtualize) setScrollTop(event.currentTarget.scrollTop);
        }}
      >
        <table className="w-full min-w-[1080px] text-left">
          <thead className={shouldVirtualize ? 'sticky top-0 z-10' : undefined}>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="w-10 px-4 py-3">
                <Checkbox
                  checked={allVisibleSelected || (someVisibleSelected ? 'indeterminate' : false)}
                  onCheckedChange={(checked) => onToggleAllVisible(parcels, checked === true)}
                  aria-label="เลือกทุกรายการที่แสดง"
                />
              </th>
              <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Tracking</th>
              <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground">เส้นทาง</th>
              <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground">ผู้รับ</th>
              <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground">สถานะ</th>
              <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground">ล่าสุด</th>
              <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-widest text-muted-foreground">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {topSpacerHeight > 0 && (
              <tr aria-hidden="true">
                <td colSpan={7} style={{ height: topSpacerHeight, padding: 0 }} />
              </tr>
            )}
            {visibleParcels.map(parcel => {
              const status = getParcelValue(parcel, 'สถานะ') || '';
              const assignment = getActiveDeliveryAssignment(parcel);
              const isDone = status === 'ส่งสำเร็จ';
              const isReleasing = releasingDeliveryId === parcel.TrackingID;
              const isSelected = selectedIds.has(parcel.TrackingID);
              return (
                <tr key={parcel.TrackingID} className={`${isSelected ? 'bg-blue-50/50' : isParcelStale(parcel) ? 'bg-amber-50/30' : ''} transition-colors hover:bg-surface-container-lowest/70`}>
                  <td className="px-4 py-3 align-top">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onToggleSelected(parcel.TrackingID, checked === true)}
                      aria-label={`เลือก ${parcel.TrackingID}`}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <code className="block max-w-[150px] break-all font-mono text-xs font-black text-primary">{parcel.TrackingID}</code>
                    <p className="mt-1 text-[11px] text-muted-foreground">{formatThaiDateTime(getParcelValue(parcel, 'วันที่สร้าง') || '')}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="max-w-[220px] space-y-1 text-xs">
                      <p className="truncate font-semibold text-slate-800">{getParcelValue(parcel, 'สาขาผู้ส่ง') || '-'}</p>
                      <p className="truncate text-muted-foreground">→ {getParcelValue(parcel, 'สาขาผู้รับ') || '-'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="max-w-[190px]">
                      <p className="truncate text-sm font-semibold text-foreground">{getParcelValue(parcel, 'ผู้รับ') || '-'}</p>
                      {(() => {
                        const textToShow = getParcelValue(parcel, 'รายละเอียด') || translateSystemNote(getCleanNote(parcel)) || '-';
                        const isExpanded = expandedIds.has(parcel.TrackingID);
                        const isLong = textToShow.length > 30;
                        return (
                          <div
                            onClick={() => isLong && toggleExpand(parcel.TrackingID)}
                            className={`mt-1 text-xs text-muted-foreground transition-all ${isLong ? 'cursor-pointer hover:text-slate-800' : ''}`}
                          >
                            <p className={`${isExpanded ? 'break-words whitespace-pre-wrap leading-relaxed' : 'truncate'}`}>
                              {textToShow}
                            </p>
                            {isLong && (
                              <span className="mt-0.5 block text-[9px] font-bold leading-none text-primary/70 hover:text-primary">
                                {isExpanded ? 'ย่อรายละเอียด' : 'ดูรายละเอียดเพิ่ม'}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="space-y-2">
                      <StatusBadge status={status as any} />
                      {isParcelStale(parcel) && (
                        <span className="inline-flex rounded-lg bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">ค้างนาน</span>
                      )}
                      {assignment && !isDone && (
                        <p className="max-w-[180px] truncate text-[11px] font-semibold text-blue-700">ผู้รับงาน: {assignment.assignedToName}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="max-w-[240px] line-clamp-2 text-xs font-medium leading-relaxed text-slate-700">{getLatestTimelineSummary(parcel)}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => onOpen(parcel)} className="app-secondary-button h-9 px-2.5 text-xs">
                        <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                        รายละเอียด
                      </button>
                      <button type="button" onClick={() => onEdit(parcel)} className="app-secondary-button h-9 px-2.5 text-xs">
                        <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                        แก้ไข
                      </button>
                      {!isDone && (
                        <button type="button" onClick={() => onConfirm(parcel)} className="app-primary-button h-9 px-2.5 text-xs">
                          <PackageCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          ยืนยันส่ง
                        </button>
                      )}
                      {assignment && !isDone && (
                        <button type="button" onClick={() => onReleaseDelivery(parcel)} disabled={isReleasing} className="app-secondary-button h-9 px-2.5 text-xs text-amber-700">
                          {isReleasing ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />}
                          คืนงาน
                        </button>
                      )}
                      <button type="button" onClick={() => onDelete(parcel)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-2.5 text-xs font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-100">
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {bottomSpacerHeight > 0 && (
              <tr aria-hidden="true">
                <td colSpan={7} style={{ height: bottomSpacerHeight, padding: 0 }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminParcelManagementTable;
