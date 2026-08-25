/// <reference types="vitest/config" />

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

type EntityRef = { slug: string; title: string };
type EvidenceSource = { url: string; description?: string };
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
  summary: string;
  narrative: string;
  sources: EvidenceSource[];
  strategies: EntityRef[];
};
type EditorialCatalog = {
  needs: Record<string, EditorialNeed>;
  strategies: CatalogStrategySource[];
  strategyProvenance?: Record<string, StrategyProvenance>;
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

function runtimeCatalogSource() {
  const legacy = JSON.parse(readFileSync(legacyCatalogPath, 'utf8')) as LegacyCatalog;
  const editorial = JSON.parse(readFileSync(editorialCatalogPath, 'utf8')) as EditorialCatalog;
  const userStrategies = JSON.parse(readFileSync(userStrategiesPath, 'utf8')) as CatalogStrategySource[];
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

  const needs = legacy.needs.map((need) => {
    const override = editorial.needs[need.slug];
    const strategies = [...(override?.strategies ?? need.strategies ?? [])];
    (addedStrategyRefsByNeed.get(need.slug) ?? []).forEach((reference) => {
      if (!strategies.some((candidate) => candidate.slug === reference.slug)) {
        strategies.push(reference);
      }
    });

    return {
      slug: need.slug,
      title: need.title,
      category: need.category,
      summary: override?.summary ?? need.description ?? need.originalClaim ?? '',
      feelings: need.feelings ?? [],
      fauxFeelings: need.fauxFeelings ?? [],
      strategies,
      evidence: {
        claimSummary: override?.summary ?? need.originalClaim,
        narrative: override?.narrative ?? need.rewrittenClaim,
        sources: override?.sources ?? need.supportingSources ?? [],
      },
    };
  });

  const fauxFeelings = legacy.fauxFeelings.map((feeling) => ({
    slug: feeling.slug,
    title: feeling.title,
    feelings: feeling.feelings ?? [],
    needs: feeling.needs ?? [],
  }));

  const userStrategySlugs = new Set(userStrategies.map((strategy) => strategy.slug));
  const strategySources = new Map<string, CatalogStrategySource>();
  legacy.strategies.forEach((strategy) => strategySources.set(strategy.slug, strategy));
  editorial.strategies.forEach((strategy) => strategySources.set(strategy.slug, strategy));
  userStrategies.forEach((strategy) => strategySources.set(strategy.slug, strategy));

  const strategies = [...strategySources.values()].map((strategy) => {
    const contributor = normalizedContributor(strategy);
    const provenance = userStrategySlugs.has(strategy.slug)
      ? 'user'
      : strategy.provenance
        ?? editorial.strategyProvenance?.[strategy.slug]
        ?? (contributor ? 'user' : 'system');

    return {
      slug: strategy.slug,
      title: strategy.title,
      summary: strategy.summary || strategy.description || '',
      supportedNeeds: strategy.needs ?? [],
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
      'node_modules/**',
      'dist/**',
      'legacy-nvc-app/**',
      '.nvc-current-*/**',
      '.codex-publish-*/**',
    ],
  },
});
