import type { BloodPressureReading } from '../types/bloodPressure';

const STORAGE_KEY = 'graphene_bp_readings_v1';

// Datos iniciales de demostración para que el usuario aprecie inmediatamente los gráficos, clasificaciones y el filtro de bata blanca
const INITIAL_DEMO_DATA: BloodPressureReading[] = [
  // Sesión de hace 1 hora (Demostración de bata blanca: 3 tomas seguidas)
  {
    id: 'demo-103',
    timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(), // Hace 50 min
    systolic: 142,
    diastolic: 91,
    heartRate: 88,
    arm: 'left',
    notes: 'Tomas continuas en reposo (1ª lectura algo nerviosa)',
  },
  {
    id: 'demo-102',
    timestamp: new Date(Date.now() - 1000 * 60 * 48).toISOString(), // Hace 48 min
    systolic: 128,
    diastolic: 83,
    heartRate: 76,
    arm: 'left',
  },
  {
    id: 'demo-101',
    timestamp: new Date(Date.now() - 1000 * 60 * 46).toISOString(), // Hace 46 min
    systolic: 121,
    diastolic: 79,
    heartRate: 72,
    arm: 'left',
  },

  // Días anteriores
  {
    id: 'demo-5',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // Ayer
    systolic: 124,
    diastolic: 81,
    heartRate: 70,
    arm: 'left',
    notes: 'Mañana en ayunas',
  },
  {
    id: 'demo-4',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // Hace 2 días
    systolic: 132,
    diastolic: 86,
    heartRate: 75,
    arm: 'left',
    notes: 'Tras caminata ligera',
  },
  {
    id: 'demo-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // Hace 3 días
    systolic: 118,
    diastolic: 77,
    heartRate: 68,
    arm: 'right',
  },
  {
    id: 'demo-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // Hace 5 días
    systolic: 138,
    diastolic: 89,
    heartRate: 81,
    arm: 'left',
    notes: 'Día de trabajo intenso',
  },
  {
    id: 'demo-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // Hace 7 días
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
      // Guardar datos demo iniciales
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
