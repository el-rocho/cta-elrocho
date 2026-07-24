import React, { useState } from 'react';
import type { BloodPressureReading, BloodPressureSession, DateRange } from '../types/bloodPressure';
import { getHealthCategory } from '../utils/healthClassification';
import { filterSessionsByDateRange } from '../utils/exportCsv';
import { History, Trash2, ChevronDown, ChevronUp, Clock, Armchair, ShieldCheck, AlertCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface ReadingListProps {
  sessions: BloodPressureSession[];
  onDeleteSession: (session: BloodPressureSession) => void;
  onDeleteSingleReading: (readingId: string) => void;
  onEditReading: (reading: BloodPressureReading) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export const ReadingList: React.FC<ReadingListProps> = ({
  sessions,
  onDeleteSession,
  onDeleteSingleReading,
  onEditReading,
  dateRange,
  onDateRangeChange,
}) => {
  const { t, language } = useLanguage();
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const filteredSessions = filterSessionsByDateRange(sessions, dateRange);

  const toggleExpand = (id: string) => {
    setExpandedSessionId(expandedSessionId === id ? null : id);
  };

  const locale = language === 'en' ? 'en-US' : 'es-ES';

  // Helper para manejar pulsación mantenida (long press), doble clic y clic derecho
  const createReadingInteractions = (reading: BloodPressureReading) => {
    let longPressTimer: ReturnType<typeof setTimeout> | null = null;

    const startLongPress = () => {
      longPressTimer = setTimeout(() => {
        onEditReading(reading);
      }, 550);
    };

    const cancelLongPress = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };

    return {
      onDoubleClick: () => {
        cancelLongPress();
        onEditReading(reading);
      },
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        cancelLongPress();
        onEditReading(reading);
      },
      onMouseDown: startLongPress,
      onTouchStart: startLongPress,
      onMouseUp: cancelLongPress,
      onMouseLeave: cancelLongPress,
      onTouchEnd: cancelLongPress,
      onTouchMove: cancelLongPress,
    };
  };

  return (
    <div className="card list-card">
      <div className="list-header">
        <div className="list-title-container">
          <div className="list-title">
            <History size={20} className="icon-history" />
            <h2>{t('list.title')}</h2>
            <span className="count-badge">{filteredSessions.length}</span>
          </div>
          <p className="list-edit-hint">{t('list.editHint')}</p>
        </div>

        {/* Filtros de Rango de Fecha */}
        <div className="filter-chips">
          <button
            type="button"
            className={`chip ${dateRange.preset === '7days' ? 'active' : ''}`}
            onClick={() => onDateRangeChange({ preset: '7days' })}
          >
            {t('list.preset7Days')}
          </button>
          <button
            type="button"
            className={`chip ${dateRange.preset === '30days' ? 'active' : ''}`}
            onClick={() => onDateRangeChange({ preset: '30days' })}
          >
            {t('list.preset30Days')}
          </button>
          <button
            type="button"
            className={`chip ${dateRange.preset === '90days' ? 'active' : ''}`}
            onClick={() => onDateRangeChange({ preset: '90days' })}
          >
            {t('list.preset90Days')}
          </button>
          <button
            type="button"
            className={`chip ${dateRange.preset === 'all' ? 'active' : ''}`}
            onClick={() => onDateRangeChange({ preset: 'all' })}
          >
            {t('list.presetAll')}
          </button>
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="empty-state">
          <p>{t('list.emptyState')}</p>
        </div>
      ) : (
        <div className="sessions-list">
          {filteredSessions.map((session) => {
            const category = getHealthCategory(session.averageSystolic, session.averageDiastolic, language);
            const isExpanded = expandedSessionId === session.id;
            const dateObj = new Date(session.timestamp);
            const dateStr = dateObj.toLocaleDateString(locale, {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });
            const timeStr = dateObj.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
            const isMulti = session.readings.length > 1;
            const primaryReading = session.readings[0];
            const itemInteractions = createReadingInteractions(primaryReading);

            return (
              <div
                key={session.id}
                className={`session-item ${isMulti ? 'session-multi' : ''}`}
                {...itemInteractions}
              >
                <div className="session-main-row">
                  {/* Fecha y Hora */}
                  <div className="session-time-col">
                    <div className="session-date">{dateStr}</div>
                    <div className="session-time">
                      <Clock size={12} /> {timeStr}
                    </div>
                  </div>

                  {/* Cifras Principales: Sistólica / Diastólica / Pulsaciones */}
                  <div className="session-metrics-col">
                    <div className="bp-reading-display">
                      <span className="sys-num">{session.averageSystolic}</span>
                      <span className="slash">/</span>
                      <span className="dia-num">{session.averageDiastolic}</span>
                      <span className="slash">/</span>
                      <span className="pulse-num">{session.averageHeartRate}</span>
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
                      <span className="white-coat-pill">
                        <ShieldCheck size={12} /> {t('list.readingsCount', { count: session.readings.length })}
                      </span>
                    )}
                  </div>

                  {/* Brazo y Notas */}
                  <div className="session-details-col">
                    <span className="arm-badge">
                      <Armchair size={12} /> {t('list.arm')}: {session.arm === 'left' ? t('form.armLeft') : t('form.armRight')}
                    </span>
                    {session.notes && <span className="notes-preview">"{session.notes}"</span>}
                  </div>

                  {/* Acciones */}
                  <div className="session-actions-col" onClick={(e) => e.stopPropagation()}>
                    {isMulti && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(session.id);
                        }}
                        className="btn-icon-subtle"
                        title={isExpanded ? 'Plegar tomas' : 'Ver todas las tomas'}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session);
                      }}
                      className="btn-icon-delete"
                      title={language === 'en' ? 'Delete session' : 'Eliminar sesión'}
                      aria-label={language === 'en' ? 'Delete session' : 'Eliminar sesión'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Desglose desplegable de tomas de la sesión de bata blanca */}
                {isExpanded && isMulti && (
                  <div className="session-expanded-details" onClick={(e) => e.stopPropagation()}>
                    <div className="expanded-banner-info">
                      <AlertCircle size={14} />
                      <span>
                        {t('list.readingsCount', { count: session.readings.length })}{' '}
                        {session.discardedCount > 0 &&
                          `(${t('list.whiteCoatDiscarded', { count: session.discardedCount })})`}
                      </span>
                    </div>

                    <table className="expanded-readings-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>{language === 'en' ? 'Time' : 'Hora'}</th>
                          <th>{language === 'en' ? 'Values' : 'Medición'}</th>
                          <th>{language === 'en' ? 'Status' : 'Estado'}</th>
                          <th>{language === 'en' ? 'Actions' : 'Acciones'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {session.readings.map((r, index) => {
                          const rTime = new Date(r.timestamp).toLocaleTimeString(locale, {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          });
                          const isDiscarded =
                            session.discardedCount > 0 &&
                            (index === 0 || (session.discardedCount === 2 && index === 1));

                          const subInteractions = createReadingInteractions(r);

                          return (
                            <tr
                              key={r.id}
                              className={isDiscarded ? 'row-discarded' : 'row-used'}
                              {...subInteractions}
                            >
                              <td>#{index + 1}</td>
                              <td>{rTime}</td>
                              <td>
                                <strong>{r.systolic}</strong> / <strong>{r.diastolic}</strong> / <strong>{r.heartRate}</strong>
                              </td>
                              <td>
                                {isDiscarded ? (
                                  <span className="status-discarded">
                                    {language === 'en' ? 'Discarded' : 'Descartada'}
                                  </span>
                                ) : (
                                  <span className="status-used">
                                    {language === 'en' ? 'Used' : 'Utilizada'}
                                  </span>
                                )}
                              </td>
                              <td>
                                <div className="table-actions-cell" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    className="btn-text-delete"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteSingleReading(r.id);
                                    }}
                                  >
                                    {language === 'en' ? 'Delete' : 'Eliminar'}
                                  </button>
                                </div>
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
