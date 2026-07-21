import React, { useState, useEffect } from 'react';
import { PlusCircle, Activity, Armchair, FileText } from 'lucide-react';
import type { ArmPosition, AppSettings } from '../types/bloodPressure';
import { getHealthCategory } from '../utils/healthClassification';

interface ReadingFormProps {
  onAddReading: (reading: {
    systolic: number;
    diastolic: number;
    heartRate: number;
    arm: ArmPosition;
    notes?: string;
  }) => void;
  settings: AppSettings;
}

export const ReadingForm: React.FC<ReadingFormProps> = ({ onAddReading, settings }) => {
  const [systolic, setSystolic] = useState<number | ''>(120);
  const [diastolic, setDiastolic] = useState<number | ''>(80);
  const [heartRate, setHeartRate] = useState<number | ''>(72);
  const [arm, setArm] = useState<ArmPosition>(settings.defaultArm || 'left');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sincronizar brazo predeterminado si cambia la configuración
  useEffect(() => {
    setArm(settings.defaultArm || 'left');
  }, [settings.defaultArm]);

  const liveSystolic = typeof systolic === 'number' ? systolic : 120;
  const liveDiastolic = typeof diastolic === 'number' ? diastolic : 80;
  const category = getHealthCategory(liveSystolic, liveDiastolic);

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

      {errorMsg && <div className="alert-danger">{errorMsg}</div>}

      <form onSubmit={handleSubmit} className="bp-form">
        <div className="metrics-inputs-grid">
          {/* Campo Sistólica */}
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
                className="input-number input-sys"
                required
              />
              <span className="input-sublabel">Máxima</span>
            </div>
          </div>

          {/* Campo Diastólica */}
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
                className="input-number input-dia"
                required
              />
              <span className="input-sublabel">Mínima</span>
            </div>
          </div>

          {/* Campo Pulsaciones */}
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
                className="input-number input-pulse"
                required
              />
              <span className="input-sublabel">Ritmo cardíaco</span>
            </div>
          </div>
        </div>

        {/* Zona discreta para selector de brazo y notas */}
        <div className="form-secondary-row">
          {/* Selector Discreto de Brazo */}
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

          {/* Campo de Notas Libre */}
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
