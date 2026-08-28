import {
  fauxFeelings,
  fauxFeelingsBySlug,
  feelings,
  feelingsBySlug,
  needs,
  needsBySlug,
} from '../../data/catalog';
import type { EntityRef } from '../../domain/models';

// @ts-expect-error The current Observation detector is canonical legacy JavaScript pending its own migration.
import { lintObservation } from '../../legacy/observations/nvcLint.js';

type ObservationLint = {
  feelings?: string[];
  needs?: string[];
  fauxFeelings?: string[];
};

const detectorCatalog = {
  feelings: new Map(feelings.map((item) => [item.slug, item])),
  needs: new Map(needs.map((item) => [item.slug, item])),
  fauxFeelings: new Map(fauxFeelings.map((item) => [item.slug, item])),
};

export type ObservationTermMatches = {
  feelings: EntityRef[];
  needs: EntityRef[];
  fauxFeelings: EntityRef[];
};

export function detectObservationTerms(text: string): ObservationTermMatches {
  if (!text.trim()) return { feelings: [], needs: [], fauxFeelings: [] };
  const result = lintObservation(text, detectorCatalog) as ObservationLint;
  return {
    feelings: (result.feelings ?? []).flatMap((slug) => {
      const item = feelingsBySlug.get(slug);
      return item ? [{ slug: item.slug, title: item.title }] : [];
    }),
    needs: (result.needs ?? []).flatMap((slug) => {
      const item = needsBySlug.get(slug);
      return item ? [{ slug: item.slug, title: item.title }] : [];
    }),
    fauxFeelings: (result.fauxFeelings ?? []).flatMap((slug) => {
      const item = fauxFeelingsBySlug.get(slug);
      return item ? [{ slug: item.slug, title: item.title }] : [];
    }),
  };
}
