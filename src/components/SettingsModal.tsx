import React from 'react';
import type { AppSettings } from '../types/bloodPressure';
import { Settings, X, ShieldAlert, Clock, Armchair, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetDemoData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetDemoData,
}) => {
  if (!isOpen) return null;

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
          {/* Opción 1: Filtro de Bata Blanca (On/Off) */}
          <div className="settings-section">
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

              {/* Switch ON/OFF */}
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.enableWhiteCoatFilter}
                  onChange={handleToggleWhiteCoat}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {/* Ajustes avanzados del filtro si está activado */}
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

          {/* Opción 2: Brazo por defecto */}
          <div className="settings-section">
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

          {/* Opción 3: Restaurar Datos Demo */}
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
