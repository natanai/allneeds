import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const magnetCss = readFileSync(new URL('./MagnetBoard.module.css', import.meta.url), 'utf8');

function ruleBody(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return magnetCss.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1] ?? '';
}

describe('magnet theme styling', () => {
  it('keeps navigation surface and magnet corners connected to Customizer tokens', () => {
    expect(ruleBody('.nav')).toContain('var(--corner-scale)');
    expect(ruleBody('.nav .magnet')).toContain('var(--corner-scale)');
    expect(ruleBody('.nav .magnet')).toContain('var(--surface-raised)');
    expect(ruleBody('.nav .peach')).toContain('var(--peach)');
    expect(ruleBody('.nav .peach')).toContain('var(--surface-raised)');
  });

  it('marks the current route without changing nav text metrics or compositing', () => {
    const activeAccent = ruleBody('.nav .active::after');
    expect(activeAccent).toContain('var(--sky)');
    expect(activeAccent).toContain('var(--outline)');
    expect(activeAccent).toContain('border:');

    ['font-weight', 'letter-spacing', 'font-size', 'padding', 'filter', 'transform', 'scale']
      .forEach((property) => expect(activeAccent).not.toContain(property));

    expect(magnetCss).not.toMatch(/\.nav \.active\s*\{[^}]*font-weight/s);
    expect(magnetCss).not.toMatch(/\.nav \.active\s*\{[^}]*letter-spacing/s);
  });
});
