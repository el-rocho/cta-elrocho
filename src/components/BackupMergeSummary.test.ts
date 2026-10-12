import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { BackupMergeSummary } from './BackupMergeSummary';
import { getTranslation } from '../i18n/translations';

const countOccurrences = (haystack: string, needle: string) => haystack.split(needle).length - 1;

describe('backup merge counters in both languages', () => {
  it.each(['es', 'en'] as const)('shows the three counters and marks conflicts in %s', (language) => {
    const html = renderToStaticMarkup(createElement(BackupMergeSummary, {
      language, counts: { addedCount: 2, identicalCount: 3, conflictCount: 1 },
    }));
    expect(html).toContain(getTranslation(language, 'data.mergeAdded'));
    expect(html).toContain(getTranslation(language, 'data.mergeIdentical'));
    expect(html).toContain(getTranslation(language, 'data.mergeConflicts'));
    expect(html).toContain('>2<');
    expect(html).toContain('>3<');
    expect(html).toContain('>1<');
    // The three second-row counters share the merge-count class.
    expect(countOccurrences(html, 'merge-count')).toBe(3);
    // The conflict counter is emphasised with its own class.
    expect(html).toContain('is-conflict');
  });

  it('does not mark the conflict counter without conflicts', () => {
    const html = renderToStaticMarkup(createElement(BackupMergeSummary, {
      language: 'es', counts: { addedCount: 0, identicalCount: 1, conflictCount: 0 },
    }));
    expect(html).not.toContain('is-conflict');
  });

  it('emits only the three merge-count items and never the removed informational note', () => {
    const html = renderToStaticMarkup(createElement(BackupMergeSummary, {
      language: 'es', counts: { addedCount: 2, identicalCount: 3, conflictCount: 1 },
    }));
    expect(countOccurrences(html, 'import-summary-item')).toBe(3);
    expect(html).not.toContain('import-preview-note');
  });
});
