/// <reference types="vitest/config" />

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

type EntityRef = { slug: string; title: string };
type CatalogStrategySource = {
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  needs?: EntityRef[];
  contributor?: { name?: string; location?: string };
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
    supportingSources?: Array<{ url: string; description?: string }>;
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

const runtimeCatalogId = 'virtual:allneeds-runtime-catalog';
const resolvedRuntimeCatalogId = `\0${runtimeCatalogId}`;
const legacyCatalogPath = resolve('src/data/generated/legacyData.json');
const userStrategiesPath = resolve('src/data/userStrategies.json');

function runtimeCatalogSource() {
  const legacy = JSON.parse(readFileSync(legacyCatalogPath, 'utf8')) as LegacyCatalog;
  const userStrategies = JSON.parse(readFileSync(userStrategiesPath, 'utf8')) as CatalogStrategySource[];
  const userStrategyRefsByNeed = new Map<string, EntityRef[]>();

  userStrategies.forEach((strategy) => {
    const reference = { slug: strategy.slug, title: strategy.title };
    (strategy.needs ?? []).forEach((need) => {
      const references = userStrategyRefsByNeed.get(need.slug) ?? [];
      if (!references.some((candidate) => candidate.slug === reference.slug)) {
        references.push(reference);
      }
      userStrategyRefsByNeed.set(need.slug, references);
    });
  });

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
    const strategies = [...(need.strategies ?? [])];
    (userStrategyRefsByNeed.get(need.slug) ?? []).forEach((reference) => {
      if (!strategies.some((candidate) => candidate.slug === reference.slug)) {
        strategies.push(reference);
      }
    });

    return {
      slug: need.slug,
      title: need.title,
      category: need.category,
      summary: need.description || need.originalClaim || '',
      feelings: need.feelings ?? [],
      fauxFeelings: need.fauxFeelings ?? [],
      strategies,
      evidence: {
        claimSummary: need.originalClaim,
        narrative: need.rewrittenClaim,
        sources: need.supportingSources ?? [],
      },
    };
  });
  const fauxFeelings = legacy.fauxFeelings.map((feeling) => ({
    slug: feeling.slug,
    title: feeling.title,
    feelings: feeling.feelings ?? [],
    needs: feeling.needs ?? [],
  }));
  const strategies = [...legacy.strategies, ...userStrategies].map((strategy) => ({
    slug: strategy.slug,
    title: strategy.title,
    summary: strategy.summary || strategy.description || '',
    supportedNeeds: strategy.needs ?? [],
    contributor: strategy.contributor,
  }));

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
