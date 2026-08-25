import { describe, expect, it } from 'vitest';

import {
  normalizeSubmittedStrategy,
  strategyKey,
} from './import-user-submitted-strategies.mjs';

const validNeeds = new Set(['rest', 'connection']);

describe('user submitted strategy importer', () => {
  it('normalizes the V2/legacy personal strategy export shape', () => {
    expect(normalizeSubmittedStrategy({
      title: '  Take a quiet walk  ',
      description: ' Step outside for ten minutes. ',
      needSlugs: ['connection', 'rest', 'rest'],
      contributor: { name: ' Sam ', location: ' KC ' },
    }, validNeeds, '2026-08-25T00:00:00.000Z')).toEqual({
      title: 'Take a quiet walk',
      summary: 'Step outside for ten minutes.',
      needSlugs: ['connection', 'rest'],
      submittedAt: '2026-08-25T00:00:00.000Z',
      contributor: { name: 'Sam', location: 'KC' },
    });
  });

  it('rejects unknown need slugs before anything can be published', () => {
    expect(() => normalizeSubmittedStrategy({
      title: 'Example',
      description: 'Example description',
      needSlugs: ['not-a-real-need'],
    }, validNeeds, '2026-08-25T00:00:00.000Z')).toThrow(/unknown need slug/i);
  });

  it('treats reordered needs and harmless whitespace/case differences as the same strategy', () => {
    const first = strategyKey({
      title: 'Take a quiet walk',
      summary: 'Step outside for ten minutes.',
      needSlugs: ['rest', 'connection'],
    });
    const second = strategyKey({
      title: ' TAKE A QUIET WALK ',
      description: '  Step outside for ten minutes. ',
      needSlugs: ['connection', 'rest'],
    });
    expect(second).toBe(first);
  });
});
