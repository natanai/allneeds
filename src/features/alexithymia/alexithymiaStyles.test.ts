import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const pageSource = readFileSync(new URL('./AlexithymiaSupportPage.tsx', import.meta.url), 'utf8');
const sheetSource = readFileSync(new URL('./AlexithymiaSupportSheets.tsx', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('./AlexithymiaSupportPage.module.css', import.meta.url), 'utf8');

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
