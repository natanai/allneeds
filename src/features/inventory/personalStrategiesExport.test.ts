import { describe, expect, it } from 'vitest';

import type { InventoryStrategy } from './inventoryRepository';
import {
  buildPersonalStrategiesExport,
  buildSingleStrategyExport,
  personalStrategiesEmailHref,
  PERSONAL_STRATEGIES_EMAIL_ADDRESS,
  PERSONAL_STRATEGIES_EMAIL_SUBJECT,
} from './personalStrategiesExport';

function strategy(overrides: Partial<InventoryStrategy> = {}): InventoryStrategy {
  return {
    id: 'strategy-1',
    title: 'Take a quiet walk',
    description: 'Step outside for ten minutes.',
    need: 'Rest',
    needSlug: 'rest',
    needSlugs: ['rest'],
    tags: ['rest'],
    personal: true,
    shareWithNat: true,
    sourceNeedPage: '',
    strategySlug: '',
    createdAt: '2026-08-24T12:00:00.000Z',
    visibility: 'public',
    ...overrides,
  };
}

describe('personal strategy export', () => {
  it('bulk exports only personal strategies marked Public', () => {
    const exportedAt = '2026-08-25T00:00:00.000Z';
    const publicStrategy = strategy();
    const payload = buildPersonalStrategiesExport([
      publicStrategy,
      strategy({ id: 'private-1', title: 'Private strategy', visibility: 'private', shareWithNat: true }),
      strategy({ id: 'followers-1', title: 'Followers strategy', visibility: 'followers', shareWithNat: false }),
      strategy({ id: 'catalog-1', title: 'Catalog strategy', personal: false }),
    ], exportedAt);

    expect(payload).toEqual({
      version: 1,
      exportedAt,
      personalStrategies: [publicStrategy],
    });
  });

  it('can explicitly export one private personal strategy without changing its privacy', () => {
    const exportedAt = '2026-08-25T00:00:00.000Z';
    const privateStrategy = strategy({ visibility: 'private', shareWithNat: false });
    expect(buildSingleStrategyExport(privateStrategy, exportedAt)).toEqual({
      version: 1,
      exportedAt,
      personalStrategies: [privateStrategy],
    });
  });

  it('never exports a catalog-saved strategy through the personal sharing path', () => {
    expect(buildSingleStrategyExport(strategy({ personal: false })).personalStrategies).toEqual([]);
  });

  it('builds the same pre-addressed email target used by the legacy share flow', () => {
    const href = personalStrategiesEmailHref();
    const url = new URL(href);
    expect(url.protocol).toBe('mailto:');
    expect(url.pathname).toBe(PERSONAL_STRATEGIES_EMAIL_ADDRESS);
    expect(url.searchParams.get('subject')).toBe(PERSONAL_STRATEGIES_EMAIL_SUBJECT);
  });
});
