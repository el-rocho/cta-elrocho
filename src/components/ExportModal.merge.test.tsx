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
  const note = () => container.querySelector('.backup-restore-preview .import-preview-note');
  const conflictCounter = () => container.querySelector('.backup-restore-preview .import-summary-item.is-conflict');
  return { preview, onRestoreBackup, onPreviewBackupMerge, button, click, note, conflictCounter };
}

describe('backup merge preview is shown as soon as the file is selected', () => {
  it('renders counters and an amber warning without any extra click when there are conflicts', async () => {
    const { button, note, conflictCounter } = await renderMerge(1);
    const warning = getTranslation('es', 'data.mergeConflictWarning', { conflicts: 1 });

    // Counters are visible right after selecting the file.
    expect(container.textContent).toContain(getTranslation('es', 'data.mergeAdded'));
    expect(container.textContent).toContain(getTranslation('es', 'data.mergeIdentical'));
    expect(container.textContent).toContain(getTranslation('es', 'data.mergeConflicts'));

    // The emphasized amber note is shown immediately, not after a click.
    expect(note()?.textContent).toContain(warning);
    expect(note()?.classList.contains('warning')).toBe(true);
    expect(note()?.classList.contains('merge-ready')).toBe(false);
    expect(conflictCounter()?.textContent).toContain('1');

    // No additional confirmation button exists.
    expect(button('Aceptar y combinar')).toBeUndefined();
    expect(button('Cancelar restauración')).toBeUndefined();
  });

  it('shows a neutral notice with added and duplicate counts when there are no conflicts', async () => {
    const { note, conflictCounter } = await renderMerge(0);
    expect(note()?.textContent).toContain(
      getTranslation('es', 'data.mergeReadyNotice', { added: 2, duplicates: 3 })
    );
    expect(note()?.classList.contains('warning')).toBe(false);
    expect(conflictCounter()).toBeNull();
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
    const { onRestoreBackup, onPreviewBackupMerge, button, click, note } = await renderMerge(1);
    const refreshed = { addedCount: 1, identicalCount: 4, conflictCount: 0, currentRevision: 'new', importRevision: 'backup' };
    onRestoreBackup.mockReturnValueOnce({ status: 'stale' } as never);
    onPreviewBackupMerge.mockReturnValueOnce(refreshed);

    await click('Combinar mediciones');
    expect(onRestoreBackup).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain(getTranslation('es', 'data.mergeChanged'));
    expect(onPreviewBackupMerge).toHaveBeenCalledTimes(2);
    // Button text is unchanged and the refreshed counts replace the old ones.
    expect(button('Combinar mediciones')).toBeTruthy();
    expect(note()?.textContent).toContain(getTranslation('es', 'data.mergeReadyNotice', { added: 1, duplicates: 4 }));

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
