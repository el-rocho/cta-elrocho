import React, { useState, useEffect } from 'react';
import { PlusCircle, Activity, Armchair, FileText, Keyboard, Sliders } from 'lucide-react';
import type { ArmPosition, AppSettings, BloodPressureReading, InputMode } from '../types/bloodPressure';
import { getHealthCategory } from '../utils/healthClassification';
import { WheelPicker } from './WheelPicker';

interface ReadingFormProps {
  onAddReading: (reading: {
    systolic: number;
    diastolic: number;
    heartRate: number;
    arm: ArmPosition;
    notes?: string;
  }) => void;
  settings: AppSettings;
  onUpdateInputMode?: (mode: InputMode) => void;
  lastReading?: BloodPressureReading | null;
}

export const ReadingForm: React.FC<ReadingFormProps> = ({
  onAddReading,
  settings,
  onUpdateInputMode,
  lastReading,
}) => {
  const [inputMode, setInputMode] = useState<InputMode>(settings.preferredInputMode || 'keyboard');

  // Inicializar los valores centrados en la última medición realizada o en valores medios por defecto (120 / 80 / 72)
  const initialSys = lastReading ? lastReading.systolic : 120;
  const initialDia = lastReading ? lastReading.diastolic : 80;
  const initialPulse = lastReading ? lastReading.heartRate : 72;

  const [systolic, setSystolic] = useState<number | ''>(initialSys);
  const [diastolic, setDiastolic] = useState<number | ''>(initialDia);
  const [heartRate, setHeartRate] = useState<number | ''>(initialPulse);
  const [arm, setArm] = useState<ArmPosition>(settings.defaultArm || 'left');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sincronizar brazo y modo de entrada predeterminado si cambia la configuración
  useEffect(() => {
    setArm(settings.defaultArm || 'left');
    if (settings.preferredInputMode) {
      setInputMode(settings.preferredInputMode);
    }
  }, [settings.defaultArm, settings.preferredInputMode]);

  // Actualizar valores iniciales cuando entra una nueva medición
  useEffect(() => {
    if (lastReading) {
      setSystolic(lastReading.systolic);
      setDiastolic(lastReading.diastolic);
      setHeartRate(lastReading.heartRate);
    }
  }, [lastReading?.id]);

  const liveSystolic = typeof systolic === 'number' ? systolic : 120;
  const liveDiastolic = typeof diastolic === 'number' ? diastolic : 80;
  const category = getHealthCategory(liveSystolic, liveDiastolic);

  // Auto-seleccionar todo el texto al tocar/enfocar un campo numérico
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleToggleInputMode = (newMode: InputMode) => {
    setInputMode(newMode);
    if (onUpdateInputMode) {
      onUpdateInputMode(newMode);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const sys = Number(systolic);
    const dia = Number(diastolic);
    const pulse = Number(heartRate);

    if (!sys || sys < 50 || sys > 260) {
      setErrorMsg('Introduce un valor de sistólica válido (50 - 260 mmHg)');
      return;
    }
    if (!dia || dia < 30 || dia > 160) {
      setErrorMsg('Introduce un valor de diastólica válido (30 - 160 mmHg)');
      return;
    }
    if (sys <= dia) {
      setErrorMsg('La tensión sistólica debe ser superior a la diastólica');
      return;
    }
    if (!pulse || pulse < 30 || pulse > 220) {
      setErrorMsg('Introduce una frecuencia cardíaca válida (30 - 220 ppm)');
      return;
    }

    onAddReading({
      systolic: sys,
      diastolic: dia,
      heartRate: pulse,
      arm,
      notes: notes.trim() ? notes.trim() : undefined,
    });

    setNotes('');
  };

  return (
    <div className="card form-card">
      <div className="form-header">
        <div className="form-title-group">
          <Activity className="icon-pulse" size={20} />
          <h2>Nueva Medición</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Conmutador discreto Modo Teclado vs Modo Ruleta Rápida */}
          <div className="input-mode-toggle">
            <button
              type="button"
              className={`btn-mode-chip ${inputMode === 'keyboard' ? 'active' : ''}`}
              onClick={() => handleToggleInputMode('keyboard')}
              title="Introducir mediante teclado numérico"
            >
              <Keyboard size={14} />
              <span>Teclado</span>
            </button>
            <button
              type="button"
              className={`btn-mode-chip ${inputMode === 'wheel' ? 'active' : ''}`}
              onClick={() => handleToggleInputMode('wheel')}
              title="Introducir mediante ruleta táctil de selección rápida"
            >
              <Sliders size={14} />
              <span>Ruleta</span>
            </button>
          </div>

          {/* Badge de clasificación en tiempo real */}
          <div
            className="live-category-badge"
            style={{ backgroundColor: category.badgeBg, color: category.badgeText }}
            title={category.description}
          >
            <span className="dot" style={{ backgroundColor: category.colorHex }}></span>
            {category.name}
          </div>
        </div>
      </div>

      {errorMsg && <div className="alert-danger">{errorMsg}</div>}

      <form onSubmit={handleSubmit} className="bp-form">
        {inputMode === 'keyboard' ? (
          /* Modo 1: Introducción mediante Teclado Numérico */
          <div className="metrics-inputs-grid">
            <div className="input-group">
              <label htmlFor="systolic-input">
                <span>Sistólica</span>
                <span className="unit">(mmHg)</span>
              </label>
              <div className="input-wrapper">
                <input
                  id="systolic-input"
                  type="number"
                  min={50}
                  max={260}
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  onFocus={handleFocus}
                  className="input-number input-sys"
                  required
                />
                <span className="input-sublabel">Máxima</span>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="diastolic-input">
                <span>Diastólica</span>
                <span className="unit">(mmHg)</span>
              </label>
              <div className="input-wrapper">
                <input
                  id="diastolic-input"
                  type="number"
                  min={30}
                  max={160}
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  onFocus={handleFocus}
                  className="input-number input-dia"
                  required
                />
                <span className="input-sublabel">Mínima</span>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="pulse-input">
                <span>Pulsaciones</span>
                <span className="unit">(ppm)</span>
              </label>
              <div className="input-wrapper">
                <input
                  id="pulse-input"
                  type="number"
                  min={30}
                  max={220}
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  onFocus={handleFocus}
                  className="input-number input-pulse"
                  required
                />
                <span className="input-sublabel">Ritmo cardíaco</span>
              </div>
            </div>
          </div>
        ) : (
          /* Modo 2: Ruleta Táctil de Selección Rápida */
          <div className="wheel-mode-container">
            <WheelPicker
              systolic={typeof systolic === 'number' ? systolic : 120}
              diastolic={typeof diastolic === 'number' ? diastolic : 80}
              heartRate={typeof heartRate === 'number' ? heartRate : 72}
              onChangeSystolic={setSystolic}
              onChangeDiastolic={setDiastolic}
              onChangeHeartRate={setHeartRate}
            />
          </div>
        )}

        {/* Zona discreta para selector de brazo y notas */}
        <div className="form-secondary-row">
          <div className="arm-selector-container">
            <label className="arm-label">
              <Armchair size={14} />
              <span>Brazo:</span>
            </label>
            <div className="arm-chips">
              <button
                type="button"
                className={`arm-chip ${arm === 'left' ? 'active' : ''}`}
                onClick={() => setArm('left')}
                title="Medición tomada en brazo izquierdo"
              >
                Izquierdo
              </button>
              <button
                type="button"
                className={`arm-chip ${arm === 'right' ? 'active' : ''}`}
                onClick={() => setArm('right')}
                title="Medición tomada en brazo derecho"
              >
                Derecho
              </button>
            </div>
          </div>

          <div className="notes-container">
            <div className="input-wrapper-notes">
              <FileText size={16} className="notes-icon" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Añadir nota opcional (ej. en ayunas, reposo, sensaciones...)"
                className="input-notes"
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn-submit-reading">
          <PlusCircle size={18} />
          <span>Guardar Registro</span>
        </button>
      </form>
    </div>
  );
};
