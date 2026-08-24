import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const magnetCss = readFileSync(new URL('./MagnetBoard.module.css', import.meta.url), 'utf8');

function ruleBody(selector: string) {
  const marker = `${selector} {`;
  const selectorStart = magnetCss.indexOf(marker);
  if (selectorStart < 0) return '';

  const bodyStart = selectorStart + marker.length;
  let depth = 1;
  for (let index = bodyStart; index < magnetCss.length; index += 1) {
    const character = magnetCss[index];
    if (character === '{') depth += 1;
    if (character !== '}') continue;
    depth -= 1;
    if (depth === 0) return magnetCss.slice(bodyStart, index);
  }
  return '';
}

describe('magnet theme styling', () => {
  it('keeps navigation surfaces and corners connected to Customizer tokens', () => {
    expect(ruleBody('.nav')).toContain('var(--corner-scale)');
    expect(ruleBody('.nav .magnet')).toContain('var(--corner-scale)');
    expect(ruleBody('.nav .magnet')).toContain('var(--surface-raised)');
    expect(ruleBody('.nav .peach')).toContain('var(--peach)');
    expect(ruleBody('.nav .peach')).toContain('var(--surface-raised)');
  });

  it('gives the current route Customizer-owned 3D depth without changing geometry or text metrics', () => {
    const activeRule = ruleBody('.nav .active');
    const desktopActiveRule = ruleBody('.nav .magnet.active');
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
      expect(desktopActiveRule).not.toContain(`${property}:`);
    });

    expect(magnetCss).not.toContain('.nav .active::after');
    expect(activeRule).not.toContain('filter:');
    expect(activeRule).not.toContain('text-shadow:');
    expect(activeRule).not.toContain('border:');
    expect(activeRule).toContain('background-image:');
    expect(activeRule).toContain('box-shadow:');
    expect(activeRule).toContain('var(--sky)');
    expect(activeRule).toContain('var(--surface-raised)');
    expect(activeRule).toContain('var(--outline)');

    expect(desktopActiveRule).not.toContain('filter:');
    expect(desktopActiveRule).toContain('box-shadow:');
    expect(desktopActiveRule).toContain('var(--sky)');
  });
});
