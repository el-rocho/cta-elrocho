import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppSettings, BloodPressureReading } from '../types/bloodPressure';
import {
  DEFAULT_SETTINGS,
  StorageError,
  addReadingToStorage,
  getStoredReadings,
  getStoredSettings,
  importReadingsIntoStorage,
  mergeBackupReadingsIntoStorage,
  previewBackupMerge,
  replaceStoredData,
  saveStoredSettings,
} from './storageService';

const key = 'graphene_bp_readings_v1';
const base: BloodPressureReading = {
  id: 'local', timestamp: '2026-01-02T10:00:00.123Z', systolic: 120,
  diastolic: 80, heartRate: 70, arm: 'left', notes: 'note',
  sessionId: 'session', pulsePressureWarningConfirmed: false,
  takesAntihypertensiveMedication: false,
};
let values: Map<string, string>;
let getItem: ReturnType<typeof vi.fn>;
let setItem: ReturnType<typeof vi.fn>;
let removeItem: ReturnType<typeof vi.fn>;
beforeEach(() => {
  values = new Map([
    [key, JSON.stringify([base])],
    ['graphene_bp_settings_v1', JSON.stringify(DEFAULT_SETTINGS)],
  ]);
  getItem = vi.fn((name: string) => values.get(name) ?? null);
  setItem = vi.fn((name: string, value: string) => { values.set(name, value); });
  removeItem = vi.fn((name: string) => { values.delete(name); });
  vi.stubGlobal('localStorage', {
    getItem,
    setItem,
    removeItem,
  });
});

