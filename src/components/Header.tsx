import React from 'react';
import { Activity, ShieldCheck, Download, Moon, Sun, Settings } from 'lucide-react';

interface HeaderProps {
  onOpenExportModal: () => void;
  onOpenSettingsModal: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenExportModal,
  onOpenSettingsModal,
  isDarkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-logo">
          <Activity size={24} className="pulse-icon" />
        </div>
        <div>
          <h1 className="brand-title">Control Tensión Arterial</h1>
          <div className="brand-badge">
            <ShieldCheck size={13} className="shield-icon" />
            <span>Privado & Offline</span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button
          onClick={onToggleDarkMode}
          className="btn-icon"
          title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={onOpenSettingsModal}
          className="btn-icon"
          title="Configuración de la aplicación"
        >
          <Settings size={18} />
        </button>

        <button onClick={onOpenExportModal} className="btn-primary-gradient">
          <Download size={16} />
          <span>Exportar / Imprimir</span>
        </button>
      </div>
    </header>
  );
};
