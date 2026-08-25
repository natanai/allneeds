import type { Strategy } from '../../domain/models';
import { LEGACY_STORAGE_KEYS } from '../../persistence/legacy/keys';
import { getBrowserStorage } from '../../persistence/storage';
import type { StorageDriver } from '../../persistence/storage';
import { VersionedStore } from '../../persistence/versionedStore';

export const INVENTORY_STORAGE_KEY = 'allneeds.v2.inventory';
export const INVENTORY_CHANGED_EVENT = 'allneeds:inventory-changed';

export type InventoryVisibility = 'private' | 'followers' | 'public';

export interface InventoryStrategy {
  id: string;
  title: string;
  description: string;
  need: string;
  needSlug: string;
  needSlugs: string[];
  tags: string[];
  personal: boolean;
  /** @deprecated Compatibility mirror. Public visibility is the canonical Nat-export signal. */
  shareWithNat: boolean;
  sourceNeedPage: string;
  strategySlug: string;
  createdAt: string;
  visibility: InventoryVisibility;
  contributor?: {
    name?: string;
    location?: string;
  };
  firstName?: string;
  location?: string;
}

type InventoryData = { items: InventoryStrategy[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function strings(value: unknown): string[] {
  const values = Array.isArray(value) ? value.flat(2) : [value];
  return [...new Set(values
    .map((entry) => typeof entry === 'string' ? entry.trim().toLocaleLowerCase() : '')
    .filter(Boolean))];
}

function visibility(value: unknown): InventoryVisibility {
  return value === 'followers' || value === 'public' ? value : 'private';
}

function normalizeEntry(value: unknown): InventoryStrategy | null {
  if (!isRecord(value)) return null;
  const title = typeof value.title === 'string' ? value.title.trim() : '';
  if (!title) return null;
  const sourceNeedPage = typeof value.sourceNeedPage === 'string'
    ? value.sourceNeedPage.trim().toLocaleLowerCase()
    : '';
  const initialNeedSlug = typeof value.needSlug === 'string'
    ? value.needSlug.trim().toLocaleLowerCase()
    : sourceNeedPage;
  const needSlugs = strings([value.needSlugs, value.needs, initialNeedSlug]);
  const tags = strings([value.tags, needSlugs]);
  const rawContributor = isRecord(value.contributor) ? value.contributor : {};
  const firstName = typeof rawContributor.name === 'string'
    ? rawContributor.name.trim()
    : typeof value.firstName === 'string' ? value.firstName.trim() : '';
  const location = typeof rawContributor.location === 'string'
    ? rawContributor.location.trim()
    : typeof value.location === 'string' ? value.location.trim() : '';
  const contributor = firstName || location
    ? { ...(firstName ? { name: firstName } : {}), ...(location ? { location } : {}) }
    : undefined;
  const normalizedVisibility = visibility(value.visibility);

  return {
    id: typeof value.id === 'string' && value.id ? value.id : createId(),
    title,
    description: typeof value.description === 'string' ? value.description : '',
    need: typeof value.need === 'string' ? value.need.trim() : '',
    needSlug: needSlugs[0] ?? '',
    needSlugs,
    tags,
    personal: value.personal === true,
    shareWithNat: normalizedVisibility === 'public',
    sourceNeedPage,
    strategySlug: typeof value.strategySlug === 'string'
      ? value.strategySlug.trim().toLocaleLowerCase()
      : '',
    createdAt: typeof value.createdAt === 'string' && value.createdAt
      ? value.createdAt
      : new Date().toISOString(),
    visibility: normalizedVisibility,
    ...(contributor ? { contributor } : {}),
    ...(firstName ? { firstName } : {}),
    ...(location ? { location } : {}),
  };
}

function isInventoryStrategy(value: unknown): value is InventoryStrategy {
  const normalized = normalizeEntry(value);
  return normalized !== null && isRecord(value)
    && typeof value.id === 'string'
    && typeof value.description === 'string'
    && Array.isArray(value.needSlugs)
    && Array.isArray(value.tags)
    && typeof value.createdAt === 'string';
}

function isInventoryData(value: unknown): value is InventoryData {
  return isRecord(value) && Array.isArray(value.items) && value.items.every(isInventoryStrategy);
}

function createStore(storage: StorageDriver | null) {
  return new VersionedStore<InventoryData>({
    key: INVENTORY_STORAGE_KEY,
    schemaVersion: 1,
    storage,
    validate: isInventoryData,
  });
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `inv_${Date.now().toString(36)}_${Math.random().toString(16).slice(2)}`;
}

function readLegacy(storage: StorageDriver): InventoryStrategy[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(LEGACY_STORAGE_KEYS.inventory) ?? 'null');
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeEntry).filter((entry): entry is InventoryStrategy => entry !== null);
  } catch {
    return [];
  }
}

