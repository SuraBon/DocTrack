import { describe, expect, it } from 'vitest';
import type { Parcel } from '@/types/parcel';
import { buildDeliveryActionPayload, getCurrentBranchFromParcel, isParcelTrulyDelivered } from './deliveryActionBuilder';

const parcel: Parcel = {
  TrackingID: 'TRK202605211234',
  'วันที่สร้าง': '21 พฤษภาคม 2569',
  'ผู้ส่ง': 'A',
  'สาขาผู้ส่ง': 'MS',
  'ผู้รับ': 'B',
  'สาขาผู้รับ': 'บางนา',
  'ประเภทสิ่งที่ส่ง': 'เอกสาร',
  'สถานะ': 'รอจัดส่ง',
};

describe('deliveryActionBuilder', () => {
  it('builds the default delivered payload', () => {
    const payload = buildDeliveryActionPayload(parcel, {
      note: 'ok',
      isForwarding: false,
      forwardSender: '',
      forwardFromBranch: '',
      forwardToBranch: '',
      isProxy: false,
      proxyName: '',
      deliveryMatchStatus: 'MATCHED_DECLARED_DESTINATION',
      deliveryMismatchReason: '',
    });

    expect(payload).toMatchObject({
      eventType: 'DELIVERED',
      location: 'บางนา',
      person: 'B',
      deliveryMatchStatus: 'MATCHED_DECLARED_DESTINATION',
      note: 'ok',
    });
    expect(payload.validationError).toBeUndefined();
  });

  it('requires proxy and elsewhere details only when selected', () => {
    const proxy = buildDeliveryActionPayload(parcel, {
      note: '',
      isForwarding: false,
      forwardSender: '',
      forwardFromBranch: '',
      forwardToBranch: '',
      isProxy: true,
      proxyName: '',
      deliveryMatchStatus: 'MATCHED_DECLARED_DESTINATION',
      deliveryMismatchReason: '',
    });
    expect(proxy.validationError).toContain('ชื่อผู้รับแทน');

    const elsewhere = buildDeliveryActionPayload(parcel, {
      note: '',
      isForwarding: false,
      forwardSender: '',
      forwardFromBranch: '',
      forwardToBranch: '',
      isProxy: false,
      proxyName: '',
      deliveryMatchStatus: 'DELIVERED_ELSEWHERE',
      deliveryMismatchReason: '',
    });
    expect(elsewhere.validationError).toContain('เหตุผลที่ส่งคนละจุด');
  });

  it('uses latest structured forward branch and delivery state', () => {
    const forwarded: Parcel = {
      ...parcel,
      'สถานะ': 'ส่งสำเร็จ',
      events: [
        { id: '1', trackingId: parcel.TrackingID, timestamp: 't1', eventType: 'CREATED', location: 'MS' },
        { id: '2', trackingId: parcel.TrackingID, timestamp: 't2', eventType: 'FORWARD', location: 'MS', destLocation: 'มหาชัย' },
      ],
    };
    expect(getCurrentBranchFromParcel(forwarded, ['MS', 'มหาชัย'])).toBe('มหาชัย');
    expect(isParcelTrulyDelivered(forwarded)).toBe(false);
  });
});

