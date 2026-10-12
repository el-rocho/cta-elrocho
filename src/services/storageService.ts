import type { BloodPressureReading, AppSettings } from '../types/bloodPressure';

const STORAGE_KEY = 'graphene_bp_readings_v1';
const SETTINGS_KEY = 'graphene_bp_settings_v1';

export type StorageOperation = 'read' | 'write' | 'parse' | 'remove';

export class StorageError extends Error {
  readonly operation: StorageOperation;
  readonly key: string;

  constructor(operation: StorageOperation, key: string, options?: ErrorOptions) {
    super(`localStorage ${operation} failed for ${key}`, options);
    this.name = 'StorageError';
    this.operation = operation;
    this.key = key;
  }
}

function readStoredValue(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    throw new StorageError('read', key, { cause: error });
  }
}

function parseStoredValue<T>(raw: string, key: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new StorageError('parse', key, { cause: error });
  }
}

function writeStoredValue(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    throw new StorageError('write', key, { cause: error });
  }
}

function removeStoredValue(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    throw new StorageError('remove', key, { cause: error });
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'es', // Por defecto Español
  enableWhiteCoatFilter: false, // Por defecto DESACTIVADO
  whiteCoatIntervalMinutes: 5, // Valor fijo; se conserva en datos serializados por compatibilidad
  defaultArm: 'left',
  preferredInputMode: 'keyboard', // Por defecto teclado ('keyboard' / 'wheel')
  guidelineProfile: 'esc-2024',
  showInformationalLabels: false,
  treatmentTargetMode: 'guideline',
  customTargetSystolicMin: 120,
  customTargetSystolicMax: 129,
  customTargetDiastolicMin: 70,
  customTargetDiastolicMax: 79,
  patientName: '',
  patientSex: '',
  patientAge: '',
  takesAntihypertensiveMedication: false,
  backupFrequency: 'disabled', // Recordatorios desactivados por defecto
  backupFolder: 'Descargas/Copias_Tension_Arterial',
  lastBackupTimestamp: undefined,
  lastFullBackupTimestamp: undefined,
};

const DAY_MS = 1000 * 60 * 60 * 24;

const DEMO_READING_NOTES: Record<string, { legacy: string; current: string }> = {
  'demo-optimal-unmedicated': {
    legacy: 'Ejemplo verde: óptima sin medicación',
    current: 'Ejemplo: 115/75 mmHg, sin medicación',
  },
  'demo-optimal-medicated': {
    legacy: 'Ejemplo verde: óptima con medicación',
    current: 'Ejemplo: 120/70 mmHg, con medicación',
  },
  'demo-hypotension': {
    legacy: 'Ejemplo azul: hipotensión con taquicardia',
    current: 'Ejemplo: 88/58 mmHg y pulso de 105 lpm',
  },
  'demo-suboptimal-medicated': {
    legacy: 'Ejemplo turquesa: subóptima con medicación',
    current: 'Ejemplo: 110/62 mmHg, con medicación',
  },
  'demo-elevated-unmedicated': {
    legacy: 'Ejemplo naranja: presión elevada sin medicación',
    current: 'Ejemplo: 130/82 mmHg, sin medicación',
  },
  'demo-elevated-medicated': {
    legacy: 'Ejemplo naranja: franja elevada con medicación',
    current: 'Ejemplo: 128/78 mmHg, con medicación',
  },
  'demo-hypertension-systolic': {
    legacy: 'Ejemplo rojo: sistólica elevada',
    current: 'Ejemplo: 138/82 mmHg, sin medicación',
  },
  'demo-hypertension-diastolic': {
    legacy: 'Ejemplo rojo: diastólica elevada con taquicardia',
    current: 'Ejemplo: 125/88 mmHg, con medicación y pulso de 106 lpm',
  },
  'demo-narrow-pulse-pressure': {
    legacy: 'Ejemplo: presión de pulso estrecha y bradicardia',
    current: 'Ejemplo: presión de pulso de 22 mmHg y pulso de 48 lpm',
  },
  'demo-wide-pulse-pressure': {
    legacy: 'Ejemplo rojo: ambos valores elevados y presión de pulso amplia',
    current: 'Ejemplo: presión de pulso de 65 mmHg',
  },
};

