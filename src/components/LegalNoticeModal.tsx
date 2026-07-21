import React from 'react';
import { ShieldCheck, X, AlertTriangle, Lock } from 'lucide-react';

interface LegalNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalNoticeModal: React.FC<LegalNoticeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <ShieldCheck size={22} className="modal-icon text-blue" />
            <h2>Aviso Legal y Política de Privacidad</h2>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {/* Exención de responsabilidad médica */}
          <div className="settings-subcard" style={{ marginBottom: '16px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <div className="field-label" style={{ color: '#d97706', margin: '0 0 6px 0' }}>
              <AlertTriangle size={16} />
              <span>Exención de Responsabilidad Médica:</span>
            </div>
            <p style={{ margin: 0, lineHeight: '1.4' }}>
              Esta aplicación es una herramienta puramente informativa de seguimiento y registro personal de datos de tensión arterial.
              <strong> No constituye un producto sanitario, dispositivo diagnóstico ni reemplaza la consulta o prescripción de un profesional de la salud calificado.</strong> Consulte siempre a su médico antes de tomar cualquier decisión clínica o modificar tratamientos.
            </p>
          </div>

          {/* Privacidad RGPD / Almacenamiento Local */}
          <div className="settings-subcard" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div className="field-label" style={{ color: '#059669', margin: '0 0 6px 0' }}>
              <Lock size={16} />
              <span>Garantía de Privacidad y RGPD (Unión Europea):</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: '1.5' }}>
              <li><strong>100% Offline y Local</strong>: Todos tus datos (lecturas, nombre, notas) se procesan y almacenan exclusivamente en tu dispositivo.</li>
              <li><strong>Sin Servidores ni Rastreo</strong>: Esta aplicación no recopila, transmite ni comparte información con servidores externos ni utiliza cookies de seguimiento.</li>
              <li><strong>Control Total</strong>: Tienes la facultad exclusiva de exportar o borrar tus datos en cualquier momento.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
