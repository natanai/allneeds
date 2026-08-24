import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const magnetCss = readFileSync(new URL('./MagnetBoard.module.css', import.meta.url), 'utf8');

function ruleBody(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return magnetCss.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1] ?? '';
}

describe('magnet theme styling', () => {
  it('keeps navigation surface and magnet corners connected to Customizer roundness', () => {
    expect(ruleBody('.nav')).toContain('var(--corner-scale)');
    expect(ruleBody('.nav .magnet')).toContain('var(--corner-scale)');
  });

  it('allows intentional nav-specific styling while route state stays geometry-neutral', () => {
    const activeRule = ruleBody('.nav .active');
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
    });
  });
});
