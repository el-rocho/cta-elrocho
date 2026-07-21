import type { BloodPressureReading, AppSettings } from '../types/bloodPressure';

const STORAGE_KEY = 'graphene_bp_readings_v1';
const SETTINGS_KEY = 'graphene_bp_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  enableWhiteCoatFilter: true,
  whiteCoatIntervalMinutes: 3,
  defaultArm: 'left',
  patientName: '',
  patientSex: '',
  patientAge: '',
  backupFrequency: 'disabled', // Por defecto DESACTIVADAS según preferencia del usuario
  backupFolder: 'Descargas/Copias_Tension_Arterial',
  lastBackupTimestamp: undefined,
};

// Datos iniciales de demostración
const INITIAL_DEMO_DATA: BloodPressureReading[] = [
  {
    id: 'demo-103',
    timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    systolic: 142,
    diastolic: 91,
    heartRate: 88,
    arm: 'left',
    notes: 'Tomas continuas en reposo (1ª lectura algo nerviosa)',
  },
  {
    id: 'demo-102',
    timestamp: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
    systolic: 128,
    diastolic: 83,
    heartRate: 76,
    arm: 'left',
  },
  {
    id: 'demo-101',
    timestamp: new Date(Date.now() - 1000 * 60 * 46).toISOString(),
    systolic: 121,
    diastolic: 79,
    heartRate: 72,
    arm: 'left',
  },
  {
    id: 'demo-5',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    systolic: 124,
    diastolic: 81,
    heartRate: 70,
    arm: 'left',
    notes: 'Mañana en ayunas',
  },
  {
    id: 'demo-4',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    systolic: 132,
    diastolic: 86,
    heartRate: 75,
    arm: 'left',
    notes: 'Tras caminata ligera',
  },
  {
    id: 'demo-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    systolic: 118,
    diastolic: 77,
    heartRate: 68,
    arm: 'right',
  },
  {
    id: 'demo-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    systolic: 138,
    diastolic: 89,
    heartRate: 81,
    arm: 'left',
    notes: 'Día de trabajo intenso',
  },
  {
    id: 'demo-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    systolic: 122,
    diastolic: 80,
    heartRate: 71,
    arm: 'left',
  },
];

export function getStoredReadings(): BloodPressureReading[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveStoredReadings(INITIAL_DEMO_DATA);
      return INITIAL_DEMO_DATA;
    }
    return JSON.parse(raw) as BloodPressureReading[];
  } catch (error) {
    console.error('Error al leer de localStorage:', error);
    return INITIAL_DEMO_DATA;
  }
}

export function saveStoredReadings(readings: BloodPressureReading[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
  } catch (error) {
    console.error('Error al guardar en localStorage:', error);
  }
}

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
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
        id: `imp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      });
    }
  });

  const updated = [...newItems, ...current];
  saveStoredReadings(updated);

  return { updated, addedCount };
}
