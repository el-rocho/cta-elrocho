import { useState, useEffect } from 'react';
import type { BloodPressureReading, ArmPosition, DateRange } from './types/bloodPressure';
import {
  getStoredReadings,
  addReadingToStorage,
  deleteSessionFromStorage,
  deleteReadingFromStorage,
} from './services/storageService';
import { processReadingsIntoSessions } from './utils/whiteCoatAlgorithm';
import { Header } from './components/Header';
import { ReadingForm } from './components/ReadingForm';
import { WhiteCoatBanner } from './components/WhiteCoatBanner';
import { TrendChart } from './components/TrendChart';
import { ReadingList } from './components/ReadingList';
import { ExportModal } from './components/ExportModal';

export function App() {
  const [readings, setReadings] = useState<BloodPressureReading[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<DateRange>({ preset: '30days' });

  // Cargar lecturas desde almacenamiento local al iniciar
  useEffect(() => {
    const loaded = getStoredReadings();
    setReadings(loaded);
  }, []);

  // Control de tema claro / oscuro en el documento
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

  // Procesar lecturas mediante el algoritmo de sesiones y atenuación de bata blanca
  const { sessions } = processReadingsIntoSessions(readings);

  return (
    <div className="app-container">
      {/* Encabezado Principal */}
      <Header
        onOpenExportModal={() => setIsExportModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Formulario de Entrada Rápida */}
      <ReadingForm onAddReading={handleAddReading} />

      {/* Banner Informativo de Bata Blanca */}
      <WhiteCoatBanner />

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

      {/* Modal de Exportación CSV e Impresión PDF */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        sessions={sessions}
      />
    </div>
  );
}

export default App;
