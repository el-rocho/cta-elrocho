import React from 'react';
import type { AppSettings, BackupFrequency, PatientSex } from '../types/bloodPressure';
import { Settings, X, ShieldAlert, Clock, Armchair, RotateCcw, Save, Folder, CalendarCheck, User, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetDemoData: () => void;
  onClearAllData: () => void;
  onTriggerManualBackup: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetDemoData,
  onClearAllData,
  onTriggerManualBackup,
}) => {
  if (!isOpen) return null;

  const currentWhiteCoatInterval = [3, 5, 10].includes(settings.whiteCoatIntervalMinutes)
    ? settings.whiteCoatIntervalMinutes
    : 5;

  const handlePatientNameChange = (name: string) => {
    onUpdateSettings({ ...settings, patientName: name });
  };

  const handlePatientSexChange = (sex: PatientSex) => {
    onUpdateSettings({ ...settings, patientSex: sex });
  };

  const handlePatientAgeChange = (ageStr: string) => {
    const ageVal = ageStr === '' ? '' : parseInt(ageStr, 10);
    onUpdateSettings({ ...settings, patientAge: isNaN(ageVal as number) ? '' : ageVal });
  };

  const handleToggleWhiteCoat = () => {
    onUpdateSettings({
      ...settings,
      enableWhiteCoatFilter: !settings.enableWhiteCoatFilter,
      whiteCoatIntervalMinutes: currentWhiteCoatInterval,
    });
  };

  const handleChangeInterval = (minutes: number) => {
    onUpdateSettings({
      ...settings,
      whiteCoatIntervalMinutes: minutes,
    });
  };

  const handleChangeDefaultArm = (arm: 'left' | 'right') => {
    onUpdateSettings({
      ...settings,
      defaultArm: arm,
    });
  };

  const handleChangeBackupFrequency = (freq: BackupFrequency) => {
    onUpdateSettings({
      ...settings,
      backupFrequency: freq,
    });
  };

  const lastBackupStr = settings.lastBackupTimestamp
    ? new Date(settings.lastBackupTimestamp).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Ninguna copia realizada todavía';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Settings size={26} className="modal-icon legal-icon-main" />
            <h2 className="legal-modal-title">Configuración</h2>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Opción 1: Datos del Paciente */}
          <div className="settings-section">
            <div className="field-label">
              <User size={22} className="text-blue settings-field-icon" />
              <span>Perfil del paciente:</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              <div>
                <label className="settings-desc" style={{ display: 'block', marginBottom: '4px' }}>Nombre completo:</label>
                <input
                  type="text"
                  value={settings.patientName || ''}
                  onChange={(e) => handlePatientNameChange(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="modal-input"
                  style={{ padding: '8px 10px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                {/* Sexo sin etiqueta */}
                <div className="chip-options-row">
                  <button
                    type="button"
                    className={`chip-select ${settings.patientSex === 'masculino' ? 'active' : ''}`}
                    onClick={() => handlePatientSexChange('masculino')}
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    Masculino
                  </button>
                  <button
                    type="button"
                    className={`chip-select ${settings.patientSex === 'femenino' ? 'active' : ''}`}
                    onClick={() => handlePatientSexChange('femenino')}
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    Femenino
                  </button>
                </div>

                {/* Edad en una sola fila con ancho reducido */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label className="settings-desc" style={{ margin: 0, whiteSpace: 'nowrap' }}>Edad (años):</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={settings.patientAge ?? ''}
                    onChange={(e) => handlePatientAgeChange(e.target.value)}
                    placeholder="65"
                    className="modal-input"
                    style={{ width: '70px', padding: '6px 8px', fontSize: '13px', textAlign: 'center' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Opción 2: Copias de Seguridad Automáticas CSV */}
          <div className="settings-section border-top">
            <div className="field-label">
              <Save size={22} className="text-blue settings-field-icon" />
              <span>Copias de Seguridad:</span>
            </div>
            <p className="settings-desc" style={{ marginBottom: '10px' }}>
              Frecuencia para guardar automáticamente copias CSV en el almacenamiento local.
            </p>

            <div className="chip-options-row" style={{ marginBottom: '12px' }}>
              <button
                type="button"
                className={`chip-select ${settings.backupFrequency === 'daily' ? 'active' : ''}`}
                onClick={() => handleChangeBackupFrequency('daily')}
              >
                Diarias (00:00)
              </button>
              <button
                type="button"
                className={`chip-select ${settings.backupFrequency === 'weekly' ? 'active' : ''}`}
                onClick={() => handleChangeBackupFrequency('weekly')}
              >
                Semanales
              </button>
              <button
                type="button"
                className={`chip-select ${settings.backupFrequency === 'monthly' ? 'active' : ''}`}
                onClick={() => handleChangeBackupFrequency('monthly')}
              >
                Mensuales
              </button>
              <button
                type="button"
                className={`chip-select ${settings.backupFrequency === 'disabled' ? 'active' : ''}`}
                onClick={() => handleChangeBackupFrequency('disabled')}
              >
                Desactivadas
              </button>
            </div>

            <div className="settings-subcard">
              <div className="field-label" style={{ fontSize: '12px' }}>
                <Folder size={20} className="text-blue settings-field-icon" />
                <span>Almacenamiento en dispositivo:</span>
              </div>
              <p className="settings-desc" style={{ marginTop: '4px', fontSize: '11px', lineHeight: '1.4' }}>
                Las copias de seguridad, automáticas y manuales, se guardan en la carpeta predeterminada de Descargas del dispositivo.
              </p>

              <div className="backup-meta-row" style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>
                  <CalendarCheck size={12} className="inline-icon" /> Última copia: <strong>{lastBackupStr}</strong>
                </span>
                <button type="button" className="btn-subtle-reset" onClick={onTriggerManualBackup}>
                  Descargar copia ahora
                </button>
              </div>
            </div>
          </div>

          {/* Opción 3: Filtro de Bata Blanca (On/Off) */}
          <div className="settings-section border-top">
            <div className="settings-row-header">
              <div className="settings-label-group">
                <ShieldAlert size={22} className="text-blue settings-field-icon" />
                <div>
                  <h3 style={{ fontWeight: 400 }}>Filtro Síndrome bata blanca</h3>
                  <p className="settings-desc" style={{ marginTop: '4px', lineHeight: '1.4' }}>
                    Si realiza varias mediciones continuadas distanciadas entre ellas menos del intervalo de tiempo definido, se descartarán las primeras tomas elevadas para eliminar el sesgo de ansiedad inicial, con el resto de los datos se calcula la media y se almacena como una única medición.
                  </p>
                </div>
              </div>

              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.enableWhiteCoatFilter}
                  onChange={handleToggleWhiteCoat}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {settings.enableWhiteCoatFilter && (
              <div className="settings-subcard">
                <div className="field-label">
                  <Clock size={16} />
                  <span>Intervalo máximo entre tomas consecutivas:</span>
                </div>
                <div className="chip-options-row">
                  {[3, 5, 10].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      className={`chip-select ${currentWhiteCoatInterval === mins ? 'active' : ''}`}
                      onClick={() => handleChangeInterval(mins)}
                    >
                      {mins} minutos
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Opción 4: Brazo por defecto */}
          <div className="settings-section border-top">
            <div className="field-label">
              <Armchair size={22} className="settings-field-icon" />
              <span>Brazo utilizado por defecto:</span>
            </div>
            <div className="chip-options-row">
              <button
                type="button"
                className={`chip-select ${settings.defaultArm === 'left' ? 'active' : ''}`}
                onClick={() => handleChangeDefaultArm('left')}
              >
                Brazo Izquierdo
              </button>
              <button
                type="button"
                className={`chip-select ${settings.defaultArm === 'right' ? 'active' : ''}`}
                onClick={() => handleChangeDefaultArm('right')}
              >
                Brazo Derecho
              </button>
            </div>
          </div>

          {/* Opción 5: Botones de Gestión (Demo y Eliminar Todos) en una fila sin título */}
          <div className="settings-section border-top">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                className="btn-subtle-reset"
                onClick={onResetDemoData}
                style={{ justifyContent: 'center', padding: '10px' }}
              >
                <RotateCcw size={16} />
                <span>Restaurar datos Demo</span>
              </button>

              <button
                type="button"
                className="btn-danger-reset"
                onClick={onClearAllData}
                style={{ justifyContent: 'center', padding: '10px' }}
              >
                <Trash2 size={16} />
                <span>Eliminar todos los datos</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
