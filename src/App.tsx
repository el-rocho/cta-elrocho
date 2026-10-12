import { useState, useEffect, useMemo, useRef } from 'react';
import type { BloodPressureReading, ArmPosition, DateRange, AppSettings, InputMode, DeleteReadingOutcome } from './types/bloodPressure';
import {
  getStoredReadings,
  createDemoReadings,
  DEFAULT_SETTINGS,
  saveStoredReadings,
  addReadingToStorage,
  updateReadingInStorage,
  deleteSessionFromStorage,
  deleteReadingFromStorage,
  getStoredSettings,
  saveStoredSettings,
  importReadingsIntoStorage,
  mergeBackupReadingsIntoStorage,
  previewBackupMerge,
  type BackupMergePreview,
  replaceStoredData,
  clearAllStoredData,
} from './services/storageService';
import { processReadingsIntoSessions } from './utils/whiteCoatAlgorithm';
import { isBackupDue } from './utils/backupScheduler';
import { saveBackup, type AppBackupSnapshot } from './utils/backupService';
import { Header } from './components/Header';
import { ReadingForm } from './components/ReadingForm';
import { TrendChart } from './components/TrendChart';
import { TrendInsights } from './components/TrendInsights';
import { ReadingList } from './components/ReadingList';
import { EditReadingModal } from './components/EditReadingModal';
import { ExportModal, type ToastNotification } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { LegalNoticeModal } from './components/LegalNoticeModal';
import { LanguageProvider } from './i18n/LanguageContext';
import { getTranslation } from './i18n/translations';

