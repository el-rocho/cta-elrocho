// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { AppSettings, BloodPressureReading } from './types/bloodPressure';
import { DEFAULT_SETTINGS } from './services/storageService';
import { getTranslation } from './i18n/translations';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

vi.mock('./components/Header', () => ({
  Header: ({ onOpenSettingsModal }: { onOpenSettingsModal: () => void }) =>
    <button data-testid="open-settings" onClick={onOpenSettingsModal}>settings</button>,
}));
vi.mock('./components/ReadingForm', () => ({
  ReadingForm: ({ readings, onAddReading }: {
    readings: BloodPressureReading[];
    onAddReading: (reading: Omit<BloodPressureReading, 'id' | 'timestamp' | 'takesAntihypertensiveMedication'>) => void;
  }) => <div data-testid="reading-form" data-count={readings.length}>
    <button data-testid="add" onClick={() => {
      try { onAddReading({ systolic: 130, diastolic: 80, heartRate: 70, arm: 'left' }); } catch { /* shown by App */ }
    }}>add</button>
  </div>,
}));
vi.mock('./components/TrendChart', () => ({ TrendChart: () => null }));
vi.mock('./components/TrendInsights', () => ({ TrendInsights: () => null }));
vi.mock('./components/LegalNoticeModal', () => ({ LegalNoticeModal: () => null }));
vi.mock('./components/ReadingList', () => ({
  ReadingList: ({ sessions, onDeleteSession, onDeleteSingleReading, onEditReading }: {
    sessions: Array<{ readings: BloodPressureReading[] }>;
    onDeleteSession: (session: { readings: BloodPressureReading[] }) => boolean;
    onDeleteSingleReading: (id: string) => boolean;
    onEditReading: (reading: BloodPressureReading) => void;
  }) => <div>
    <button data-testid="delete" onClick={() => onDeleteSingleReading(sessions[0].readings[0].id)}>delete</button>
    <button data-testid="delete-session" onClick={() => onDeleteSession({ readings: sessions[0].readings })}>delete-session</button>
    <button data-testid="edit" onClick={() => onEditReading(sessions[0].readings[0])}>edit</button>
  </div>,
}));
vi.mock('./components/EditReadingModal', () => ({
  EditReadingModal: ({ isOpen, reading, onSaveReading }: {
    isOpen: boolean;
    reading: BloodPressureReading | null;
    onSaveReading: (reading: BloodPressureReading) => boolean;
  }) => isOpen && reading
    ? <button data-testid="edit-save" onClick={() => onSaveReading(reading)}>save</button>
    : null,
}));
vi.mock('./components/ExportModal', () => ({
  ExportModal: ({ onImportReadings, onRestoreBackup, onPreviewBackupMerge, onNotify, onTriggerManualBackup }: {
    onImportReadings: (readings: Omit<BloodPressureReading, 'id'>[]) => number;
    onRestoreBackup: (snapshot: { readings: BloodPressureReading[]; settings: AppSettings; createdAt: string }, mode: 'merge' | 'replace', preview?: unknown) => unknown;
    onPreviewBackupMerge: (readings: BloodPressureReading[]) => unknown;
    onNotify?: (toast: string | { message: string }) => void;
    onTriggerManualBackup: () => void | Promise<void>;
  }) => <div>
    <button data-testid="import" onClick={() => {
      try { onImportReadings([{ timestamp: '2026-01-03T10:00:00.000Z', systolic: 130, diastolic: 80, heartRate: 70, arm: 'left' }]); } catch { /* shown by App */ }
    }}>import</button>
    <button data-testid="merge" onClick={() => {
      const incoming = [{ id: 'incoming', timestamp: '2026-01-03T10:00:00.000Z', systolic: 130, diastolic: 80, heartRate: 70, arm: 'left' as const }];
      onRestoreBackup({ readings: incoming, settings: DEFAULT_SETTINGS, createdAt: '2026-01-03T12:00:00.000Z' }, 'merge', onPreviewBackupMerge(incoming));
    }}>merge</button>
    <button data-testid="replace" onClick={() => onRestoreBackup({
      readings: [], settings: DEFAULT_SETTINGS, createdAt: '2026-01-03T12:00:00.000Z',
    }, 'replace')}>replace</button>
    <button data-testid="notify-later" onClick={() => onNotify?.({ message: 'LATER-NOTIFICATION' })}>notify-later</button>
    <button data-testid="manual-backup" onClick={() => { void onTriggerManualBackup(); }}>manual-backup</button>
  </div>,
}));
vi.mock('./components/SettingsModal', () => ({
  SettingsModal: ({ isOpen, settings, onUpdateSettings, onMedicationContextChange, onClearAllData, onResetDemoData }: {
    isOpen: boolean;
    settings: AppSettings;
    onUpdateSettings: (settings: AppSettings) => boolean;
    onMedicationContextChange: (takesMedication: boolean, recalculateHistory: boolean) => boolean;
    onClearAllData: () => void;
    onResetDemoData: () => void;
  }) => isOpen ? <div data-testid="settings" data-name={settings.patientName}>
    <button data-testid="update-settings" onClick={() => onUpdateSettings({ ...settings, patientName: 'Changed' })}>update</button>
    <button data-testid="medication" onClick={() => onMedicationContextChange(true, true)}>medication</button>
    <button data-testid="enable-backups" onClick={() => onUpdateSettings({
      ...settings, backupFrequency: 'daily', lastFullBackupTimestamp: undefined,
    })}>enable-backups</button>
    <button data-testid="reset" onClick={onResetDemoData}>reset</button>
    <button data-testid="clear" onClick={onClearAllData}>clear</button>
  </div> : null,
}));

