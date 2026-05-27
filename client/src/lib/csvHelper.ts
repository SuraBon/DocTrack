import type { Parcel } from '../types/parcel';

/**
 * Converts a list of Parcel objects to a CSV string format with Thai character compatibility (UTF-8 BOM).
 */
export function convertParcelsToCSV(parcels: Parcel[]): string {
  const headers = [
    'เลขพัสดุ (Tracking ID)',
    'วันที่ลงทะเบียน',
    'ผู้ส่ง',
    'สาขาผู้ส่ง',
    'ผู้รับ',
    'สาขาผู้รับ',
    'ประเภทสิ่งที่ส่ง',
    'รายละเอียด',
    'สถานะ',
    'วันที่รับ/ส่งสำเร็จ',
    'หมายเหตุ',
    'Latitude',
    'Longitude'
  ];

  const escapeField = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = parcels.map(p => [
    escapeField(p.TrackingID),
    escapeField(p['วันที่สร้าง']),
    escapeField(p['ผู้ส่ง']),
    escapeField(p['สาขาผู้ส่ง']),
    escapeField(p['ผู้รับ']),
    escapeField(p['สาขาผู้รับ']),
    escapeField(p['ประเภทสิ่งที่ส่ง']),
    escapeField(p['รายละเอียด']),
    escapeField(p['สถานะ']),
    escapeField(p['วันที่รับ']),
    escapeField(p['หมายเหตุ']),
    escapeField(p.Latitude),
    escapeField(p.Longitude)
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\r\n');

  // Prefix UTF-8 BOM so Excel opens it with Thai characters correctly
  return '\uFEFF' + csvContent;
}

/**
 * Triggers a browser download of the CSV content.
 */
export function downloadCSV(csvContent: string, fileName: string = 'parcels-export.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
