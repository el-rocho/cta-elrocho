import type { BloodPressureReading, BloodPressureSession, AppSettings } from '../types/bloodPressure';
import { DEFAULT_SETTINGS } from '../services/storageService';

/**
 * Agrupa una lista de lecturas en sesiones de medición continua respetando las opciones configuradas.
 */
export function processReadingsIntoSessions(
  readings: BloodPressureReading[],
  settings: AppSettings = DEFAULT_SETTINGS
): {
  sessions: BloodPressureSession[];
  allReadings: BloodPressureReading[];
} {
  if (readings.length === 0) {
    return { sessions: [], allReadings: [] };
  }

  // Ordenar cronológicamente ascendente para agrupar
  const sorted = [...readings].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Si el filtro de bata blanca está DESACTIVADO por el usuario, tratamos cada lectura como una sesión individual
  if (!settings.enableWhiteCoatFilter) {
    const individualSessions: BloodPressureSession[] = sorted.map((r) => ({
      id: `session-single-${r.id}`,
      timestamp: r.timestamp,
      readings: [r],
      averageSystolic: r.systolic,
      averageDiastolic: r.diastolic,
      averageHeartRate: r.heartRate,
      discardedCount: 0,
      arm: r.arm,
      notes: r.notes,
    }));

    const sessionsDescending = [...individualSessions].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return {
      sessions: sessionsDescending,
      allReadings: sorted,
    };
  }

  // Umbral de tiempo dinámico según la configuración del usuario (en milisegundos)
  const sessionThresholdMs = (settings.whiteCoatIntervalMinutes || 3) * 60 * 1000;

  const sessionGroups: BloodPressureReading[][] = [];
  let currentGroup: BloodPressureReading[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevTime = new Date(sorted[i - 1].timestamp).getTime();
    const currTime = new Date(sorted[i].timestamp).getTime();

    if (currTime - prevTime <= sessionThresholdMs) {
      currentGroup.push(sorted[i]);
    } else {
      sessionGroups.push(currentGroup);
      currentGroup = [sorted[i]];
    }
  }
  if (currentGroup.length > 0) {
    sessionGroups.push(currentGroup);
  }

  // Procesar cada grupo para crear la sesión con el filtro de bata blanca
  const sessions: BloodPressureSession[] = sessionGroups.map((group, index) => {
    const sessionId = group[0].sessionId || `session-${index}-${group[0].id}`;

    group.forEach((r) => {
      r.sessionId = sessionId;
    });

    let validReadingsForAvg = [...group];
    let discardedCount = 0;

    if (group.length === 2) {
      // En 2 lecturas, si la primera es sensiblemente superior a la segunda, descartamos la primera
      if (group[0].systolic > group[1].systolic + 4 || group[0].diastolic > group[1].diastolic + 3) {
        validReadingsForAvg = [group[1]];
        discardedCount = 1;
      }
    } else if (group.length >= 3) {
      // En 3 o más lecturas, descartamos la primera toma (típica de adaptación/ansiedad)
      const sortedBySys = [...group].sort((a, b) => b.systolic - a.systolic);
      validReadingsForAvg = group.slice(1);
      discardedCount = 1;

      if (validReadingsForAvg.length >= 2 && group[1].id === sortedBySys[0].id) {
        validReadingsForAvg = validReadingsForAvg.slice(1);
        discardedCount = 2;
      }
    }

    const sumSys = validReadingsForAvg.reduce((acc, r) => acc + r.systolic, 0);
    const sumDia = validReadingsForAvg.reduce((acc, r) => acc + r.diastolic, 0);
    const sumPulse = validReadingsForAvg.reduce((acc, r) => acc + r.heartRate, 0);

    const count = validReadingsForAvg.length;
    const notesList = group.map((r) => r.notes).filter(Boolean);
    const combinedNotes = notesList.length > 0 ? Array.from(new Set(notesList)).join(' | ') : undefined;

    return {
      id: sessionId,
      timestamp: group[0].timestamp,
      readings: group,
      averageSystolic: Math.round(sumSys / count),
      averageDiastolic: Math.round(sumDia / count),
      averageHeartRate: Math.round(sumPulse / count),
      discardedCount,
      arm: group[group.length - 1].arm,
      notes: combinedNotes,
    };
  });

  const sessionsDescending = [...sessions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return {
    sessions: sessionsDescending,
    allReadings: sorted,
  };
}
