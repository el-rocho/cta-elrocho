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
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { LegalNoticeModal } from './components/LegalNoticeModal';

export function App() {
  const [readings, setReadings] = useState<BloodPressureReading[]>(() => getStoredReadings());
  const [settings, setSettings] = useState<AppSettings>(() => getStoredSettings());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isLegalNoticeOpen, setIsLegalNoticeOpen] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<DateRange>({ preset: '30days' });
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

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
        setNotificationMsg(`✓ Copia de seguridad automática CSV guardada (${result.dateStr})`);
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
    setNotificationMsg(`✓ Se han importado ${result.addedCount} registros nuevos.`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  const handleTriggerManualBackup = () => {
    if (sessions.length === 0) {
      alert('No hay registros suficientes para exportar copia de seguridad.');
      return;
    }
    const now = new Date();
    exportToCSV(sessions, { preset: 'all' }, 'tension_arterial', {
      patientName: settings.patientName,
      patientSex: settings.patientSex,
      patientAge: settings.patientAge,
    });
    const updatedSettings = {
      ...settings,
      lastBackupTimestamp: now.toISOString(),
    };
    handleUpdateSettings(updatedSettings);
    setNotificationMsg('✓ Copia de seguridad CSV generada y descargada.');
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  const handleResetDemoData = () => {
    if (window.confirm('¿Deseas restaurar los datos de ejemplo predeterminados?')) {
      localStorage.removeItem('graphene_bp_readings_v1');
      const freshReadings = getStoredReadings();
      setReadings(freshReadings);
      setIsSettingsModalOpen(false);
      setNotificationMsg('✓ Se han restaurado los datos de ejemplo.');
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('¿Seguro que deseas ELIMINAR TODOS los datos? Esta acción borrará permanentemente todo tu historial.')) {
      clearAllStoredData();
      setReadings([]);
      setIsSettingsModalOpen(false);
      setNotificationMsg('✓ Se han eliminado todos los datos de la aplicación.');
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
    if (window.confirm('¿Seguro que deseas eliminar esta sesión de medición?')) {
      const updated = deleteSessionFromStorage(sessionToDelete.readings);
      setReadings(updated);
    }
  };

  const handleDeleteSingleReading = (readingId: string) => {
    if (window.confirm('¿Seguro que deseas eliminar esta toma individual?')) {
      const updated = deleteReadingFromStorage(readingId);
      setReadings(updated);
    }
  };

  const lastReading = readings.length > 0 ? readings[0] : null;

  return (
    <div className="app-container">
      {notificationMsg && (
        <div className="toast-notification">
          <span>{notificationMsg}</span>
          <button onClick={() => setNotificationMsg(null)}>×</button>
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
        <span>Control Tensión Arterial &copy; {new Date().getFullYear()}</span>
        <span> &bull; </span>
        <button
          type="button"
          className="btn-footer-link"
          onClick={() => setIsLegalNoticeOpen(true)}
        >
          Aviso Legal &amp; Privacidad (RGPD)
        </button>
      </footer>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        sessions={sessions}
        settings={settings}
        onImportReadings={handleImportReadings}
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
  );
}

export default App;