describe('storage failures', () => {
  it('distinguishes an absent readings key from a failed read', () => {
    values.delete(key);
    expect(getStoredReadings()).toHaveLength(10);
    expect(setItem).toHaveBeenCalledWith(key, expect.any(String));

    getItem.mockImplementationOnce(() => { throw new DOMException('blocked'); });
    expect(() => getStoredReadings()).toThrowError(expect.objectContaining({
      name: 'StorageError', operation: 'read', key,
    }));
  });

  it('reports invalid JSON without replacing the corrupt value', () => {
    values.set(key, '{broken');
    expect(() => getStoredReadings()).toThrowError(expect.objectContaining({
      name: 'StorageError', operation: 'parse', key,
    }));
    expect(values.get(key)).toBe('{broken');
    expect(setItem).not.toHaveBeenCalledWith(key, expect.any(String));
  });

  it('does not initialize defaults while handling corrupt readings', () => {
    values.set(key, '{broken');
    values.delete('graphene_bp_settings_v1');
    expect(() => getStoredReadings()).toThrowError(StorageError);
    expect(setItem).not.toHaveBeenCalled();
  });

  it('reports settings parse and write failures with the same typed errors', () => {
    const settingsKey = 'graphene_bp_settings_v1';
    values.set(settingsKey, '{broken');
    expect(() => getStoredSettings()).toThrowError(expect.objectContaining({
      name: 'StorageError', operation: 'parse', key: settingsKey,
    }));

    setItem.mockImplementationOnce(() => { throw new DOMException('blocked'); });
    expect(() => saveStoredSettings(DEFAULT_SETTINGS)).toThrowError(expect.objectContaining({
      operation: 'write', key: settingsKey,
    }));
  });

  it('does not return optimistic mutation results when writing fails', () => {
    setItem.mockImplementationOnce(() => { throw new DOMException('quota'); });
    expect(() => addReadingToStorage({
      ...base,
      id: undefined,
    } as Omit<BloodPressureReading, 'id'>)).toThrowError(expect.objectContaining({
      operation: 'write', key,
    }));
    expect(JSON.parse(values.get(key)!)).toEqual([base]);
  });

  it('rolls readings back if replacing settings fails and never reports success', () => {
    const settingsKey = 'graphene_bp_settings_v1';
    const previousSettings: AppSettings = { ...DEFAULT_SETTINGS, patientName: 'Previous' };
    values.set(settingsKey, JSON.stringify(previousSettings));
    // Solo falla la PRIMERA escritura de ajustes. El rollback debe reintentar la
    // restauración: si no lo hiciera, el contador se quedaría en 1.
    let settingsWriteAttempts = 0;
    setItem.mockImplementation((name: string, value: string) => {
      if (name === settingsKey && settingsWriteAttempts++ === 0) throw new DOMException('quota');
      values.set(name, value);
    });

    expect(() => replaceStoredData([{ ...base, id: 'replacement' }], {
      ...DEFAULT_SETTINGS,
      patientName: 'Replacement',
    })).toThrowError(expect.objectContaining({ operation: 'write', key: settingsKey }));

    // El rollback restauró de verdad: reescribe ambas claves con los valores previos.
    expect(settingsWriteAttempts).toBe(2);
    expect(setItem).toHaveBeenLastCalledWith(settingsKey, JSON.stringify(previousSettings));
    expect(setItem).toHaveBeenCalledWith(key, JSON.stringify([base]));
    expect(JSON.parse(values.get(key)!)).toEqual([base]);
    expect(JSON.parse(values.get(settingsKey)!)).toEqual(previousSettings);
  });

  it('keeps the readings read correctly when the accessory migration write fails', () => {
    // Legacy readings (without the medication flag) trigger a migration, i.e. an accessory write.
    const legacy = { ...base, takesAntihypertensiveMedication: undefined };
    const serializedLegacy = JSON.stringify([legacy]);
    values.set(key, serializedLegacy);
    setItem.mockImplementation((name: string, value: string) => {
      if (name === key) throw new DOMException('quota');
      values.set(name, value);
    });

    const readings = getStoredReadings();

    expect(readings).toHaveLength(1);
    expect(readings[0].takesAntihypertensiveMedication).toBe(
      DEFAULT_SETTINGS.takesAntihypertensiveMedication
    );
    // The failed accessory write must not discard nor hide the value that was read.
    expect(values.get(key)).toBe(serializedLegacy);
  });

  it('reads and migrates readings even when the settings are corrupt', () => {
    const legacy = { ...base, takesAntihypertensiveMedication: undefined };
    values.set(key, JSON.stringify([legacy]));
    values.set('graphene_bp_settings_v1', '{broken');

    const readings = getStoredReadings();

    expect(readings).toHaveLength(1);
    expect(readings[0].takesAntihypertensiveMedication).toBe(
      DEFAULT_SETTINGS.takesAntihypertensiveMedication
    );
    expect(values.get('graphene_bp_settings_v1')).toBe('{broken');
  });

  it('saves imported readings even when the settings are corrupt', () => {
    values.set('graphene_bp_settings_v1', '{broken');

    const result = importReadingsIntoStorage([
      { timestamp: '2026-01-05T10:00:00.000Z', systolic: 130, diastolic: 85, heartRate: 72, arm: 'right' },
    ]);

    expect(result.addedCount).toBe(1);
    expect(result.updated[0].takesAntihypertensiveMedication).toBe(
      DEFAULT_SETTINGS.takesAntihypertensiveMedication
    );
    expect(JSON.parse(values.get(key)!)).toHaveLength(2);
  });

  it('seeds the default settings on a first boot and types a seeding write failure', () => {
    const settingsKey = 'graphene_bp_settings_v1';
    values.delete(settingsKey);

    // Primer arranque: la ausencia de la clave siembra los ajustes por defecto y los persiste.
    expect(getStoredSettings()).toEqual(DEFAULT_SETTINGS);
    expect(setItem).toHaveBeenCalledWith(settingsKey, JSON.stringify(DEFAULT_SETTINGS));

    // Si ese sembrado no se puede escribir, el fallo se reporta y no se deja un valor parcial.
    values.delete(settingsKey);
    setItem.mockImplementationOnce(() => { throw new DOMException('quota'); });
    expect(() => getStoredSettings()).toThrowError(expect.objectContaining({
      name: 'StorageError', operation: 'write', key: settingsKey,
    }));
    expect(values.has(settingsKey)).toBe(false);
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
