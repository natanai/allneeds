import rawLegacyData from './generated/legacyData.json';
import type {
  EntityRef,
  FauxFeeling,
  Feeling,
  Need,
  Strategy,
} from '../domain/models';

type LegacyFeeling = {
  title: string;
  slug: string;
  description: string;
  needSatisfaction: Feeling['needSatisfaction'];
  bodySignals?: string[];
  needs?: EntityRef[];
  fauxFeelings?: EntityRef[];
  poemQuote?: string;
  poemUrl?: string;
};

type LegacyNeed = {
  title: string;
  slug: string;
  category?: string;
  description?: string;
  originalClaim?: string;
  rewrittenClaim?: string;
  supportingSources?: Array<{ url: string; description?: string }>;
  feelings?: EntityRef[];
  fauxFeelings?: EntityRef[];
  strategies?: EntityRef[];
};

type LegacyFauxFeeling = {
  title: string;
  slug: string;
  feelings?: EntityRef[];
  needs?: EntityRef[];
};

type LegacyStrategy = {
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  needs?: EntityRef[];
  contributor?: { name?: string; location?: string };
};

type LegacyData = {
  feelings: LegacyFeeling[];
  needs: LegacyNeed[];
  fauxFeelings: LegacyFauxFeeling[];
  strategies: LegacyStrategy[];
};

const legacyData = rawLegacyData as LegacyData;

export const catalogProvenance = {
  repository: 'natanai/nvc-app',
  branch: 'performance/immediate-response-v1',
  commit: '7fb6b397d35efc3ceb9cca99aac9a93ddcf18ca3',
  importedAt: '2026-08-23',
} as const;

export const feelings: Feeling[] = legacyData.feelings.map((feeling) => ({
  slug: feeling.slug,
  title: feeling.title,
  summary: feeling.description,
  needSatisfaction: feeling.needSatisfaction,
  bodySignals: feeling.bodySignals ?? [],
  needs: feeling.needs ?? [],
  fauxFeelings: feeling.fauxFeelings ?? [],
  ...(feeling.poemQuote
    ? { poem: { quotation: feeling.poemQuote, ...(feeling.poemUrl ? { url: feeling.poemUrl } : {}) } }
    : {}),
}));

export const needs: Need[] = legacyData.needs.map((need) => ({
  slug: need.slug,
  title: need.title,
  category: need.category,
  summary: need.description || need.originalClaim || '',
  feelings: need.feelings ?? [],
  fauxFeelings: need.fauxFeelings ?? [],
  strategies: need.strategies ?? [],
  evidence: {
    claimSummary: need.originalClaim,
    narrative: need.rewrittenClaim,
    sources: need.supportingSources ?? [],
  },
}));

export const fauxFeelings: FauxFeeling[] = legacyData.fauxFeelings.map((feeling) => ({
  slug: feeling.slug,
  title: feeling.title,
  feelings: feeling.feelings ?? [],
  needs: feeling.needs ?? [],
}));

export const strategies: Strategy[] = legacyData.strategies.map((strategy) => ({
  slug: strategy.slug,
  title: strategy.title,
  summary: strategy.summary || strategy.description || '',
  supportedNeeds: strategy.needs ?? [],
  contributor: strategy.contributor,
}));

export const feelingsBySlug = new Map(feelings.map((feeling) => [feeling.slug, feeling]));
export const needsBySlug = new Map(needs.map((need) => [need.slug, need]));
export const fauxFeelingsBySlug = new Map(fauxFeelings.map((feeling) => [feeling.slug, feeling]));
export const strategiesBySlug = new Map(strategies.map((strategy) => [strategy.slug, strategy]));

export function assetPath(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
