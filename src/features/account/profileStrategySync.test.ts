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
  it('publishes only signed-in users own public or followers strategies with stable local keys', () => {
    const result = profilePublishableStrategies([
      strategy({
        id: 'mine-public', title: 'Mine public', personal: true, visibility: 'public',
        firstName: 'Nat', location: 'Missouri',
      }),
      strategy({
        id: 'mine-followers', title: 'Mine followers', personal: true, visibility: 'followers',
        contributor: { name: 'Profile name', location: 'Profile place' },
      }),
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
      {
        clientKey: 'mine-public',
        title: 'Mine public',
        body: 'Example description',
        needIds: ['safety'],
        firstName: 'Nat',
        location: 'Missouri',
        visibility: 'public',
      },
      {
        clientKey: 'mine-followers',
        title: 'Mine followers',
        body: 'Example description',
        needIds: ['safety'],
        firstName: 'Profile name',
        location: 'Profile place',
        visibility: 'followers',
      },
    ]);
  });
});
