import { describe, expect, it } from 'vitest';

import type { InventoryStrategy } from './inventoryRepository';
import {
  buildPersonalStrategiesExport,
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
    sourceNeedPage: '',
    strategySlug: '',
    createdAt: '2026-08-24T12:00:00.000Z',
    visibility: 'private',
    ...overrides,
  };
}

describe('personal strategy export', () => {
  it('exports only personal strategies in the legacy-compatible envelope', () => {
    const exportedAt = '2026-08-25T00:00:00.000Z';
    const payload = buildPersonalStrategiesExport([
      strategy(),
      strategy({ id: 'catalog-1', title: 'Catalog strategy', personal: false }),
    ], exportedAt);

    expect(payload).toEqual({
      version: 1,
      exportedAt,
      personalStrategies: [strategy()],
    });
  });

  it('builds the same pre-addressed email target used by the legacy share flow', () => {
    const href = personalStrategiesEmailHref();
    expect(href).toContain(`mailto:${PERSONAL_STRATEGIES_EMAIL_ADDRESS}?`);
    expect(decodeURIComponent(href)).toContain(PERSONAL_STRATEGIES_EMAIL_SUBJECT);
  });
});
