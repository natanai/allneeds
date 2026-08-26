import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('approved Need magnet identities', () => {
  it('promotes Safety · Layered Cover with the umbrella icon', () => {
    const css = readFileSync(new URL('./NeedsPage.module.css', import.meta.url), 'utf8');
    const icon = readFileSync(new URL('../../../public/icons/needs/safety.svg', import.meta.url), 'utf8');
    const art = readFileSync(
      new URL('../../../public/icons/needs/art/safety-layered-cover.svg', import.meta.url),
      'utf8',
    );

    expect(css).toContain("[data-magnet-id='needs-safety']");
    expect(css).toContain("url('/icons/needs/safety.svg')");
    expect(css).toContain("url('/icons/needs/art/safety-layered-cover.svg')");
    expect(icon).toContain('M3 11.5C4.2 7.2 7.4 4.5 12 4.5');
    expect(art).toContain('viewBox="0 0 220 64"');
  });
});
