import type { BloodPressureSession, DateRange, ExportReportOptions } from '../types/bloodPressure';
import { filterSessionsByDateRange } from './exportCsv';
import { getHealthCategory } from './healthClassification';

export function printPDFReport(
  sessions: BloodPressureSession[],
  dateRange: DateRange,
  options: ExportReportOptions = {}
): void {
  const filtered = filterSessionsByDateRange(sessions, dateRange);

  // Ordenar de más antiguo a más reciente para el gráfico
  const chronological = [...filtered].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Estadísticas para el resumen
  const total = filtered.length;
  let sumSys = 0;
  let sumDia = 0;
  let sumPulse = 0;

  filtered.forEach((s) => {
    sumSys += s.averageSystolic;
    sumDia += s.averageDiastolic;
    sumPulse += s.averageHeartRate;
  });

  const avgSys = total > 0 ? Math.round(sumSys / total) : 0;
  const avgDia = total > 0 ? Math.round(sumDia / total) : 0;
  const avgPulse = total > 0 ? Math.round(sumPulse / total) : 0;
  const avgCategory = getHealthCategory(avgSys, avgDia);

  // Generar SVG del gráfico con triple trazado (Sistólica, Diastólica y Pulsaciones con eje derecho)
  const svgChartHtml = generateChartSVG(chronological);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permite las ventanas emergentes en tu navegador para generar el informe PDF.');
    return;
  }

  const dateRangeLabel =
    dateRange.preset === 'all'
      ? 'Histórico Completo'
      : dateRange.preset === '7days'
      ? 'Últimos 7 días'
      : dateRange.preset === '30days'
      ? 'Últimos 30 días'
      : dateRange.preset === '90days'
      ? 'Últimos 90 días'
      : `Del ${dateRange.startDate || ''} al ${dateRange.endDate || ''}`;

  // Formatear metadatos de paciente
  let patientInfoStr = '';
  if (!options.hidePatientData) {
    const parts: string[] = [];
    if (options.patientName) parts.push(`<strong>Paciente:</strong> ${options.patientName}`);
    if (options.patientSex) {
      const sexCap = options.patientSex.charAt(0).toUpperCase() + options.patientSex.slice(1);
      parts.push(`<strong>Sexo:</strong> ${sexCap}`);
    }
    if (options.patientAge) parts.push(`<strong>Edad:</strong> ${options.patientAge} años`);

    patientInfoStr = parts.length > 0 ? parts.join(' | ') : '<strong>Paciente:</strong> No especificado';
  } else {
    patientInfoStr = '<strong>Datos de Paciente:</strong> Ocultos / Anónimos';
  }

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Informe de Tensión Arterial - ${dateRangeLabel}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1e293b;
          padding: 24px;
          margin: 0;
          background: #ffffff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }
        .header-title {
          margin: 0;
          font-size: 24px;
          color: #0f172a;
          font-weight: 700;
        }
        .header-subtitle {
          margin: 6px 0 0 0;
          font-size: 13px;
          color: #475569;
        }
        .header-meta {
          text-align: right;
          font-size: 12px;
          color: #475569;
        }
        .report-notes-box {
          background: #fffbe6;
          border: 1px solid #ffe58f;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          font-size: 13px;
          color: #873800;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .summary-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
        }
        .summary-card-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          margin-bottom: 4px;
        }
        .summary-card-value {
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
        }
        .summary-card-unit {
          font-size: 12px;
          color: #94a3b8;
          font-weight: normal;
        }
        .chart-pdf-container {
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px;
          background: #f8fafc;
          page-break-inside: avoid;
        }
        .chart-pdf-title {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .chart-pdf-legend {
          display: flex;
          gap: 16px;
          font-size: 11px;
          color: #475569;
        }
        .legend-item { display: flex; align-items: center; gap: 4px; }
        .dot-red { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; display: inline-block; }
        .dot-blue { width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; display: inline-block; }
        .dot-pink { width: 8px; height: 8px; background: #ec4899; border-radius: 50%; display: inline-block; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          font-size: 12px;
        }
        th, td {
          padding: 8px 10px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        th {
          background-color: #f1f5f9;
          color: #334155;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.5px;
        }
        tr:nth-child(even) { background-color: #f8fafc; }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
        }
        .footer {
          margin-top: 32px;
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
          font-size: 11px;
          color: #94a3b8;
          text-align: center;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="header-title">Informe de Tensión Arterial y Pulsaciones</h1>
          <p class="header-subtitle">${patientInfoStr} | <strong>Periodo:</strong> ${dateRangeLabel}</p>
        </div>
        <div class="header-meta">
          <p style="margin:0;">Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}</p>
          <p style="margin:4px 0 0 0; color:#10b981; font-weight:600;">✓ Documento Offline Privado</p>
        </div>
      </div>

      ${
        options.reportNotes
          ? `
        <div class="report-notes-box">
          <strong>Observaciones Médico-Clínicas:</strong>
          <p style="margin:4px 0 0 0; font-style:italic;">"${options.reportNotes}"</p>
        </div>
      `
          : ''
      }

      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-card-title">Promedio Sistólico</div>
          <div class="summary-card-value">${avgSys} <span class="summary-card-unit">mmHg</span></div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Promedio Diastólico</div>
          <div class="summary-card-value">${avgDia} <span class="summary-card-unit">mmHg</span></div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Promedio Pulsaciones</div>
          <div class="summary-card-value" style="color:#ec4899">${avgPulse} <span class="summary-card-unit">ppm</span></div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Estado Global</div>
          <div class="summary-card-value" style="font-size:16px; color:${avgCategory.colorHex}; font-weight:700; padding-top:4px;">
            ${avgCategory.name}
          </div>
        </div>
      </div>

      <!-- Gráfico con línea de pulsaciones y doble eje Y antes de la lista de registros -->
      <div class="chart-pdf-container">
        <div class="chart-pdf-title">
          <span>Evolución Temporal de Tensión Arterial y Pulsaciones</span>
          <div class="chart-pdf-legend">
            <span class="legend-item"><span class="dot-red"></span> Sistólica (Eje Izq.)</span>
            <span class="legend-item"><span class="dot-blue"></span> Diastólica (Eje Izq.)</span>
            <span class="legend-item"><span class="dot-pink"></span> Pulsaciones (Eje Der.)</span>
          </div>
        </div>
        ${svgChartHtml}
      </div>

      <h3 style="font-size:16px; color:#1e293b; margin-bottom:12px;">Historial de Mediciones (${total} registros)</h3>

      <table>
        <thead>
          <tr>
            <th>Fecha y Hora</th>
            <th>Sistólica</th>
            <th>Diastólica</th>
            <th>Pulso</th>
            <th>Brazo</th>
            <th>Clasificación OMS/AHA</th>
            <th>Notas / Sesión</th>
          </tr>
        </thead>
        <tbody>
          ${filtered
            .map((s) => {
              const d = new Date(s.timestamp);
              const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
              const timeStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              const cat = getHealthCategory(s.averageSystolic, s.averageDiastolic);
              const armLabel = s.arm === 'left' ? 'Izq' : 'Der';
              const sessionTag = s.readings.length > 1 ? ` (Media de ${s.readings.length} tomas)` : '';

              return `
              <tr>
                <td><strong>${dateStr}</strong> ${timeStr}</td>
                <td><strong style="font-size:14px; color:#ef4444;">${s.averageSystolic}</strong> mmHg</td>
                <td><strong style="font-size:14px; color:#3b82f6;">${s.averageDiastolic}</strong> mmHg</td>
                <td><strong style="font-size:13px; color:#ec4899;">${s.averageHeartRate}</strong> ppm</td>
                <td>${armLabel}</td>
                <td>
                  <span class="badge" style="background:${cat.badgeBg}; color:${cat.badgeText};">
                    ${cat.name}
                  </span>
                </td>
                <td>${(s.notes || '') + sessionTag}</td>
              </tr>
            `;
            })
            .join('')}
        </tbody>
      </table>

      <div class="footer">
        Este documento ha sido generado localmente en el dispositivo de forma 100% privada sin servicios en la nube.
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Genera el código SVG vectorial del gráfico con doble eje Y (Tensión a la izq. y Pulsaciones a la der.)
 */
function generateChartSVG(chronologicalSessions: BloodPressureSession[]): string {
  if (chronologicalSessions.length === 0) {
    return '<p style="text-align:center; color:#94a3b8; font-size:12px;">Sin datos para graficar en este periodo</p>';
  }

  const width = 720;
  const height = 200;
  const paddingLeft = 40;
  const paddingRight = 45; // Espacio para eje derecho (Pulsaciones)
  const paddingTop = 15;
  const paddingBottom = 32;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Escala Eje Izquierdo (Tensión Arterial: 40 - 200 mmHg)
  const minBP = 40;
  const maxBP = 200;

  // Escala Eje Derecho (Pulsaciones: 40 - 140 ppm)
  const minPulse = 40;
  const maxPulse = 140;

  const getY_BP = (val: number) => {
    const clamped = Math.max(minBP, Math.min(maxBP, val));
    const ratio = (clamped - minBP) / (maxBP - minBP);
    return height - paddingBottom - ratio * chartHeight;
  };

  const getY_Pulse = (val: number) => {
    const clamped = Math.max(minPulse, Math.min(maxPulse, val));
    const ratio = (clamped - minPulse) / (maxPulse - minPulse);
    return height - paddingBottom - ratio * chartHeight;
  };

  const getX = (index: number) => {
    if (chronologicalSessions.length === 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (chronologicalSessions.length - 1)) * chartWidth;
  };

  const sysPoints = chronologicalSessions.map((s, i) => ({ x: getX(i), y: getY_BP(s.averageSystolic) }));
  const diaPoints = chronologicalSessions.map((s, i) => ({ x: getX(i), y: getY_BP(s.averageDiastolic) }));
  const pulsePoints = chronologicalSessions.map((s, i) => ({ x: getX(i), y: getY_Pulse(s.averageHeartRate) }));

  const sysPath = sysPoints.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  const diaPath = diaPoints.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  const pulsePath = pulsePoints.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');

  const idealSysY = getY_BP(120);

  return `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:auto;">
      <!-- Guía de rango óptimo tensión -->
      <line x1="${paddingLeft}" y1="${idealSysY}" x2="${width - paddingRight}" y2="${idealSysY}" stroke="#10b981" stroke-dasharray="3 3" stroke-width="1" />

      <!-- Cuadrícula Y y Eje Izquierdo (mmHg) -->
      ${[60, 90, 120, 150, 180]
        .map((v) => {
          const y = getY_BP(v);
          return `
          <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="#e2e8f0" stroke-dasharray="2 2" />
          <text x="${paddingLeft - 6}" y="${y + 3}" text-anchor="end" fill="#64748b" font-size="9" font-weight="600">${v}</text>
        `;
        })
        .join('')}

      <!-- Eje Derecho (Pulsaciones ppm) -->
      ${[40, 60, 80, 100, 120, 140]
        .map((v) => {
          const y = getY_Pulse(v);
          return `
          <text x="${width - paddingRight + 6}" y="${y + 3}" text-anchor="start" fill="#ec4899" font-size="9" font-weight="600">${v} ppm</text>
        `;
        })
        .join('')}

      <!-- Trazo Sistólica (Rojo) -->
      <path d="${sysPath}" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" />

      <!-- Trazo Diastólica (Azul) -->
      <path d="${diaPath}" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" />

      <!-- Trazo Pulsaciones (Rosa/Púrpura punteado) -->
      <path d="${pulsePath}" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 3" />

      <!-- Puntos Sistólica -->
      ${sysPoints
        .map((p) => `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />`)
        .join('')}

      <!-- Puntos Diastólica -->
      ${diaPoints
        .map((p) => `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#3b82f6" stroke="#ffffff" stroke-width="1.5" />`)
        .join('')}

      <!-- Puntos Pulsaciones -->
      ${pulsePoints
        .map((p) => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="#ec4899" stroke="#ffffff" stroke-width="1.5" />`)
        .join('')}

      <!-- Eje X (Fechas) -->
      ${chronologicalSessions
        .map((s, i) => {
          if (chronologicalSessions.length > 10 && i % Math.ceil(chronologicalSessions.length / 8) !== 0) return '';
          const x = getX(i);
          const dateLabel = new Date(s.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
          return `<text x="${x}" y="${height - 8}" text-anchor="middle" fill="#64748b" font-size="9">${dateLabel}</text>`;
        })
        .join('')}
    </svg>
  `;
}
