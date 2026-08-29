import { describe, expect, it } from 'vitest';

import pageSource from './AlexithymiaSupportPage.tsx?raw';
import sheetSource from './AlexithymiaSupportSheets.tsx?raw';
import cssSource from './AlexithymiaSupportPage.module.css?raw';

function referencedStyleNames(source: string) {
  return [...source.matchAll(/styles\.([A-Za-z0-9_]+)/g)].map((match) => match[1]!);
}

describe('Feeling word support styling', () => {
  it('keeps every referenced style in the canonical CSS Module', () => {
    const referenced = [...new Set([
      ...referencedStyleNames(pageSource),
      ...referencedStyleNames(sheetSource),
    ])].sort();

    const missing = referenced.filter((name) => !new RegExp(`\\.${name}(?![A-Za-z0-9_-])`).test(cssSource));
    expect(missing).toEqual([]);
  });
});
