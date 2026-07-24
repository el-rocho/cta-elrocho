import { useState, useEffect } from 'react';
import type { BloodPressureReading, ArmPosition, DateRange, AppSettings, InputMode } from './types/bloodPressure';
import {
  getStoredReadings,
  saveStoredReadings,
  addReadingToStorage,
  deleteSessionFromStorage,
  deleteReadingFromStorage,
  getStoredSettings,
  saveStoredSettings,
  importReadingsIntoStorage,
  clearAllStoredData,
} from './services/storageService';
import { processReadingsIntoSessions } from './utils/whiteCoatAlgorithm';
import { checkAndExecuteAutoBackup } from './utils/backupScheduler';
import { exportToCSV } from './utils/exportCsv';
import { Header } from './components/Header';
import { ReadingForm } from './components/ReadingForm';
import { WhiteCoatBanner } from './components/WhiteCoatBanner';
import { TrendChart } from './components/TrendChart';
import { ReadingList } from './components/ReadingList';
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
  const [dateRange, setDateRange] = useState<DateRange>({ preset: '30days' });
  const [notificationMsg, setNotificationMsg] = useState<string | ToastNotification | null>(null);

  const { sessions } = processReadingsIntoSessions(readings, settings);

  useEffect(() => {
    saveStoredReadings(readings);
  }, [readings]);

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (sessions.length > 0) {
      const result = checkAndExecuteAutoBackup(sessions, settings, handleUpdateSettings);
      if (result.backupExecuted) {
        setNotificationMsg(getTranslation(settings.language, 'toast.autoBackup', { date: result.dateStr ?? '' }));
        setTimeout(() => setNotificationMsg(null), 6000);
      }
    }
  }, [readings.length, settings.backupFrequency]);

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
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
  };

  const handleTriggerManualBackup = () => {
    if (sessions.length === 0) {
      alert(getTranslation(settings.language, 'toast.noDataToExport'));
      return;
    }
    const now = new Date();
    exportToCSV(sessions, { preset: 'all' }, 'tension_arterial', {
      patientName: settings.patientName,
      patientSex: settings.patientSex,
      patientAge: settings.patientAge,
    }, settings.language);
    const updatedSettings = {
      ...settings,
      lastBackupTimestamp: now.toISOString(),
    };
    handleUpdateSettings(updatedSettings);
    setNotificationMsg(getTranslation(settings.language, 'toast.manualBackupSuccess'));
    setTimeout(() => setNotificationMsg(null), 5000);
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
  }) => {
    const created = addReadingToStorage({
      timestamp: new Date().toISOString(),
      systolic: data.systolic,
      diastolic: data.diastolic,
      heartRate: data.heartRate,
      arm: data.arm,
      notes: data.notes,
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

  const lastReading = readings.length > 0 ? readings[0] : null;

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
                      notificationMsg.onAction?.();
                      setNotificationMsg(null);
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
        />

        <WhiteCoatBanner settings={settings} onOpenSettings={() => setIsSettingsModalOpen(true)} />

        <TrendChart sessions={sessions} />

        <ReadingList
          sessions={sessions}
          onDeleteSession={handleDeleteSession}
          onDeleteSingleReading={handleDeleteSingleReading}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
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

        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          sessions={sessions}
          settings={settings}
          onImportReadings={handleImportReadings}
          onNotify={(msg) => setNotificationMsg(msg)}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onResetDemoData={handleResetDemoData}
          onClearAllData={handleClearAllData}
          onTriggerManualBackup={handleTriggerManualBackup}
        />

        <LegalNoticeModal
          isOpen={isLegalNoticeOpen}
          onClose={() => setIsLegalNoticeOpen(false)}
        />
      </div>
    </LanguageProvider>
  );
}

export default App;
