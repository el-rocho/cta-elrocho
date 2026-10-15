// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ReadingForm } from './ReadingForm';
import { LanguageProvider } from '../i18n/LanguageContext';
import { DEFAULT_SETTINGS } from '../services/storageService';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root;
let container: HTMLDivElement;

afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function renderForm(
  onAddReading = vi.fn(),
  settings = DEFAULT_SETTINGS
) {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(
    <LanguageProvider language="es">
      <ReadingForm
        onAddReading={onAddReading}
        settings={settings}
        readings={[]}
      />
    </LanguageProvider>
  ));
  return onAddReading;
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

function deferredSave() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const validationDialog = () => document.body.querySelector<HTMLElement>('.form-alert-dialog');
const pulsePressureDialog = () => document.body.querySelector<HTMLElement>('.pulse-pressure-dialog');

describe('ReadingForm defensive values', () => {
  it('labels the primary action as Registrar medición', async () => {
    await renderForm();

    expect(container.querySelector<HTMLButtonElement>('.btn-submit-reading')?.textContent).toContain(
      'Registrar medición'
    );
  });

  it('starts with empty numeric fields and reference placeholders', async () => {
    await renderForm();

    expect(container.querySelector<HTMLInputElement>('#systolic-input')).toMatchObject({
      value: '',
      placeholder: '115',
    });
    expect(container.querySelector<HTMLInputElement>('#diastolic-input')).toMatchObject({
      value: '',
      placeholder: '65',
    });
    expect(container.querySelector<HTMLInputElement>('#pulse-input')).toMatchObject({
      value: '',
      placeholder: '60',
    });
  });

  it('rejects an empty submit with a modal notice and without adding a reading', async () => {
    const onAddReading = await renderForm();

    await act(async () => {
      container.querySelector<HTMLButtonElement>('.btn-submit-reading')!.click();
    });

    expect(onAddReading).not.toHaveBeenCalled();
    expect(container.querySelector('.alert-danger')).toBeNull();
    expect(validationDialog()!.querySelector('.form-alert-message')?.textContent).toBe(
      'Introduce valores Sistólica, Diastólica y Pulso'
    );
  });

  it('closes the missing-values modal with its button and with Escape', async () => {
    await renderForm();

    await act(async () => {
      container.querySelector<HTMLButtonElement>('.btn-submit-reading')!.click();
    });
    expect(validationDialog()!.contains(document.activeElement)).toBe(true);
    await act(async () => {
      validationDialog()!.querySelector<HTMLButtonElement>('.btn-alert-accept')!.click();
    });
    expect(validationDialog()).toBeNull();

    await act(async () => {
      container.querySelector<HTMLButtonElement>('.btn-submit-reading')!.click();
    });
    expect(validationDialog()!.contains(document.activeElement)).toBe(true);
    await act(async () => {
      document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(validationDialog()).toBeNull();
  });

  it('closes the missing-values modal by clicking outside its content', async () => {
    await renderForm();

    await act(async () => {
      container.querySelector<HTMLButtonElement>('.btn-submit-reading')!.click();
    });
    await act(async () => {
      validationDialog()!.parentElement!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(validationDialog()).toBeNull();
  });

  it('makes the background form inert while a dialog is open', async () => {
    await renderForm();
    const form = container.querySelector<HTMLFormElement>('form')!;
    expect(form.hasAttribute('inert')).toBe(false);

    await act(async () => {
      container.querySelector<HTMLButtonElement>('.btn-submit-reading')!.click();
    });
    expect(form.hasAttribute('inert')).toBe(true);

    await act(async () => {
      validationDialog()!.querySelector<HTMLButtonElement>('.btn-alert-accept')!.click();
    });
    expect(form.hasAttribute('inert')).toBe(false);
  });

  it('moves the focus into the cuff modal and closes it with Escape', async () => {
    await renderForm();
    setInput('#systolic-input', '180');
    setInput('#diastolic-input', '60');
    setInput('#pulse-input', '70');

    await act(async () => container.querySelector<HTMLFormElement>('form')!.requestSubmit());
    expect(pulsePressureDialog()!.contains(document.activeElement)).toBe(true);

    await act(async () => {
      document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(pulsePressureDialog()).toBeNull();
    expect(container.querySelector<HTMLInputElement>('#systolic-input')!.value).toBe('180');
  });

  it('keeps the cuff modal open when the overlay is clicked during a save', async () => {
    const save = deferredSave();
    await renderForm(vi.fn(() => save.promise));
    setInput('#systolic-input', '180');
    setInput('#diastolic-input', '60');
    setInput('#pulse-input', '70');

    await act(async () => container.querySelector<HTMLFormElement>('form')!.requestSubmit());
    await act(async () => {
      pulsePressureDialog()!.querySelector<HTMLButtonElement>('.btn-force-save')!.click();
    });
    await act(async () => {
      pulsePressureDialog()!.parentElement!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(pulsePressureDialog()).not.toBeNull();

    await act(async () => {
      save.resolve();
      await save.promise;
    });
  });

  it('explains a diastolic value that is not lower than the systolic one in the modal', async () => {
    const onAddReading = await renderForm();
    setInput('#systolic-input', '80');
    setInput('#diastolic-input', '90');
    setInput('#pulse-input', '70');

    await act(async () => {
      container.querySelector<HTMLFormElement>('form')!.requestSubmit();
    });

    expect(onAddReading).not.toHaveBeenCalled();
    expect(validationDialog()!.querySelector('.form-alert-message')?.textContent).toBe(
      'La presión diastólica debe ser menor que la sistólica. Revisa los valores: esta medición no se puede guardar.'
    );
  });

  it('labels a very high reading with the plain hypertension name', async () => {
    await renderForm();
    setInput('#systolic-input', '200');
    setInput('#diastolic-input', '120');
    setInput('#pulse-input', '70');

    const pill = container.querySelector('.reading-alerts-row .clinical-alert-pill');
    expect(pill?.getAttribute('data-alert-key')).toBe('extremeHighPressure');
    expect(pill?.querySelector('.health-alert-name')?.textContent).toBe('Hipertensión grave (200/120)');
    // El aviso de urgencia no cabe en un desplegable que caduca: la etiqueta queda
    // sin texto propio y, por tanto, sin capa desplegable.
    expect(pill?.closest('details')).toBeNull();
    expect(container.querySelector('.clinical-alert-popover')).toBeNull();
    expect(container.querySelector('.reading-info-area')?.textContent).not.toContain('112');
  });

  it('keeps the previous assessment while a partial value is typed and updates it when plausible', async () => {
    await renderForm();
    setInput('#systolic-input', '200');
    setInput('#diastolic-input', '80');
    setInput('#pulse-input', '70');

    const alertKey = () => container.querySelector('.reading-alerts-row .clinical-alert-pill')?.getAttribute('data-alert-key');
    expect(alertKey()).toBe('extremeHighPressure');

    setInput('#systolic-input', '2');
    expect(alertKey()).toBe('extremeHighPressure');

    setInput('#systolic-input', '20');
    expect(alertKey()).toBe('extremeHighPressure');

    setInput('#systolic-input', '120');
    expect(alertKey()).not.toBe('extremeHighPressure');
  });

  it('keeps the last valid assessment until the whole combination is valid again', async () => {
    await renderForm();
    setInput('#systolic-input', '200');
    setInput('#diastolic-input', '80');
    setInput('#pulse-input', '70');

    const alertKey = () => container.querySelector('.reading-alerts-row .clinical-alert-pill')?.getAttribute('data-alert-key');
    expect(alertKey()).toBe('extremeHighPressure');

    setInput('#systolic-input', '70');
    expect(alertKey()).toBe('extremeHighPressure');

    setInput('#diastolic-input', '50');
    expect(alertKey()).not.toBe('extremeHighPressure');
  });

  it('does not truncate decimals or use them to update the assessment', async () => {
    await renderForm();
    setInput('#systolic-input', '200');
    setInput('#diastolic-input', '80');
    setInput('#pulse-input', '70');

    const alertKey = () => container.querySelector('.reading-alerts-row .clinical-alert-pill')?.getAttribute('data-alert-key');

    setInput('#systolic-input', '49.5');
    expect(container.querySelector<HTMLInputElement>('#systolic-input')!.value).toBe('49.5');
    expect(alertKey()).toBe('extremeHighPressure');

    setInput('#systolic-input', '120');
    expect(alertKey()).not.toBe('extremeHighPressure');
  });

  it('clears all numeric fields after a successful save', async () => {
    const onAddReading = await renderForm(vi.fn(() => Promise.resolve()));
    const systolic = setInput('#systolic-input', '120');
    const diastolic = setInput('#diastolic-input', '80');
    const pulse = setInput('#pulse-input', '60');

    await act(async () => {
      container.querySelector('form')!.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
      await Promise.resolve();
    });

    expect(onAddReading).toHaveBeenCalledOnce();
    expect(systolic.value).toBe('');
    expect(diastolic.value).toBe('');
    expect(pulse.value).toBe('');
  });

  it('locks the draft while a save is pending', async () => {
    const save = deferredSave();
    await renderForm(vi.fn(() => save.promise));
    const systolic = setInput('#systolic-input', '120');
    setInput('#diastolic-input', '80');
    setInput('#pulse-input', '60');

    await act(async () => container.querySelector<HTMLFormElement>('form')!.requestSubmit());
    expect(systolic.disabled).toBe(true);
    setInput('#systolic-input', '130');
    expect(systolic.value).toBe('120');

    await act(async () => {
      save.resolve();
      await save.promise;
    });
    expect(systolic.value).toBe('');
  });

  it('preserves a failed pending save beyond the inactivity timeout', async () => {
    vi.useFakeTimers();
    const save = deferredSave();
    await renderForm(vi.fn(() => save.promise));
    const systolic = setInput('#systolic-input', '120');
    setInput('#diastolic-input', '80');
    setInput('#pulse-input', '60');

    await act(async () => container.querySelector<HTMLFormElement>('form')!.requestSubmit());
    setInput('#systolic-input', '130');
    await act(async () => {
      save.reject(new Error('offline'));
      await save.promise.catch(() => undefined);
    });
    await act(async () => vi.advanceTimersByTime(5000));

    expect(systolic.value).toBe('120');
    expect(container.querySelector('.alert-danger')).not.toBeNull();

    setInput('#systolic-input', '131');
    await act(async () => vi.advanceTimersByTime(5000));
    expect(systolic.value).toBe('');
  });

  it('clears an unsaved partial draft after five seconds without changes', async () => {
    vi.useFakeTimers();
    await renderForm();
    const systolic = setInput('#systolic-input', '128');
    const diastolic = container.querySelector<HTMLInputElement>('#diastolic-input')!;
    const notes = setInput('.input-notes', 'no guardar');

    await act(async () => vi.advanceTimersByTime(4000));
    expect(systolic.value).toBe('128');
    expect(notes.value).toBe('no guardar');

    setInput('#diastolic-input', '82');
    await act(async () => vi.advanceTimersByTime(4999));
    expect([systolic.value, diastolic.value, notes.value]).toEqual(['128', '82', 'no guardar']);

    await act(async () => vi.advanceTimersByTime(1));
    expect([systolic.value, diastolic.value, notes.value]).toEqual(['', '', '']);
  });

  it('keeps the cuff-confirmation modal and the values while the user decides', async () => {
    vi.useFakeTimers();
    await renderForm();
    const systolic = setInput('#systolic-input', '180');
    const diastolic = setInput('#diastolic-input', '60');
    const pulse = setInput('#pulse-input', '70');

    await act(async () => container.querySelector<HTMLFormElement>('form')!.requestSubmit());
    expect(pulsePressureDialog()).not.toBeNull();

    await act(async () => vi.advanceTimersByTime(30000));

    expect(pulsePressureDialog()).not.toBeNull();
    expect([systolic.value, diastolic.value, pulse.value]).toEqual(['180', '60', '70']);
  });

  it('restarts the inactivity cleanup after the cuff modal is dismissed', async () => {
    vi.useFakeTimers();
    await renderForm();
    const systolic = setInput('#systolic-input', '180');
    setInput('#diastolic-input', '60');
    setInput('#pulse-input', '70');

    await act(async () => container.querySelector<HTMLFormElement>('form')!.requestSubmit());
    await act(async () => {
      pulsePressureDialog()!.querySelector<HTMLButtonElement>('.btn-cancel-warning')!.click();
    });

    expect(pulsePressureDialog()).toBeNull();
    expect(systolic.value).toBe('180');

    await act(async () => vi.advanceTimersByTime(5000));
    expect(systolic.value).toBe('');
  });

  it('blocks the pulse-pressure confirmation buttons while a save is pending', async () => {
    const save = deferredSave();
    await renderForm(vi.fn(() => save.promise));
    setInput('#systolic-input', '180');
    setInput('#diastolic-input', '60');
    setInput('#pulse-input', '70');

    await act(async () => container.querySelector<HTMLFormElement>('form')!.requestSubmit());
    await act(async () => {
      pulsePressureDialog()!.querySelector<HTMLButtonElement>('.btn-force-save')!.click();
    });

    expect(pulsePressureDialog()!.querySelector<HTMLButtonElement>('.btn-force-save')!.disabled).toBe(true);
    expect(pulsePressureDialog()!.querySelector<HTMLButtonElement>('.btn-cancel-warning')!.disabled).toBe(true);

    await act(async () => {
      save.resolve();
      await save.promise;
    });
  });

  it('keeps one primary alert in the reserved row and summarizes additional alerts', async () => {
    await renderForm(vi.fn(), { ...DEFAULT_SETTINGS, showInformationalLabels: true });
    setInput('#systolic-input', '80');
    setInput('#diastolic-input', '65');
    setInput('#pulse-input', '70');

    expect(container.querySelectorAll('.reading-alerts-row .clinical-alert-pill')).toHaveLength(1);
    expect(container.querySelector('.health-alert-count')).toBeNull();

    setInput('#systolic-input', '85');
    setInput('#diastolic-input', '55');
    setInput('#pulse-input', '105');

    expect(container.querySelectorAll('.reading-alerts-row .clinical-alert-pill')).toHaveLength(1);
    expect(container.querySelector('.reading-alerts-row .clinical-alert-pill')?.getAttribute('data-alert-key')).toBe('hypotensionTachycardia');
    expect(container.querySelector('.health-alert-count')?.textContent).toBe('+2');
    expect(container.querySelector('.reading-info-area')?.contains(container.querySelector('.reading-alerts-row'))).toBe(true);
    const details = container.querySelector<HTMLDetailsElement>('.clinical-alert-details');
    expect(details).not.toBeNull();
    expect(details!.querySelector('.clinical-alert-popover')?.textContent).toContain('repite la medición');
  });

  it('groups the header blocks reserving two informative labels and two buttons', async () => {
    await renderForm(vi.fn(), { ...DEFAULT_SETTINGS, showInformationalLabels: true });

    const badges = Array.from(container.querySelectorAll('.classification-badges > *'));
    expect(badges).toHaveLength(2);
    expect(badges[1].classList.contains('is-placeholder')).toBe(true);
    expect(badges[1].getAttribute('aria-hidden')).toBe('true');

    expect(container.querySelectorAll('.form-controls-wrapper .btn-switch')).toHaveLength(2);
  });

  it('keeps compact controls in the title row and one information row below save', async () => {
    await renderForm(vi.fn(), { ...DEFAULT_SETTINGS, showInformationalLabels: true });

    const header = container.querySelector('.form-header')!;
    expect(header.querySelector('.form-title-left')).not.toBeNull();
    expect(header.querySelector('.form-controls-wrapper')).not.toBeNull();
    expect(header.querySelector('.health-alerts-badges')).toBeNull();
    expect(header.querySelector('.classification-badges')).toBeNull();

    const armButton = header.querySelector<HTMLButtonElement>('.arm-chip')!;
    const modeButton = header.querySelector<HTMLButtonElement>('.btn-mode-chip')!;
    expect(armButton.textContent).toBe('Izq.');
    expect(modeButton.textContent).toBe('');
    expect(modeButton.querySelector('svg')).not.toBeNull();

    const infoArea = container.querySelector('.reading-info-area')!;
    expect(infoArea).not.toBeNull();
    // Una sola fila con los dos grupos; los avisos van antes que las etiquetas, así
    // que al no caber el bloque de etiquetas cae debajo del aviso.
    expect(Array.from(infoArea.children).map((child) => child.className.split(' ')[0])).toEqual([
      'reading-alerts-row',
      'reading-labels-row',
    ]);
    expect(infoArea.querySelector('.reading-info-row')).toBeNull();
    expect(infoArea.previousElementSibling?.classList.contains('reading-submit-row')).toBe(true);
  });

  it('does not reserve the target slot when the treatment target is shown', async () => {
    await renderForm(vi.fn(), {
      ...DEFAULT_SETTINGS,
      showInformationalLabels: true,
      takesAntihypertensiveMedication: true,
    });

    const badges = Array.from(container.querySelectorAll('.classification-badges > *'));
    expect(badges).toHaveLength(2);
    expect(badges.some((badge) => badge.classList.contains('is-placeholder'))).toBe(false);
  });

  it('clears an unsaved wheel selection after five seconds', async () => {
    vi.useFakeTimers();
    await renderForm(vi.fn(), { ...DEFAULT_SETTINGS, preferredInputMode: 'wheel' });
    const selectedSystolic = container.querySelector<HTMLDivElement>('.wheel-item.selected')!;

    act(() => selectedSystolic.click());
    expect(container.querySelectorAll('.wheel-item.selected.reference')).toHaveLength(2);

    await act(async () => vi.advanceTimersByTime(5000));
    expect(container.querySelectorAll('.wheel-item.selected.reference')).toHaveLength(3);
  });

  it('shows wheel references without treating them as entered data', async () => {
    const onAddReading = await renderForm(vi.fn(), {
      ...DEFAULT_SETTINGS,
      preferredInputMode: 'wheel',
    });

    expect(Array.from(container.querySelectorAll('.wheel-item.selected'), (item) => item.textContent)).toEqual([
      '115',
      '65',
      '60',
    ]);
    expect(container.querySelectorAll('.wheel-item.selected.reference')).toHaveLength(3);

    await act(async () => {
      container.querySelector<HTMLButtonElement>('.btn-submit-reading')!.click();
    });

    expect(onAddReading).not.toHaveBeenCalled();
    expect(validationDialog()!.querySelector('.form-alert-message')?.textContent).toBe(
      'Introduce valores Sistólica, Diastólica y Pulso'
    );
  });
});
