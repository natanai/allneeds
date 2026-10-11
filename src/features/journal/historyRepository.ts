import { getBrowserStorage, type StorageDriver } from '../../persistence/storage';
import { VersionedStore } from '../../persistence/versionedStore';
import type { HistorySettings } from './historyModel';

export type HistoryAnnotation = { id: string; date: string; label: string };
export const HISTORY_ANNOTATIONS_KEY = 'allneeds.v2.journal.annotations';
// Version the transient view so the two-coordinate graph becomes the default
// instead of inheriting the former feeling-intensity default in an open tab.
const sessionKey = 'allneeds:history-view:2';
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function sessionStorage(): StorageDriver | null { try { return typeof window === 'undefined' ? null : window.sessionStorage; } catch { return null; } }
export function readHistorySettings(defaults: HistorySettings, storage = sessionStorage()): HistorySettings {
  try {
    const value: unknown = JSON.parse(storage?.getItem(sessionKey) ?? 'null');
    if (!record(value)) return defaults;
    const result = { ...defaults };
    for (const key of ['from', 'to', 'query', 'feelingFilter', 'need', 'tag'] as const) if (typeof value[key] === 'string') result[key] = value[key];
    if (value.metric === 'mood' || value.metric === 'intensity' || value.metric === 'frequency') result.metric = value.metric;
    if (value.grouping === 'entry' || value.grouping === 'day' || value.grouping === 'week') result.grouping = value.grouping;
    if (value.period === '7' || value.period === '30' || value.period === '90' || value.period === 'all' || value.period === 'custom') result.period = value.period;
    if (value.sort === 'newest' || value.sort === 'oldest' || value.sort === 'highest' || value.sort === 'lowest') result.sort = value.sort;
    if (Array.isArray(value.feelings) && value.feelings.every((item) => typeof item === 'string')) result.feelings = value.feelings.slice(0, 3);
    if (typeof value.comparison === 'boolean') result.comparison = value.comparison;
    if (typeof value.showAnnotations === 'boolean') result.showAnnotations = value.showAnnotations;
    if (typeof value.minIntensity === 'number') result.minIntensity = Math.max(1, Math.min(10, Math.round(value.minIntensity)));
    if (typeof value.maxIntensity === 'number') result.maxIntensity = Math.max(result.minIntensity, Math.min(10, Math.round(value.maxIntensity)));
    return result;
  } catch { return defaults; }
}
export function writeHistorySettings(settings: HistorySettings, storage = sessionStorage()) { try { storage?.setItem(sessionKey, JSON.stringify(settings)); } catch { /* View controls still work in restricted sessions. */ } }
function annotationStore(storage: StorageDriver | null) {
  return new VersionedStore<{ annotations: HistoryAnnotation[] }>({ key: HISTORY_ANNOTATIONS_KEY, schemaVersion: 1, storage,
    validate: (value): value is { annotations: HistoryAnnotation[] } => record(value) && Array.isArray(value.annotations) && value.annotations.every((item) => record(item) && typeof item.id === 'string' && typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && typeof item.label === 'string'),
  });
}
export function readHistoryAnnotations(storage = getBrowserStorage()) { const result = annotationStore(storage).read(); return result.status === 'ready' ? result.value.annotations : []; }
export function writeHistoryAnnotations(annotations: HistoryAnnotation[], storage = getBrowserStorage()) { if (!storage) throw new Error('Device storage is unavailable.'); annotationStore(storage).write({ annotations }); return annotations; }