import { App } from './App';

const readingsKey = 'graphene_bp_readings_v1';
const settingsKey = 'graphene_bp_settings_v1';
const base: BloodPressureReading = {
  id: 'local', timestamp: '2026-01-02T10:00:00.000Z', systolic: 120,
  diastolic: 80, heartRate: 70, arm: 'left', takesAntihypertensiveMedication: false,
};
let values: Map<string, string>;
let failWrites = false;
let setItem: ReturnType<typeof vi.fn>;
let root: Root;
let container: HTMLDivElement;
let isAppMounted = false;

beforeEach(() => {
  values = new Map([
    [readingsKey, JSON.stringify([base])],
    [settingsKey, JSON.stringify({ ...DEFAULT_SETTINGS, patientName: 'Original' })],
  ]);
  failWrites = false;
  setItem = vi.fn((key: string, value: string) => {
    if (failWrites) throw new DOMException('quota');
    values.set(key, value);
  });
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem,
    removeItem: (key: string) => values.delete(key),
  });
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  isAppMounted = true;
});

async function unmountApp() {
  if (!isAppMounted) return;
  isAppMounted = false;
  await act(async () => root.unmount());
}

afterEach(async () => {
  await unmountApp();
  container.remove();
  vi.restoreAllMocks();
});

async function renderApp() {
  await act(async () => root.render(<App />));
}

