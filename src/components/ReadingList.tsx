import React, { useState } from 'react';
import type { BloodPressureSession, DateRange } from '../types/bloodPressure';
import { getHealthCategory } from '../utils/healthClassification';
import { filterSessionsByDateRange } from '../utils/exportCsv';
import { History, Trash2, ChevronDown, ChevronUp, Clock, Armchair, ShieldCheck, AlertCircle } from 'lucide-react';

interface ReadingListProps {
  sessions: BloodPressureSession[];
  onDeleteSession: (session: BloodPressureSession) => void;
  onDeleteSingleReading: (readingId: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export const ReadingList: React.FC<ReadingListProps> = ({
  sessions,
  onDeleteSession,
  onDeleteSingleReading,
  dateRange,
  onDateRangeChange,
}) => {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const filteredSessions = filterSessionsByDateRange(sessions, dateRange);

  const toggleExpand = (id: string) => {
    setExpandedSessionId(expandedSessionId === id ? null : id);
  };

  return (
    <div className="card list-card">
      <div className="list-header">
        <div className="list-title">
          <History size={20} className="icon-history" />
          <h2>Historial de Mediciones</h2>
          <span className="count-badge">{filteredSessions.length}</span>
        </div>

        {/* Filtros de Rango de Fecha */}
        <div className="filter-chips">
          <button
            type="button"
            className={`chip ${dateRange.preset === 'all' ? 'active' : ''}`}
            onClick={() => onDateRangeChange({ preset: 'all' })}
          >
            Todas
          </button>
          <button
            type="button"
            className={`chip ${dateRange.preset === '7days' ? 'active' : ''}`}
            onClick={() => onDateRangeChange({ preset: '7days' })}
          >
            7 Días
          </button>
          <button
            type="button"
            className={`chip ${dateRange.preset === '30days' ? 'active' : ''}`}
            onClick={() => onDateRangeChange({ preset: '30days' })}
          >
            30 Días
          </button>
          <button
            type="button"
            className={`chip ${dateRange.preset === '90days' ? 'active' : ''}`}
            onClick={() => onDateRangeChange({ preset: '90days' })}
          >
            90 Días
          </button>
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="empty-state">
          <p>No se encontraron registros de tensión para el periodo seleccionado.</p>
        </div>
      ) : (
        <div className="sessions-list">
          {filteredSessions.map((session) => {
            const category = getHealthCategory(session.averageSystolic, session.averageDiastolic);
            const isExpanded = expandedSessionId === session.id;
            const dateObj = new Date(session.timestamp);
            const dateStr = dateObj.toLocaleDateString('es-ES', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });
            const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const isMulti = session.readings.length > 1;

            return (
              <div key={session.id} className={`session-item ${isMulti ? 'session-multi' : ''}`}>
                <div className="session-main-row">
                  {/* Fecha y Hora */}
                  <div className="session-time-col">
                    <div className="session-date">{dateStr}</div>
                    <div className="session-time">
                      <Clock size={12} /> {timeStr}
                    </div>
                  </div>

                  {/* Cifras Principales */}
                  <div className="session-metrics-col">
                    <div className="bp-reading-display">
                      <span className="sys-num">{session.averageSystolic}</span>
                      <span className="slash">/</span>
                      <span className="dia-num">{session.averageDiastolic}</span>
                      <span className="bp-unit">mmHg</span>
                    </div>
                    <div className="pulse-display">
                      <span className="pulse-num">{session.averageHeartRate}</span>
                      <span className="pulse-unit">ppm</span>
                    </div>
                  </div>

                  {/* Badge OMS / AHA */}
                  <div className="session-badge-col">
                    <span
                      className="category-pill"
                      style={{ backgroundColor: category.badgeBg, color: category.badgeText }}
                      title={category.description}
                    >
                      <span className="dot" style={{ backgroundColor: category.colorHex }}></span>
                      {category.name}
                    </span>

                    {/* Badge de Bata Blanca */}
                    {isMulti && (
                      <span className="white-coat-pill" title="Media calculada descartando tomas iniciales elevadas">
                        <ShieldCheck size={12} /> Media ({session.readings.length} tomas)
                      </span>
                    )}
                  </div>

                  {/* Brazo y Notas */}
                  <div className="session-details-col">
                    <span className="arm-badge">
                      <Armchair size={12} /> {session.arm === 'left' ? 'Brazo Izq.' : 'Brazo Der.'}
                    </span>
                    {session.notes && <span className="notes-preview">"{session.notes}"</span>}
                  </div>

                  {/* Acciones */}
                  <div className="session-actions-col">
                    {isMulti && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(session.id)}
                        className="btn-icon-subtle"
                        title="Ver tomas individuales de la sesión"
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteSession(session)}
                      className="btn-icon-delete"
                      title="Eliminar este registro"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Desglose desplegable de tomas de la sesión de bata blanca */}
                {isExpanded && isMulti && (
                  <div className="session-expanded-details">
                    <div className="expanded-banner-info">
                      <AlertCircle size={14} />
                      <span>
                        Se realizaron {session.readings.length} tomas seguidas en menos de 3 minutos.{' '}
                        {session.discardedCount > 0 &&
                          `Se descartó la ${session.discardedCount === 1 ? '1ª toma' : '1ª y 2ª tomas'} por pico de bata blanca.`}
                      </span>
                    </div>

                    <table className="expanded-readings-table">
                      <thead>
                        <tr>
                          <th># Toma</th>
                          <th>Hora</th>
                          <th>Presión</th>
                          <th>Pulso</th>
                          <th>Estado en Algoritmo</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {session.readings.map((r, index) => {
                          const rTime = new Date(r.timestamp).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          });
                          // Verificar si fue descartada
                          const isDiscarded =
                            session.discardedCount > 0 &&
                            (index === 0 || (session.discardedCount === 2 && index === 1));

                          return (
                            <tr key={r.id} className={isDiscarded ? 'row-discarded' : 'row-used'}>
                              <td>Toma {index + 1}</td>
                              <td>{rTime}</td>
                              <td>
                                <strong>{r.systolic}</strong> / <strong>{r.diastolic}</strong> mmHg
                              </td>
                              <td>{r.heartRate} ppm</td>
                              <td>
                                {isDiscarded ? (
                                  <span className="status-discarded"> Descartada (Bata Blanca)</span>
                                ) : (
                                  <span className="status-used"> Utilizada en Media</span>
                                )}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-text-delete"
                                  onClick={() => onDeleteSingleReading(r.id)}
                                >
                                  Eliminar
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
