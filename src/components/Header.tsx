import React from 'react';
import { ShieldCheck, Download, Moon, Sun, Settings } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

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
  const { t } = useLanguage();
  const appVersion = import.meta.env.VITE_APP_VERSION || 'v1.4.1';

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-logo">
          <img
            src={isDarkMode ? './logo-night.png' : './logo-day.png'}
            alt={t('header.title')}
            className="brand-logo-img"
          />
        </div>
        <div>
          <h1 className="brand-title">{t('header.title')}</h1>
          <div className="brand-badge">
            <ShieldCheck size={13} className="shield-icon" />
            <span>Privado &amp; Offline &bull; {appVersion}</span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button
          onClick={onToggleDarkMode}
          className="btn-icon"
          title={isDarkMode ? t('header.lightMode') : t('header.darkMode')}
        >
          {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
        </button>

        <button
          onClick={onOpenSettingsModal}
          className="btn-icon"
          title={t('header.settingsTooltip')}
        >
          <Settings size={22} />
        </button>

        <button onClick={onOpenExportModal} className="btn-primary-gradient">
          <Download size={16} />
          <span>Exportar / Imprimir</span>
        </button>
      </div>
    </header>
  );
};
