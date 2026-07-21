import type { BloodPressureSession, DateRange, ExportReportOptions } from '../types/bloodPressure';
import { getHealthCategory } from './healthClassification';

export function filterSessionsByDateRange(
  sessions: BloodPressureSession[],
  dateRange: DateRange
): BloodPressureSession[] {
  if (dateRange.preset === 'all') return sessions;

  const now = new Date();

  return sessions.filter((s) => {
    const sDate = new Date(s.timestamp);

    if (dateRange.preset === '7days') {
      const diffMs = now.getTime() - sDate.getTime();
      return diffMs <= 7 * 24 * 60 * 60 * 1000;
    }

    if (dateRange.preset === '30days') {
      const diffMs = now.getTime() - sDate.getTime();
      return diffMs <= 30 * 24 * 60 * 60 * 1000;
    }

    if (dateRange.preset === '90days') {
      const diffMs = now.getTime() - sDate.getTime();
      return diffMs <= 90 * 24 * 60 * 60 * 1000;
    }

    if (dateRange.preset === 'custom') {
      if (dateRange.startDate && sDate < new Date(dateRange.startDate)) return false;
      if (dateRange.endDate) {
        const end = new Date(dateRange.endDate);
        end.setHours(23, 59, 59, 999);
        if (sDate > end) return false;
      }
      return true;
    }

    return true;
  });
}

export function exportToCSV(
  sessions: BloodPressureSession[],
  dateRange: DateRange,
  filenamePrefix = 'tension_arterial',
  options: ExportReportOptions = {}
): void {
  const filtered = filterSessionsByDateRange(sessions, dateRange);

  const headers = [
    'Fecha',
    'Hora',
    'Sistolica_mmHg',
    'Diastolica_mmHg',
    'Pulsaciones_ppm',
    'Brazo',
    'Clasificacion_OMS',
    'Tomas_En_Sesion',
    'Tomas_Descartadas',
    'Notas',
  ];

  let metadataHeader = '';
  if (!options.hidePatientData) {
    if (options.patientName) metadataHeader += `# Paciente: ${options.patientName}\n`;
    if (options.patientSex) metadataHeader += `# Sexo: ${options.patientSex}\n`;
    if (options.patientAge) metadataHeader += `# Edad: ${options.patientAge} años\n`;
  }
  if (options.reportNotes) {
    metadataHeader += `# Observaciones: ${options.reportNotes}\n`;
  }

  const rows = filtered.map((s) => {
    const dateObj = new Date(s.timestamp);
    const dateStr = dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const timeStr = dateObj.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const category = getHealthCategory(s.averageSystolic, s.averageDiastolic);
    const armStr = s.arm === 'left' ? 'Izquierdo' : 'Derecho';
    const notesClean = s.notes ? `"${s.notes.replace(/"/g, '""')}"` : '';

    return [
      dateStr,
      timeStr,
      s.averageSystolic,
      s.averageDiastolic,
      s.averageHeartRate,
      armStr,
      `"${category.name}"`,
      s.readings.length,
      s.discardedCount,
      notesClean,
    ].join(';');
  });

  const csvContent = '\uFEFF' + metadataHeader + headers.join(';') + '\n' + rows.join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  // Formatear la fecha y hora exacta (AAAA-MM-DD_HH-MM-SS)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const dateTimeStr = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;

  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${dateTimeStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
