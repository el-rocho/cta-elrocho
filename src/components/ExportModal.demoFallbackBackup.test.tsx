// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ExportModal } from './ExportModal';
import { DEFAULT_SETTINGS } from '../services/storageService';
import { getTranslation } from '../i18n/translations';
import type { BloodPressureReading } from '../types/bloodPressure';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const reading: BloodPressureReading = {
  id: 'saved', timestamp: '2026-01-02T10:00:00.000Z',
  systolic: 130, diastolic: 80, heartRate: 70, arm: 'left',
};

let root: Root;
let container: HTMLDivElement;

afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  vi.restoreAllMocks();
});

async function renderModal(isDemoFallback: boolean) {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  const onTriggerManualBackup = vi.fn();
  await act(async () => root.render(<ExportModal
    isOpen onClose={() => {}} sessions={[]} readings={[reading]} settings={DEFAULT_SETTINGS}
    onImportReadings={() => 0} onRestoreBackup={() => 0}
    onPreviewBackupMerge={() => ({ addedCount: 0, identicalCount: 0, conflictCount: 0, currentRevision: '', importRevision: '' })}
    onUpdateSettings={() => {}} onTriggerManualBackup={onTriggerManualBackup}
    isDemoFallback={isDemoFallback}
  />));
  const createButton = container.querySelector<HTMLButtonElement>('.btn-create-backup')!;
  return { createButton, onTriggerManualBackup };
}

describe('creating a backup while example data is shown', () => {
  it('disables the create button and explains why when the demo fallback is active', async () => {
    const { createButton, onTriggerManualBackup } = await renderModal(true);

    expect(createButton.disabled).toBe(true);
    const note = container.querySelector('[data-testid="backup-demo-blocked"]');
    expect(note?.getAttribute('role')).toBe('alert');
    expect(note?.textContent).toContain(getTranslation('es', 'toast.demoFallbackBackupBlocked'));

    // Un botón deshabilitado no dispara la creación de la copia.
    await act(async () => createButton.click());
    expect(onTriggerManualBackup).not.toHaveBeenCalled();
  });

  it('keeps the create button enabled and shows no notice with real, readable data', async () => {
    const { createButton } = await renderModal(false);

    expect(createButton.disabled).toBe(false);
    expect(container.querySelector('[data-testid="backup-demo-blocked"]')).toBeNull();
  });
});
