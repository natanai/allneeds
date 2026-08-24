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

  it('keeps navigation clicks and hover states on the shared magnet interaction styling', () => {
    expect(magnetCss).not.toContain('.nav .magnet:hover');
    expect(magnetCss).not.toContain('.nav .magnet:active');
    expect(magnetCss).not.toContain(".nav .magnet[data-picked-up='true']");
    expect(magnetCss).not.toContain(".nav [data-magnet-id='nav-menu'][aria-expanded='true']");

    const activeRule = ruleBody('.nav .active');
    expect(activeRule).not.toContain('background');
    expect(activeRule).not.toContain('filter');
    expect(activeRule).not.toContain('box-shadow');
  });
});