async function click(testId: string) {
  await act(async () => container.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`)!.click());
}

describe('App storage failures', () => {
  it('renders an in-memory fallback for corrupt JSON without overwriting it', async () => {
    values.set(readingsKey, '{broken');
    await renderApp();
    expect(container.querySelector('[data-testid="reading-form"]')?.getAttribute('data-count')).toBe('10');
    expect(values.get(readingsKey)).toBe('{broken');
    expect(setItem).not.toHaveBeenCalledWith(readingsKey, expect.any(String));
  });

  it('blocks creating a real backup while the example set is shown and keeps the reminder silent', async () => {
    // Frecuencia diaria y sin copia previa: sin el bloqueo, el recordatorio sería exigible.
    values.set(readingsKey, '{broken');
    values.set(settingsKey, JSON.stringify({ ...DEFAULT_SETTINGS, backupFrequency: 'daily' }));
    await renderApp();

    // El fallback demo está activo y su aviso persistente es visible.
    expect(container.querySelector('[data-testid="demo-fallback-warning"]')).toBeTruthy();
    // Y no se ofrece el recordatorio de copia: crear una copia ahora guardaría ejemplos como reales.
    expect(container.querySelector('.toast-notification')).toBeNull();

    const settingsBefore = values.get(settingsKey);
    await click('manual-backup');

    // Se avisa con claridad de que no se puede crear una copia real con datos de ejemplo.
    expect(container.querySelector('.toast-notification')?.textContent).toContain(
      getTranslation('es', 'toast.demoFallbackBackupBlocked')
    );
    // No se anuncia ninguna copia guardada ni se pide confirmarla.
    expect(container.textContent).not.toContain(getTranslation('es', 'toast.manualBackupSavedAt', { path: 'Descargas' }));
    expect(container.textContent).not.toContain(getTranslation('es', 'toast.confirmBackupSaved'));
    // El recordatorio no queda silenciado: la copia bloqueada no altera los ajustes persistidos.
    expect(values.get(settingsKey)).toBe(settingsBefore);
    // Y el bloqueo tampoco desactiva el fallback: el aviso de datos de ejemplo sigue visible.
    expect(container.querySelector('[data-testid="demo-fallback-warning"]')).toBeTruthy();
  });

  it('keeps readings, settings and dialogs unchanged and shows no success when writes fail', async () => {
    await renderApp();
    failWrites = true;

    await click('add');
    await click('delete');
    await click('import');
    await click('merge');
    await click('replace');
    await click('open-settings');
    await click('update-settings');
    await click('medication');
    await click('reset');
    await click('clear');

    expect(container.querySelector('[data-testid="reading-form"]')?.getAttribute('data-count')).toBe('1');
    expect(container.querySelector('[data-testid="settings"]')?.getAttribute('data-name')).toBe('Original');
    expect(container.querySelector('[data-testid="settings"]')).toBeTruthy();
    // El borrado no debe anunciarse como correcto (la escritura falló) y los datos siguen intactos.
    expect(container.textContent).not.toContain(getTranslation('es', 'toast.clearAllSuccess'));
    expect(container.textContent).not.toContain(getTranslation('es', 'toast.resetDemoSuccess'));
    expect(container.textContent).toContain(getTranslation('es', 'toast.storageError'));
    expect(values.get(readingsKey)).toBe(JSON.stringify([base]));
  });

  it('does not persist the demo fallback over unreadable readings when recalculating', async () => {
    values.set(readingsKey, '{broken');
    await renderApp();
    // The corrupt value is rejected, so App falls back to the demo set in memory.
    expect(container.querySelector('[data-testid="reading-form"]')?.getAttribute('data-count')).toBe('10');

    await click('open-settings');
    await click('medication');

    // Recalculating must not overwrite the real (still unreadable) data with the demos.
    expect(values.get(readingsKey)).toBe('{broken');
    expect(setItem).not.toHaveBeenCalledWith(readingsKey, expect.any(String));
  });

  it('shows a visible example-data warning while the stored readings are unreadable', async () => {
    values.set(readingsKey, '{broken');
    await renderApp();

    const warning = container.querySelector('[data-testid="demo-fallback-warning"]');
    expect(warning).toBeTruthy();
    expect(warning?.getAttribute('role')).toBe('alert');
    expect(warning?.textContent).toContain(getTranslation('es', 'toast.demoFallbackWarning'));
    // El conjunto demo se muestra, pero señalado como tal.
    expect(container.querySelector('[data-testid="reading-form"]')?.getAttribute('data-count')).toBe('10');
  });

  it('keeps the example-data warning after a transient toast auto-dismisses', async () => {
    vi.useFakeTimers();
    try {
      values.set(readingsKey, '{broken');
      await renderApp();
      expect(container.querySelector('[data-testid="demo-fallback-warning"]')).toBeTruthy();

      failWrites = true;
      await click('add'); // provoca un aviso transitorio (autodescartable) de error de almacenamiento
      expect(container.querySelector('.toast-notification')).toBeTruthy();

      await act(async () => { vi.advanceTimersByTime(5000); });

      // El toast transitorio desaparece, pero el aviso de datos de ejemplo debe seguir visible.
      expect(container.querySelector('.toast-notification')).toBeNull();
      expect(container.querySelector('[data-testid="demo-fallback-warning"]')).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('never persists the example set while the storage stays unreadable', async () => {
    values.set(readingsKey, '{broken');
    await renderApp();

    await click('add');

    expect(values.get(readingsKey)).toBe('{broken');
    expect(setItem).not.toHaveBeenCalledWith(readingsKey, expect.any(String));
    expect(container.querySelector('[data-testid="demo-fallback-warning"]')).toBeTruthy();
  });

  it('withdraws the example-data warning once the real readings are readable again', async () => {
    values.set(readingsKey, '{broken');
    await renderApp();
    expect(container.querySelector('[data-testid="demo-fallback-warning"]')).toBeTruthy();

    // El valor corrupto se recupera: la siguiente operación ya lee datos reales.
    values.set(readingsKey, JSON.stringify([base]));
    await click('add');

    expect(container.querySelector('[data-testid="demo-fallback-warning"]')).toBeNull();
    expect(container.querySelector('[data-testid="reading-form"]')?.getAttribute('data-count')).toBe('2');
    expect(JSON.parse(values.get(readingsKey)!)).toHaveLength(2);
  });

  it('clears the notification dismiss timer on unmount', async () => {
    vi.useFakeTimers();
    try {
      await renderApp();
      const idleTimers = vi.getTimerCount();
      failWrites = true;
      await click('add'); // programa el temporizador de autodescarte del aviso

      // Un conteo exacto: si el autodescarte dejara de programarse, el aviso no añadiría ningún
      // temporizador y esta aserción fallaría (a diferencia de un simple "mayor que cero").
      expect(vi.getTimerCount()).toBe(idleTimers + 1);
      await unmountApp();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not let an earlier auto-dismiss timer silence a later notice', async () => {
    vi.useFakeTimers();
    try {
      await renderApp();
      await click('import'); // aviso autodescartable: programa el descarte a 5000 ms
      expect(container.querySelector('.toast-notification')?.textContent).toContain(
        getTranslation('es', 'toast.importedCount', { count: 1 })
      );

      await click('notify-later'); // aviso nuevo, asignado sin autodescarte
      expect(container.querySelector('.toast-notification')?.textContent).toContain('LATER-NOTIFICATION');

      await act(async () => { vi.advanceTimersByTime(5000); });

      // El temporizador del aviso anterior no puede descartar el aviso nuevo.
      expect(container.querySelector('.toast-notification')?.textContent).toContain('LATER-NOTIFICATION');
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not let the import auto-dismiss timer erase the backup reminder', async () => {
    vi.useFakeTimers();
    try {
      await renderApp();
      await click('import'); // aviso autodescartable: programa el descarte a 5000 ms

      await click('open-settings');
      await click('enable-backups'); // el recordatorio de copia aparece con el temporizador vivo
      expect(container.querySelector('.toast-notification')?.textContent).toContain(
        getTranslation('es', 'toast.backupDue')
      );

      await act(async () => { vi.advanceTimersByTime(5000); });

      // El recordatorio no se autodescarta y el temporizador anterior ya no puede borrarlo.
      expect(container.querySelector('.toast-notification')?.textContent).toContain(
        getTranslation('es', 'toast.backupDue')
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels the pending auto-dismiss timer when a manual backup asks for confirmation', async () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => 'blob:stub');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    try {
      await renderApp();
      await click('import'); // aviso autodescartable: programa el descarte a 5000 ms

      await act(async () => {
        container.querySelector<HTMLButtonElement>('[data-testid="manual-backup"]')!.click();
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(container.querySelector('.toast-notification')?.textContent).toContain(
        getTranslation('es', 'toast.confirmBackupSaved')
      );

      await act(async () => { vi.advanceTimersByTime(5000); });

      // La confirmación de copia guardada no la descarta el temporizador del aviso anterior.
      expect(container.querySelector('.toast-notification')?.textContent).toContain(
        getTranslation('es', 'toast.confirmBackupSaved')
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels the pending auto-dismiss timer when a notice is closed by hand', async () => {
    vi.useFakeTimers();
    try {
      await renderApp();
      const idleTimers = vi.getTimerCount();
      await click('import');
      expect(vi.getTimerCount()).toBe(idleTimers + 1);

      await act(async () => {
        container.querySelector<HTMLButtonElement>('.toast-close-btn')!.click();
      });

      expect(container.querySelector('.toast-notification')).toBeNull();
      // El cierre manual deja de arrastrar un temporizador pendiente.
      expect(vi.getTimerCount()).toBe(idleTimers);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the example-data warning visible when a later notice is shown directly', async () => {
    vi.useFakeTimers();
    try {
      values.set(readingsKey, '{broken');
      await renderApp();
      expect(container.querySelector('[data-testid="demo-fallback-warning"]')).toBeTruthy();

      await click('notify-later');
      await act(async () => { vi.advanceTimersByTime(60 * 60 * 1000); });

      // El recordatorio no transitorio sigue visible: nada lo autodescarta.
      expect(container.querySelector('.toast-notification')?.textContent).toContain('LATER-NOTIFICATION');
      expect(container.querySelector('[data-testid="demo-fallback-warning"]')).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops claiming the original data is intact once the example set is explicitly restored', async () => {
    values.set(readingsKey, '{broken');
    await renderApp();
    expect(container.querySelector('[data-testid="demo-fallback-warning"]')).toBeTruthy();

    await click('open-settings');
    await click('reset');

    // El conjunto de ejemplo ya es el contenido guardado: la afirmación del aviso dejaría de ser
    // cierta si el fallback siguiera activo.
    expect(container.querySelector('[data-testid="demo-fallback-warning"]')).toBeNull();
    expect(container.textContent).toContain(getTranslation('es', 'toast.resetDemoSuccess'));
    expect(JSON.parse(values.get(readingsKey)!)).toHaveLength(10);
  });

  const unwarningRoutes: Array<{ route: string; clicks: string[] }> = [
    { route: 'import', clicks: ['import'] },
    { route: 'merge', clicks: ['merge'] },
    { route: 'replace', clicks: ['replace'] },
    { route: 'clear-all', clicks: ['open-settings', 'clear'] },
    { route: 'delete-session', clicks: ['delete-session'] },
    { route: 'delete-reading', clicks: ['delete'] },
    { route: 'edit-save', clicks: ['edit', 'edit-save'] },
  ];

  for (const { route, clicks } of unwarningRoutes) {
    it(`withdraws the example-data warning once the ${route} route operates on readable data`, async () => {
      values.set(readingsKey, '{broken');
      await renderApp();
      expect(container.querySelector('[data-testid="demo-fallback-warning"]')).toBeTruthy();

      // El almacenamiento corrompido vuelve a ser legible: la operación ya trabaja sobre datos reales.
      values.set(readingsKey, JSON.stringify([base]));
      for (const testId of clicks) await click(testId);

      expect(container.querySelector('[data-testid="demo-fallback-warning"]')).toBeNull();
    });
  }

  it('shows no example-data warning on a legitimate first boot', async () => {
    values.delete(readingsKey);
    await renderApp();

    // Un primer arranque sin datos no es un fallo de lectura: el conjunto inicial no se señala.
    expect(container.querySelector('[data-testid="demo-fallback-warning"]')).toBeNull();
    expect(container.querySelector('[data-testid="reading-form"]')?.getAttribute('data-count')).toBe('10');
  });
});
