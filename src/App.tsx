import { useState, useEffect } from 'react';
import type { BloodPressureReading, ArmPosition, DateRange, AppSettings, InputMode } from './types/bloodPressure';
import {
  getStoredReadings,
  addReadingToStorage,
  deleteSessionFromStorage,
  deleteReadingFromStorage,
  getStoredSettings,
  saveStoredSettings,
  importReadingsIntoStorage,
  clearAllStoredData,
  DEFAULT_SETTINGS,
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
  const [readings, setReadings] = useState<BloodPressureReading[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isLegalNoticeOpen, setIsLegalNoticeOpen] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<DateRange>({ preset: '30days' });
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Cargar lecturas y configuración al iniciar
  useEffect(() => {
    const loadedReadings = getStoredReadings();
    const loadedSettings = getStoredSettings();
    setReadings(loadedReadings);
    setSettings(loadedSettings);
  }, []);

  // Procesar lecturas mediante el algoritmo de sesiones y atenuación de bata blanca
  const { sessions } = processReadingsIntoSessions(readings, settings);

  // Comprobar si corresponde ejecutar copia de seguridad automática programada
  useEffect(() => {
    if (sessions.length > 0) {
      const result = checkAndExecuteAutoBackup(sessions, settings, handleUpdateSettings);
      if (result.backupExecuted) {
        setNotificationMsg(`✓ Copia de seguridad automática CSV guardada (${result.dateStr})`);
        setTimeout(() => setNotificationMsg(null), 6000);
      }
    }
  }, [readings.length, settings.backupFrequency]);

  // Actualizar ajustes y guardar
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  const handleUpdateInputMode = (mode: InputMode) => {
    const updated = { ...settings, preferredInputMode: mode };
    handleUpdateSettings(updated);
  };

  // Importar lecturas desde CSV
  const handleImportReadings = (imported: Omit<BloodPressureReading, 'id'>[]) => {
    const result = importReadingsIntoStorage(imported);
    setReadings(result.updated);
    setNotificationMsg(`✓ Se han importado ${result.addedCount} registros nuevos desde el archivo CSV.`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Generar copia manual inmediata desde Ajustes
  const handleTriggerManualBackup = () => {
    if (sessions.length === 0) {
      alert('No hay registros suficientes para exportar copia de seguridad.');
      return;
    }
    const now = new Date();
    exportToCSV(sessions, { preset: 'all' }, 'copia_seguridad_manual', {
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

  // Restaurar datos demo
  const handleResetDemoData = () => {
    if (window.confirm('¿Deseas restaurar los registros de demostración iniciales?')) {
      localStorage.removeItem('graphene_bp_readings_v1');
      const resetReadings = getStoredReadings();
      setReadings(resetReadings);
      setIsSettingsModalOpen(false);
      setNotificationMsg('✓ Se han cargado los registros de demostración.');
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  // Eliminar absolutamente todos los datos guardados
  const handleClearAllData = () => {
    if (window.confirm('¿Seguro que deseas ELIMINAR TODOS los registros de tensión de este dispositivo? Esta acción borrará todo tu historial de forma permanente.')) {
      clearAllStoredData();
      setReadings([]);
      setIsSettingsModalOpen(false);
      setNotificationMsg('✓ Se han eliminado todos los registros guardados.');
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  // Control de tema claro / oscuro
  const handleToggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  // Agregar nueva lectura
  const handleAddReading = (data: {
    systolic: number;
    diastolic: number;
    heartRate: number;
    arm: ArmPosition;
    notes?: string;
  }) => {
    const newReading = addReadingToStorage({
      timestamp: new Date().toISOString(),
      systolic: data.systolic,
      diastolic: data.diastolic,
      heartRate: data.heartRate,
      arm: data.arm,
      notes: data.notes,
    });
    setReadings((prev) => [newReading, ...prev]);
  };

  // Eliminar una sesión completa
  const handleDeleteSession = (sessionToDelete: any) => {
    if (window.confirm('¿Seguro que deseas eliminar esta sesión de medición?')) {
      const updated = deleteSessionFromStorage(sessionToDelete.readings);
      setReadings(updated);
    }
  };

  // Eliminar una toma individual dentro de una sesión
  const handleDeleteSingleReading = (readingId: string) => {
    if (window.confirm('¿Seguro que deseas eliminar esta toma individual?')) {
      const updated = deleteReadingFromStorage(readingId);
      setReadings(updated);
    }
  };

  // Obtener la última medición realizada (cronológicamente más reciente)
  const lastReading = readings.length > 0 ? readings[0] : null;

  return (
    <div className="app-container">
      {/* Banner de Notificación / Toast */}
      {notificationMsg && (
        <div className="toast-notification">
          <span>{notificationMsg}</span>
          <button onClick={() => setNotificationMsg(null)}>×</button>
        </div>
      )}

      {/* Encabezado Principal */}
      <Header
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Formulario de Entrada Rápida (Teclado o Ruleta) */}
      <ReadingForm
        onAddReading={handleAddReading}
        settings={settings}
        onUpdateInputMode={handleUpdateInputMode}
        lastReading={lastReading}
      />

      {/* Banner Informativo de Bata Blanca */}
      <WhiteCoatBanner settings={settings} onOpenSettings={() => setIsSettingsModalOpen(true)} />

      {/* Gráfico Interactivo de Tendencias */}
      <TrendChart sessions={sessions} />

      {/* Historial de Mediciones */}
      <ReadingList
        sessions={sessions}
        onDeleteSession={handleDeleteSession}
        onDeleteSingleReading={handleDeleteSingleReading}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* Pie de página discreto con enlace de aviso legal y privacidad */}
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

      {/* Modales */}
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
