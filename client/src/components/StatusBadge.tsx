/**
 * Status Badge Component
 * แสดงสถานะของรายการส่งด้วยสี
 */

import type { ParcelStatus } from '@/types/parcel';
import { CheckCircle2, PackageOpen, Truck, type LucideIcon } from 'lucide-react';

interface StatusBadgeProps {
  status: ParcelStatus;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const getStatusIcon = (status: ParcelStatus): LucideIcon | null => {
    switch (status) {
      case 'รอจัดส่ง':
        return PackageOpen;
      case 'กำลังจัดส่ง':
        return Truck;
      case 'ส่งสำเร็จ':
        return CheckCircle2;
      default:
        return null;
    }
  };

  const getStatusStyles = (status: ParcelStatus) => {
    switch (status) {
      case 'รอจัดส่ง':
        return 'border-outline-variant/30 bg-surface-container text-on-surface dark:text-foreground';
      case 'กำลังจัดส่ง':
        return 'border-blue-500/30 bg-blue-500/10 text-blue-400 dark:text-blue-300';
      case 'ส่งสำเร็จ':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 dark:text-emerald-300';
      default:
        return 'border-border bg-muted text-muted-foreground';
    }
  };

  const getStatusDot = (status: ParcelStatus) => {
    switch (status) {
      case 'รอจัดส่ง':
        return 'bg-amber-500';
      case 'กำลังจัดส่ง':
        return 'bg-blue-500';
      case 'ส่งสำเร็จ':
        return 'bg-emerald-500';
      default:
        return 'bg-slate-400';
    }
  };

  const Icon = getStatusIcon(status);

  return (
    <span
      className={`inline-flex h-7 min-w-[108px] items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 text-[11px] font-medium leading-none transition-colors ${getStatusStyles(status)} ${className}`}
    >
      {Icon ? (
        <Icon className={`h-3.5 w-3.5 shrink-0 ${status === 'กำลังจัดส่ง' ? 'animate-pulse' : ''}`} aria-hidden="true" />
      ) : (
        <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${getStatusDot(status)}`} />
      )}
      <span className="leading-none">{status}</span>
    </span>
  );
}
