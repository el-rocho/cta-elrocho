import { getTranslation } from '../i18n/translations';
import type { BackupMergePreview } from '../services/storageService';
import type { LanguageOption } from '../types/bloodPressure';

type Counts = Pick<BackupMergePreview, 'addedCount' | 'identicalCount' | 'conflictCount'>;

/**
 * Emite las tres tarjetas de contadores de la segunda fila del grid
 * `import-summary-grid backup-preview-grid`. Al devolver un fragmento, los items
 * se convierten en hijos directos del grid padre (React no añade nodos extra),
 * de modo que las cinco tarjetas comparten un único grid.
 */
export function BackupMergeSummary({ language, counts }: { language: LanguageOption; counts: Counts }) {
  const t = (key: string, params?: Record<string, number>) => getTranslation(language, key, params);
  const counters = [
    { key: 'data.mergeAdded', value: counts.addedCount, isConflict: false },
    { key: 'data.mergeIdentical', value: counts.identicalCount, isConflict: false },
    { key: 'data.mergeConflicts', value: counts.conflictCount, isConflict: counts.conflictCount > 0 },
  ];
  return <>
    {counters.map(({ key, value, isConflict }) => (
      <div className={`import-summary-item merge-count${isConflict ? ' is-conflict' : ''}`} key={key}>
        <strong>{value}</strong>
        <span>{t(key)}</span>
      </div>
    ))}
  </>;
}
