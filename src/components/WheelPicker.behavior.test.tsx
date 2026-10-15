// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { WheelPicker } from './WheelPicker';
import { LanguageProvider } from '../i18n/LanguageContext';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function renderWheel(onChangeSystolic = vi.fn()) {
  await act(async () => root.render(
    <LanguageProvider language="es">
      <WheelPicker
        systolic={120}
        diastolic={80}
        heartRate={60}
        onChangeSystolic={onChangeSystolic}
        onChangeDiastolic={vi.fn()}
        onChangeHeartRate={vi.fn()}
      />
    </LanguageProvider>
  ));
  await act(async () => vi.runAllTimers());
  onChangeSystolic.mockClear();
  return onChangeSystolic;
}

describe('WheelPicker precision', () => {
  it('emits only the nearest value after scrolling stops and aligns it exactly', async () => {
    const onChange = await renderWheel();
    const column = container.querySelectorAll<HTMLDivElement>('.wheel-tumbler-container')[0];

    column.scrollTop = (125 - 60) * 40 + 12;
    act(() => column.dispatchEvent(new Event('scroll', { bubbles: true })));

    expect(onChange).not.toHaveBeenCalled();

    await act(async () => {
      vi.runAllTimers();
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(125);
    expect(column.scrollTop).toBe((125 - 60) * 40);
  });

  it('debounces consecutive scroll positions and emits only the final one', async () => {
    const onChange = await renderWheel();
    const column = container.querySelectorAll<HTMLDivElement>('.wheel-tumbler-container')[0];

    column.scrollTop = (123 - 60) * 40;
    act(() => column.dispatchEvent(new Event('scroll', { bubbles: true })));
    column.scrollTop = (127 - 60) * 40 + 19;
    act(() => column.dispatchEvent(new Event('scroll', { bubbles: true })));

    await act(async () => vi.runAllTimers());

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(127);
    expect(column.scrollTop).toBe((127 - 60) * 40);
  });

  it('selects and aligns a clicked item exactly once', async () => {
    const onChange = await renderWheel();
    const column = container.querySelectorAll<HTMLDivElement>('.wheel-tumbler-container')[0];
    const item = Array.from(column.querySelectorAll<HTMLDivElement>('.wheel-item'))
      .find((candidate) => candidate.textContent === '130')!;

    act(() => item.click());

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(130);
    expect(column.scrollTop).toBe((130 - 60) * 40);
  });

  it('exposes the column as a keyboard-operable selector', async () => {
    const onChange = await renderWheel();
    const column = container.querySelectorAll<HTMLDivElement>('.wheel-tumbler-container')[0];

    expect(column.getAttribute('role')).toBe('listbox');
    expect(column.tabIndex).toBe(0);
    expect(column.querySelector('[role="option"][aria-selected="true"]')?.textContent).toBe('120');

    act(() => column.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(121);
    expect(column.scrollTop).toBe((121 - 60) * 40);
  });
});
