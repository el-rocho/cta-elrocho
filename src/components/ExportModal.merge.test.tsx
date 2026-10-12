// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ExportModal } from './ExportModal';
import { DEFAULT_SETTINGS, type BackupMergePreview } from '../services/storageService';
import { createBackupSnapshot, parseBackupContent } from '../utils/backupService';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
import { getTranslation } from '../i18n/translations';
import type { BloodPressureReading } from '../types/bloodPressure';

const reading: BloodPressureReading = {
  id: 'synthetic', timestamp: '2026-07-30T08:00:00.000Z',
  systolic: 130, diastolic: 80, heartRate: 70, arm: 'left',
};
const serialized = JSON.stringify(createBackupSnapshot([reading], DEFAULT_SETTINGS, '2026-07-31T12:00:00.000Z'));
const parsed = parseBackupContent(serialized);
if (parsed.status !== 'valid') throw new Error('Invalid synthetic backup fixture');
const snapshot = parsed.snapshot;
let root: Root;
let container: HTMLDivElement;

afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  vi.restoreAllMocks();
});

async function renderMerge(conflictCount: number) {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  const preview: BackupMergePreview = {
    addedCount: 2, identicalCount: 3, conflictCount,
    currentRevision: 'current', importRevision: 'backup',
  };
  const onRestoreBackup = vi.fn(() => ({ status: 'applied' as const, ...preview }));
  const onPreviewBackupMerge = vi.fn(() => preview);
  await act(async () => root.render(<ExportModal
    isOpen onClose={() => {}} sessions={[]} readings={[]} settings={DEFAULT_SETTINGS}
    onImportReadings={() => 0} onRestoreBackup={onRestoreBackup}
    onPreviewBackupMerge={onPreviewBackupMerge} onUpdateSettings={() => {}}
    onTriggerManualBackup={() => {}}
  />));
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: [new File([JSON.stringify(snapshot)], 'synthetic-backup.json', { type: 'application/json' })],
  });
  await act(async () => {
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  expect(onPreviewBackupMerge).toHaveBeenCalledOnce();
  const button = (label: string) => [...container.querySelectorAll('button')]
    .find((item) => item.textContent?.trim() === label) as HTMLButtonElement | undefined;
  const click = async (label: string) => {
    const target = button(label);
    expect(target, `button ${label}`).toBeTruthy();
    await act(async () => target!.click());
  };
  const previewCards = () => container.querySelectorAll('.backup-restore-preview .import-summary-grid.backup-preview-grid');
  // Every counter card of the single unified grid (both rows).
  const summaryItems = () => [...container.querySelectorAll<HTMLElement>(
    '.backup-restore-preview .import-summary-grid.backup-preview-grid > .import-summary-item'
  )];
  // The three second-row counters share the merge-count class.
  const mergeCounters = () => [...container.querySelectorAll<HTMLElement>(
    '.backup-restore-preview .import-summary-item.merge-count'
  )];
  const mergeValues = () => mergeCounters().map((el) => el.querySelector('strong')?.textContent);
  const conflictCounter = () => container.querySelector('.backup-restore-preview .import-summary-item.is-conflict');
  const note = () => container.querySelector('.backup-restore-preview .import-preview-note');
  return { preview, onRestoreBackup, onPreviewBackupMerge, button, click, note, previewCards, summaryItems, mergeCounters, mergeValues, conflictCounter };
}

describe('backup merge preview is shown as soon as the file is selected', () => {
  it('renders the five unified counters in a single grid and drops the redundant card', async () => {
    const { button, note, previewCards, summaryItems, mergeCounters, mergeValues, conflictCounter } = await renderMerge(1);

    // The five shared texts are visible right after selecting the file.
    expect(container.textContent).toContain('mediciones preparadas');
    expect(container.textContent).toContain('fecha de la copia');
    expect(container.textContent).toContain('tomas nuevas');
    expect(container.textContent).toContain('tomas duplicadas');
    expect(container.textContent).toContain('tomas misma fecha/hora');

    // A single grid holds all five counters: two on the first row, three on the second.
    expect(previewCards().length).toBe(1);
    expect(summaryItems().length).toBe(5);
    expect(mergeCounters().length).toBe(3);
    expect(mergeValues()).toEqual(['2', '3', '1']);

    // The conflict counter stays emphasised through the is-conflict class.
    expect(conflictCounter()?.textContent).toContain('1');

    // The redundant informational card is completely gone.
    expect(note()).toBeNull();
    expect(container.textContent).not.toContain('ya existentes omitidas');
    expect(container.textContent).not.toContain('con la misma fecha y hora pero datos distintos');

    // No additional confirmation button exists.
    expect(button('Aceptar y combinar')).toBeUndefined();
    expect(button('Cancelar restauración')).toBeUndefined();
  });

  it('shows the same five counters without a conflict emphasis when there are no conflicts', async () => {
    const { note, summaryItems, mergeCounters, conflictCounter } = await renderMerge(0);
    expect(summaryItems().length).toBe(5);
    expect(mergeCounters().length).toBe(3);
    expect(conflictCounter()).toBeNull();
    expect(note()).toBeNull();
  });
});

describe('replace asks for confirmation like the other variants', () => {
  it('confirms once with the shared replace text before restoring', async () => {
    const { preview, onRestoreBackup, button, click } = await renderMerge(0);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    onRestoreBackup.mockReturnValueOnce(snapshot.readings.length as never);

    expect(container.textContent).toContain(getTranslation('es', 'export.importPreviewTitle'));
    expect(button('Restaurar y reemplazar')).toBeTruthy();

    await click('Restaurar y reemplazar');

    expect(confirm).toHaveBeenCalledOnce();
    expect(confirm).toHaveBeenCalledWith(getTranslation('es', 'data.replaceConfirm'));
    expect(onRestoreBackup).toHaveBeenCalledOnce();
    expect(onRestoreBackup).toHaveBeenCalledWith(snapshot, 'replace', preview);
    expect(container.textContent).toContain(
      getTranslation('es', 'data.restoreReplaceSuccess', { count: snapshot.readings.length })
    );
  });

  it('cancels the replace without touching storage when the user declines the confirmation', async () => {
    const { onRestoreBackup, click } = await renderMerge(0);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    await click('Restaurar y reemplazar');

    expect(confirm).toHaveBeenCalledOnce();
    expect(confirm).toHaveBeenCalledWith(getTranslation('es', 'data.replaceConfirm'));
    expect(onRestoreBackup).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain(getTranslation('es', 'data.restoreReplaceSuccess', {
      count: snapshot.readings.length,
    }));
  });
});

describe('merge applies directly from the already-computed preview', () => {
  it('applies with a single click and never changes the button text', async () => {
    const { preview, onRestoreBackup, onPreviewBackupMerge, button, click } = await renderMerge(2);
    await click('Combinar mediciones');
    expect(onRestoreBackup).toHaveBeenCalledOnce();
    expect(onRestoreBackup).toHaveBeenCalledWith(snapshot, 'merge', preview);
    // The preview is not recomputed and no confirmation step appears.
    expect(onPreviewBackupMerge).toHaveBeenCalledOnce();
    expect(button('Aceptar y combinar')).toBeUndefined();
    expect(container.textContent).toContain(
      getTranslation('es', 'data.restoreMergeSuccess', { added: 2, identical: 3, conflicts: 2 })
    );
  });

  it('rejects a stale preview without writing and recalculates the preview automatically', async () => {
    const { onRestoreBackup, onPreviewBackupMerge, button, click, mergeValues, conflictCounter } = await renderMerge(1);
    const refreshed = { addedCount: 1, identicalCount: 4, conflictCount: 0, currentRevision: 'new', importRevision: 'backup' };
    onRestoreBackup.mockReturnValueOnce({ status: 'stale' } as never);
    onPreviewBackupMerge.mockReturnValueOnce(refreshed);

    await click('Combinar mediciones');
    expect(onRestoreBackup).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain(getTranslation('es', 'data.mergeChanged'));
    expect(onPreviewBackupMerge).toHaveBeenCalledTimes(2);
    // Button text is unchanged and the refreshed counts replace the old ones.
    expect(button('Combinar mediciones')).toBeTruthy();
    expect(mergeValues()).toEqual(['1', '4', '0']);
    expect(conflictCounter()).toBeNull();

    await click('Combinar mediciones');
    expect(onRestoreBackup).toHaveBeenCalledTimes(2);
    expect(onRestoreBackup).toHaveBeenLastCalledWith(snapshot, 'merge', refreshed);
  });

  it('reports a storage error without crashing when the post-stale preview recalculation fails', async () => {
    const { onRestoreBackup, onPreviewBackupMerge, button, click } = await renderMerge(1);
    onRestoreBackup.mockReturnValueOnce({ status: 'stale' } as never);
    onPreviewBackupMerge.mockImplementationOnce(() => { throw new Error('storage boom'); });

    await click('Combinar mediciones');

    // The thrown recomputation is surfaced as a storage error, not as an uncaught exception.
    expect(onPreviewBackupMerge).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain(getTranslation('es', 'toast.storageError'));
    expect(container.textContent).not.toContain(getTranslation('es', 'data.mergeChanged'));
    // The pending backup is kept so the user can retry or select another file.
    expect(button('Combinar mediciones')).toBeTruthy();
  });

  it('keeps the pending backup and shows no success when storage rejects the merge', async () => {
    const { onRestoreBackup, button, click } = await renderMerge(1);
    onRestoreBackup.mockReturnValueOnce({ status: 'error' } as never);

    await click('Combinar mediciones');

    expect(button('Combinar mediciones')).toBeTruthy();
    expect(container.textContent).toContain(getTranslation('es', 'toast.storageError'));
    expect(container.textContent).not.toContain(getTranslation('es', 'data.restoreMergeSuccess', {
      added: 2, identical: 3, conflicts: 1,
    }));
  });
});
