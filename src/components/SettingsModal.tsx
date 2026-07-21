import React from 'react';
import type { AppSettings, BackupFrequency, PatientSex } from '../types/bloodPressure';
import { Settings, X, ShieldAlert, Clock, Armchair, RotateCcw, Save, Folder, CalendarCheck, User } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetDemoData: () => void;
  onTriggerManualBackup: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetDemoData,
  onTriggerManualBackup,
}) => {
  if (!isOpen) return null;

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

  const handleChangeBackupFolder = (folder: string) => {
    onUpdateSettings({
      ...settings,
      backupFolder: folder,
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
            <Settings size={22} className="modal-icon" />
            <h2>Configuración de la Aplicación</h2>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Opción 1: Datos del Paciente */}
          <div className="settings-section">
            <div className="field-label">
              <User size={16} className="text-blue" />
              <span>Perfil del Paciente (Para informes y exportación):</span>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="settings-desc" style={{ display: 'block', marginBottom: '4px' }}>Sexo:</label>
                  <div className="chip-options-row">
                    <button
                      type="button"
                      className={`chip-select ${settings.patientSex === 'masculino' ? 'active' : ''}`}
                      onClick={() => handlePatientSexChange('masculino')}
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      Masculino
                    </button>
                    <button
                      type="button"
                      className={`chip-select ${settings.patientSex === 'femenino' ? 'active' : ''}`}
                      onClick={() => handlePatientSexChange('femenino')}
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      Femenino
                    </button>
                  </div>
                </div>

                <div>
                  <label className="settings-desc" style={{ display: 'block', marginBottom: '4px' }}>Edad (años):</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={settings.patientAge ?? ''}
                    onChange={(e) => handlePatientAgeChange(e.target.value)}
                    placeholder="Ej. 65"
                    className="modal-input"
                    style={{ padding: '6px 10px', fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Opción 2: Copias de Seguridad Automáticas CSV */}
          <div className="settings-section border-top">
            <div className="field-label">
              <Save size={16} className="text-blue" />
              <span>Copias de Seguridad Automáticas (Formato CSV):</span>
            </div>
            <p className="settings-desc" style={{ marginBottom: '10px' }}>
              Define la frecuencia para guardar de forma programada copias CSV en tu almacenamiento local.
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
                <Folder size={14} />
                <span>Carpeta o ruta de almacenamiento de la copia:</span>
              </div>
              <input
                type="text"
                value={settings.backupFolder || 'Descargas/Copias_Tension'}
                onChange={(e) => handleChangeBackupFolder(e.target.value)}
                placeholder="Ej. Descargas/Copias_Tension_Arterial"
                className="modal-input"
                style={{ fontSize: '13px', padding: '8px 10px' }}
              />

              <div className="backup-meta-row" style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>
                  <CalendarCheck size={12} className="inline-icon" /> Última copia: <strong>{lastBackupStr}</strong>
                </span>
                <button type="button" className="btn-subtle-reset" onClick={onTriggerManualBackup}>
                  Generar Copia Ahora
                </button>
              </div>
            </div>
          </div>

          {/* Opción 3: Filtro de Bata Blanca (On/Off) */}
          <div className="settings-section border-top">
            <div className="settings-row-header">
              <div className="settings-label-group">
                <ShieldAlert size={18} className="text-blue" />
                <div>
                  <h3>Filtro de Síndrome de Bata Blanca</h3>
                  <p className="settings-desc">
                    Descarta automáticamente tomas elevadas en mediciones continuas para evitar el sesgo de ansiedad inicial.
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
                  <Clock size={14} />
                  <span>Intervalo máximo de tiempo entre tomas:</span>
                </div>
                <div className="chip-options-row">
                  {[1, 2, 3, 5].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      className={`chip-select ${settings.whiteCoatIntervalMinutes === mins ? 'active' : ''}`}
                      onClick={() => handleChangeInterval(mins)}
                    >
                      {mins} {mins === 1 ? 'minuto' : 'minutos'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Opción 4: Brazo por defecto */}
          <div className="settings-section border-top">
            <div className="field-label">
              <Armchair size={16} />
              <span>Brazo utilizado por defecto en el formulario:</span>
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

          {/* Opción 5: Restaurar Datos Demo */}
          <div className="settings-section border-top">
            <div className="settings-row-header">
              <div>
                <h4 style={{ fontSize: '13px', margin: 0 }}>Restablecer Datos de Ejemplo</h4>
                <p className="settings-desc">Vuelve a cargar los datos de demostración si los has borrado.</p>
              </div>
              <button type="button" className="btn-subtle-reset" onClick={onResetDemoData}>
                <RotateCcw size={14} />
                <span>Restaurar Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
