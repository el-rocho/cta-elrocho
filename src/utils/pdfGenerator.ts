import type { BloodPressureSession, DateRange } from '../types/bloodPressure';
import { filterSessionsByDateRange } from './exportCsv';
import { getHealthCategory } from './healthClassification';

export function printPDFReport(sessions: BloodPressureSession[], dateRange: DateRange, patientName = ''): void {
  const filtered = filterSessionsByDateRange(sessions, dateRange);

  // Calcular estadísticas para el resumen
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

  // Crear ventana o contenedor de impresión
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
          margin-bottom: 24px;
        }
        .header-title {
          margin: 0;
          font-size: 24px;
          color: #0f172a;
          font-weight: 700;
        }
        .header-subtitle {
          margin: 4px 0 0 0;
          font-size: 14px;
          color: #64748b;
        }
        .header-meta {
          text-align: right;
          font-size: 13px;
          color: #475569;
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
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          font-size: 13px;
        }
        th, td {
          padding: 8px 12px;
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
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
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
          <h1 class="header-title">Informe de Tensión Arterial</h1>
          <p class="header-subtitle">${patientName ? 'Paciente: ' + patientName + ' | ' : ''}Periodo: ${dateRangeLabel}</p>
        </div>
        <div class="header-meta">
          <p style="margin:0;">Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}</p>
          <p style="margin:4px 0 0 0; color:#10b981; font-weight:600;">✓ Documento Offline Privado</p>
        </div>
      </div>

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
          <div class="summary-card-value">${avgPulse} <span class="summary-card-unit">ppm</span></div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Estado Global</div>
          <div class="summary-card-value" style="font-size:16px; color:${avgCategory.colorHex}; font-weight:700; padding-top:4px;">
            ${avgCategory.name}
          </div>
        </div>
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
                <td><strong style="font-size:14px;">${s.averageSystolic}</strong> mmHg</td>
                <td><strong style="font-size:14px;">${s.averageDiastolic}</strong> mmHg</td>
                <td>${s.averageHeartRate} ppm</td>
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
