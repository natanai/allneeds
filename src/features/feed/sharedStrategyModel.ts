import { needs, needsBySlug } from '../../data/catalog';
import type { EntityRef, Strategy } from '../../domain/models';
import type { SharedFeedStrategy } from '../../app/appResources';

const needSlugByTitle = new Map(
  needs.map((need) => [need.title.trim().toLocaleLowerCase(), need.slug]),
);

function normalizeNeedReference(value: unknown) {
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) return '';
    const lower = normalized.toLocaleLowerCase();
    if (needsBySlug.has(lower)) return lower;
    return needSlugByTitle.get(lower) ?? lower;
  }
  if (!value || typeof value !== 'object') return '';
  const record = value as Record<string, unknown>;
  if (typeof record.slug === 'string' && record.slug.trim()) {
    return normalizeNeedReference(record.slug);
  }
  if (typeof record.title === 'string' && record.title.trim()) {
    return normalizeNeedReference(record.title);
  }
  return '';
}

export function normalizeSharedStrategyNeeds(strategy: SharedFeedStrategy) {
  const raw = Array.isArray(strategy.needIds) ? strategy.needIds
    : Array.isArray(strategy.supportsNeeds) ? strategy.supportsNeeds
      : Array.isArray(strategy.needs) ? strategy.needs : [];
  return [...new Set(raw.map(normalizeNeedReference).filter(Boolean))];
}

export function sharedStrategySupportsNeed(strategy: SharedFeedStrategy, needSlug: string) {
  const normalizedNeed = needSlug.trim().toLocaleLowerCase();
  return Boolean(normalizedNeed && normalizeSharedStrategyNeeds(strategy).includes(normalizedNeed));
}

export function sharedStrategyOwnerDid(strategy: SharedFeedStrategy) {
  const topLevel = typeof strategy.authorDid === 'string' ? strategy.authorDid.trim() : '';
  const nested = typeof strategy.author?.did === 'string' ? strategy.author.did.trim() : '';
  return topLevel || nested;
}

export function sharedStrategyAuthorName(strategy: SharedFeedStrategy) {
  return strategy.author?.displayName?.trim()
    || strategy.author?.handle?.trim()
    || sharedStrategyOwnerDid(strategy)
    || '';
}

export function sharedStrategyDeckSlug(strategy: SharedFeedStrategy) {
  return `community-${String(strategy.id).trim().toLocaleLowerCase()}`;
}

export function sharedStrategyToNeedStrategy(strategy: SharedFeedStrategy): Strategy {
  const supportedNeeds: EntityRef[] = normalizeSharedStrategyNeeds(strategy).map((slug) => {
    const need = needsBySlug.get(slug);
    return { slug, title: need?.title ?? slug };
  });
  const contributorName = sharedStrategyAuthorName(strategy);
  return {
    slug: sharedStrategyDeckSlug(strategy),
    title: strategy.title?.trim() || 'Untitled strategy',
    summary: strategy.body || '',
    supportedNeeds,
    provenance: 'user',
    ...(contributorName ? { contributor: { name: contributorName } } : {}),
  };
}

export function sharedStrategyContentKey(strategy: Pick<Strategy, 'title' | 'summary' | 'supportedNeeds'>) {
  const needsKey = [...new Set(strategy.supportedNeeds.map((need) => need.slug.trim().toLocaleLowerCase()).filter(Boolean))]
    .sort()
    .join('|');
  return [strategy.title.trim().toLocaleLowerCase(), strategy.summary.trim(), needsKey].join('\u0000');
}