// Mismos diez ejemplos utilizados por las versiones individual, cliente y autoalojada.
export function createDemoReadings(referenceMs = Date.now()): BloodPressureReading[] {
  const demoTimestamp = (daysAgo: number) => new Date(referenceMs - DAY_MS * daysAgo).toISOString();
  return [
  {
    id: 'demo-optimal-unmedicated',
    timestamp: demoTimestamp(0),
    systolic: 115,
    diastolic: 75,
    heartRate: 72,
    arm: 'left',
    notes: DEMO_READING_NOTES['demo-optimal-unmedicated'].current,
    pulsePressureWarningConfirmed: false,
    takesAntihypertensiveMedication: false,
  },
  {
    id: 'demo-optimal-medicated',
    timestamp: demoTimestamp(2),
    systolic: 120,
    diastolic: 70,
    heartRate: 68,
    arm: 'right',
    notes: DEMO_READING_NOTES['demo-optimal-medicated'].current,
    pulsePressureWarningConfirmed: false,
    takesAntihypertensiveMedication: true,
  },
  {
    id: 'demo-hypotension',
    timestamp: demoTimestamp(6),
    systolic: 88,
    diastolic: 58,
    heartRate: 105,
    arm: 'left',
    notes: DEMO_READING_NOTES['demo-hypotension'].current,
    pulsePressureWarningConfirmed: false,
    takesAntihypertensiveMedication: false,
  },
  {
    id: 'demo-suboptimal-medicated',
    timestamp: demoTimestamp(10),
    systolic: 110,
    diastolic: 62,
    heartRate: 66,
    arm: 'right',
    notes: DEMO_READING_NOTES['demo-suboptimal-medicated'].current,
    pulsePressureWarningConfirmed: false,
    takesAntihypertensiveMedication: true,
  },
  {
    id: 'demo-elevated-unmedicated',
    timestamp: demoTimestamp(20),
    systolic: 130,
    diastolic: 82,
    heartRate: 74,
    arm: 'left',
    notes: DEMO_READING_NOTES['demo-elevated-unmedicated'].current,
    pulsePressureWarningConfirmed: false,
    takesAntihypertensiveMedication: false,
  },
  {
    id: 'demo-elevated-medicated',
    timestamp: demoTimestamp(45),
    systolic: 128,
    diastolic: 78,
    heartRate: 76,
    arm: 'right',
    notes: DEMO_READING_NOTES['demo-elevated-medicated'].current,
    pulsePressureWarningConfirmed: false,
    takesAntihypertensiveMedication: true,
  },
  {
    id: 'demo-hypertension-systolic',
    timestamp: demoTimestamp(75),
    systolic: 138,
    diastolic: 82,
    heartRate: 72,
    arm: 'left',
    notes: DEMO_READING_NOTES['demo-hypertension-systolic'].current,
    pulsePressureWarningConfirmed: false,
    takesAntihypertensiveMedication: false,
  },
  {
    id: 'demo-hypertension-diastolic',
    timestamp: demoTimestamp(100),
    systolic: 125,
    diastolic: 88,
    heartRate: 106,
    arm: 'right',
    notes: DEMO_READING_NOTES['demo-hypertension-diastolic'].current,
    pulsePressureWarningConfirmed: false,
    takesAntihypertensiveMedication: true,
  },
  {
    id: 'demo-narrow-pulse-pressure',
    timestamp: demoTimestamp(180),
    systolic: 100,
    diastolic: 78,
    heartRate: 48,
    arm: 'left',
    notes: DEMO_READING_NOTES['demo-narrow-pulse-pressure'].current,
    pulsePressureWarningConfirmed: true,
    takesAntihypertensiveMedication: false,
  },
  {
    id: 'demo-wide-pulse-pressure',
    timestamp: demoTimestamp(365),
    systolic: 150,
    diastolic: 85,
    heartRate: 70,
    arm: 'right',
    notes: DEMO_READING_NOTES['demo-wide-pulse-pressure'].current,
    pulsePressureWarningConfirmed: true,
    takesAntihypertensiveMedication: false,
  },
  ];
}

function migrateMedicationContext(
  readings: BloodPressureReading[],
  fallback: boolean
): { readings: BloodPressureReading[]; changed: boolean } {
  let changed = false;
  const migrated = readings.map((reading) => {
    if (typeof reading.takesAntihypertensiveMedication === 'boolean') return reading;
    changed = true;
    return { ...reading, takesAntihypertensiveMedication: fallback };
  });
  return { readings: migrated, changed };
}

function migrateDemoReadingNotes(
  readings: BloodPressureReading[]
): { readings: BloodPressureReading[]; changed: boolean } {
  let changed = false;
  const migrated = readings.map((reading) => {
    const noteMigration = DEMO_READING_NOTES[reading.id];
    if (!noteMigration || reading.notes !== noteMigration.legacy) return reading;
    changed = true;
    return { ...reading, notes: noteMigration.current };
  });
  return { readings: migrated, changed };
}

