import { describe, expect, it } from 'vitest';

import magnetCss from './MagnetBoard.module.css?raw';

function ruleBody(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return magnetCss.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1] ?? '';
}

describe('magnet theme styling', () => {
  it('keeps navigation surface and magnet corners connected to Customizer roundness', () => {
    expect(ruleBody('.nav')).toContain('var(--corner-scale)');
    expect(ruleBody('.nav .magnet')).toContain('var(--corner-scale)');
  });
});
