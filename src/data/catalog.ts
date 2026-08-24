import {
  fauxFeelings as runtimeFauxFeelings,
  feelings as runtimeFeelings,
  needs as runtimeNeeds,
  strategies as runtimeStrategies,
} from 'virtual:allneeds-runtime-catalog';
import type { FauxFeeling, Feeling, Need, Strategy } from '../domain/models';

export const catalogProvenance = {
  repository: 'natanai/nvc-app',
  branch: 'performance/immediate-response-v1',
  commit: '7fb6b397d35efc3ceb9cca99aac9a93ddcf18ca3',
  importedAt: '2026-08-23',
} as const;

export const feelings: Feeling[] = runtimeFeelings;
export const needs: Need[] = runtimeNeeds;
export const fauxFeelings: FauxFeeling[] = runtimeFauxFeelings;
export const strategies: Strategy[] = runtimeStrategies;

export const feelingsBySlug = new Map(feelings.map((feeling) => [feeling.slug, feeling]));
export const needsBySlug = new Map(needs.map((need) => [need.slug, need]));
export const fauxFeelingsBySlug = new Map(fauxFeelings.map((feeling) => [feeling.slug, feeling]));
export const strategiesBySlug = new Map(strategies.map((strategy) => [strategy.slug, strategy]));

export function assetPath(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
