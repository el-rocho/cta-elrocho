import type { BloodPressureReading, BloodPressureSession } from '../types/bloodPressure';

// Umbral de tiempo en milisegundos para agrupar lecturas en una misma sesión (3 minutos = 180,000 ms)
const SESSION_THRESHOLD_MS = 3 * 60 * 1000;

/**
 * Agrupa una lista de lecturas en sesiones de medición continua (menos de 3 minutos entre tomas consecutivas)
 * y calcula la media libre de sesgo por síndrome de bata blanca.
 */
export function processReadingsIntoSessions(readings: BloodPressureReading[]): {
  sessions: BloodPressureSession[];
  allReadings: BloodPressureReading[];
} {
  if (readings.length === 0) {
    return { sessions: [], allReadings: [] };
  }

  // Ordenar cronológicamente ascendente para agrupar
  const sorted = [...readings].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const sessionGroups: BloodPressureReading[][] = [];
  let currentGroup: BloodPressureReading[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevTime = new Date(sorted[i - 1].timestamp).getTime();
    const currTime = new Date(sorted[i].timestamp).getTime();

    if (currTime - prevTime <= SESSION_THRESHOLD_MS) {
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

    // Asignar el sessionId a cada lectura del grupo
    group.forEach((r) => {
      r.sessionId = sessionId;
    });

    let validReadingsForAvg = [...group];
    let discardedCount = 0;

    if (group.length === 2) {
      // En 2 lecturas, si la primera es sensiblemente superior a la segunda (ej. sistólica > 5 mmHg mayor), descartamos la primera
      if (group[0].systolic > group[1].systolic + 4 || group[0].diastolic > group[1].diastolic + 3) {
        validReadingsForAvg = [group[1]];
        discardedCount = 1;
      }
    } else if (group.length >= 3) {
      // En 3 o más lecturas, descartamos la primera toma (típica de adaptación/ansiedad)
      // Si la 2ª toma también es anormalmente más alta que el resto, descartamos la 1ª y la 2ª
      const sortedBySys = [...group].sort((a, b) => b.systolic - a.systolic);
      
      // Siempre descartamos al menos la 1ª lectura si hay >=3 tomas
      validReadingsForAvg = group.slice(1);
      discardedCount = 1;

      // Si aún quedan 2 o más y la 2ª toma también era de los picos mas altos, nos quedamos con las últimas tomas mas estables
      if (validReadingsForAvg.length >= 2 && group[1].id === sortedBySys[0].id) {
        validReadingsForAvg = validReadingsForAvg.slice(1);
        discardedCount = 2;
      }
    }

    // Calcular promedios de las tomas válidas
    const sumSys = validReadingsForAvg.reduce((acc, r) => acc + r.systolic, 0);
    const sumDia = validReadingsForAvg.reduce((acc, r) => acc + r.diastolic, 0);
    const sumPulse = validReadingsForAvg.reduce((acc, r) => acc + r.heartRate, 0);

    const count = validReadingsForAvg.length;

    // Buscar notas acumuladas o principales
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
      arm: group[group.length - 1].arm, // Brazo de la última toma o representativo
      notes: combinedNotes,
    };
  });

  // Devolver ordenado de más reciente a más antiguo para la interfaz
  const sessionsDescending = [...sessions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return {
    sessions: sessionsDescending,
    allReadings: sorted,
  };
}
