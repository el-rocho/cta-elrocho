import { getTranslation } from '../i18n/translations';
import type { BackupMergePreview } from '../services/storageService';
import type { LanguageOption } from '../types/bloodPressure';

type Counts = Pick<BackupMergePreview, 'addedCount' | 'identicalCount' | 'conflictCount'>;

export function BackupMergeSummary({ language, counts }: { language: LanguageOption; counts: Counts }) {
  const t = (key: string, params?: Record<string, number>) => getTranslation(language, key, params);
  return <>
    <div className="import-summary-grid backup-preview-grid">
      {(['added', 'identical', 'conflicts'] as const).map((kind) => {
        const value = kind === 'added' ? counts.addedCount : kind === 'identical' ? counts.identicalCount : counts.conflictCount;
        const isConflict = kind === 'conflicts' && counts.conflictCount > 0;
        return (
          <div className={`import-summary-item${isConflict ? ' is-conflict' : ''}`} key={kind}>
            <strong>{value}</strong>
            <span>{t(`data.merge${kind[0].toUpperCase()}${kind.slice(1)}`)}</span>
          </div>
        );
      })}
    </div>
  </>;
}
