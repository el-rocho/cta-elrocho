import type { BloodPressureReading, AppSettings } from '../types/bloodPressure';

const STORAGE_KEY = 'graphene_bp_readings_v1';
const SETTINGS_KEY = 'graphene_bp_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'es', // Por defecto Español
  enableWhiteCoatFilter: false, // Por defecto DESACTIVADO
  whiteCoatIntervalMinutes: 5, // Valor fijo; se conserva en datos serializados por compatibilidad
  defaultArm: 'left',
  preferredInputMode: 'keyboard', // Por defecto teclado ('keyboard' / 'wheel')
  guidelineProfile: 'esc-2024',
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
function createDemoReadings(referenceMs = Date.now()): BloodPressureReading[] {
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

export function getStoredReadings(): BloodPressureReading[] {
  try {
    const medicationFallback = getStoredSettings().takesAntihypertensiveMedication;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = migrateMedicationContext(createDemoReadings(), medicationFallback).readings;
      saveStoredReadings(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as BloodPressureReading[];
    const medicationMigration = migrateMedicationContext(parsed, medicationFallback);
    const notesMigration = migrateDemoReadingNotes(medicationMigration.readings);
    if (medicationMigration.changed || notesMigration.changed) {
      saveStoredReadings(notesMigration.readings);
    }
    return notesMigration.readings;
  } catch (error) {
    console.error('Error al leer de localStorage:', error);
    return createDemoReadings();
  }
}

export function saveStoredReadings(readings: BloodPressureReading[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
  } catch (error) {
    console.error('Error al guardar en localStorage:', error);
  }
}

export function clearAllStoredData(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch (error) {
    console.error('Error al eliminar datos de localStorage:', error);
  }
}

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
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
  } catch (error) {
    console.error('Error al leer ajustes:', error);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error al guardar ajustes:', error);
  }
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

export function updateMedicationContextForAllReadings(
  takesMedication: boolean
): BloodPressureReading[] {
  const updated = getStoredReadings().map((reading) => ({
    ...reading,
    takesAntihypertensiveMedication: takesMedication,
  }));
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
  const currentMedicationContext = getStoredSettings().takesAntihypertensiveMedication;
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

function getExactReadingSignature(reading: Omit<BloodPressureReading, 'id'>): string {
  return [
    new Date(reading.timestamp).toISOString(),
    reading.systolic,
    reading.diastolic,
    reading.heartRate,
    reading.arm,
    reading.sessionId ?? '',
  ].join('_');
}

export function mergeBackupReadingsIntoStorage(imported: BloodPressureReading[]): {
  updated: BloodPressureReading[];
  addedCount: number;
} {
  const current = getStoredReadings();
  const existingIds = new Set(current.map((reading) => reading.id));
  const existingSignatures = new Set(current.map(getExactReadingSignature));
  const newItems: BloodPressureReading[] = [];

  for (const reading of imported) {
    const signature = getExactReadingSignature(reading);
    if (existingSignatures.has(signature)) continue;

    let id = reading.id;
    if (existingIds.has(id)) {
      id = `restore-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }
    existingIds.add(id);
    existingSignatures.add(signature);
    newItems.push({ ...reading, id });
  }

  const updated = [...newItems, ...current];
  saveStoredReadings(updated);
  return { updated, addedCount: newItems.length };
}

export function replaceStoredData(readings: BloodPressureReading[], settings: AppSettings): void {
  saveStoredReadings(readings);
  saveStoredSettings(settings);
}