export function App() {
  // Marca que la carga inicial falló: el estado en memoria es entonces un conjunto de demos
  // de reserva y nunca debe escribirse sobre los datos reales almacenados.
  const readingsLoadFailedRef = useRef(false);
  const [readings, setReadings] = useState<BloodPressureReading[]>(() => {
    try {
      return getStoredReadings();
    } catch (error) {
      console.error('Error al cargar las mediciones:', error);
      readingsLoadFailedRef.current = true;
      return createDemoReadings();
    }
  });
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      return getStoredSettings();
    } catch (error) {
      console.error('Error al cargar los ajustes:', error);
      return DEFAULT_SETTINGS;
    }
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isLegalNoticeOpen, setIsLegalNoticeOpen] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<DateRange>({ preset: '1month' });
  const [readingToEdit, setReadingToEdit] = useState<BloodPressureReading | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | ToastNotification | null>(null);
  const backupReminderKeyRef = useRef<string | null>(null);
  // El fallback demo no es un aviso transitorio: se muestra mientras siga activo, para que
  // nunca se confunda con mediciones reales (se inicializa desde el fallo de la carga inicial).
  const [isDemoFallback, setIsDemoFallback] = useState<boolean>(readingsLoadFailedRef.current);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { sessions } = useMemo(
    () => processReadingsIntoSessions(readings, settings),
    [readings, settings]
  );

  const clearNotificationTimer = () => {
    if (notificationTimerRef.current !== null) {
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
  };

  // Punto único de asignación de avisos: asignar uno nuevo cancela el autodescarte pendiente, de
  // modo que el temporizador de un aviso anterior no pueda borrar el aviso actual.
  // `delayMs` programa su autodescarte; sin él, el aviso permanece hasta que se atienda o se cierre.
  const showNotification = (msg: string | ToastNotification, delayMs?: number) => {
    clearNotificationTimer();
    setNotificationMsg(msg);
    if (delayMs === undefined) return;
    notificationTimerRef.current = setTimeout(() => {
      notificationTimerRef.current = null;
      setNotificationMsg(null);
    }, delayMs);
  };

  // Cerrar un aviso a mano cancela también su autodescarte pendiente.
  const dismissNotification = () => {
    clearNotificationTimer();
    setNotificationMsg(null);
  };

  useEffect(() => clearNotificationTimer, []);

  // El fallback demo deja de estar activo en cuanto una operación vuelve a operar sobre los
  // datos reales del almacenamiento.
  const clearReadingsFallback = () => {
    if (!readingsLoadFailedRef.current) return;
    readingsLoadFailedRef.current = false;
    setIsDemoFallback(false);
  };

  useEffect(() => {
    const showBackupReminderIfDue = () => {
      // Mientras el fallback demo esté activo, `readings` son ejemplos: recordar (u ofrecer) una
      // copia guardaría esos ejemplos como si fueran los registros reales.
      if (readingsLoadFailedRef.current) return;
      if (!isBackupDue(readings, settings)) return;
      const reminderKey = `${settings.backupFrequency}:${settings.lastFullBackupTimestamp ?? 'never'}:${new Date().toDateString()}`;
      if (backupReminderKeyRef.current === reminderKey) return;
      backupReminderKeyRef.current = reminderKey;
      showNotification({
        message: getTranslation(settings.language, 'toast.backupDue'),
        actionLabel: getTranslation(settings.language, 'toast.openBackups'),
        variant: 'soft-blue',
        onAction: () => setIsExportModalOpen(true),
      });
    };

    showBackupReminderIfDue();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') showBackupReminderIfDue();
    };
    const intervalId = window.setInterval(showBackupReminderIfDue, 60 * 60 * 1000);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [readings, settings]);

  const notifyStorageError = (error: unknown) => {
    console.error('Error de almacenamiento local:', error);
    showNotification(getTranslation(settings.language, 'toast.storageError'), 5000);
  };

  const handleUpdateSettings = (newSettings: AppSettings): boolean => {
    try {
      saveStoredSettings(newSettings);
      setSettings(newSettings);
      return true;
    } catch (error) {
      notifyStorageError(error);
      return false;
    }
  };

  const handleMedicationContextChange = (
    takesMedication: boolean,
    recalculateHistory: boolean
  ): boolean => {
    const updatedSettings = { ...settings, takesAntihypertensiveMedication: takesMedication };
    try {
      if (recalculateHistory) {
        // Si la carga inicial falló, releemos del almacenamiento en lugar de usar el estado en
        // memoria (que podría ser el conjunto de demos de reserva) para no sobrescribir datos reales.
        const sourceReadings = readingsLoadFailedRef.current ? getStoredReadings() : readings;
        const updatedReadings = sourceReadings.map((reading) => ({
          ...reading,
          takesAntihypertensiveMedication: takesMedication,
        }));
        replaceStoredData(updatedReadings, updatedSettings);
        clearReadingsFallback();
        setReadings(updatedReadings);
      } else {
        saveStoredSettings(updatedSettings);
      }
      setSettings(updatedSettings);
      return true;
    } catch (error) {
      notifyStorageError(error);
      return false;
    }
  };

  const handleUpdateInputMode = (mode: InputMode) => {
    const updated = { ...settings, preferredInputMode: mode };
    handleUpdateSettings(updated);
  };

  const handleImportReadings = (imported: Omit<BloodPressureReading, 'id'>[]) => {
    try {
      const result = importReadingsIntoStorage(imported);
      setReadings(result.updated);
      clearReadingsFallback();
      showNotification(
        getTranslation(settings.language, 'toast.importedCount', { count: result.addedCount }),
        5000
      );
      return result.addedCount;
    } catch (error) {
      notifyStorageError(error);
      throw error;
    }
  };

  const handleTriggerManualBackup = async () => {
    if (readingsLoadFailedRef.current) {
      // Con el fallback demo activo, `readings` son datos de ejemplo: guardarlos como copia "real"
      // (y fijar lastFullBackupTimestamp, silenciando el recordatorio) sería engañoso.
      showNotification(getTranslation(settings.language, 'toast.demoFallbackBackupBlocked'), 5000);
      return;
    }
    if (readings.length === 0) {
      alert(getTranslation(settings.language, 'toast.noDataToExport'));
      return;
    }
    const now = new Date();
    try {
      const result = await saveBackup(readings, settings, now);
      if (result.mode === 'native') {
        if (!result.saved) {
          showNotification(getTranslation(settings.language, 'toast.manualBackupCancelled'), 5000);
          return;
        }

        const updatedSettings = {
          ...settings,
          lastBackupTimestamp: now.toISOString(),
          lastFullBackupTimestamp: now.toISOString(),
        };
        if (!handleUpdateSettings(updatedSettings)) return;
        const downloadsFolder = settings.language === 'en' ? 'Downloads' : 'Descargas';
        showNotification({
          message: getTranslation(settings.language, 'toast.manualBackupSavedAt', { path: downloadsFolder }),
          detail: result.filename,
          variant: 'soft-blue',
        });
        return;
      }

      showNotification({
        actionLabel: getTranslation(settings.language, 'toast.confirmBackupSaved'),
        cancelLabel: getTranslation(settings.language, 'toast.backupCancelledAction'),
        variant: 'neutral',
        onAction: () => {
          const updatedSettings = {
            ...settings,
            lastBackupTimestamp: now.toISOString(),
            lastFullBackupTimestamp: now.toISOString(),
          };
          handleUpdateSettings(updatedSettings);
        },
      });
    } catch (error) {
      console.error('Error al guardar la copia:', error);
      showNotification(getTranslation(settings.language, 'toast.manualBackupError'), 5000);
    }
  };

  const handleRestoreBackup = (snapshot: AppBackupSnapshot, mode: 'merge' | 'replace', preview?: BackupMergePreview) => {
    try {
      if (mode === 'replace') {
        const restoredSettings = {
          ...snapshot.settings,
          lastBackupTimestamp: snapshot.createdAt,
          lastFullBackupTimestamp: snapshot.createdAt,
        };
        replaceStoredData(snapshot.readings, restoredSettings);
        setReadings(snapshot.readings);
        setSettings(restoredSettings);
        clearReadingsFallback();
        return snapshot.readings.length;
      }

      if (!preview) return { status: 'stale' as const };
      const result = mergeBackupReadingsIntoStorage(snapshot.readings, preview);
      if (result.status === 'applied') {
        setReadings(result.updated);
        clearReadingsFallback();
      }
      return result;
    } catch (error) {
      notifyStorageError(error);
      return { status: 'error' as const };
    }
  };

  const handleResetDemoData = () => {
    if (window.confirm(getTranslation(settings.language, 'toast.resetDemoConfirm'))) {
      try {
        const freshReadings = createDemoReadings();
        saveStoredReadings(freshReadings);
        setReadings(freshReadings);
        // El conjunto demo ya es el contenido guardado: el aviso de fallback (que afirma que los
        // datos originales siguen intactos) dejaría de ser cierto si se mantuviera.
        clearReadingsFallback();
        setIsSettingsModalOpen(false);
        showNotification(getTranslation(settings.language, 'toast.resetDemoSuccess'), 4000);
      } catch (error) {
        notifyStorageError(error);
      }
    }
  };

  const handleClearAllData = () => {
    if (window.confirm(getTranslation(settings.language, 'toast.clearAllConfirm'))) {
      try {
        clearAllStoredData();
        setReadings([]);
        clearReadingsFallback();
        setIsSettingsModalOpen(false);
        showNotification(getTranslation(settings.language, 'toast.clearAllSuccess'), 4000);
      } catch (error) {
        notifyStorageError(error);
      }
    }
  };

  const handleToggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const handleAddReading = (data: {
    systolic: number;
    diastolic: number;
    heartRate: number;
    arm: ArmPosition;
    notes?: string;
    pulsePressureWarningConfirmed?: boolean;
  }) => {
    try {
      const created = addReadingToStorage({
        timestamp: new Date().toISOString(),
        systolic: data.systolic,
        diastolic: data.diastolic,
        heartRate: data.heartRate,
        arm: data.arm,
        notes: data.notes,
        pulsePressureWarningConfirmed: data.pulsePressureWarningConfirmed,
        takesAntihypertensiveMedication: settings.takesAntihypertensiveMedication,
      });
      if (readingsLoadFailedRef.current) {
        // La carga inicial cayó al conjunto demo. En cuanto el almacenamiento vuelve a ser
        // legible, se adopta la lista real que se acaba de persistir y se retira el aviso de
        // fallback, en lugar de mezclar las demos con las mediciones reales.
        clearReadingsFallback();
        setReadings(getStoredReadings());
      } else {
        setReadings((prev) => [created, ...prev]);
      }
    } catch (error) {
      notifyStorageError(error);
      throw error;
    }
  };

  const handleDeleteSession = (sessionToDelete: any) => {
    if (window.confirm(getTranslation(settings.language, 'list.deleteSessionConfirm'))) {
      try {
        const updated = deleteSessionFromStorage(sessionToDelete.readings);
        setReadings(updated);
        clearReadingsFallback();
        return true;
      } catch (error) {
        notifyStorageError(error);
      }
    }
    return false;
  };

  // Borrado efectivo, sin confirmación: quien lo invoca ya ha confirmado (el modal muestra su
  // propia confirmación en línea, la lista usa window.confirm mediante handleDeleteSingleReading).
  const deleteReading = (readingId: string): DeleteReadingOutcome => {
    try {
      const updated = deleteReadingFromStorage(readingId);
      setReadings(updated);
      clearReadingsFallback();
      return 'deleted';
    } catch (error) {
      notifyStorageError(error);
      return 'failed';
    }
  };

  const handleDeleteSingleReading = (readingId: string): DeleteReadingOutcome => {
    if (!window.confirm(getTranslation(settings.language, 'list.deleteReadingConfirm'))) {
      // Cancelar la confirmación no es un fallo de almacenamiento.
      return 'cancelled';
    }
    return deleteReading(readingId);
  };

  const handleSaveReadingEdit = (updatedReading: BloodPressureReading) => {
    try {
      const updated = updateReadingInStorage(updatedReading);
      setReadings(updated);
      clearReadingsFallback();
      return true;
    } catch (error) {
      notifyStorageError(error);
      return false;
    }
  };

  return (
    <LanguageProvider
      language={settings.language}
      onLanguageChange={(lang) => handleUpdateSettings({ ...settings, language: lang })}
    >
      <div className="app-container">
        {isDemoFallback && (
          <div
            className="alert-danger demo-fallback-banner"
            role="alert"
            data-testid="demo-fallback-warning"
          >
            {getTranslation(settings.language, 'toast.demoFallbackWarning')}
          </div>
        )}

        {notificationMsg && (
          <div className={`toast-modal-overlay ${typeof notificationMsg === 'object' ? notificationMsg.variant ?? '' : ''}`} onClick={dismissNotification}>
            <div className={`toast-notification ${typeof notificationMsg === 'object' ? notificationMsg.variant ?? '' : ''}`} onClick={(e) => e.stopPropagation()}>
              <div className="toast-top-row">
                {(typeof notificationMsg === 'string' || notificationMsg.message) && (
                  <span className="toast-message-text">
                    {typeof notificationMsg === 'string' ? notificationMsg : notificationMsg.message}
                  </span>
                )}
                {(typeof notificationMsg === 'string' || !notificationMsg.cancelLabel) && (
                  <button
                    type="button"
                    className="toast-close-btn"
                    onClick={dismissNotification}
                    aria-label="Cerrar notificación"
                  >
                    ×
                  </button>
                )}
              </div>

              {typeof notificationMsg === 'object' && notificationMsg.detail && (
                <span className="toast-detail-text">{notificationMsg.detail}</span>
              )}

              {typeof notificationMsg === 'object' && notificationMsg.actionLabel && notificationMsg.onAction && (
                <div className="toast-bottom-row">
                  <button
                    type="button"
                    className="toast-action-btn"
                    onClick={() => {
                      dismissNotification();
                      notificationMsg.onAction?.();
                    }}
                  >
                    {notificationMsg.actionLabel}
                  </button>
                  {notificationMsg.cancelLabel && (
                    <button
                      type="button"
                      className="toast-cancel-btn"
                      onClick={dismissNotification}
                    >
                      {notificationMsg.cancelLabel}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <Header
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />

        <ReadingForm
          onAddReading={handleAddReading}
          settings={settings}
          onUpdateInputMode={handleUpdateInputMode}
          readings={readings}
        />

        <TrendChart
          sessions={sessions}
          settings={settings}
        />

        <TrendInsights
          sessions={sessions}
          guidelineProfile={settings.guidelineProfile}
          settings={settings}
        />

        <ReadingList
          sessions={sessions}
          onDeleteSession={handleDeleteSession}
          onDeleteSingleReading={handleDeleteSingleReading}
          onEditReading={(reading) => setReadingToEdit(reading)}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          settings={settings}
        />

        <footer className="app-footer">
          <span>{getTranslation(settings.language, 'header.title')}</span>
          <span> &bull; </span>
          <button
            type="button"
            className="btn-footer-link"
            onClick={() => setIsLegalNoticeOpen(true)}
          >
            {getTranslation(settings.language, 'legal.footerLink')}
          </button>
        </footer>

        <EditReadingModal
          isOpen={Boolean(readingToEdit)}
          reading={readingToEdit}
          settings={settings}
          onUpdateInputMode={handleUpdateInputMode}
          onClose={() => setReadingToEdit(null)}
          onSaveReading={handleSaveReadingEdit}
          onDeleteReading={deleteReading}
          readings={readings}
        />

        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          sessions={sessions}
          readings={readings}
          settings={settings}
          onImportReadings={handleImportReadings}
          onRestoreBackup={handleRestoreBackup}
          onPreviewBackupMerge={previewBackupMerge}
          onUpdateSettings={handleUpdateSettings}
          onTriggerManualBackup={handleTriggerManualBackup}
          isDemoFallback={isDemoFallback}
          onNotify={(msg) => showNotification(msg)}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onMedicationContextChange={handleMedicationContextChange}
          onResetDemoData={handleResetDemoData}
          onClearAllData={handleClearAllData}
        />

        <LegalNoticeModal
          isOpen={isLegalNoticeOpen}
          onClose={() => setIsLegalNoticeOpen(false)}
          guidelineProfile={settings.guidelineProfile}
        />
      </div>
    </LanguageProvider>
  );
}

export default App;
