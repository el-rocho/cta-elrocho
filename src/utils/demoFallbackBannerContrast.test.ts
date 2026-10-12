import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// El aviso de datos de ejemplo es texto de 13 px en seminegrita: según WCAG no es "texto grande",
// así que necesita contraste AA (4.5:1) tanto en tema claro como oscuro. Esta prueba calcula el
// contraste a partir de los valores reales de index.css, de modo que un cambio de color no pueda
// dejar el aviso por debajo de AA sin que la suite lo detecte.
const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

const AA_NORMAL_TEXT = 4.5;

function cssBlock(selector: string): string {
  const start = css.indexOf(`\n${selector} {`);
  if (start === -1) throw new Error(`No se encontró el bloque CSS de ${selector}`);
  const open = css.indexOf('{', start);
  const end = css.indexOf('}', open);
  return css.slice(open + 1, end);
}

function cssDeclarations(selector: string): Record<string, string> {
  const declarations: Record<string, string> = {};
  for (const [, property, value] of cssBlock(selector).matchAll(/([\w-]+)\s*:\s*([^;]+);/g)) {
    declarations[property] = value.trim();
  }
  return declarations;
}

function hexToRgb(hex: string): [number, number, number] {
  const digits = hex.trim().replace('#', '');
  const full = digits.length === 3 ? digits.split('').map((d) => d + d).join('') : digits;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function rgbaToRgb(value: string): { rgb: [number, number, number]; alpha: number } {
  const parts = value.match(/[\d.]+/g);
  if (!parts || parts.length < 3) throw new Error(`Color no reconocido: ${value}`);
  const [r, g, b] = parts.slice(0, 3).map(Number);
  return { rgb: [r, g, b], alpha: parts.length > 3 ? Number(parts[3]) : 1 };
}

// El fondo del aviso es un rojo translúcido compuesto sobre el fondo del tema.
function composite(overlay: { rgb: [number, number, number]; alpha: number }, backdrop: [number, number, number]): [number, number, number] {
  return overlay.rgb.map((channel, index) =>
    Math.round(overlay.alpha * channel + (1 - overlay.alpha) * backdrop[index])
  ) as [number, number, number];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (value: number) => {
    const ratio = value / 255;
    return ratio <= 0.03928 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(foreground: [number, number, number], background: [number, number, number]): number {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

const bannerBackground = rgbaToRgb(cssDeclarations('.alert-danger')['background']);

describe('example-data banner contrast', () => {
  it.each([
    { theme: 'claro', backdrop: cssDeclarations(':root')['--bg-app'], color: cssDeclarations('.demo-fallback-banner')['color'] },
    { theme: 'oscuro', backdrop: cssDeclarations("[data-theme='dark']")['--bg-app'], color: cssDeclarations("[data-theme='dark'] .demo-fallback-banner")['color'] },
  ])('reaches WCAG AA in the $theme theme', ({ backdrop, color }) => {
    const ratio = contrast(hexToRgb(color), composite(bannerBackground, hexToRgb(backdrop)));
    expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });
});
