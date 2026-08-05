import { useState, useEffect, useMemo, useRef } from 'react';
import type { BloodPressureReading, ArmPosition, DateRange, AppSettings, InputMode } from './types/bloodPressure';
import {
  getStoredReadings,
  saveStoredReadings,
  addReadingToStorage,
  updateReadingInStorage,
  updateMedicationContextForAllReadings,
  deleteSessionFromStorage,
  deleteReadingFromStorage,
  getStoredSettings,
  saveStoredSettings,
  importReadingsIntoStorage,
  mergeBackupReadingsIntoStorage,
  replaceStoredData,
  clearAllStoredData,
} from './services/storageService';
import {
  getSessionSummaryReading,
  processReadingsIntoSessions,
} from './utils/whiteCoatAlgorithm';
import { isBackupDue } from './utils/backupScheduler';
import { downloadBackup, type AppBackupSnapshot } from './utils/backupService';
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
  const [readings, setReadings] = useState<BloodPressureReading[]>(() => getStoredReadings());
  const [settings, setSettings] = useState<AppSettings>(() => getStoredSettings());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isLegalNoticeOpen, setIsLegalNoticeOpen] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<DateRange>({ preset: '1month' });
  const [readingToEdit, setReadingToEdit] = useState<BloodPressureReading | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | ToastNotification | null>(null);
  const backupReminderKeyRef = useRef<string | null>(null);

  const { sessions } = useMemo(
    () => processReadingsIntoSessions(readings, settings),
    [readings, settings]
  );

  useEffect(() => {
    saveStoredReadings(readings);
  }, [readings]);

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  useEffect(() => {
    const showBackupReminderIfDue = () => {
      if (!isBackupDue(readings, settings)) return;
      const reminderKey = `${settings.backupFrequency}:${settings.lastFullBackupTimestamp ?? 'never'}:${new Date().toDateString()}`;
      if (backupReminderKeyRef.current === reminderKey) return;
      backupReminderKeyRef.current = reminderKey;
      setNotificationMsg({
        message: getTranslation(settings.language, 'toast.backupDue'),
        actionLabel: getTranslation(settings.language, 'toast.openBackups'),
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

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  const handleMedicationContextChange = (
    takesMedication: boolean,
    recalculateHistory: boolean
  ): boolean => {
    if (recalculateHistory) {
      setReadings(updateMedicationContextForAllReadings(takesMedication));
    }
    setSettings({ ...settings, takesAntihypertensiveMedication: takesMedication });
    return true;
  };

  const handleUpdateInputMode = (mode: InputMode) => {
    const updated = { ...settings, preferredInputMode: mode };
    handleUpdateSettings(updated);
  };

  const handleImportReadings = (imported: Omit<BloodPressureReading, 'id'>[]) => {
    const result = importReadingsIntoStorage(imported);
    setReadings(result.updated);
    setNotificationMsg(getTranslation(settings.language, 'toast.importedCount', { count: result.addedCount }));
    setTimeout(() => setNotificationMsg(null), 5000);
    return result.addedCount;
  };

  const handleTriggerManualBackup = () => {
    if (readings.length === 0) {
      alert(getTranslation(settings.language, 'toast.noDataToExport'));
      return;
    }
    const now = new Date();
    try {
      downloadBackup(readings, settings, now);
      setNotificationMsg({
        message: getTranslation(settings.language, 'toast.manualBackupRequested'),
        actionLabel: getTranslation(settings.language, 'toast.confirmBackupSaved'),
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
      console.error('Error al solicitar la descarga de la copia:', error);
      setNotificationMsg(getTranslation(settings.language, 'toast.manualBackupError'));
      setTimeout(() => setNotificationMsg(null), 5000);
    }
  };

  const handleRestoreBackup = (snapshot: AppBackupSnapshot, mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      const restoredSettings = {
        ...snapshot.settings,
        lastBackupTimestamp: snapshot.createdAt,
        lastFullBackupTimestamp: snapshot.createdAt,
      };
      replaceStoredData(snapshot.readings, restoredSettings);
      setReadings(snapshot.readings);
      setSettings(restoredSettings);
      return snapshot.readings.length;
    }

    const result = mergeBackupReadingsIntoStorage(snapshot.readings);
    setReadings(result.updated);
    return result.addedCount;
  };

  const handleResetDemoData = () => {
    if (window.confirm(getTranslation(settings.language, 'toast.resetDemoConfirm'))) {
      localStorage.removeItem('graphene_bp_readings_v1');
      const freshReadings = getStoredReadings();
      setReadings(freshReadings);
      setIsSettingsModalOpen(false);
      setNotificationMsg(getTranslation(settings.language, 'toast.resetDemoSuccess'));
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  const handleClearAllData = () => {
    if (window.confirm(getTranslation(settings.language, 'toast.clearAllConfirm'))) {
      clearAllStoredData();
      setReadings([]);
      setIsSettingsModalOpen(false);
      setNotificationMsg(getTranslation(settings.language, 'toast.clearAllSuccess'));
      setTimeout(() => setNotificationMsg(null), 4000);
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
    setReadings((prev) => [created, ...prev]);
  };

  const handleDeleteSession = (sessionToDelete: any) => {
    if (window.confirm(getTranslation(settings.language, 'list.deleteSessionConfirm'))) {
      const updated = deleteSessionFromStorage(sessionToDelete.readings);
      setReadings(updated);
    }
  };

  const handleDeleteSingleReading = (readingId: string) => {
    if (window.confirm(getTranslation(settings.language, 'list.deleteReadingConfirm'))) {
      const updated = deleteReadingFromStorage(readingId);
      setReadings(updated);
    }
  };

  const handleSaveReadingEdit = (updatedReading: BloodPressureReading) => {
    const updated = updateReadingInStorage(updatedReading);
    setReadings(updated);
  };

  const lastReading = useMemo(
    () => (sessions.length > 0 ? getSessionSummaryReading(sessions[0]) : null),
    [sessions]
  );

  return (
    <LanguageProvider
      language={settings.language}
      onLanguageChange={(lang) => handleUpdateSettings({ ...settings, language: lang })}
    >
      <div className="app-container">
        {notificationMsg && (
          <div className="toast-modal-overlay" onClick={() => setNotificationMsg(null)}>
            <div className="toast-notification" onClick={(e) => e.stopPropagation()}>
              <div className="toast-top-row">
                <span className="toast-message-text">
                  {typeof notificationMsg === 'string' ? notificationMsg : notificationMsg.message}
                </span>
                <button
                  type="button"
                  className="toast-close-btn"
                  onClick={() => setNotificationMsg(null)}
                  aria-label="Cerrar notificación"
                >
                  ×
                </button>
              </div>

              {typeof notificationMsg === 'object' && notificationMsg.actionLabel && notificationMsg.onAction && (
                <div className="toast-bottom-row">
                  <button
                    type="button"
                    className="toast-action-btn"
                    onClick={() => {
                      setNotificationMsg(null);
                      notificationMsg.onAction?.();
                    }}
                  >
                    {notificationMsg.actionLabel}
                  </button>
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
          lastReading={lastReading}
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
          onUpdateSettings={handleUpdateSettings}
          onTriggerManualBackup={handleTriggerManualBackup}
          onNotify={(msg) => setNotificationMsg(msg)}
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
