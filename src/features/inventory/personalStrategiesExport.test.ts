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
    visibility: 'private',
    ...overrides,
  };
}

describe('personal strategy export', () => {
  it('bulk exports only personal strategies explicitly marked shareable with Nat', () => {
    const exportedAt = '2026-08-25T00:00:00.000Z';
    const shareable = strategy();
    const payload = buildPersonalStrategiesExport([
      shareable,
      strategy({ id: 'private-1', title: 'Private strategy', shareWithNat: false }),
      strategy({ id: 'catalog-1', title: 'Catalog strategy', personal: false }),
    ], exportedAt);

    expect(payload).toEqual({
      version: 1,
      exportedAt,
      personalStrategies: [shareable],
    });
  });

  it('can explicitly export one personal strategy and records that explicit share in the file', () => {
    const exportedAt = '2026-08-25T00:00:00.000Z';
    const privateStrategy = strategy({ shareWithNat: false });
    expect(buildSingleStrategyExport(privateStrategy, exportedAt)).toEqual({
      version: 1,
      exportedAt,
      personalStrategies: [{ ...privateStrategy, shareWithNat: true }],
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
