import { describe, expect, it } from 'vitest';

import needsCss from './NeedsPage.module.css?raw';

describe('approved Need magnet identities', () => {
  it('ships Connection with the approved Constellation artwork and semantic Customizer roles', () => {
    expect(needsCss).toContain("[data-magnet-id='needs-connection']");
    expect(needsCss).toContain("/icons/needs/art/connection-constellation.svg");
    expect(needsCss).toContain('var(--positive)');
    expect(needsCss).toContain('var(--primary)');
    expect(needsCss).not.toMatch(/var\(--(?:plum|lavender|ink|rose|mint|gold|sky|peach)\)/);
  });
});
