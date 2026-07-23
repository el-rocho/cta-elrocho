import type { BloodPressureSession, DateRange, ExportReportOptions, LanguageOption } from '../types/bloodPressure';
import { filterSessionsByDateRange } from './exportCsv';
import { getHealthCategory } from './healthClassification';

export function printPDFReport(
  sessions: BloodPressureSession[],
  dateRange: DateRange,
  options: ExportReportOptions = {},
  lang: LanguageOption = 'es'
): void {
  const isEn = lang === 'en';
  const locale = isEn ? 'en-US' : 'es-ES';
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
  const avgCategory = getHealthCategory(avgSys, avgDia, lang);

  // Generar SVG del gráfico
  const svgChartHtml = generateChartSVG(chronological, locale);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert(
      isEn
        ? 'Please allow pop-ups in your browser to generate the PDF report.'
        : 'Por favor, permite las ventanas emergentes en tu navegador para generar el informe PDF.'
    );
    return;
  }

  // Calcular periodo de fechas real directamente
  let realPeriodStr = '';
  if (filtered.length > 0) {
    const timestamps = filtered.map((s) => new Date(s.timestamp).getTime());
    const minT = Math.min(...timestamps);
    const maxT = Math.max(...timestamps);
    const minDStr = new Date(minT).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
    const maxDStr = new Date(maxT).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
    realPeriodStr = minDStr === maxDStr ? minDStr : isEn ? `From ${minDStr} to ${maxDStr}` : `Del ${minDStr} al ${maxDStr}`;
  } else {
    realPeriodStr = isEn ? 'No records in this period' : 'Sin registros en este periodo';
  }

  // Formatear metadatos de paciente (Nombre, Sexo y Edad)
  let patientInfoStr = '';
  if (!options.hidePatientData) {
    const parts: string[] = [];
    if (options.patientName) parts.push(`<strong>${isEn ? 'Patient:' : 'Paciente:'}</strong> ${options.patientName}`);
    if (options.patientSex) {
      const sexCap = options.patientSex.charAt(0).toUpperCase() + options.patientSex.slice(1);
      parts.push(`<strong>${isEn ? 'Sex:' : 'Sexo:'}</strong> ${sexCap}`);
    }
    if (options.patientAge) {
      parts.push(`<strong>${isEn ? 'Age:' : 'Edad:'}</strong> ${options.patientAge} ${isEn ? 'years' : 'años'}`);
    } else {
      parts.push(`<strong>${isEn ? 'Age:' : 'Edad:'}</strong> ${isEn ? 'Not specified' : 'No especificada'}`);
    }

    patientInfoStr = parts.length > 0 ? parts.join(' | ') : `<strong>${isEn ? 'Patient:' : 'Paciente:'}</strong> ${isEn ? 'Not specified' : 'No especificado'}`;
  } else {
    patientInfoStr = `<strong>${isEn ? 'Patient Data:' : 'Datos de Paciente:'}</strong> ${isEn ? 'Hidden / Anonymous' : 'Ocultos / Anónimos'}`;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="UTF-8" />
      <title>${isEn ? 'Blood Pressure Report' : 'Informe de Tensión Arterial'} - ${realPeriodStr}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1e293b;
          padding: 24px;
          margin: 0;
          background: #ffffff;
        }
        .action-bar {
          background: #0f172a;
          color: #ffffff;
          padding: 12px 20px;
          border-radius: 8px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
        }
        .action-bar-title {
          font-weight: 600;
          font-size: 15px;
        }
        .action-buttons {
          display: flex;
          gap: 10px;
        }
        .btn-print {
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
        }
        .btn-close-pdf {
          background: #475569;
          color: #ffffff;
          border: none;
          padding: 8px 14px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
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
          font-size: 22px;
          color: #0f172a;
        }
        .header-subtitle {
          margin: 6px 0 0 0;
          font-size: 13px;
          color: #64748b;
        }
        .header-meta {
          text-align: right;
          font-size: 12px;
          color: #64748b;
        }
        .report-notes-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-left: 4px solid #3b82f6;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 13px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
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
          font-weight: 600;
          margin-bottom: 4px;
        }
        .summary-card-value {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
        }
        .summary-card-unit {
          font-size: 12px;
          font-weight: 400;
          color: #64748b;
        }
        .chart-pdf-container {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
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
          gap: 12px;
          font-size: 10px;
          font-weight: 500;
          color: #64748b;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .dot-red { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; display: inline-block; }
        .dot-blue { width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; display: inline-block; }
        .dot-gray { width: 8px; height: 8px; background: #64748b; border-radius: 50%; display: inline-block; }
        .box-green { width: 10px; height: 8px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); display: inline-block; }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        th {
          background-color: #f1f5f9;
          color: #475569;
          font-weight: 600;
          text-align: left;
          padding: 8px 10px;
          border-bottom: 2px solid #cbd5e1;
        }
        td {
          padding: 8px 10px;
          border-bottom: 1px solid #e2e8f0;
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
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="action-bar no-print">
        <div class="action-bar-title">
          📋 ${isEn ? 'Blood Pressure Report Preview' : 'Vista Previa del Informe de Tensión Arterial'}
        </div>
        <div class="action-buttons">
          <button class="btn-print" onclick="window.print()">🖨️ ${isEn ? 'Print / Save as PDF' : 'Imprimir / Guardar en PDF'}</button>
          <button class="btn-close-pdf" onclick="window.close()">${isEn ? 'Close' : 'Cerrar'}</button>
        </div>
      </div>

      <div class="header">
        <div>
          <h1 class="header-title">${isEn ? 'Blood Pressure & Pulse Clinical Report' : 'Informe de Tensión Arterial y Pulsaciones'}</h1>
          <p class="header-subtitle">${patientInfoStr} | <strong>${isEn ? 'Period:' : 'Periodo:'}</strong> ${realPeriodStr}</p>
        </div>
        <div class="header-meta">
          <p style="margin:0;">${isEn ? 'Generated:' : 'Generado:'} ${new Date().toLocaleDateString(locale)} ${new Date().toLocaleTimeString(locale)}</p>
          <p style="margin:4px 0 0 0; color:#10b981; font-weight:600;">✓ ${isEn ? 'Private Document' : 'Documento Privado'}</p>
        </div>
      </div>

      ${
        options.reportNotes
          ? `
        <div class="report-notes-box">
          <strong>${isEn ? 'Medical Remarks:' : 'Observaciones Médico-Clínicas:'}</strong>
          <p style="margin:4px 0 0 0; font-style:italic;">"${options.reportNotes}"</p>
        </div>
      `
          : ''
      }

      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-card-title">${isEn ? 'Avg Systolic' : 'Promedio Sistólico'}</div>
          <div class="summary-card-value">${avgSys} <span class="summary-card-unit">mmHg</span></div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">${isEn ? 'Avg Diastolic' : 'Promedio Diastólico'}</div>
          <div class="summary-card-value">${avgDia} <span class="summary-card-unit">mmHg</span></div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">${isEn ? 'Avg Pulse' : 'Promedio Pulsaciones'}</div>
          <div class="summary-card-value" style="color:#64748b">${avgPulse} <span class="summary-card-unit">${isEn ? 'BPM' : 'ppm'}</span></div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">${isEn ? 'Global Status' : 'Estado Global'}</div>
          <div class="summary-card-value" style="font-size:16px; color:${avgCategory.colorHex}; font-weight:700; padding-top:4px;">
            ${avgCategory.name}
          </div>
        </div>
      </div>

      <!-- Gráfico antes de la lista de registros -->
      <div class="chart-pdf-container">
        <div class="chart-pdf-title">
          <span>${isEn ? 'Blood Pressure Evolution' : 'Evolución Tensión Arterial'}</span>
          <div class="chart-pdf-legend">
            <span class="legend-item"><span class="dot-red"></span> ${isEn ? 'Systolic' : 'Sistólica (Eje Izq.)'}</span>
            <span class="legend-item"><span class="dot-blue"></span> ${isEn ? 'Diastolic' : 'Diastólica (Eje Izq.)'}</span>
            <span class="legend-item"><span class="dot-gray"></span> ${isEn ? 'Pulse' : 'Pulsaciones (Eje Der.)'}</span>
            <span class="legend-item"><span class="box-green"></span> ${isEn ? 'Healthy Range' : 'Rango Saludable'}</span>
          </div>
        </div>
        ${svgChartHtml}
      </div>

      <h3 style="font-size:16px; color:#1e293b; margin-bottom:12px;">${isEn ? `Measurement History (${total} records)` : `Historial mediciones (${total} registros)`}</h3>

      <table>
        <thead>
          <tr>
            <th>${isEn ? 'Date & Time' : 'Fecha y Hora'}</th>
            <th>${isEn ? 'Systolic' : 'Sistólica'}</th>
            <th>${isEn ? 'Diastolic' : 'Diastólica'}</th>
            <th>${isEn ? 'Pulse' : 'Pulso'}</th>
            <th>${isEn ? 'Arm' : 'Brazo'}</th>
            <th>${isEn ? 'WHO/AHA Category' : 'Clasificación OMS/AHA'}</th>
            <th>${isEn ? 'Notes / Session' : 'Notas / Sesión'}</th>
          </tr>
        </thead>
        <tbody>
          ${filtered
            .map((s) => {
              const d = new Date(s.timestamp);
              const dateStr = d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
              const timeStr = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
              const cat = getHealthCategory(s.averageSystolic, s.averageDiastolic, lang);
              const armLabel = s.arm === 'left' ? (isEn ? 'Left' : 'Izq') : (isEn ? 'Right' : 'Der');
              const sessionTag = s.readings.length > 1 ? (isEn ? ` (Avg of ${s.readings.length} readings)` : ` (Media de ${s.readings.length} tomas)`) : '';

              return `
              <tr>
                <td><strong>${dateStr}</strong> ${timeStr}</td>
                <td><strong style="font-size:14px; color:#ef4444;">${s.averageSystolic}</strong> mmHg</td>
                <td><strong style="font-size:14px; color:#3b82f6;">${s.averageDiastolic}</strong> mmHg</td>
                <td><strong style="font-size:13px; color:#64748b;">${s.averageHeartRate}</strong> ${isEn ? 'BPM' : 'ppm'}</td>
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
        ${isEn ? 'This document was generated locally and 100% privately.' : 'Este documento ha sido generado localmente de forma 100% privada.'}
      </div>
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
function generateChartSVG(chronologicalSessions: BloodPressureSession[], locale = 'es-ES'): string {
  if (chronologicalSessions.length === 0) {
    return '<p style="text-align:center; color:#94a3b8; font-size:12px;">Sin datos para graficar en este periodo</p>';
  }

  const width = 720;
  const height = 200;
  const paddingLeft = 40;
  const paddingRight = 45;
  const paddingTop = 15;
  const paddingBottom = 32;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const minVal = 40;
  const maxVal = 200;

  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    const ratio = (clamped - minVal) / (maxVal - minVal);
    return height - paddingBottom - ratio * chartHeight;
  };

  const getX = (index: number) => {
    if (chronologicalSessions.length === 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (chronologicalSessions.length - 1)) * chartWidth;
  };

  const sysPoints = chronologicalSessions.map((s, i) => ({ x: getX(i), y: getY(s.averageSystolic) }));
  const diaPoints = chronologicalSessions.map((s, i) => ({ x: getX(i), y: getY(s.averageDiastolic) }));
  const pulsePoints = chronologicalSessions.map((s, i) => ({ x: getX(i), y: getY(s.averageHeartRate) }));

  const sysPath = sysPoints.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  const diaPath = diaPoints.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  const pulsePath = pulsePoints.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');

  const idealSysY = getY(120);
  const idealDiaY = getY(80);

  return `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:auto; overflow:visible;">
      <!-- Banda Rango Saludable -->
      <rect x="${paddingLeft}" y="${idealSysY}" width="${chartWidth}" height="${Math.max(0, idealDiaY - idealSysY)}" fill="rgba(16, 185, 129, 0.1)" rx="3" />
      <line x1="${paddingLeft}" y1="${idealSysY}" x2="${width - paddingRight}" y2="${idealSysY}" stroke="rgba(16, 185, 129, 0.4)" stroke-dasharray="3 3" />

      <!-- Escala Y (Tensión a la izq.) -->
      ${[60, 90, 120, 150, 180]
        .map((val) => {
          const y = getY(val);
          return `
          <g>
            <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="#e2e8f0" stroke-dasharray="2 2" />
            <text x="${paddingLeft - 6}" y="${y + 3}" text-anchor="end" fill="#94a3b8" font-size="9">${val}</text>
          </g>
        `;
        })
        .join('')}

      <!-- Línea Pulsaciones (Gris) -->
      <path d="${pulsePath}" fill="none" stroke="#64748b" stroke-width="0.8" stroke-linecap="round" stroke-dasharray="4 3" />

      <!-- Líneas Sistólica y Diastólica -->
      <path d="${sysPath}" fill="none" stroke="#ef4444" stroke-width="1.2" stroke-linecap="round" />
      <path d="${diaPath}" fill="none" stroke="#3b82f6" stroke-width="1.2" stroke-linecap="round" />

      <!-- Puntos Sistólica -->
      ${sysPoints
        .map((p) => `<circle cx="${p.x}" cy="${p.y}" r="2" fill="#ef4444" stroke="#ffffff" stroke-width="0.75" />`)
        .join('')}

      <!-- Puntos Diastólica -->
      ${diaPoints
        .map((p) => `<circle cx="${p.x}" cy="${p.y}" r="2" fill="#3b82f6" stroke="#ffffff" stroke-width="0.75" />`)
        .join('')}

      <!-- Puntos Pulsaciones (Gris) -->
      ${pulsePoints
        .map((p) => `<circle cx="${p.x}" cy="${p.y}" r="1.5" fill="#64748b" stroke="#ffffff" stroke-width="0.75" />`)
        .join('')}

      <!-- Eje X (Fechas) -->
      ${chronologicalSessions
        .map((s, i) => {
          if (chronologicalSessions.length > 10 && i % Math.ceil(chronologicalSessions.length / 8) !== 0) return '';
          const x = getX(i);
          const dateLabel = new Date(s.timestamp).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
          return `<text x="${x}" y="${height - 8}" text-anchor="middle" fill="#64748b" font-size="9">${dateLabel}</text>`;
        })
        .join('')}
    </svg>
  `;
}
