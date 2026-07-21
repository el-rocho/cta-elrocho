import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, Info, Settings } from 'lucide-react';
import type { AppSettings } from '../types/bloodPressure';

interface WhiteCoatBannerProps {
  settings: AppSettings;
  onOpenSettings: () => void;
}

export const WhiteCoatBanner: React.FC<WhiteCoatBannerProps> = ({ settings, onOpenSettings }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isActive = settings.enableWhiteCoatFilter;

  return (
    <div className={`white-coat-banner ${!isActive ? 'banner-disabled' : ''}`}>
      <div className="banner-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="banner-title">
          <ShieldAlert className={`banner-icon ${!isActive ? 'icon-muted' : ''}`} size={18} />
          <span>
            Filtro de Síndrome de Bata Blanca:{' '}
            <strong className={isActive ? 'text-green' : 'text-muted'}>
              {isActive ? `Activo (${settings.whiteCoatIntervalMinutes} min)` : 'Inactivo'}
            </strong>
          </span>
        </div>
        <div className="banner-actions-group" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="btn-subtle-settings"
            onClick={onOpenSettings}
            title="Configurar opciones de bata blanca"
          >
            <Settings size={14} /> Configurar
          </button>
          <button
            type="button"
            className="btn-banner-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label="Más detalles"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="banner-content">
          <p>
            <Info size={14} className="inline-icon" />
            {isActive ? (
              <>
                El filtro está <strong>ACTIVADO</strong>. Si registras varias tomas en menos de {settings.whiteCoatIntervalMinutes} minutos,
                se calculará la media descartando las lecturas iniciales más altas.
              </>
            ) : (
              <>
                El filtro está <strong>DESACTIVADO</strong>. Todas las lecturas se registrarán de forma individual sin promediar ni descartar tomas elevadas.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
};
