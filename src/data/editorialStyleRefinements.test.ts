import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

type EditorialCatalog = {
  needs: Record<string, {
    summary?: string;
    narrative?: string;
    lenses?: Array<{ summary?: string; narrative?: string }>;
  }>;
  strategies: Array<{ slug: string; summary: string }>;
};

const catalog = JSON.parse(
  readFileSync(new URL('./editorialCatalog.json', import.meta.url), 'utf8'),
) as EditorialCatalog;

describe('approved human editorial refinements', () => {
  it('uses the approved motivation wording for Support, Safety, and Understanding', () => {
    expect(catalog.needs.support.summary).toContain('This need may motivate us to');
    expect(catalog.needs.safety.summary).toContain('We may be motivated to');
    expect(catalog.needs.understanding.summary).toContain('This need may motivate us to');

    expect(catalog.needs.support.summary).not.toContain('draw us to');
    expect(catalog.needs.safety.summary).not.toContain('drawn to');
    expect(catalog.needs.understanding.summary).not.toContain('draw us to');
  });

  it('keeps internal audit scaffolding out of the revised Connection details', () => {
    const narrative = catalog.needs.connection.narrative ?? '';
    expect(narrative).not.toContain('This source is included because');
    expect(narrative).not.toContain('These sources are included because');
    expect(narrative).not.toContain('Taken together');
  });

  it('keeps the approved plain-language revisions in Understanding details', () => {
    const lenses = catalog.needs.understanding.lenses ?? [];
    const combinedNarrative = lenses.map((lens) => lens.narrative ?? '').join('\n');

    expect(combinedNarrative).not.toContain('instrumental payoff');
    expect(combinedNarrative).not.toContain('It should remain explicitly labeled as a theory.');
    expect(combinedNarrative).toContain('a research term for knowledge team members hold in common about their work');
  });

  it('keeps the approved Map your support wording', () => {
    const strategy = catalog.strategies.find((item) => item.slug === 'map-your-support');
    expect(strategy?.summary).toBe(
      'Set a five-minute timer. Write down any people, groups, services, or places you could turn to. Next to each, write what kind of help it could realistically offer, such as listening or practical help. Leave anything blank if no option comes to mind.',
    );
  });
});
