import { describe, expect, it } from 'vitest';
import { buildGpsEvidenceNote, getGpsQuality, needsGpsOverrideReason } from './gpsQuality';

describe('gpsQuality', () => {
  it('classifies GPS state for delivery UX', () => {
    expect(getGpsQuality('loading', null)).toBe('loading');
    expect(getGpsQuality('error', null)).toBe('unavailable');
    expect(getGpsQuality('success', { latitude: 13, longitude: 100, accuracy: 30 })).toBe('ready');
    expect(getGpsQuality('success', { latitude: 13, longitude: 100, accuracy: 150 })).toBe('low_accuracy');
  });

  it('requires override reasons only for failed GPS', () => {
    expect(needsGpsOverrideReason('denied')).toBe(true);
    expect(needsGpsOverrideReason('error')).toBe(true);
    expect(needsGpsOverrideReason('success')).toBe(false);
  });

  it('builds evidence notes for audit trail', () => {
    expect(buildGpsEvidenceNote({ status: 'error', position: null, overrideReason: 'อยู่ในอาคาร' })).toEqual([
      '[GPS ไม่พร้อม: อยู่ในอาคาร]',
    ]);
    expect(buildGpsEvidenceNote({ status: 'success', position: { latitude: 13, longitude: 100, accuracy: 140 } })).toEqual([
      '[GPS แม่นยำต่ำ: ~140m]',
    ]);
  });
});

