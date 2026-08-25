import { describe, expect, it } from 'vitest';

import type { InventoryStrategy } from '../inventory/inventoryRepository';
import { profilePublishableStrategies } from './profileStrategySync';

function strategy(overrides: Partial<InventoryStrategy>): InventoryStrategy {
  return {
    id: 'local-id',
    title: 'Example',
    description: 'Example description',
    need: 'Safety',
    needSlug: 'safety',
    needSlugs: ['safety'],
    tags: ['safety'],
    personal: true,
    shareWithNat: false,
    sourceNeedPage: '',
    strategySlug: '',
    createdAt: '2026-08-25T00:00:00.000Z',
    visibility: 'private',
    ...overrides,
  };
}

describe('profile strategy publishing', () => {
  it('publishes only signed-in users own public or followers strategies', () => {
    const result = profilePublishableStrategies([
      strategy({ id: 'mine-public', title: 'Mine public', personal: true, visibility: 'public' }),
      strategy({ id: 'mine-followers', title: 'Mine followers', personal: true, visibility: 'followers' }),
      strategy({ id: 'mine-private', title: 'Mine private', personal: true, visibility: 'private' }),
      strategy({
        id: 'someone-else',
        title: 'Someone else',
        personal: false,
        strategySlug: '123',
        visibility: 'public',
      }),
    ]);

    expect(result).toEqual([
      { title: 'Mine public', body: 'Example description', needIds: ['safety'], visibility: 'public' },
      { title: 'Mine followers', body: 'Example description', needIds: ['safety'], visibility: 'followers' },
    ]);
  });
});
