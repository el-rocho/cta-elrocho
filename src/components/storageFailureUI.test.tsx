// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ReadingForm } from './ReadingForm';
import { EditReadingModal } from './EditReadingModal';
import { LanguageProvider } from '../i18n/LanguageContext';
import { getTranslation } from '../i18n/translations';
import { DEFAULT_SETTINGS } from '../services/storageService';
import type { BloodPressureReading } from '../types/bloodPressure';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root;
let container: HTMLDivElement;
const reading: BloodPressureReading = {
  id: 'saved',
  timestamp: '2026-01-02T10:00:00.000Z',
  systolic: 120,
  diastolic: 80,
  heartRate: 60,
  arm: 'left',
};

afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  vi.restoreAllMocks();
});

async function render(ui: React.ReactNode) {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(
    <LanguageProvider language="es">{ui}</LanguageProvider>
  ));
}

function setInput(selector: string, value: string) {
  const input = container.querySelector<HTMLInputElement>(selector)!;
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  return input;
}

describe('storage failure UI', () => {
  it('keeps the new-reading form intact and does not show saved state', async () => {
    const onAddReading = vi.fn(() => Promise.reject(new Error('storage failed')));
    await render(<ReadingForm
      onAddReading={onAddReading}
      settings={DEFAULT_SETTINGS}
      readings={[]}
    />);
    const systolic = setInput('#systolic-input', '135');
    const notes = setInput('.input-notes', 'keep me');

    await act(async () => {
      container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });

    expect(onAddReading).toHaveBeenCalledOnce();
    expect(systolic.value).toBe('135');
    expect(notes.value).toBe('keep me');
    expect(container.querySelector('.btn-submit-reading')?.classList.contains('is-saved')).toBe(false);
    // El banner muestra el mensaje exacto de fallo de almacenamiento (no cualquier texto).
    expect(container.querySelector('.alert-danger')?.textContent).toBe(
      getTranslation('es', 'form.storageError')
    );
  });

  it('keeps the edit modal and edited values open when saving fails', async () => {
    const onClose = vi.fn();
    const onSaveReading = vi.fn(() => false);
    await render(<EditReadingModal
      isOpen
      onClose={onClose}
      reading={reading}
      settings={DEFAULT_SETTINGS}
      onSaveReading={onSaveReading}
      readings={[reading]}
    />);
    const systolic = setInput('#edit-systolic', '135');

    await act(async () => {
      container.querySelector<HTMLFormElement>('.edit-modal-body')!.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
      await Promise.resolve();
    });

    expect(onSaveReading).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    expect(systolic.value).toBe('135');
    // El banner de error muestra el mensaje exacto de fallo de almacenamiento.
    expect(container.querySelector('.form-error-banner')?.textContent).toBe(
      getTranslation('es', 'form.storageError')
    );
  });

  const renderEditModalForDelete = (outcome: 'deleted' | 'cancelled' | 'failed') => {
    const onClose = vi.fn();
    const onDeleteReading = vi.fn(() => outcome);
    return { onClose, onDeleteReading };
  };

  async function confirmDeleteInModal() {
    await act(async () => {
      container.querySelector<HTMLButtonElement>('.btn-delete-modal')!.click();
    });
    await act(async () => {
      container.querySelector<HTMLButtonElement>('.btn-danger-confirm')!.click();
      await Promise.resolve();
    });
  }

  it('does not report a storage error when the delete confirmation is cancelled', async () => {
    const { onClose, onDeleteReading } = renderEditModalForDelete('cancelled');
    await render(<EditReadingModal
      isOpen
      onClose={onClose}
      reading={reading}
      settings={DEFAULT_SETTINGS}
      onSaveReading={vi.fn(() => true)}
      onDeleteReading={onDeleteReading}
      readings={[reading]}
    />);

    await confirmDeleteInModal();

    expect(onDeleteReading).toHaveBeenCalledWith('saved');
    expect(container.querySelector('.form-error-banner')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows a storage error only when the delete actually fails', async () => {
    const { onClose, onDeleteReading } = renderEditModalForDelete('failed');
    await render(<EditReadingModal
      isOpen
      onClose={onClose}
      reading={reading}
      settings={DEFAULT_SETTINGS}
      onSaveReading={vi.fn(() => true)}
      onDeleteReading={onDeleteReading}
      readings={[reading]}
    />);

    await confirmDeleteInModal();

    expect(container.querySelector('.form-error-banner')?.textContent).toBe(
      getTranslation('es', 'form.storageError')
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes the modal when the delete succeeds', async () => {
    const { onClose, onDeleteReading } = renderEditModalForDelete('deleted');
    await render(<EditReadingModal
      isOpen
      onClose={onClose}
      reading={reading}
      settings={DEFAULT_SETTINGS}
      onSaveReading={vi.fn(() => true)}
      onDeleteReading={onDeleteReading}
      readings={[reading]}
    />);

    await confirmDeleteInModal();

    expect(onClose).toHaveBeenCalled();
    expect(container.querySelector('.form-error-banner')).toBeNull();
  });
});