// Reading the readings must never depend on the settings being readable: when the settings
// are corrupt we recover the medication context from the defaults instead of letting the
// failure block the whole readings pipeline.
function readMedicationFallback(): boolean {
  try {
    return getStoredSettings().takesAntihypertensiveMedication;
  } catch {
    return DEFAULT_SETTINGS.takesAntihypertensiveMedication;
  }
}

// Persisting a migration is an accessory side effect of reading. When the write fails, the
// readings that were read successfully are still returned; they are never discarded or hidden
// behind a storage error.
function persistMigratedReadings(readings: BloodPressureReading[]): void {
  try {
    saveStoredReadings(readings);
  } catch {
    // Best effort: the read already succeeded and the caller keeps the data in memory.
  }
}

export function getStoredReadings(): BloodPressureReading[] {
  const raw = readStoredValue(STORAGE_KEY);
  if (raw === null) {
    const medicationFallback = readMedicationFallback();
    const initial = migrateMedicationContext(createDemoReadings(), medicationFallback).readings;
    persistMigratedReadings(initial);
    return initial;
  }
  const parsed = parseStoredValue<BloodPressureReading[]>(raw, STORAGE_KEY);
  const needsMedicationMigration = parsed.some(
    (reading) => typeof reading.takesAntihypertensiveMedication !== 'boolean'
  );
  const medicationFallback = needsMedicationMigration ? readMedicationFallback() : false;
  const medicationMigration = migrateMedicationContext(parsed, medicationFallback);
  const notesMigration = migrateDemoReadingNotes(medicationMigration.readings);
  if (medicationMigration.changed || notesMigration.changed) {
    persistMigratedReadings(notesMigration.readings);
  }
  return notesMigration.readings;
}

export function saveStoredReadings(readings: BloodPressureReading[]): void {
  writeStoredValue(STORAGE_KEY, readings);
}

export function clearAllStoredData(): void {
  saveStoredReadings([]);
}

export function getStoredSettings(): AppSettings {
  const raw = readStoredValue(SETTINGS_KEY);
  if (raw === null) {
    saveStoredSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  const stored = parseStoredValue<Partial<AppSettings>>(raw, SETTINGS_KEY);
  const parsed = {
    ...DEFAULT_SETTINGS,
    ...stored,
    showInformationalLabels: typeof stored.showInformationalLabels === 'boolean'
      ? stored.showInformationalLabels
      : true,
  };
  if (!['es', 'en'].includes(parsed.language)) {
    parsed.language = 'es';
  }
  parsed.whiteCoatIntervalMinutes = 5;
  if (!['keyboard', 'wheel'].includes(parsed.preferredInputMode)) {
    parsed.preferredInputMode = 'keyboard';
  }
  if (!['esc-2024', 'aha-acc-2025', 'ish-2020'].includes(parsed.guidelineProfile)) {
    parsed.guidelineProfile = 'esc-2024';
  }
  return parsed;
}

export function saveStoredSettings(settings: AppSettings): void {
  writeStoredValue(SETTINGS_KEY, settings);
}

export function addReadingToStorage(newReading: Omit<BloodPressureReading, 'id'>): BloodPressureReading {
  const current = getStoredReadings();
  const created: BloodPressureReading = {
    ...newReading,
    id: `bp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  };
  const updated = [created, ...current];
  saveStoredReadings(updated);
  return created;
}

export function updateReadingInStorage(updatedReading: BloodPressureReading): BloodPressureReading[] {
  const current = getStoredReadings();
  const updated = current.map((r) => (r.id === updatedReading.id ? updatedReading : r));
  saveStoredReadings(updated);
  return updated;
}

export function deleteReadingFromStorage(id: string): BloodPressureReading[] {
  const current = getStoredReadings();
  const updated = current.filter((r) => r.id !== id);
  saveStoredReadings(updated);
  return updated;
}

export function deleteSessionFromStorage(readingsInSession: BloodPressureReading[]): BloodPressureReading[] {
  const idsToDelete = new Set(readingsInSession.map((r) => r.id));
  const current = getStoredReadings();
  const updated = current.filter((r) => !idsToDelete.has(r.id));
  saveStoredReadings(updated);
  return updated;
}

export function importReadingsIntoStorage(imported: Omit<BloodPressureReading, 'id'>[]): {
  updated: BloodPressureReading[];
  addedCount: number;
} {
  const current = getStoredReadings();
  const currentMedicationContext = readMedicationFallback();
  const existingSignatures = new Set(
    current.map((r) => `${new Date(r.timestamp).toISOString().slice(0, 16)}_${r.systolic}_${r.diastolic}_${r.heartRate}`)
  );

  let addedCount = 0;
  const newItems: BloodPressureReading[] = [];

  imported.forEach((item) => {
    const sig = `${new Date(item.timestamp).toISOString().slice(0, 16)}_${item.systolic}_${item.diastolic}_${item.heartRate}`;
    if (!existingSignatures.has(sig)) {
      existingSignatures.add(sig);
      addedCount++;
      newItems.push({
        ...item,
        takesAntihypertensiveMedication:
          typeof item.takesAntihypertensiveMedication === 'boolean'
            ? item.takesAntihypertensiveMedication
            : currentMedicationContext,
        id: `imp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      });
    }
  });

  const updated = [...newItems, ...current];
  saveStoredReadings(updated);

  return { updated, addedCount };
}

