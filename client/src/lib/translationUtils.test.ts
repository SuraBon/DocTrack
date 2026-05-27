import { describe, expect, it } from 'vitest';
import { translateSystemNote, translateAuditDetails } from './translationUtils';

describe('translationUtils', () => {
  describe('translateSystemNote', () => {
    it('returns empty string for null/undefined/empty input', () => {
      expect(translateSystemNote(null)).toBe('');
      expect(translateSystemNote(undefined)).toBe('');
      expect(translateSystemNote('')).toBe('');
    });

    it('translates autoPickup patterns correctly', () => {
      expect(translateSystemNote('autoPickup=originGpsMatched;distanceMeters=150')).toBe(
        'รับของอัตโนมัติ (GPS ตรงกับต้นทาง ห่าง 150 ม.)'
      );
      expect(translateSystemNote('autoPickup=originGpsMatched;distanceMeters=1500')).toBe(
        'รับของอัตโนมัติ (GPS ตรงกับต้นทาง ห่าง 1.5 กม.)'
      );
      expect(translateSystemNote('autoPickup=originGpsMatched')).toBe(
        'รับของอัตโนมัติ (GPS ตรงกับต้นทาง)'
      );
      expect(translateSystemNote('autoPickup=manualBypass')).toBe(
        'รับของอัตโนมัติ (manualBypass)'
      );
    });

    it('translates assignedToId correctly', () => {
      expect(translateSystemNote('assignedToId=EMP123')).toBe('มอบหมายให้: EMP123');
    });

    it('translates GPS evidence tags correctly', () => {
      expect(translateSystemNote('[GPS: matched, distance 200]')).toBe('[ตำแหน่ง GPS ตรงกัน ห่าง 200 ม.]');
      expect(translateSystemNote('[GPS: matched, distance 1200]')).toBe('[ตำแหน่ง GPS ตรงกัน ห่าง 1.2 กม.]');
      expect(translateSystemNote('[GPS: no_match, distance 500]')).toBe('[ตำแหน่ง GPS ไม่ตรง ห่าง 500 ม.]');
      expect(translateSystemNote('[GPS: unavailable]')).toBe('[ไม่มีข้อมูลตำแหน่ง GPS]');
      expect(translateSystemNote('[GPS: bypassed, reason: indoor]')).toBe('[ข้าม GPS: indoor]');
      expect(translateSystemNote('[GPS: bypassed]')).toBe('[ข้ามตำแหน่ง GPS]');
    });

    it('translates deliveryMatch status tags correctly', () => {
      expect(translateSystemNote('deliveryMatch=MATCHED_DECLARED_DESTINATION')).toBe('ส่งตรงตามปลายทาง');
      expect(translateSystemNote('deliveryMatch=DELIVERED_ELSEWHERE')).toBe('ส่งคนละจุด');
    });

    it('translates forwarding and proxy tags correctly', () => {
      expect(translateSystemNote('forwardedFrom=BranchA to=BranchB')).toBe('ส่งต่อจาก BranchA ไปยัง BranchB');
      expect(translateSystemNote('proxyReceiver=JohnDoe')).toBe('ผู้รับแทน: JohnDoe');
    });

    it('retains untranslated text', () => {
      expect(translateSystemNote('Just a normal note')).toBe('Just a normal note');
    });
  });

  describe('translateAuditDetails', () => {
    it('returns empty string for null/undefined/empty input', () => {
      expect(translateAuditDetails(null)).toBe('');
      expect(translateAuditDetails(undefined)).toBe('');
      expect(translateAuditDetails('')).toBe('');
    });

    it('translates common keys correctly', () => {
      expect(translateAuditDetails('status=active')).toBe('สถานะ: active');
      expect(translateAuditDetails('sender: John')).toBe('ผู้ส่ง: John');
      expect(translateAuditDetails('receiver=Jane')).toBe('ผู้รับ: Jane');
      expect(translateAuditDetails('branch: HeadOffice')).toBe('สาขา: HeadOffice');
      expect(translateAuditDetails('role=admin')).toBe('ตำแหน่ง: admin');
      expect(translateAuditDetails('reason: network_issue')).toBe('เหตุผล: network_issue');
    });
  });
});