export function readInventory(storage: StorageDriver | null = getBrowserStorage()): InventoryStrategy[] {
  if (!storage) return [];
  const store = createStore(storage);
  const stored = store.read();
  if (stored.status === 'ready') {
    return stored.value.items
      .map(normalizeEntry)
      .filter((entry): entry is InventoryStrategy => entry !== null);
  }
  if (stored.status !== 'empty') return [];

  const legacyItems = readLegacy(storage);
  if (legacyItems.length) store.write({ items: legacyItems });
  return legacyItems;
}

function emitInventoryChanged(count: number) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(INVENTORY_CHANGED_EVENT, { detail: { count } }));
  }
}

export function writeInventory(
  items: InventoryStrategy[],
  storage: StorageDriver | null = getBrowserStorage(),
) {
  const normalizedItems = items
    .map(normalizeEntry)
    .filter((entry): entry is InventoryStrategy => entry !== null);
  if (!storage) return normalizedItems;
  createStore(storage).write({ items: normalizedItems });
  emitInventoryChanged(normalizedItems.length);
  return normalizedItems;
}

export function isDuplicateStrategy(items: InventoryStrategy[], title: string, needSlugs: string[]) {
  const normalizedTitle = title.trim().toLocaleLowerCase();
  const requested = new Set(strings(needSlugs));
  return items.some((item) => item.title.trim().toLocaleLowerCase() === normalizedTitle
    && item.needSlugs.some((slug) => requested.has(slug)));
}

export function inventoryHasStrategy(items: InventoryStrategy[], strategySlug: string) {
  const normalized = strategySlug.trim().toLocaleLowerCase();
  return Boolean(normalized && items.some((item) => item.strategySlug === normalized));
}

type CatalogEntryInput = {
  strategy: Strategy;
  needSlug: string;
  needTitle: string;
};

export function createCatalogInventoryEntry({
  strategy,
  needSlug,
  needTitle,
}: CatalogEntryInput): InventoryStrategy {
  const needSlugs = strings([strategy.supportedNeeds.map((need) => need.slug), needSlug]);
  const contributor = strategy.contributor && (strategy.contributor.name || strategy.contributor.location)
    ? strategy.contributor
    : undefined;
  return {
    id: createId(),
    title: strategy.title,
    description: strategy.summary,
    need: needTitle,
    needSlug: needSlugs[0] ?? needSlug,
    needSlugs,
    tags: needSlugs,
    personal: false,
    shareWithNat: false,
    sourceNeedPage: needSlug,
    strategySlug: strategy.slug,
    createdAt: new Date().toISOString(),
    visibility: 'private',
    ...(contributor ? { contributor } : {}),
    ...(contributor?.name ? { firstName: contributor.name } : {}),
    ...(contributor?.location ? { location: contributor.location } : {}),
  };
}

export type PersonalStrategyInput = {
  title: string;
  description: string;
  needSlugs: string[];
  needTitle: string;
  firstName?: string;
  location?: string;
  visibility?: InventoryVisibility;
  /** @deprecated Use visibility='public'. Retained for old callers during migration. */
  shareWithNat?: boolean;
};

export function createPersonalInventoryEntry(input: PersonalStrategyInput): InventoryStrategy {
  const needSlugs = strings(input.needSlugs);
  const firstName = input.firstName?.trim() ?? '';
  const location = input.location?.trim() ?? '';
  const contributor = firstName || location
    ? { ...(firstName ? { name: firstName } : {}), ...(location ? { location } : {}) }
    : undefined;
  const requestedVisibility = visibility(input.visibility);
  const resolvedVisibility: InventoryVisibility = input.shareWithNat === true
    ? 'public'
    : requestedVisibility;
  return {
    id: createId(),
    title: input.title.trim(),
    description: input.description.trim(),
    need: input.needTitle,
    needSlug: needSlugs[0] ?? '',
    needSlugs,
    tags: needSlugs,
    personal: true,
    shareWithNat: resolvedVisibility === 'public',
    sourceNeedPage: '',
    strategySlug: '',
    createdAt: new Date().toISOString(),
    visibility: resolvedVisibility,
    ...(contributor ? { contributor } : {}),
    ...(firstName ? { firstName } : {}),
    ...(location ? { location } : {}),
  };
}

export function createSharedInventoryEntry(input: {
  id: string;
  title: string;
  description: string;
  needSlugs: string[];
  visibility?: InventoryVisibility;
  contributor?: { name?: string; location?: string };
}): InventoryStrategy {
  const needSlugs = strings(input.needSlugs);
  const contributor = input.contributor && (input.contributor.name || input.contributor.location)
    ? input.contributor
    : undefined;
  return {
    id: createId(),
    title: input.title.trim() || 'Untitled strategy',
    description: input.description.trim(),
    need: '',
    needSlug: needSlugs[0] ?? '',
    needSlugs,
    tags: needSlugs,
    personal: false,
    shareWithNat: false,
    sourceNeedPage: '',
    strategySlug: input.id.trim().toLocaleLowerCase(),
    createdAt: new Date().toISOString(),
    visibility: visibility(input.visibility),
    ...(contributor ? { contributor } : {}),
    ...(contributor?.name ? { firstName: contributor.name } : {}),
    ...(contributor?.location ? { location: contributor.location } : {}),
  };
}
