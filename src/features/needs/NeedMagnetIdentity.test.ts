import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const needsCss = readFileSync(new URL('./NeedsPage.module.css', import.meta.url), 'utf8');

describe('approved Need magnet identities', () => {
  it('ships Connection with the approved Constellation artwork and semantic Customizer roles', () => {
    expect(needsCss).toContain("[data-magnet-id='needs-connection']");
    expect(needsCss).toContain("/icons/needs/art/connection-constellation.svg");
    expect(needsCss).toContain('var(--positive)');
    expect(needsCss).toContain('var(--primary)');
    expect(needsCss).not.toMatch(/var\(--(?:plum|lavender|ink|rose|mint|gold|sky|peach)\)/);
  });
});
