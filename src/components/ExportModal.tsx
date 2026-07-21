import React, { useState } from 'react';
import type { BloodPressureSession, DateFilterPreset, DateRange } from '../types/bloodPressure';
import { exportToCSV } from '../utils/exportCsv';
import { printPDFReport } from '../utils/pdfGenerator';
import { FileSpreadsheet, Printer, X, Calendar, User } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: BloodPressureSession[];
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, sessions }) => {
  const [preset, setPreset] = useState<DateFilterPreset>('30days');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');

  if (!isOpen) return null;

  const getCurrentRange = (): DateRange => ({
    preset,
    startDate: preset === 'custom' ? startDate : undefined,
    endDate: preset === 'custom' ? endDate : undefined,
  });

  const handleExportCSV = () => {
    exportToCSV(sessions, getCurrentRange());
    onClose();
  };

  const handlePrintPDF = () => {
    printPDFReport(sessions, getCurrentRange(), patientName);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Printer size={22} className="modal-icon" />
            <h2>Exportar e Imprimir Datos</h2>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Nombre Paciente opcional para informe */}
          <div className="modal-field">
            <label className="field-label">
              <User size={15} />
              <span>Nombre del Paciente (Opcional para PDF):</span>
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Ej. Juan Pérez"
              className="modal-input"
            />
          </div>

          {/* Rango de Fechas */}
          <div className="modal-field">
            <label className="field-label">
              <Calendar size={15} />
              <span>Selecciona el Intervalo Temporal:</span>
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
                Histórico Completo
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

          {/* Acciones de exportación */}
          <div className="export-actions-container">
            <button type="button" className="btn-export-csv" onClick={handleExportCSV}>
              <FileSpreadsheet size={18} />
              <span>Descargar CSV (Excel / Calc)</span>
            </button>

            <button type="button" className="btn-export-pdf" onClick={handlePrintPDF}>
              <Printer size={18} />
              <span>Generar Informe PDF / Imprimir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
