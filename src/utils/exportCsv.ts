import type { BloodPressureSession, DateRange, ExportReportOptions } from '../types/bloodPressure';
import { getHealthCategory } from './healthClassification';

export function filterSessionsByDateRange(sessions: BloodPressureSession[], dateRange: DateRange): BloodPressureSession[] {
  if (dateRange.preset === 'all') return sessions;

  const now = new Date();
  let minDate: Date | null = null;

  if (dateRange.preset === '7days') {
    minDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (dateRange.preset === '30days') {
    minDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (dateRange.preset === '90days') {
    minDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  } else if (dateRange.preset === 'custom') {
    const start = dateRange.startDate ? new Date(dateRange.startDate) : null;
    const end = dateRange.endDate ? new Date(dateRange.endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    return sessions.filter((s) => {
      const sDate = new Date(s.timestamp);
      if (start && sDate < start) return false;
      if (end && sDate > end) return false;
      return true;
    });
  }

  if (!minDate) return sessions;

  return sessions.filter((s) => new Date(s.timestamp) >= minDate!);
}

/**
 * Genera y descarga el archivo CSV con las lecturas y metadatos del paciente
 */
export function exportToCSV(
  sessions: BloodPressureSession[],
  dateRange: DateRange,
  fileNamePrefix = 'tension_arterial',
  options: ExportReportOptions = {}
): void {
  const filteredSessions = filterSessionsByDateRange(sessions, dateRange);

  const metaRows: string[] = [];

  // Metadatos de encabezado de CSV si no están ocultos
  if (!options.hidePatientData) {
    if (options.patientName) metaRows.push(`# Paciente: ${options.patientName}`);
    if (options.patientSex) metaRows.push(`# Sexo: ${options.patientSex.charAt(0).toUpperCase() + options.patientSex.slice(1)}`);
    if (options.patientAge) metaRows.push(`# Edad: ${options.patientAge} años`);
  } else {
    metaRows.push(`# Datos de paciente: Anónimos / Ocultos`);
  }

  if (options.reportNotes) {
    metaRows.push(`# Observaciones del informe: "${options.reportNotes.replace(/"/g, '""')}"`);
  }
  metaRows.push(`# Fecha de exportación: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`);
  metaRows.push(''); // Línea en blanco separadora

  // Encabezados estándar en español
  const headers = [
    'Fecha',
    'Hora',
    'Sistólica (mmHg)',
    'Diastólica (mmHg)',
    'Pulsaciones (ppm)',
    'Brazo',
    'Clasificación OMS/AHA',
    'Es Media de Sesión',
    'Tomas en Sesión',
    'Notas',
  ];

  const rows: string[][] = [];

  filteredSessions.forEach((session) => {
    const d = new Date(session.timestamp);
    const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const category = getHealthCategory(session.averageSystolic, session.averageDiastolic);
    const armStr = session.arm === 'left' ? 'Izquierdo' : 'Derecho';
    const isMultiReading = session.readings.length > 1 ? 'Sí' : 'No';

    rows.push([
      dateStr,
      timeStr,
      session.averageSystolic.toString(),
      session.averageDiastolic.toString(),
      session.averageHeartRate.toString(),
      armStr,
      category.name,
      isMultiReading,
      session.readings.length.toString(),
      `"${(session.notes || '').replace(/"/g, '""')}"`,
    ]);
  });

  // Construir string CSV con delimitador punto y coma (estándar en español/Excel) y UTF-8 BOM
  const csvContent =
    '\uFEFF' +
    [...metaRows, headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

  // Descarga del archivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStamp = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `${fileNamePrefix}_${dateRange.preset}_${dateStamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
