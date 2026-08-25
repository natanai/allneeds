import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const tokensPath = fileURLToPath(new URL('./tokens.css', import.meta.url));
const tokens = readFileSync(tokensPath, 'utf8');

describe('shared radius tokens', () => {
  it('keeps pill corners responsive across the Customizer roundness range', () => {
    expect(tokens).toContain('--radius-pill: calc(var(--corner-scale) * 24px);');
    expect(tokens).not.toContain('--radius-pill: calc(var(--corner-scale) * 999px);');
  });
});
