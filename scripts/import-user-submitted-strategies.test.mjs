import { describe, expect, it } from 'vitest';

import {
  normalizeSubmittedStrategy,
  strategyKey,
} from './import-user-submitted-strategies.mjs';

const validNeeds = new Map([
  ['rest', 'Rest'],
  ['connection', 'Connection'],
]);

describe('user submitted strategy importer', () => {
  it('normalizes the exported personal strategy shape', () => {
    expect(normalizeSubmittedStrategy({
      title: '  Take a quiet walk  ',
      description: ' Step outside for ten minutes. ',
      needSlugs: ['connection', 'rest', 'rest'],
      contributor: { name: ' Sam ', location: ' KC ' },
    }, validNeeds)).toEqual({
      title: 'Take a quiet walk',
      summary: 'Step outside for ten minutes.',
      needSlugs: ['connection', 'rest'],
      contributor: { name: 'Sam', location: 'KC' },
    });
  });

  it('rejects unknown need slugs before anything can be published', () => {
    expect(() => normalizeSubmittedStrategy({
      title: 'Example',
      description: 'Example description',
      needSlugs: ['not-a-real-need'],
    }, validNeeds)).toThrow(/unknown need slug/i);
  });

  it('treats a published strategy and a rerun export as duplicates despite harmless formatting differences', () => {
    const published = strategyKey({
      title: 'Take a quiet walk',
      summary: 'Step outside for ten minutes.',
      needs: [
        { slug: 'rest', title: 'Rest' },
        { slug: 'connection', title: 'Connection' },
      ],
    });
    const exportedAgain = strategyKey({
      title: ' TAKE A QUIET WALK ',
      description: '  Step outside for ten minutes. ',
      needSlugs: ['connection', 'rest'],
    });
    expect(exportedAgain).toBe(published);
  });
});
