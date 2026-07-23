import html2pdf from 'html2pdf.js';
import type { BloodPressureSession, DateRange, ExportReportOptions, LanguageOption } from '../types/bloodPressure';
import { filterSessionsByDateRange } from './exportCsv';
import { getHealthCategory } from './healthClassification';

export async function downloadPDFReport(
  sessions: BloodPressureSession[],
  dateRange: DateRange,
  options: ExportReportOptions = {},
  lang: LanguageOption = 'es'
): Promise<void> {
  const isEn = lang === 'en';
  const locale = isEn ? 'en-US' : 'es-ES';
  const filtered = filterSessionsByDateRange(sessions, dateRange);

  if (filtered.length === 0) {
    alert(isEn ? 'No blood pressure records found for selected period.' : 'No hay registros de tensión en el periodo seleccionado.');
    return;
  }

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
  const svgChartHtml = generateChartSVG(chronological, locale, isEn);

  // Calcular periodo de fechas real
  let realPeriodStr = '';
  const timestamps = filtered.map((s) => new Date(s.timestamp).getTime());
  const minT = Math.min(...timestamps);
  const maxT = Math.max(...timestamps);
  const minDStr = new Date(minT).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const maxDStr = new Date(maxT).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  realPeriodStr = minDStr === maxDStr ? minDStr : isEn ? `From ${minDStr} to ${maxDStr}` : `Del ${minDStr} al ${maxDStr}`;

  // Formatear metadatos de paciente
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

  // Crear contenedor temporal fuera de pantalla para renderizar el PDF
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // Ancho A4 estándar en píxeles
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1e293b';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  container.style.padding = '24px';
  container.style.boxSizing = 'border-box';

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px;">
      <div>
        <h1 style="margin: 0; font-size: 22px; color: #0f172a;">${isEn ? 'Blood Pressure & Pulse Clinical Report' : 'Informe de Tensión Arterial y Pulsaciones'}</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #64748b;">${patientInfoStr} | <strong>${isEn ? 'Period:' : 'Periodo:'}</strong> ${realPeriodStr}</p>
      </div>
      <div style="text-align: right; font-size: 12px; color: #64748b;">
        <p style="margin:0;">${isEn ? 'Generated:' : 'Generado:'} ${new Date().toLocaleDateString(locale)} ${new Date().toLocaleTimeString(locale)}</p>
        <p style="margin:4px 0 0 0; color:#10b981; font-weight:600;">✓ ${isEn ? 'Private Document' : 'Documento Privado'}</p>
      </div>
    </div>

    ${
      options.reportNotes
        ? `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 13px;">
        <strong>${isEn ? 'Medical Remarks:' : 'Observaciones Médico-Clínicas:'}</strong>
        <p style="margin:4px 0 0 0; font-style:italic;">"${options.reportNotes}"</p>
      </div>
    `
        : ''
    }

    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; margin-bottom: 4px;">${isEn ? 'Avg Systolic' : 'Promedio Sistólico'}</div>
        <div style="font-size: 22px; font-weight: 800; color: #0f172a;">${avgSys} <span style="font-size: 12px; font-weight: 400; color: #64748b;">mmHg</span></div>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; margin-bottom: 4px;">${isEn ? 'Avg Diastolic' : 'Promedio Diastólico'}</div>
        <div style="font-size: 22px; font-weight: 800; color: #0f172a;">${avgDia} <span style="font-size: 12px; font-weight: 400; color: #64748b;">mmHg</span></div>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; margin-bottom: 4px;">${isEn ? 'Avg Pulse' : 'Promedio Pulsaciones'}</div>
        <div style="font-size: 22px; font-weight: 800; color: #64748b;">${avgPulse} <span style="font-size: 12px; font-weight: 400; color: #64748b;">${isEn ? 'BPM' : 'ppm'}</span></div>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; margin-bottom: 4px;">${isEn ? 'Global Status' : 'Estado Global'}</div>
        <div style="font-size: 15px; color: ${avgCategory.colorHex}; font-weight: 700; padding-top: 4px;">
          ${avgCategory.name}
        </div>
      </div>
    </div>

    <!-- Gráfico vectorial del informe -->
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <span>${isEn ? 'Blood Pressure Evolution' : 'Evolución Tensión Arterial'}</span>
        <div style="display: flex; gap: 12px; font-size: 10px; font-weight: 500; color: #64748b;">
          <span style="display: flex; align-items: center; gap: 4px;"><span style="width:8px; height:8px; background:#ef4444; border-radius:50%; display:inline-block;"></span> ${isEn ? 'Systolic' : 'Sistólica'}</span>
          <span style="display: flex; align-items: center; gap: 4px;"><span style="width:8px; height:8px; background:#3b82f6; border-radius:50%; display:inline-block;"></span> ${isEn ? 'Diastolic' : 'Diastólica'}</span>
          <span style="display: flex; align-items: center; gap: 4px;"><span style="width:8px; height:8px; background:#64748b; border-radius:50%; display:inline-block;"></span> ${isEn ? 'Pulse' : 'Pulsaciones'}</span>
          <span style="display: flex; align-items: center; gap: 4px;"><span style="width:10px; height:8px; background:rgba(16, 185, 129, 0.15); border:1px solid rgba(16, 185, 129, 0.4); display:inline-block;"></span> ${isEn ? 'Healthy Range' : 'Rango Saludable'}</span>
        </div>
      </div>
      ${svgChartHtml}
    </div>

    <h3 style="font-size:15px; color:#1e293b; margin-bottom:12px;">${isEn ? `Measurement History (${total} records)` : `Historial mediciones (${total} registros)`}</h3>

    <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
      <thead>
        <tr style="background-color: #f1f5f9; color: #475569; text-align: left;">
          <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">${isEn ? 'Date & Time' : 'Fecha y Hora'}</th>
          <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">${isEn ? 'Systolic' : 'Sistólica'}</th>
          <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">${isEn ? 'Diastolic' : 'Diastólica'}</th>
          <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">${isEn ? 'Pulse' : 'Pulso'}</th>
          <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">${isEn ? 'Arm' : 'Brazo'}</th>
          <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">${isEn ? 'WHO Category' : 'Categoría OMS'}</th>
          <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">${isEn ? 'Notes / Session' : 'Notas / Sesión'}</th>
        </tr>
      </thead>
      <tbody>
        ${filtered
          .map((s, index) => {
            const d = new Date(s.timestamp);
            const dateStr = d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
            const timeStr = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
            const cat = getHealthCategory(s.averageSystolic, s.averageDiastolic, lang);
            const armLabel = s.arm === 'left' ? (isEn ? 'Left' : 'Izq') : (isEn ? 'Right' : 'Der');
            const sessionTag = s.readings.length > 1 ? (isEn ? ` (Avg of ${s.readings.length} readings)` : ` (Media de ${s.readings.length} tomas)`) : '';
            const bg = index % 2 === 0 ? '#ffffff' : '#f8fafc';

            return `
            <tr style="background-color: ${bg};">
              <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;"><strong>${dateStr}</strong> ${timeStr}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;"><strong style="font-size:13px; color:#ef4444;">${s.averageSystolic}</strong> mmHg</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;"><strong style="font-size:13px; color:#3b82f6;">${s.averageDiastolic}</strong> mmHg</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;"><strong style="font-size:12px; color:#64748b;">${s.averageHeartRate}</strong> ${isEn ? 'BPM' : 'ppm'}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${armLabel}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">
                <span style="display:inline-block; padding:2px 8px; border-radius:9999px; font-size:10px; font-weight:600; background:${cat.badgeBg}; color:${cat.badgeText};">
                  ${cat.name}
                </span>
              </td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${(s.notes || '') + sessionTag}</td>
            </tr>
          `;
          })
          .join('')}
      </tbody>
    </table>

    <div style="margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; text-align: center;">
      ${isEn ? 'Self-monitoring document generated locally and 100% privately. Does not constitute a medical diagnosis.' : 'Documento de autocontrol generado localmente de forma 100% privada. No constituye diagnóstico médico.'}
    </div>
  `;

  document.body.appendChild(container);

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const dateTimeStr = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  const filenamePrefix = isEn ? 'blood_pressure_report' : 'informe_tension_arterial';
  const filename = `${filenamePrefix}_${dateTimeStr}.pdf`;

  const opt = {
    margin: 8,
    filename: filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
    pagebreak: { mode: ['avoid-all' as const, 'css' as const, 'legacy' as const] },
  };

  try {
    await html2pdf().set(opt).from(container).save();
  } catch (error) {
    console.error('Error al generar PDF:', error);
    alert(isEn ? 'Error generating PDF report.' : 'Error al generar el informe PDF.');
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

export function printPDFReport(
  sessions: BloodPressureSession[],
  dateRange: DateRange,
  options: ExportReportOptions = {},
  lang: LanguageOption = 'es'
): void {
  downloadPDFReport(sessions, dateRange, options, lang);
}

function generateChartSVG(chronologicalSessions: BloodPressureSession[], locale = 'es-ES', isEn = false): string {
  if (chronologicalSessions.length === 0) {
    return `<p style="text-align:center; color:#94a3b8; font-size:12px;">${isEn ? 'No data to chart in this period' : 'Sin datos para graficar en este periodo'}</p>`;
  }

  const width = 720;
  const height = 180;
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
