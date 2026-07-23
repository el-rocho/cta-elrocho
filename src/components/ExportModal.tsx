import React, { useState } from 'react';
import type { BloodPressureSession, DateFilterPreset, DateRange, BloodPressureReading, AppSettings, ExportReportOptions } from '../types/bloodPressure';
import { exportToCSV } from '../utils/exportCsv';
import { printPDFReport } from '../utils/pdfGenerator';
import { parseCSVData } from '../utils/importCsv';
import { FileSpreadsheet, Printer, X, Calendar, User, Upload, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: BloodPressureSession[];
  settings: AppSettings;
  onImportReadings: (readings: Omit<BloodPressureReading, 'id'>[]) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  sessions,
  settings,
  onImportReadings,
}) => {
  const [preset, setPreset] = useState<DateFilterPreset>('30days');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reportNotes, setReportNotes] = useState<string>('');
  const [hidePatientData, setHidePatientData] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const getCurrentRange = (): DateRange => ({
    preset,
    startDate: preset === 'custom' ? startDate : undefined,
    endDate: preset === 'custom' ? endDate : undefined,
  });

  const getExportOptions = (): ExportReportOptions => ({
    patientName: settings.patientName,
    patientSex: settings.patientSex,
    patientAge: settings.patientAge,
    reportNotes: reportNotes.trim() ? reportNotes.trim() : undefined,
    hidePatientData,
  });

  const handleExportCSV = () => {
    exportToCSV(sessions, getCurrentRange(), 'tension_arterial', getExportOptions());
    onClose();
  };

  const handlePrintPDF = () => {
    printPDFReport(sessions, getCurrentRange(), getExportOptions());
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseCSVData(text);
        if (parsed.length === 0) {
          setImportStatus('No se encontraron registros de tensión válidos en el archivo CSV.');
        } else {
          onImportReadings(parsed);
          setImportStatus(`¡Éxito! Se han procesado e importado ${parsed.length} registros.`);
        }
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Printer size={26} className="modal-icon legal-icon-main" />
            <h2 className="legal-modal-title">Gestión de Datos</h2>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* Pestañas Exportar / Importar */}
        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            Exportar
          </button>
          <button
            type="button"
            className={`modal-tab ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            Importar
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'export' ? (
            <>
              {/* Resumen del perfil de paciente */}
              <div className="modal-field export-patient-card">
                <div className="field-label" style={{ margin: 0 }}>
                  <User size={20} className="export-field-icon" />
                  <span>
                    Paciente:{' '}
                    <span style={{ fontWeight: 400 }}>
                      {settings.patientName || 'Sin nombre'}
                    </span>
                  </span>
                </div>

                {/* Interruptor para Ocultar datos del paciente */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={hidePatientData}
                    onChange={(e) => setHidePatientData(e.target.checked)}
                  />
                  <span>Ocultar datos en informe</span>
                </label>
              </div>

              {/* Rango de Fechas */}
              <div className="modal-field">
                <label className="field-label">
                  <Calendar size={20} className="export-field-icon" />
                  <span>Selecciona intervalo temporal:</span>
                </label>

                <div className="range-options-grid">
                  <button
                    type="button"
                    className={`range-option ${preset === '7days' ? 'selected' : ''}`}
                    onClick={() => setPreset('7days')}
                  >
                    Últimos 7 días
                  </button>
                  <button
                    type="button"
                    className={`range-option ${preset === '30days' ? 'selected' : ''}`}
                    onClick={() => setPreset('30days')}
                  >
                    Últimos 30 días
                  </button>
                  <button
                    type="button"
                    className={`range-option ${preset === '90days' ? 'selected' : ''}`}
                    onClick={() => setPreset('90days')}
                  >
                    Últimos 90 días
                  </button>
                  <button
                    type="button"
                    className={`range-option ${preset === 'all' ? 'selected' : ''}`}
                    onClick={() => setPreset('all')}
                  >
                    Completo
                  </button>
                  <button
                    type="button"
                    className={`range-option ${preset === 'custom' ? 'selected' : ''}`}
                    onClick={() => setPreset('custom')}
                  >
                    Personalizado
                  </button>
                </div>
              </div>

              {/* Campos de Fecha Personalizada */}
              {preset === 'custom' && (
                <div className="custom-date-inputs">
                  <div className="date-input-group">
                    <label>Desde:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="modal-input-date"
                    />
                  </div>
                  <div className="date-input-group">
                    <label>Hasta:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="modal-input-date"
                    />
                  </div>
                </div>
              )}

              {/* Campo opcional de Observaciones / Nota del informe */}
              <div className="modal-field">
                <label className="field-label">
                  <FileText size={20} className="export-field-icon" />
                  <span>Nota del Informe (Opcional):</span>
                </label>
                <textarea
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="En tratamiento con hipertensivo"
                  className="modal-input"
                  rows={2}
                  style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '13px' }}
                />
              </div>

              {/* Acciones de exportación */}
              <div className="export-actions-container">
                <button type="button" className="btn-export-csv" onClick={handleExportCSV}>
                  <FileSpreadsheet size={20} />
                  <span>Descargar CSV</span>
                </button>

                <button type="button" className="btn-export-pdf" onClick={handlePrintPDF}>
                  <Printer size={22} />
                  <span>Informe PDF</span>
                </button>
              </div>
            </>
          ) : (
            /* Pestaña Importar CSV */
            <div className="import-tab-content">
              <div className="import-dropzone" onClick={() => fileInputRef.current?.click()}>
                <Upload size={32} className="dropzone-icon" />
                <h3>Haz clic para seleccionar tu archivo CSV</h3>
                <p className="dropzone-sub">
                  Admite copias de seguridad de la aplicación y formatos CSV estándar (delimitados por ; o ,)
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              {importStatus && (
                <div className={`import-status-box ${importStatus.includes('¡Éxito!') ? 'success' : 'error'}`}>
                  {importStatus.includes('¡Éxito!') ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{importStatus}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
