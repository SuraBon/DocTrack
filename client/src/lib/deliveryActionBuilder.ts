import type { DeliveryMatchStatus, Parcel } from '@/types/parcel';
import { OTHER_VALUE, resolveSelectValue } from '@/components/NativeSelect';
import { sanitizeTextInput, validateRequiredText } from './validation';

export type DeliveryActionFormState = {
  note: string;
  isForwarding: boolean;
  forwardSender: string;
  forwardFromBranch: string;
  forwardToBranch: string;
  isProxy: boolean;
  proxyName: string;
  deliveryMatchStatus: DeliveryMatchStatus;
  deliveryMismatchReason: string;
};

export type DeliveryActionPayload = {
  eventType: 'FORWARD' | 'PROXY' | 'DELIVERED';
  location?: string;
  destLocation?: string;
  person?: string;
  deliveryMatchStatus?: DeliveryMatchStatus;
  deliveryMismatchReason?: string;
  note: string;
  validationError?: string;
};

export function getCurrentBranchFromParcel(parcel: Parcel, branches: string[]): string {
  let currentBranch = parcel['สาขาผู้ส่ง'];
  const forwardEvents = parcel.events?.filter(event => event.eventType === 'FORWARD') || [];
  if (forwardEvents.length > 0) {
    const lastForward = forwardEvents[forwardEvents.length - 1];
    currentBranch = lastForward.destLocation || currentBranch;
  } else {
    const parcelNote = parcel['หมายเหตุ'] || '';
    const forwardRegex = /\[ส่งต่อโดย:\s*(.*?)\s*จากสาขา:\s*(.*?)\s*ไปสาขา:\s*(.*?)\s*เมื่อ:\s*(.*?)\]/g;
    let match: RegExpExecArray | null;
    while ((match = forwardRegex.exec(parcelNote)) !== null) {
      currentBranch = match[3];
    }
  }
  return branches.includes(currentBranch) ? currentBranch : OTHER_VALUE;
}

export function isParcelTrulyDelivered(parcel: Parcel): boolean {
  let delivered = parcel['สถานะ'] === 'ส่งสำเร็จ';
  if (!delivered) return false;

  if (Array.isArray(parcel.events) && parcel.events.length > 0) {
    const actionEvents = parcel.events.filter(
      event => event.eventType === 'FORWARD' || event.eventType === 'DELIVERED' || event.eventType === 'PROXY',
    );
    return actionEvents.length === 0 || actionEvents[actionEvents.length - 1].eventType !== 'FORWARD';
  }

  const note = String(parcel['หมายเหตุ'] || '');
  const lastForwardIdx = note.lastIndexOf('[ส่งต่อโดย:');
  const lastProxyIdx = note.lastIndexOf('[รับแทนโดย:');
  const lastNormalIdx = note.lastIndexOf('[รับพัสดุเรียบร้อย');
  const maxIdx = Math.max(lastForwardIdx, lastProxyIdx, lastNormalIdx);
  return !(maxIdx >= 0 && maxIdx === lastForwardIdx);
}

export function buildDeliveryActionPayload(
  parcel: Parcel,
  form: DeliveryActionFormState,
): DeliveryActionPayload {
  const safeNote = sanitizeTextInput(form.note, 2000);
  const safeForwardSender = sanitizeTextInput(form.forwardSender, 200);
  const safeProxyName = sanitizeTextInput(form.proxyName, 200);
  const safeDeliveryMismatchReason = sanitizeTextInput(form.deliveryMismatchReason, 500);

  if (form.isForwarding) {
    const location = sanitizeTextInput(resolveSelectValue(form.forwardFromBranch), 100);
    const destLocation = sanitizeTextInput(resolveSelectValue(form.forwardToBranch), 100);
    const validationError =
      validateRequiredText(safeForwardSender, 'ชื่อผู้รับช่วงต่อ', 1, 200) ||
      validateRequiredText(destLocation, 'จุดหมายถัดไป', 1, 100);

    return {
      eventType: 'FORWARD',
      location,
      destLocation,
      person: safeForwardSender,
      note: safeNote,
      validationError: validationError || undefined,
    };
  }

  const location = sanitizeTextInput(parcel['สาขาผู้รับ'], 100);
  if (form.isProxy) {
    const validationError = validateRequiredText(safeProxyName, 'ชื่อผู้รับแทน', 1, 200);
    return {
      eventType: 'PROXY',
      location,
      person: safeProxyName,
      deliveryMatchStatus: form.deliveryMatchStatus,
      deliveryMismatchReason: form.deliveryMatchStatus === 'DELIVERED_ELSEWHERE' ? safeDeliveryMismatchReason : undefined,
      note: safeNote,
      validationError: validationError || undefined,
    };
  }

  const validationError = form.deliveryMatchStatus === 'DELIVERED_ELSEWHERE'
    ? validateRequiredText(safeDeliveryMismatchReason, 'เหตุผลที่ส่งคนละจุด', 1, 500)
    : null;

  return {
    eventType: 'DELIVERED',
    location,
    person: sanitizeTextInput(parcel['ผู้รับ'], 200),
    deliveryMatchStatus: form.deliveryMatchStatus,
    deliveryMismatchReason: form.deliveryMatchStatus === 'DELIVERED_ELSEWHERE' ? safeDeliveryMismatchReason : undefined,
    note: safeNote,
    validationError: validationError || undefined,
  };
}

