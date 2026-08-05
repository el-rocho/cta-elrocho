import React, { useState } from 'react';
import type {
  AppSettings,
  BackupFrequency,
  BloodPressureReading,
  BloodPressureSession,
  DateFilterPreset,
  DateRange,
  ExportReportOptions,
} from '../types/bloodPressure';
import { exportToCSV } from '../utils/exportCsv';
import { downloadPDFReport } from '../utils/pdfGenerator';
import { analyzeCSVDateOverlap, analyzeCSVImport, type CSVImportResult } from '../utils/importCsv';
import { parseBackupContent, type AppBackupSnapshot } from '../utils/backupService';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock3,
  DatabaseBackup,
  FileSpreadsheet,
  FileText,
  Printer,
  Upload,
  User,
  X,
} from 'lucide-react';
import { useLanguage } from '../i18n/useLanguage';
import { Share } from '@capacitor/share';

export interface ToastNotification {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

type DataTab = 'backup' | 'import' | 'report';
type PendingImport =
  | { kind: 'backup'; snapshot: AppBackupSnapshot }
  | { kind: 'csv'; result: CSVImportResult };

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: BloodPressureSession[];
  readings: BloodPressureReading[];
  settings: AppSettings;
  onImportReadings: (readings: Omit<BloodPressureReading, 'id'>[]) => number | Promise<number>;
  onRestoreBackup: (snapshot: AppBackupSnapshot, mode: 'merge' | 'replace') => number | Promise<number>;
  onUpdateSettings: (settings: AppSettings) => void;
  onTriggerManualBackup: () => void;
  onNotify?: (toast: string | ToastNotification) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  sessions,
  readings,
  settings,
  onImportReadings,
  onRestoreBackup,
  onUpdateSettings,
  onTriggerManualBackup,
  onNotify,
}) => {
  const { t, language } = useLanguage();
  const [preset, setPreset] = useState<DateFilterPreset>('1month');
  const [reportNotes, setReportNotes] = useState('');
  const [hidePatientData, setHidePatientData] = useState(false);
  const [activeTab, setActiveTab] = useState<DataTab>('backup');
  const [importStatus, setImportStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const backupFileInputRef = React.useRef<HTMLInputElement>(null);
  const csvFileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) return;

    setImportStatus(null);
    setPendingImport(null);
    if (backupFileInputRef.current) backupFileInputRef.current.value = '';
    if (csvFileInputRef.current) csvFileInputRef.current.value = '';
  }, [isOpen]);

  if (!isOpen) return null;

  const locale = language === 'en' ? 'en-US' : 'es-ES';
  const lastBackup = settings.lastFullBackupTimestamp
    ? new Date(settings.lastFullBackupTimestamp).toLocaleString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : t('data.backupNever');
  const csvDateOverlap = pendingImport?.kind === 'csv'
    ? analyzeCSVDateOverlap(pendingImport.result.readings, readings)
    : { overlappingDateCount: 0, overlappingReadingCount: 0 };

  const getCurrentRange = (): DateRange => ({ preset });
  const getExportOptions = (): ExportReportOptions => ({
    patientName: settings.patientName,
    patientSex: settings.patientSex,
    patientAge: settings.patientAge,
    patientBirthDate: settings.patientBirthDate,
    takesAntihypertensiveMedication: settings.takesAntihypertensiveMedication,
    guidelineProfile: settings.guidelineProfile,
    treatmentTargetMode: settings.treatmentTargetMode,
    customTargetSystolicMin: settings.customTargetSystolicMin,
    customTargetSystolicMax: settings.customTargetSystolicMax,
    customTargetDiastolicMin: settings.customTargetDiastolicMin,
    customTargetDiastolicMax: settings.customTargetDiastolicMax,
    reportNotes: reportNotes.trim() || undefined,
    hidePatientData,
  });

  const handleBackupFrequency = (backupFrequency: BackupFrequency) => {
    onUpdateSettings({ ...settings, backupFrequency });
  };

  const handleExportCSV = () => {
    exportToCSV(sessions, getCurrentRange(), 'tension_arterial_informe', getExportOptions(), language);
    onClose();
    onNotify?.(t('toast.csvReportSuccess'));
  };

  const handlePrintPDF = async () => {
    onClose();
    onNotify?.(t('toast.pdfDownloadStarting'));
    const result = await downloadPDFReport(sessions, getCurrentRange(), getExportOptions(), language);
    if (!result.success || !onNotify) return;

    onNotify({
      message: t('toast.pdfDownloadSuccess'),
      actionLabel: language === 'en' ? 'View / Share' : 'Ver / Compartir',
      onAction: async () => {
        if (result.isNative && result.fileUri) {
          try {
            await Share.share({
              title: result.filename,
              text: language === 'en' ? 'Home Blood Pressure Report' : 'Informe Tensión Arterial domiciliaria',
              url: result.fileUri,
              dialogTitle: language === 'en' ? 'Open or Share PDF' : 'Abrir o Compartir PDF',
            });
          } catch (error) {
            console.error('Error al abrir/compartir archivo en Android:', error);
          }
        } else if (result.blobUrl) {
          const win = window.open(result.blobUrl, '_blank');
          if (!win) window.location.href = result.blobUrl;
        }
      },
    });
  };

  const handleFileChange = (
    expectedType: 'backup' | 'csv',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportStatus(null);
    setPendingImport(null);
    const inputRef = expectedType === 'backup' ? backupFileInputRef : csvFileInputRef;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const content = loadEvent.target?.result;
      if (typeof content !== 'string') return;

      if (expectedType === 'backup') {
        const backupResult = parseBackupContent(content);
        if (backupResult.status === 'valid') {
          setPendingImport({ kind: 'backup', snapshot: backupResult.snapshot });
        } else {
          setImportStatus({
            kind: 'error',
            message: backupResult.status === 'invalid' && backupResult.reason === 'unsupported-version'
              ? t('data.backupUnsupported')
              : t('data.backupInvalid'),
          });
        }
      } else {
        const result = analyzeCSVImport(content, { defaultArm: settings.defaultArm });
        if (result.format === 'unknown' || result.readings.length === 0) {
          setImportStatus({ kind: 'error', message: t('export.importNoValidReadings') });
        } else {
          setPendingImport({ kind: 'csv', result });
        }
      }
      if (inputRef.current) inputRef.current.value = '';
    };
    reader.onerror = () => {
      setImportStatus({ kind: 'error', message: t('export.importReadError') });
      if (inputRef.current) inputRef.current.value = '';
    };
    reader.readAsText(file, 'UTF-8');
  };

  const confirmCSVImport = async () => {
    if (!pendingImport || pendingImport.kind !== 'csv') return;
    if (
      csvDateOverlap.overlappingDateCount > 0 &&
      !window.confirm(t('data.csvOverlapConfirm', {
        dates: csvDateOverlap.overlappingDateCount,
        readings: csvDateOverlap.overlappingReadingCount,
      }))
    ) return;
    const addedCount = await onImportReadings(pendingImport.result.readings);
    setImportStatus({ kind: 'success', message: t('toast.importedCount', { count: addedCount }) });
    setPendingImport(null);
  };

  const confirmBackupRestore = async (mode: 'merge' | 'replace') => {
    if (!pendingImport || pendingImport.kind !== 'backup') return;
    if (mode === 'replace' && !window.confirm(t('data.replaceConfirm'))) return;
    const restoredCount = await onRestoreBackup(pendingImport.snapshot, mode);
    setImportStatus({
      kind: 'success',
      message: mode === 'replace'
        ? t('data.restoreReplaceSuccess', { count: restoredCount })
        : t('data.restoreMergeSuccess', { count: restoredCount }),
    });
    setPendingImport(null);
  };

  const openBackupFilePicker = () => backupFileInputRef.current?.click();
  const openCSVFilePicker = () => csvFileInputRef.current?.click();
  const changeTab = (tab: DataTab) => {
    setActiveTab(tab);
    setPendingImport(null);
    setImportStatus(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content data-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <DatabaseBackup size={26} className="modal-icon legal-icon-main" />
            <h2 className="legal-modal-title">{t('data.title')}</h2>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label={t('settings.close')}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-tabs data-tabs">
          {(['backup', 'import', 'report'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`modal-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => changeTab(tab)}
            >
              {t(`data.tab.${tab}`)}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {activeTab === 'backup' && (
            <div className="data-panel">
              <section className="backup-action-card">
                <div className="backup-action-heading">
                  <DatabaseBackup size={24} />
                  <div>
                    <h3>{t('data.createBackupTitle')}</h3>
                    <p>{t('data.createBackupDescription')}</p>
                  </div>
                </div>

                <div className="backup-status-grid">
                  <div className="backup-status-item">
                    <span>{t('data.readingsStored')}</span>
                    <strong>{readings.length}</strong>
                  </div>
                  <div className="backup-status-item">
                    <span>{t('data.lastBackup')}</span>
                    <strong>{lastBackup}</strong>
                  </div>
                </div>

                <button type="button" className="btn-create-backup" onClick={onTriggerManualBackup} disabled={readings.length === 0}>
                  <DatabaseBackup size={20} />
                  {t('data.createBackupNow')}
                </button>

                <div className="modal-field backup-schedule-card">
                  <label className="field-label">
                    <Clock3 size={20} className="export-field-icon" />
                    <span>{t('data.scheduleTitle')}</span>
                  </label>
                  <div className="chip-options-row">
                    {(['disabled', 'daily', 'weekly', 'monthly'] as const).map((frequency) => (
                      <button
                        key={frequency}
                        type="button"
                        className={`chip-select ${settings.backupFrequency === frequency ? 'active' : ''}`}
                        onClick={() => handleBackupFrequency(frequency)}
                      >
                        {t(`data.frequency.${frequency}`)}
                      </button>
                    ))}
                  </div>
                  <div className="data-caveat">
                    <AlertCircle size={17} />
                    <span>{t('data.scheduleNotice')}</span>
                  </div>
                </div>
              </section>

              <section className="backup-action-card restore-backup-card">
                <div className="backup-action-heading">
                  <Upload size={24} />
                  <div>
                    <h3>{t('data.restoreBackupTitle')}</h3>
                    <p>{t('data.restoreBackupDescription')}</p>
                  </div>
                </div>

                <button type="button" className="btn-select-backup" onClick={openBackupFilePicker}>
                  <Upload size={20} />
                  {t('data.selectBackupFile')}
                </button>
                <input
                  type="file"
                  ref={backupFileInputRef}
                  accept=".json,.cta-backup.json,application/json"
                  onChange={(event) => handleFileChange('backup', event)}
                  style={{ display: 'none' }}
                />
              </section>

              {pendingImport?.kind === 'backup' && (
                <div className="import-preview-card backup-restore-preview">
                  <div className="import-preview-heading">
                    <DatabaseBackup size={21} />
                    <div>
                      <h3>{t('export.importPreviewTitle')}</h3>
                      <p>{t('data.nativeBackupDetected')}</p>
                    </div>
                  </div>
                  <div className="import-summary-grid backup-preview-grid">
                    <div className="import-summary-item">
                      <strong>{pendingImport.snapshot.readings.length}</strong>
                      <span>{t('export.importReadingsReady')}</span>
                    </div>
                    <div className="import-summary-item">
                      <strong>{new Date(pendingImport.snapshot.createdAt).toLocaleDateString(locale)}</strong>
                      <span>{t('data.backupCreatedAt')}</span>
                    </div>
                  </div>
                  <div className="import-preview-note">
                    <CheckCircle2 size={17} />
                    <span>{t('data.nativeBackupNotice')}</span>
                  </div>
                  <div className="import-preview-actions restore-actions">
                    <button type="button" className="btn-import-confirm" onClick={() => confirmBackupRestore('merge')}>
                      <CheckCircle2 size={18} />
                      {t('data.mergeBackup')}
                    </button>
                    <button type="button" className="btn-replace-data" onClick={() => confirmBackupRestore('replace')}>
                      {t('data.replaceData')}
                    </button>
                    <button type="button" className="btn-import-reselect" onClick={openBackupFilePicker}>
                      {t('data.selectAnotherFile')}
                    </button>
                  </div>
                </div>
              )}

              {importStatus && (
                <div className={`import-status-box ${importStatus.kind}`}>
                  {importStatus.kind === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{importStatus.message}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="import-tab-content data-panel">
              <div className="import-dropzone" onClick={openCSVFilePicker}>
                <Upload size={32} className="dropzone-icon" />
                <h3>{t('data.selectCsvFile')}</h3>
                <p className="dropzone-sub">{t('data.csvImportDescription')}</p>
                <input
                  type="file"
                  ref={csvFileInputRef}
                  accept=".csv,text/csv"
                  onChange={(event) => handleFileChange('csv', event)}
                  style={{ display: 'none' }}
                />
              </div>

              {pendingImport?.kind === 'csv' && (
                <div className="import-preview-card">
                  <div className="import-preview-heading">
                    <FileSpreadsheet size={21} />
                    <div>
                      <h3>{t('export.importPreviewTitle')}</h3>
                      <p>
                        {pendingImport.result.format === 'mytherapy'
                          ? t('export.importFormatMyTherapy')
                          : pendingImport.result.nativeSource === 'current-report'
                            ? t('data.nativeCsvReportDetected')
                            : t('data.historicalCsvDetected')}
                      </p>
                    </div>
                  </div>
                  {pendingImport.result.format === 'native' ? (
                    <div className="import-summary-grid">
                      <div className="import-summary-item">
                        <strong>{pendingImport.result.readings.length}</strong>
                        <span>{t('data.csvResultsReady')}</span>
                      </div>
                      <div className="import-summary-item">
                        <strong>{pendingImport.result.reportedMultiReadingSessions}</strong>
                        <span>{t('data.csvMultiSessionResults')}</span>
                      </div>
                      {pendingImport.result.reportedSourceReadings > 0 && (
                        <div className="import-summary-item">
                          <strong>{pendingImport.result.reportedSourceReadings}</strong>
                          <span>{t('data.csvSourceReadings')}</span>
                        </div>
                      )}
                      {pendingImport.result.reportedSourceReadings > 0 && (
                        <div className="import-summary-item">
                          <strong>{pendingImport.result.reportedDiscardedReadings}</strong>
                          <span>{t('data.csvDiscardedReadings')}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="import-summary-grid">
                      <div className="import-summary-item">
                        <strong>{pendingImport.result.readings.length}</strong>
                        <span>{t('export.importReadingsReady')}</span>
                      </div>
                      <div className="import-summary-item">
                        <strong>{pendingImport.result.ignoredRows}</strong>
                        <span>{t('export.importRowsIgnored')}</span>
                      </div>
                      <div className="import-summary-item">
                        <strong>{pendingImport.result.shorthandNormalized}</strong>
                        <span>{t('export.importShorthandNormalized')}</span>
                      </div>
                      <div className="import-summary-item">
                        <strong>{pendingImport.result.invalidReadings}</strong>
                        <span>{t('export.importInvalidReadings')}</span>
                      </div>
                    </div>
                  )}

                  {csvDateOverlap.overlappingDateCount > 0 && (
                    <div className="import-preview-note danger">
                      <AlertCircle size={17} />
                      <div>
                        <strong>{t('data.csvOverlapWarningTitle')}</strong>
                        <span>{t('data.csvOverlapWarning', {
                          dates: csvDateOverlap.overlappingDateCount,
                          readings: csvDateOverlap.overlappingReadingCount,
                        })}</span>
                      </div>
                    </div>
                  )}
                  {pendingImport.result.format === 'native' && (
                    <div className="import-preview-note warning">
                      <AlertCircle size={17} />
                      <span>{t('data.csvRecoveryNotice')}</span>
                    </div>
                  )}
                  {pendingImport.result.format === 'native' && pendingImport.result.reportedMultiReadingSessions > 0 && (
                    <div className="import-preview-note warning">
                      <AlertCircle size={17} />
                      <span>{t('data.csvSessionLossNotice', {
                        count: pendingImport.result.reportedMultiReadingSessions,
                        readings: pendingImport.result.reportedSourceReadings,
                        discarded: pendingImport.result.reportedDiscardedReadings,
                      })}</span>
                    </div>
                  )}
                  {pendingImport.result.format === 'mytherapy' && (
                    <div className="import-preview-note">
                      <AlertCircle size={17} />
                      <span>{t('export.importMyTherapyNotice', {
                        arm: settings.defaultArm === 'right' ? t('form.armRight') : t('form.armLeft'),
                      })}</span>
                    </div>
                  )}
                  {pendingImport.result.shorthandNormalized > 0 && (
                    <div className="import-preview-note warning">
                      <AlertCircle size={17} />
                      <span>{t('export.importShorthandNotice', { count: pendingImport.result.shorthandNormalized })}</span>
                    </div>
                  )}
                  {pendingImport.result.incompleteGroups > 0 && (
                    <div className="import-preview-note warning">
                      <AlertCircle size={17} />
                      <span>{t('export.importIncompleteNotice', { count: pendingImport.result.incompleteGroups })}</span>
                    </div>
                  )}
                  <div className="import-preview-actions">
                    <button type="button" className="btn-import-confirm" onClick={confirmCSVImport}>
                      <CheckCircle2 size={18} />
                      {pendingImport.result.format === 'native'
                        ? t('data.recoverCsvResults')
                        : t('export.confirmImport')}
                    </button>
                    <button type="button" className="btn-import-reselect" onClick={openCSVFilePicker}>
                      {t('data.selectAnotherFile')}
                    </button>
                  </div>
                </div>
              )}

              {importStatus && (
                <div className={`import-status-box ${importStatus.kind}`}>
                  {importStatus.kind === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{importStatus.message}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'report' && (
            <div className="data-panel">
              <div className="modal-field export-patient-card">
                <div className="field-label" style={{ margin: 0 }}>
                  <User size={20} className="export-field-icon" />
                  <span>
                    {t('data.patientLabel')}{' '}
                    <span style={{ fontWeight: 400 }}>{settings.patientName || t('data.unnamedPatient')}</span>
                  </span>
                </div>
                <label className="export-privacy-toggle">
                  <input type="checkbox" checked={hidePatientData} onChange={(event) => setHidePatientData(event.target.checked)} />
                  <span>{t('export.hidePatientData')}</span>
                </label>
              </div>

              <div className="modal-field">
                <label className="field-label">
                  <Calendar size={20} className="export-field-icon" />
                  <span>{t('export.filterRangeLabel')}</span>
                </label>
                <div className="range-options-grid">
                  {(['7days', '1month', '3months', 'all'] as const).map((rangePreset) => (
                    <button
                      key={rangePreset}
                      type="button"
                      className={`range-option ${preset === rangePreset ? 'selected' : ''}`}
                      onClick={() => setPreset(rangePreset)}
                    >
                      {t(`list.preset${rangePreset === 'all' ? 'All' : rangePreset === '7days' ? '7Days' : rangePreset === '1month' ? '1Month' : '3Months'}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-field">
                <label className="field-label">
                  <FileText size={20} className="export-field-icon" />
                  <span>{t('export.clinicalNotesLabel')}</span>
                </label>
                <textarea
                  value={reportNotes}
                  onChange={(event) => setReportNotes(event.target.value)}
                  placeholder={t('export.clinicalNotesPlaceholder')}
                  className="modal-input"
                  rows={2}
                />
              </div>

              <div className="data-caveat report-caveat">
                <AlertCircle size={17} />
                <div className="report-caveat-copy">
                  <p>{t('data.reportCsvNotice')}</p>
                  <p>{t('data.reportCsvRecoveryNotice')}</p>
                </div>
              </div>
              <div className="export-actions-container">
                <button type="button" className="btn-export-csv" onClick={handleExportCSV}>
                  <FileSpreadsheet size={20} />
                  <span>{t('data.downloadCsvReport')}</span>
                </button>
                <button type="button" className="btn-export-pdf" onClick={handlePrintPDF}>
                  <Printer size={22} />
                  <span>{t('export.downloadPdf')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
