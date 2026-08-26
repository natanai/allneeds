import { describe, expect, it } from 'vitest';

import { strategies } from './catalog';
import userStrategies from './userStrategies.json';

describe('static user strategy ownership boundary', () => {
  it('treats the published user strategy registry as the complete protected static-user source', () => {
    const publishedSlugs = userStrategies.map((strategy) => strategy.slug).sort();
    const runtimeUserSlugs = strategies
      .filter((strategy) => strategy.provenance === 'user')
      .map((strategy) => strategy.slug)
      .sort();

    expect(runtimeUserSlugs).toEqual(publishedSlugs);

    for (const published of userStrategies) {
      const runtime = strategies.find((strategy) => strategy.slug === published.slug);
      expect(runtime).toMatchObject({
        slug: published.slug,
        title: published.title,
        summary: published.summary,
        supportedNeeds: published.needs,
        provenance: 'user',
        ...(published.contributor ? { contributor: published.contributor } : {}),
      });
    }
  });
});
