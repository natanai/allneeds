/// <reference types="vitest/config" />

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

type EntityRef = { slug: string; title: string };
type SupportingSourceKind = 'scholarly' | 'clinical-guidance' | 'official-resource';
type EvidenceSource = { url: string; description?: string; kind?: SupportingSourceKind };
type EvidenceLens = {
  id: string;
  title: string;
  recognitionCue?: string;
  summary: string;
  narrative?: string;
  sources: EvidenceSource[];
};
type StrategyProvenance = 'system' | 'user';
type CatalogStrategySource = {
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  needs?: EntityRef[];
  contributor?: { name?: string; location?: string };
  contributorName?: string;
  contributorLocation?: string;
  provenance?: StrategyProvenance;
  evidence?: EvidenceSource;
};
type LegacyCatalog = {
  feelings: Array<{
    title: string;
    slug: string;
    description: string;
    needSatisfaction: 'met' | 'unmet' | 'both';
    bodySignals?: string[];
    needs?: EntityRef[];
    fauxFeelings?: EntityRef[];
    poemQuote?: string;
    poemUrl?: string;
  }>;
  needs: Array<{
    title: string;
    slug: string;
    category?: string;
    description?: string;
    originalClaim?: string;
    rewrittenClaim?: string;
    supportingSources?: EvidenceSource[];
    feelings?: EntityRef[];
    fauxFeelings?: EntityRef[];
    strategies?: EntityRef[];
  }>;
  fauxFeelings: Array<{
    title: string;
    slug: string;
    feelings?: EntityRef[];
    needs?: EntityRef[];
  }>;
  strategies: CatalogStrategySource[];
};
type EditorialNeed = {
  title?: string;
  category?: string;
  catalogOrder?: number;
  feelings?: EntityRef[];
  fauxFeelings?: EntityRef[];
  summary: string;
  narrative: string;
  sources: EvidenceSource[];
  strategies: EntityRef[];
  lenses?: EvidenceLens[];
};
type CanonicalEditorialNeed = EditorialNeed & {
  title: string;
  catalogOrder: number;
  feelings: EntityRef[];
  fauxFeelings: EntityRef[];
};
type EditorialCatalog = {
  needs: Record<string, EditorialNeed>;
  strategies: CatalogStrategySource[];
  strategyProvenance?: Record<string, StrategyProvenance>;
  discardedStrategySlugs?: string[];
  strategyNeedRemovals?: Record<string, string[]>;
};

const runtimeCatalogId = 'virtual:allneeds-runtime-catalog';
const resolvedRuntimeCatalogId = `\0${runtimeCatalogId}`;
const legacyCatalogPath = resolve('src/data/generated/legacyData.json');
const editorialCatalogPath = resolve('src/data/editorialCatalog.json');
const userStrategiesPath = resolve('src/data/userStrategies.json');

function normalizedContributor(strategy: CatalogStrategySource) {
  const name = strategy.contributor?.name?.trim() || strategy.contributorName?.trim() || undefined;
  const location = strategy.contributor?.location?.trim() || strategy.contributorLocation?.trim() || undefined;
  return name || location ? { name, location } : undefined;
}

function addStrategyReferences(
  strategies: CatalogStrategySource[],
  referencesByNeed: Map<string, EntityRef[]>,
) {
  strategies.forEach((strategy) => {
    const reference = { slug: strategy.slug, title: strategy.title };
    (strategy.needs ?? []).forEach((need) => {
      const references = referencesByNeed.get(need.slug) ?? [];
      if (!references.some((candidate) => candidate.slug === reference.slug)) {
        references.push(reference);
      }
      referencesByNeed.set(need.slug, references);
    });
  });
}

function editorialNeedOwnsEntity(need: EditorialNeed): need is CanonicalEditorialNeed {
  return typeof need.title === 'string'
    && typeof need.catalogOrder === 'number'
    && Array.isArray(need.feelings)
    && Array.isArray(need.fauxFeelings);
}

