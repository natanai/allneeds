import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const magnetCss = readFileSync(new URL('./MagnetBoard.module.css', import.meta.url), 'utf8');

function ruleBody(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return magnetCss.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1] ?? '';
}

describe('magnet theme styling', () => {
  it('keeps navigation surfaces and corners connected to Customizer tokens', () => {
    expect(ruleBody('.nav')).toContain('var(--corner-scale)');
    expect(ruleBody('.nav .magnet')).toContain('var(--corner-scale)');
    expect(ruleBody('.nav .magnet')).toContain('var(--surface-raised)');
    expect(ruleBody('.nav .peach')).toContain('var(--peach)');
    expect(ruleBody('.nav .peach')).toContain('var(--surface-raised)');
  });

  it('allows a visible current-route accent while semantic state stays geometry-neutral and crisp', () => {
    const activeRule = ruleBody('.nav .active');
    const activeAccent = ruleBody('.nav .active::after');
    const geometryProperties = [
      'font-size',
      'font-weight',
      'letter-spacing',
      'line-height',
      'padding',
      'margin',
      'gap',
      'width',
      'height',
      'min-width',
      'min-height',
      'border-width',
      'transform',
      'translate',
      'scale',
    ];

    geometryProperties.forEach((property) => {
      expect(activeRule).not.toContain(`${property}:`);
      expect(activeAccent).not.toContain(`${property}:`);
    });
    expect(activeRule).not.toContain('filter:');
    expect(activeRule).not.toContain('text-shadow:');
    expect(activeAccent).not.toContain('filter:');
    expect(activeAccent).not.toContain('text-shadow:');
    expect(activeAccent).toContain('var(--sky)');
    expect(activeAccent).toContain('var(--outline)');
    expect(activeAccent).toContain('border:');
  });
});
