import { describe, expect, it } from 'vitest';

import { strategies } from './catalog';
import userStrategies from './userStrategies.json';

describe('static user strategy ownership boundary', () => {
  it('keeps Autumn as the only repository-resident user submission', () => {
    expect(userStrategies).toEqual([
      {
        title: 'Comfy gaming',
        slug: 'comfy-gaming',
        summary: 'Stardew Valley or Skyrim or something else I have played a million times before that I cherish and can decompress with after a long day of uncomfortability.',
        needs: [{ title: 'Safety', slug: 'safety' }],
        contributor: { name: 'Autumn' },
      },
    ]);

    expect(
      strategies
        .filter((strategy) => strategy.provenance === 'user')
        .map((strategy) => ({
          slug: strategy.slug,
          contributor: strategy.contributor,
        })),
    ).toEqual([
      {
        slug: 'comfy-gaming',
        contributor: { name: 'Autumn' },
      },
    ]);
  });
});