function readingContent(reading: BloodPressureReading): string {
  // The whole instant matters; optional legacy fields have the same empty defaults.
  return JSON.stringify([
    new Date(reading.timestamp).toISOString(), reading.systolic, reading.diastolic,
    reading.heartRate, reading.arm, reading.notes ?? '', reading.sessionId ?? '',
    reading.pulsePressureWarningConfirmed ?? false,
    reading.takesAntihypertensiveMedication ?? false,
  ]);
}

export interface BackupMergePreview {
  addedCount: number;
  identicalCount: number;
  conflictCount: number;
  /** Snapshot of both inputs, used to reject stale confirmations. */
  currentRevision: string;
  importRevision: string;
}

function planBackupMerge(imported: BloodPressureReading[], current: BloodPressureReading[]) {
  const byInstant = new Map<string, Set<string>>();
  for (const reading of current) {
    const instant = new Date(reading.timestamp).toISOString();
    if (!byInstant.has(instant)) byInstant.set(instant, new Set());
    byInstant.get(instant)!.add(readingContent(reading));
  }
  const newItems: BloodPressureReading[] = [];
  let addedCount = 0;
  let identicalCount = 0;
  let conflictCount = 0;
  for (const reading of imported) {
    const instant = new Date(reading.timestamp).toISOString();
    const content = readingContent(reading);
    const variants = byInstant.get(instant);
    if (variants?.has(content)) {
      identicalCount++;
      continue;
    }
    if (variants?.size) conflictCount++;
    else addedCount++;
    newItems.push(reading);
    if (variants) variants.add(content);
    else byInstant.set(instant, new Set([content]));
  }
  return { newItems, addedCount, identicalCount, conflictCount };
}

export function previewBackupMerge(imported: BloodPressureReading[]): BackupMergePreview {
  const current = getStoredReadings();
  const { addedCount, identicalCount, conflictCount } = planBackupMerge(imported, current);
  return {
    addedCount, identicalCount, conflictCount,
    currentRevision: JSON.stringify(current), importRevision: JSON.stringify(imported),
  };
}

export function mergeBackupReadingsIntoStorage(
  imported: BloodPressureReading[], preview: BackupMergePreview
): ({ status: 'applied'; updated: BloodPressureReading[] } & BackupMergePreview) | { status: 'stale' } {
  const current = getStoredReadings();
  if (JSON.stringify(current) !== preview.currentRevision || JSON.stringify(imported) !== preview.importRevision) {
    return { status: 'stale' };
  }
  const plan = planBackupMerge(imported, current);
  if (plan.addedCount !== preview.addedCount || plan.identicalCount !== preview.identicalCount || plan.conflictCount !== preview.conflictCount) {
    return { status: 'stale' };
  }
  const existingIds = new Set(current.map((reading) => reading.id));
  const newItems = plan.newItems.map((reading) => {
    let id = reading.id;
    while (existingIds.has(id)) id = `restore-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    existingIds.add(id);
    return { ...reading, id };
  });
  const updated = [...newItems, ...current];
  if (newItems.length) saveStoredReadings(updated);
  return { status: 'applied', updated, ...preview };
}

export function replaceStoredData(readings: BloodPressureReading[], settings: AppSettings): void {
  const previousReadings = readStoredValue(STORAGE_KEY);
  const previousSettings = readStoredValue(SETTINGS_KEY);
  saveStoredReadings(readings);
  try {
    saveStoredSettings(settings);
  } catch (error) {
    try {
      if (previousReadings === null) removeStoredValue(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, previousReadings);
      if (previousSettings === null) removeStoredValue(SETTINGS_KEY);
      else localStorage.setItem(SETTINGS_KEY, previousSettings);
    } catch {
      // localStorage has no transactions; preserve the original write failure.
    }
    throw error;
  }
}
