// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { BloodPressureReading } from './types/bloodPressure';
import { DEFAULT_SETTINGS } from './services/storageService';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

// Se conservan reales App y EditReadingModal (el modal aporta su propia confirmación en línea);
// el resto de componentes se sustituyen por dobles para poder abrir el modal desde la lista.
vi.mock('./components/Header', () => ({ Header: () => null }));
vi.mock('./components/ReadingForm', () => ({ ReadingForm: () => null }));
vi.mock('./components/TrendChart', () => ({ TrendChart: () => null }));
vi.mock('./components/TrendInsights', () => ({ TrendInsights: () => null }));
vi.mock('./components/LegalNoticeModal', () => ({ LegalNoticeModal: () => null }));
vi.mock('./components/ExportModal', () => ({ ExportModal: () => null }));
vi.mock('./components/SettingsModal', () => ({ SettingsModal: () => null }));
vi.mock('./components/ReadingList', () => ({
  ReadingList: ({ sessions, onEditReading, onDeleteSingleReading }: {
    sessions: Array<{ readings: BloodPressureReading[] }>;
    onEditReading: (reading: BloodPressureReading) => void;
    onDeleteSingleReading: (readingId: string) => void;
  }) => <>
    <button data-testid="edit" onClick={() => onEditReading(sessions[0].readings[0])}>edit</button>
    <button data-testid="delete-from-list" onClick={() => onDeleteSingleReading(sessions[0].readings[0].id)}>delete</button>
  </>,
}));

import { App } from './App';

const readingsKey = 'graphene_bp_readings_v1';
const settingsKey = 'graphene_bp_settings_v1';
const base: BloodPressureReading = {
  id: 'local', timestamp: '2026-01-02T10:00:00.000Z', systolic: 120,
  diastolic: 80, heartRate: 70, arm: 'left', takesAntihypertensiveMedication: false,
};
let values: Map<string, string>;
let root: Root;
let container: HTMLDivElement;
let confirmSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  values = new Map([
    [readingsKey, JSON.stringify([base])],
    [settingsKey, JSON.stringify(DEFAULT_SETTINGS)],
  ]);
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  });
  confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

async function renderApp() {
  await act(async () => root.render(<App />));
}

async function click(testId: string) {
  await act(async () => {
    container.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`)!.click();
    await Promise.resolve();
  });
}

async function clickSelector(selector: string) {
  await act(async () => {
    container.querySelector<HTMLButtonElement>(selector)!.click();
    await Promise.resolve();
  });
}

describe('delete confirmation is requested only once', () => {
  it('does not ask for a second confirmation when deleting from the edit modal', async () => {
    await renderApp();

    await click('edit');
    expect(container.querySelector('.edit-modal-body')).toBeTruthy();

    // El propio modal ofrece la confirmación en línea; al confirmarla no debe aparecer
    // además el window.confirm nativo (doble confirmación).
    await clickSelector('.btn-delete-modal');
    await clickSelector('.btn-danger-confirm');

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(JSON.parse(values.get(readingsKey)!)).toEqual([]);
    // El modal se cierra cuando el borrado tiene éxito.
    expect(container.querySelector('.edit-modal-body')).toBeNull();
  });

  it('still asks exactly one confirmation when deleting directly from the list', async () => {
    await renderApp();

    await click('delete-from-list');

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(values.get(readingsKey)!)).toEqual([]);
  });

  it('cancelling the native confirmation from the list keeps the reading', async () => {
    await renderApp();
    confirmSpy.mockReturnValue(false);

    await click('delete-from-list');

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(values.get(readingsKey)!)).toEqual([base]);
  });
});
