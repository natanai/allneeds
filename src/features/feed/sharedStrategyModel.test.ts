import { describe, expect, it } from 'vitest';

import type { SharedFeedStrategy } from '../../app/appResources';
import {
  normalizeSharedStrategyNeeds,
  sharedStrategyAuthorName,
  sharedStrategyClientKey,
  sharedStrategyDeckSlug,
  sharedStrategyOwnerDid,
  sharedStrategySupportsNeed,
  sharedStrategyToNeedStrategy,
} from './sharedStrategyModel';

describe('shared strategy model', () => {
  it('normalizes need titles, slugs, and object references to canonical slugs', () => {
    const strategy: SharedFeedStrategy = {
      id: 42,
      needIds: ['Safety', { slug: 'clarity' }, { title: 'Safety' }],
    };
    expect(normalizeSharedStrategyNeeds(strategy)).toEqual(['safety', 'clarity']);
    expect(sharedStrategySupportsNeed(strategy, 'safety')).toBe(true);
    expect(sharedStrategySupportsNeed(strategy, 'connection')).toBe(false);
  });

  it('keeps backend identity separate from display attribution', () => {
    const strategy: SharedFeedStrategy = {
      id: '99',
      authorDid: 'did:plc:owner',
      clientKey: 'inv-owned-strategy',
      author: { displayName: 'Person', handle: 'person.example', did: 'did:plc:nested' },
      title: 'Try the familiar thing',
      body: 'Use something familiar when that helps.',
      needIds: ['safety'],
    };
    expect(sharedStrategyOwnerDid(strategy)).toBe('did:plc:owner');
    expect(sharedStrategyClientKey(strategy)).toBe('inv-owned-strategy');
    expect(sharedStrategyAuthorName(strategy)).toBe('Person');
    expect(sharedStrategyDeckSlug(strategy)).toBe('community-99');
    expect(sharedStrategyToNeedStrategy(strategy)).toMatchObject({
      slug: 'community-99',
      provenance: 'user',
      contributor: { name: 'Person' },
      supportedNeeds: [{ slug: 'safety', title: 'Safety' }],
    });
  });
});
