import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, Info } from 'lucide-react';

export const WhiteCoatBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="white-coat-banner">
      <div className="banner-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="banner-title">
          <ShieldAlert className="banner-icon" size={18} />
          <span>Filtro de Síndrome de Bata Blanca Activo</span>
        </div>
        <button type="button" className="btn-banner-toggle" aria-label="Más detalles">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div className="banner-content">
          <p>
            <Info size={14} className="inline-icon" />
            Muchas personas experimentan elevaciones temporales de tensión arterial en las primeras tomas por adaptación
            o ligera ansiedad.
          </p>
          <p>
            <strong>¿Cómo funciona el algoritmo?</strong> Si registras varias mediciones en un intervalo inferior a 3 minutos:
          </p>
          <ul>
            <li>La aplicación agrupa las tomas en una única <strong>Sesión de Medición</strong>.</li>
            <li>Calcula la media de la sesión <strong>descartando la 1ª o 2ª lectura más elevada</strong>.</li>
            <li>Obtendrás una estimación limpia y precisa de tu presión en reposo real.</li>
          </ul>
        </div>
      )}
    </div>
  );
};
