import { describe, expect, it } from 'vitest';

import editorialCatalog from './editorialCatalog.json';
import legacyData from './generated/legacyData.json';

function hasCompleteCanonicalOwnership(need: (typeof editorialCatalog.needs)[string]) {
  return typeof need.title === 'string'
    && Number.isInteger(need.catalogOrder)
    && Array.isArray(need.feelings)
    && Array.isArray(need.fauxFeelings);
}

describe('canonical Need legacy retirement', () => {
  it('requires every reviewed editorial Need to own its complete entity record', () => {
    for (const [slug, need] of Object.entries(editorialCatalog.needs)) {
      expect(hasCompleteCanonicalOwnership(need), `${slug} must have complete canonical entity ownership`).toBe(true);
    }
  });

  it('keeps every complete canonical Need physically out of legacyData.json', () => {
    const legacyNeedSlugs = new Set(legacyData.needs.map((need) => need.slug));

    for (const [slug, need] of Object.entries(editorialCatalog.needs)) {
      if (!hasCompleteCanonicalOwnership(need)) continue;
      expect(legacyNeedSlugs.has(slug), `${slug} must be physically retired from legacyData.json`).toBe(false);
    }
  });
});
