import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BloodPressureReading } from '../types/bloodPressure';
import { mergeBackupReadingsIntoStorage, previewBackupMerge } from './storageService';

const key = 'graphene_bp_readings_v1';
const base: BloodPressureReading = {
  id: 'local', timestamp: '2026-01-02T10:00:00.123Z', systolic: 120,
  diastolic: 80, heartRate: 70, arm: 'left', notes: 'note',
  sessionId: 'session', pulsePressureWarningConfirmed: false,
  takesAntihypertensiveMedication: false,
};
let values: Map<string, string>;
beforeEach(() => {
  values = new Map([[key, JSON.stringify([base])]]);
  vi.stubGlobal('localStorage', {
    getItem: (name: string) => values.get(name) ?? null,
    setItem: (name: string, value: string) => values.set(name, value),
  });
});

describe('combined backup restore', () => {
  it('previews without writing and skips identical content despite different IDs and timestamp offsets', () => {
    const imported = [{ ...base, id: 'other', timestamp: '2026-01-02T11:00:00.123+01:00' }];
    const before = values.get(key);
    const preview = previewBackupMerge(imported);
    expect(preview).toMatchObject({ addedCount: 0, identicalCount: 1, conflictCount: 0 });
    expect(values.get(key)).toBe(before);
    expect(mergeBackupReadingsIntoStorage(imported, preview)).toMatchObject({ status: 'applied', addedCount: 0, identicalCount: 1, conflictCount: 0 });
    expect(JSON.parse(values.get(key)!)).toEqual([base]);
  });

  it('flags a different reading at the exact instant, then keeps both after approval', () => {
    const imported = [{ ...base, id: 'local', systolic: 125 }];
    const preview = previewBackupMerge(imported);
    expect(preview).toMatchObject({ addedCount: 0, identicalCount: 0, conflictCount: 1 });
    expect(JSON.parse(values.get(key)!)).toEqual([base]);
    const result = mergeBackupReadingsIntoStorage(imported, preview);
    expect(result).toMatchObject({ status: 'applied', addedCount: 0, identicalCount: 0, conflictCount: 1 });
    if (result.status !== 'applied') throw new Error('not applied');
    expect(result.updated).toHaveLength(2);
    expect(result.updated[0]).toMatchObject({ systolic: 125, timestamp: base.timestamp });
    expect(result.updated[0].id).not.toBe('local');
    expect(result.updated[1]).toEqual(base);
  });

  it('prefers an identical variant over a different reading at the same instant', () => {
    const imported = [{ ...base, id: 'backup', systolic: 125 }];
    values.set(key, JSON.stringify([base, { ...imported[0], id: 'already' }]));
    expect(previewBackupMerge(imported)).toMatchObject({ addedCount: 0, identicalCount: 1, conflictCount: 0 });
  });

  it('compares all data except id and normalizes absent optional fields', () => {
    const bare = { ...base, notes: undefined, sessionId: undefined, pulsePressureWarningConfirmed: undefined };
    values.set(key, JSON.stringify([bare]));
    const incoming = { ...bare, id: 'new', notes: '', sessionId: '', pulsePressureWarningConfirmed: false };
    expect(previewBackupMerge([incoming])).toMatchObject({ addedCount: 0, identicalCount: 1, conflictCount: 0 });
    for (const change of [{ heartRate: 71 }, { arm: 'right' as const }, { sessionId: 'another' }, { notes: 'changed' }, { pulsePressureWarningConfirmed: true }, { takesAntihypertensiveMedication: true }]) {
      expect(previewBackupMerge([{ ...base, id: 'new', ...change }])).toMatchObject({ conflictCount: 1 });
    }
  });

  it('distinguishes milliseconds and classifies repeated imported variants as identical', () => {
    const imported = { ...base, id: 'new', timestamp: '2026-01-02T10:00:00.124Z' };
    expect(previewBackupMerge([imported, { ...imported, id: 'other' }])).toMatchObject({ addedCount: 1, identicalCount: 1, conflictCount: 0 });
  });

  it('retains distinct variants within a backup and counts a later same-instant variant as conflict', () => {
    const first = { ...base, id: 'first', timestamp: '2026-01-02T12:00:00.000Z' };
    const second = { ...first, id: 'second', notes: 'another' };
    const preview = previewBackupMerge([first, second]);
    expect(preview).toMatchObject({ addedCount: 1, conflictCount: 1, identicalCount: 0 });
    const result = mergeBackupReadingsIntoStorage([first, second], preview);
    expect(result.status).toBe('applied');
    if (result.status === 'applied') expect(result.updated).toHaveLength(3);
  });

  it('refuses a stale preview without changing stored data', () => {
    const imported = [{ ...base, id: 'new', timestamp: '2026-01-02T10:00:01.123Z' }];
    const preview = previewBackupMerge(imported);
    const changed = [{ ...base, notes: 'updated' }];
    values.set(key, JSON.stringify(changed));
    expect(mergeBackupReadingsIntoStorage(imported, preview)).toMatchObject({ status: 'stale' });
    expect(JSON.parse(values.get(key)!)).toEqual(changed);
  });
});
