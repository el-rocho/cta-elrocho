/**
 * Modelos de datos para el seguimiento de la tensión arterial
 */

export type ArmPosition = 'left' | 'right';

export interface BloodPressureReading {
  id: string;
  timestamp: string; // Formato ISO
  systolic: number; // Tensión sistólica (mmHg)
  diastolic: number; // Tensión diastólica (mmHg)
  heartRate: number; // Pulsaciones por minuto (ppm)
  arm: ArmPosition; // Brazo utilizado ('left' = Izquierdo, 'right' = Derecho)
  notes?: string; // Notas adicionales del usuario
  sessionId?: string; // ID de sesión si pertenece a un conjunto de lecturas continuas
}

export interface BloodPressureSession {
  id: string;
  timestamp: string; // Hora de la sesión (primera lectura)
  readings: BloodPressureReading[];
  averageSystolic: number;
  averageDiastolic: number;
  averageHeartRate: number;
  discardedCount: number; // Número de tomas iniciales mas altas descartadas por sesgo de bata blanca
  arm: ArmPosition;
  notes?: string;
}

export type BackupFrequency = 'disabled' | 'daily' | 'weekly' | 'monthly';

export interface AppSettings {
  enableWhiteCoatFilter: boolean; // Activar/desactivar filtro de bata blanca
  whiteCoatIntervalMinutes: number; // Intervalo de tiempo máximo entre tomas (ej. 2 o 3 min)
  defaultArm: ArmPosition; // Brazo predeterminado ('left' / 'right')
  
  // Copias de seguridad automáticas CSV
  backupFrequency: BackupFrequency; // Frecuencia de copias ('disabled' | 'daily' | 'weekly' | 'monthly')
  backupFolder: string; // Carpeta o ruta preferida para copias (ej. "Descargas/Copias_Tension")
  lastBackupTimestamp?: string; // Fecha y hora de la última copia realizada
}

export type HealthSeverity = 'optimal' | 'normal' | 'elevated' | 'stage1' | 'stage2' | 'crisis';

export interface HealthCategoryInfo {
  key: HealthSeverity;
  name: string;
  description: string;
  colorHex: string;
  badgeBg: string;
  badgeText: string;
}

export type DateFilterPreset = 'all' | '7days' | '30days' | '90days' | 'custom';

export interface DateRange {
  preset: DateFilterPreset;
  startDate?: string;
  endDate?: string;
}
