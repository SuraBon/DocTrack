// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { convertParcelsToCSV, downloadCSV } from './csvHelper';
import type { Parcel } from '../types/parcel';

describe('csvHelper', () => {
  describe('convertParcelsToCSV', () => {
    it('should format a list of parcels as a CSV string with a BOM prefix', () => {
      const parcels: Parcel[] = [
        {
          TrackingID: 'TRACK123',
          'วันที่สร้าง': '2026-05-27T10:00:00Z',
          'ผู้ส่ง': 'นาย ก',
          'สาขาผู้ส่ง': 'สาขา A',
          'ผู้รับ': 'นาง ข',
          'สาขาผู้รับ': 'สาขา B',
          'ประเภทสิ่งที่ส่ง': 'เอกสาร',
          'รายละเอียด': 'สำคัญมาก',
          'สถานะ': 'รอจัดส่ง',
          'วันที่รับ': '2026-05-27T12:00:00Z',
          'หมายเหตุ': 'ด่วน',
          Latitude: 13.7563,
          Longitude: 100.5018,
        },
      ];

      const csv = convertParcelsToCSV(parcels);

      // Must start with UTF-8 BOM
      expect(csv.startsWith('\uFEFF')).toBe(true);

      // Check header row is included
      expect(csv).toContain('เลขพัสดุ (Tracking ID),วันที่ลงทะเบียน,ผู้ส่ง,สาขาผู้ส่ง,ผู้รับ,สาขาผู้รับ,ประเภทสิ่งที่ส่ง,รายละเอียด,สถานะ,วันที่รับ/ส่งสำเร็จ,หมายเหตุ,Latitude,Longitude');

      // Check content row is included
      expect(csv).toContain('TRACK123,2026-05-27T10:00:00Z,นาย ก,สาขา A,นาง ข,สาขา B,เอกสาร,สำคัญมาก,รอจัดส่ง,2026-05-27T12:00:00Z,ด่วน,13.7563,100.5018');
    });

    it('should correctly escape quotes and commas', () => {
      const parcels: Parcel[] = [
        {
          TrackingID: 'TRACK456',
          'วันที่สร้าง': '2026-05-27T10:00:00Z',
          'ผู้ส่ง': 'นาย ก, ส่งของ',
          'สาขาผู้ส่ง': 'สาขา "A"',
          'ผู้รับ': 'นาง ข',
          'สาขาผู้รับ': 'สาขา B',
          'สถานะ': 'รอจัดส่ง',
        },
      ];

      const csv = convertParcelsToCSV(parcels);

      // Check escaping
      expect(csv).toContain('"นาย ก, ส่งของ"');
      expect(csv).toContain('"สาขา ""A"""');
    });
  });

  describe('downloadCSV', () => {
    it('should trigger download on browser elements', () => {
      // Mock DOM methods
      const mockElement = {
        setAttribute: vi.fn(),
        style: {},
        click: vi.fn(),
      } as any;

      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockElement);
      const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockElement);
      const createObjectURLMock = vi.fn().mockReturnValue('blob:url');

      global.URL.createObjectURL = createObjectURLMock;
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockElement);

      downloadCSV('test-content', 'test-file.csv');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('href', 'blob:url');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('download', 'test-file.csv');
      expect(appendSpy).toHaveBeenCalledWith(mockElement);
      expect(mockElement.click).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalledWith(mockElement);

      // Clean up spies
      appendSpy.mockRestore();
      removeSpy.mockRestore();
      createElementSpy.mockRestore();
    });
  });
});
