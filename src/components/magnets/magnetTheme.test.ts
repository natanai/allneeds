import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const magnetCss = readFileSync(new URL('./MagnetBoard.module.css', import.meta.url), 'utf8');
const faceCss = readFileSync(new URL('./MagnetFaces.css', import.meta.url), 'utf8');
const needsPageCss = readFileSync(new URL('../../features/needs/NeedsPage.module.css', import.meta.url), 'utf8');

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
  it('keeps navigation surfaces and corners connected to Customizer roles', () => {
    expect(ruleBody('.nav')).toContain('var(--corner-scale)');
    expect(ruleBody('.nav .magnet')).toContain('var(--corner-scale)');
    expect(ruleBody('.nav .magnet')).toContain('var(--surface-raised)');
    expect(ruleBody('.nav .action')).toContain('var(--action)');
    expect(ruleBody('.nav .action')).toContain('var(--surface-raised)');
  });

  it('makes the current route obvious with one Customizer-owned extrusion and no geometry changes', () => {
    const activeRule = ruleBody('.nav .active');
    const activePickedUpRule = ruleBody(".nav .active[data-picked-up='true']");
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

    expect(activeRule).toContain('background: color-mix(in srgb, var(--selection) 60%, var(--primary) 40%);');
    expect(activeRule).toContain('filter: none;');
    expect(activeRule).toContain('box-shadow: 0 9px 0 color-mix(in srgb, var(--primary) 64%, var(--outline) 36%);');
    expect(activeRule.match(/box-shadow:/g)).toHaveLength(1);
    expect(activeRule).not.toContain('background-image:');
    expect(activeRule).not.toContain('inset');
    expect(activeRule).not.toContain('drop-shadow(');
    expect(activeRule).not.toContain('text-shadow:');

    expect(activePickedUpRule).toContain('box-shadow: 0 12px 0');
    expect(activePickedUpRule.match(/box-shadow:/g)).toHaveLength(1);
    expect(activePickedUpRule).not.toContain('inset');

    expect(desktopActiveRule).toContain('box-shadow: 0 9px 0');
    expect(desktopActiveRule.match(/box-shadow:/g)).toHaveLength(1);
    expect(desktopActiveRule).not.toContain('inset');
    expect(desktopActiveRule).not.toContain('filter:');
  });

  it('owns approved Need faces in the shared magnet layer rather than the Needs page', () => {
    expect(magnetCss).toContain("@import './MagnetFaces.css';");
    [
      'connection',
      'support',
      'safety',
      'understanding',
      'clarity',
      'honesty',
      'accountability',
    ].forEach((slug) => {
      expect(faceCss).toContain(`[data-magnet-id='needs-${slug}']`);
    });
    expect(needsPageCss).not.toContain("data-magnet-id='needs-");
    expect(faceCss).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