function runtimeCatalogSource() {
  const legacy = JSON.parse(readFileSync(legacyCatalogPath, 'utf8')) as LegacyCatalog;
  const editorial = JSON.parse(readFileSync(editorialCatalogPath, 'utf8')) as EditorialCatalog;
  const userStrategies = JSON.parse(readFileSync(userStrategiesPath, 'utf8')) as CatalogStrategySource[];
  const discardedStrategySlugs = new Set(editorial.discardedStrategySlugs ?? []);
  const removedNeedsByStrategy = new Map(
    Object.entries(editorial.strategyNeedRemovals ?? {}).map(([strategySlug, needSlugs]) => [
      strategySlug,
      new Set(needSlugs),
    ]),
  );
  const strategyAllowedForNeed = (strategySlug: string, needSlug: string) => (
    !discardedStrategySlugs.has(strategySlug)
    && !removedNeedsByStrategy.get(strategySlug)?.has(needSlug)
  );

  const addedStrategyRefsByNeed = new Map<string, EntityRef[]>();
  addStrategyReferences(editorial.strategies, addedStrategyRefsByNeed);
  addStrategyReferences(userStrategies, addedStrategyRefsByNeed);

  const feelings = legacy.feelings.map((feeling) => ({
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

  const canonicalEditorialNeeds = Object.entries(editorial.needs)
    .filter(([, need]) => editorialNeedOwnsEntity(need))
    .map(([slug, need]) => [slug, need] as [string, CanonicalEditorialNeed]);
  const canonicalEditorialNeedSlugs = new Set(canonicalEditorialNeeds.map(([slug]) => slug));
  const strategyReferencesForNeed = (needSlug: string, baseReferences: EntityRef[]) => {
    const strategies = [...baseReferences]
      .filter((reference) => strategyAllowedForNeed(reference.slug, needSlug));
    (addedStrategyRefsByNeed.get(needSlug) ?? []).forEach((reference) => {
      if (strategyAllowedForNeed(reference.slug, needSlug)
        && !strategies.some((candidate) => candidate.slug === reference.slug)) {
        strategies.push(reference);
      }
    });
    return strategies;
  };

  const legacyNeeds = legacy.needs
    .map((need, catalogOrder) => ({ need, catalogOrder }))
    .filter(({ need }) => !canonicalEditorialNeedSlugs.has(need.slug))
    .map(({ need, catalogOrder }) => {
      const override = editorial.needs[need.slug];
      return {
        catalogOrder,
        value: {
          slug: need.slug,
          title: need.title,
          category: need.category,
          summary: override?.summary ?? need.description ?? need.originalClaim ?? '',
          feelings: need.feelings ?? [],
          fauxFeelings: need.fauxFeelings ?? [],
          strategies: strategyReferencesForNeed(
            need.slug,
            override?.strategies ?? need.strategies ?? [],
          ),
          evidence: {
            claimSummary: override?.summary ?? need.originalClaim,
            narrative: override?.narrative ?? need.rewrittenClaim,
            sources: override?.sources ?? need.supportingSources ?? [],
            ...(override?.lenses?.length ? { lenses: override.lenses } : {}),
          },
        },
      };
    });

  const editorialNeeds = canonicalEditorialNeeds.map(([slug, need]) => ({
    catalogOrder: need.catalogOrder,
    value: {
      slug,
      title: need.title,
      category: need.category,
      summary: need.summary,
      feelings: need.feelings,
      fauxFeelings: need.fauxFeelings,
      strategies: strategyReferencesForNeed(slug, need.strategies),
      evidence: {
        claimSummary: need.summary,
        narrative: need.narrative,
        sources: need.sources,
        ...(need.lenses?.length ? { lenses: need.lenses } : {}),
      },
    },
  }));

  const needs = [...legacyNeeds, ...editorialNeeds]
    .sort((a, b) => a.catalogOrder - b.catalogOrder)
    .map(({ value }) => value);

  const fauxFeelings = legacy.fauxFeelings.map((feeling) => ({
    slug: feeling.slug,
    title: feeling.title,
    feelings: feeling.feelings ?? [],
    needs: feeling.needs ?? [],
  }));

  const userStrategySlugs = new Set(userStrategies.map((strategy) => strategy.slug));
  const strategySources = new Map<string, CatalogStrategySource>();
  legacy.strategies.forEach((strategy) => {
    if (!discardedStrategySlugs.has(strategy.slug)) strategySources.set(strategy.slug, strategy);
  });
  editorial.strategies.forEach((strategy) => {
    if (!discardedStrategySlugs.has(strategy.slug)) strategySources.set(strategy.slug, strategy);
  });
  userStrategies.forEach((strategy) => {
    if (!discardedStrategySlugs.has(strategy.slug)) strategySources.set(strategy.slug, strategy);
  });

  const strategies = [...strategySources.values()].map((strategy) => {
    const contributor = normalizedContributor(strategy);
    const provenance = userStrategySlugs.has(strategy.slug)
      ? 'user'
      : strategy.provenance
        ?? editorial.strategyProvenance?.[strategy.slug]
        ?? (contributor ? 'user' : 'system');
    const supportedNeeds = (strategy.needs ?? [])
      .filter((need) => strategyAllowedForNeed(strategy.slug, need.slug));

    return {
      slug: strategy.slug,
      title: strategy.title,
      summary: strategy.summary || strategy.description || '',
      supportedNeeds,
      provenance,
      ...(contributor ? { contributor } : {}),
      ...(strategy.evidence ? { evidence: strategy.evidence } : {}),
    };
  });

  return [
    `export const feelings = ${JSON.stringify(feelings)};`,
    `export const needs = ${JSON.stringify(needs)};`,
    `export const fauxFeelings = ${JSON.stringify(fauxFeelings)};`,
    `export const strategies = ${JSON.stringify(strategies)};`,
  ].join('\n');
}

function runtimeCatalogPlugin(): Plugin {
  return {
    name: 'allneeds-runtime-catalog',
    resolveId(id) {
      return id === runtimeCatalogId ? resolvedRuntimeCatalogId : null;
    },
    load(id) {
      if (id !== resolvedRuntimeCatalogId) return null;
      this.addWatchFile(legacyCatalogPath);
      this.addWatchFile(editorialCatalogPath);
      this.addWatchFile(userStrategiesPath);
      return runtimeCatalogSource();
    },
  };
}

export default defineConfig({
  plugins: [runtimeCatalogPlugin(), react()],
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    proxy: {
      '/allneeds-api': {
        target: 'https://backend.allneeds.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/allneeds-api/, '/api'),
      },
    },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
          if (id === resolvedRuntimeCatalogId) return 'catalog-data';
          return undefined;
        },
      },
    },
  },
  test: {
    exclude: [
      'tests/e2e/**',
      '**/node_modules/**',
      'dist/**',
      'legacy-nvc-app/**',
      '.nvc-current-*/**',
      '.codex-publish-*/**',
    ],
  },
});
