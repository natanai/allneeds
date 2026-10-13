import { LEGACY_STORAGE_KEYS } from '../../persistence/legacy/keys';
import { getBrowserStorage } from '../../persistence/storage';
import type { StorageDriver } from '../../persistence/storage';
import { VersionedStore } from '../../persistence/versionedStore';

export const JOURNAL_STORAGE_KEY = 'allneeds.v2.journal';
export const JOURNAL_CHANGED_EVENT = 'allneeds:journal-changed';

export interface JournalFeelingRating {
  feeling: string;
  intensity: number;
  /** Legacy labels without a reported number retain their old display value only. */
  ratingSource?: 'unknown';
}

export type JournalMood = {
  kind: 'rated';
  /** Valence: −5 is very unpleasant, +5 is very pleasant. */
  value: number;
  /** Arousal: −5 is very low activation, +5 is very high activation. */
  arousal?: number;
} | { kind: 'mixed' | 'unsure' };

export function normalizeJournalMood(value: unknown): JournalMood | undefined {
  if (!isRecord(value)) return undefined;
  if (value.kind === 'mixed' || value.kind === 'unsure') return { kind: value.kind };
  if (value.kind !== 'rated' || typeof value.value !== 'number' || !Number.isFinite(value.value)) return undefined;
  const arousal = typeof value.arousal === 'number' && Number.isFinite(value.arousal)
    ? Math.min(5, Math.max(-5, Math.round(value.arousal)))
    : undefined;
  return {
    kind: 'rated',
    value: Math.min(5, Math.max(-5, Math.round(value.value))),
    ...(arousal === undefined ? {} : { arousal }),
  };
}

export function journalDate(entry: JournalRecord) { return entry.experiencedAtISO ?? entry.dateISO; }

export interface JournalGuidedSupport {
  observation: string;
  terms: Array<{ label: string; role: 'feeling' | 'faux-feeling' | 'working' }>;
  statement: string;
  /** User-selected somatic clues, including their explicitly chosen intensity. */
  bodyClues?: Array<{ id: string; label: string; intensity: number }>;
  /** Original 0–1 support-lane clues; optional, independent of Journal mood. */
  overallRatings?: Partial<Record<'pleasantness' | 'energy' | 'power' | 'expectedness', number>>;
  bodyClear?: boolean;
  noWordYet?: boolean;
}

export interface JournalRecord {
  id: string;
  dateISO: string;
  createdAtISO?: string;
  experiencedAtISO?: string;
  mood?: JournalMood;
  emotion: string;
  intensity?: number;
  feelings: JournalFeelingRating[];
  needs: string[];
  tags: string[];
  notes: string;
  sensations: string[];
  strategies: string[];
  source: 'journal' | 'lane';
  guidedSupport?: JournalGuidedSupport;
}

type JournalDataWire = { entries: unknown[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function list(value: unknown, separator: RegExp = /[,|]/) {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(separator) : [];
  const seen = new Set<string>();
  return raw.map((item) => String(item).trim()).filter((item) => {
    const key = item.toLocaleLowerCase();
    if (!item || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scale(value: unknown, fallback?: number) {
  if (value === undefined || value === null || value === '') return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(10, Math.max(0, Math.round(number)));
}

function feelingRatings(value: unknown, fallbackEmotion: string, fallbackIntensity?: number) {
  const fallback = scale(fallbackIntensity, 5) ?? 5;
  const raw = Array.isArray(value) && value.length
    ? value
    : list(fallbackEmotion).map((feeling) => ({ feeling, intensity: fallback, ...(fallbackIntensity === undefined ? { ratingSource: 'unknown' } : {}) }));
  const normalized = new Map<string, JournalFeelingRating>();
  raw.forEach((item) => {
    const record = isRecord(item) ? item : null;
    const feelingValue = typeof item === 'string'
      ? item
      : record?.feeling ?? record?.emotion ?? record?.label ?? record?.name ?? record?.key;
    const feeling = typeof feelingValue === 'string' ? feelingValue.trim() : '';
    const reported = scale(record?.intensity ?? record?.level ?? record?.scale ?? record?.rating, fallbackIntensity);
    const intensity = reported ?? fallback;
    if (!feeling || !intensity) return;
    const key = feeling.toLocaleLowerCase();
    const current = normalized.get(key);
    const unknown = record?.ratingSource === 'unknown' || reported === undefined;
    if (!current || (current.ratingSource === 'unknown' && !unknown)
      || ((current.ratingSource === 'unknown') === unknown && intensity > current.intensity)) normalized.set(key, { feeling, intensity,
      ...(unknown ? { ratingSource: 'unknown' as const } : {}),
    });
  });
  return [...normalized.values()];
}

function guidedSupport(value: unknown): JournalGuidedSupport | undefined {
  if (!isRecord(value)
    || typeof value.observation !== 'string'
    || typeof value.statement !== 'string'
    || !Array.isArray(value.terms)) return undefined;
  const terms: JournalGuidedSupport['terms'] = value.terms.flatMap((term) => {
    if (!isRecord(term) || typeof term.label !== 'string') return [];
    const role = term.role;
    if (role !== 'feeling' && role !== 'faux-feeling' && role !== 'working') return [];
    const label = term.label.trim();
    return label ? [{ label, role }] : [];
  });
  const bodyClues = Array.isArray(value.bodyClues) ? value.bodyClues.flatMap((clue) => {
    if (!isRecord(clue) || typeof clue.id !== 'string' || typeof clue.label !== 'string'
      || typeof clue.intensity !== 'number' || !Number.isFinite(clue.intensity)) return [];
    return [{ id: clue.id.trim(), label: clue.label.trim(), intensity: Math.min(100, Math.max(0, clue.intensity)) }];
  }).filter((clue) => clue.id && clue.label && clue.intensity > 0) : [];
  const dimensionKeys = ['pleasantness', 'energy', 'power', 'expectedness'];
  const overallRatings = isRecord(value.overallRatings) ? Object.fromEntries(
    Object.entries(value.overallRatings).filter(([key, rating]) =>
      dimensionKeys.includes(key) && typeof rating === 'number' && Number.isFinite(rating),
    ).map(([key, rating]) => [key, Math.min(1, Math.max(0, rating as number))]),
  ) as NonNullable<JournalGuidedSupport['overallRatings']> : {};
  return {
    observation: value.observation.trim(),
    terms,
    statement: value.statement.trim(),
    ...(bodyClues.length ? { bodyClues } : {}),
    ...(Object.keys(overallRatings).length ? { overallRatings } : {}),
    ...(value.bodyClear === true ? { bodyClear: true } : {}),
    ...(value.noWordYet === true ? { noWordYet: true } : {}),
  };
}

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `journal_${Date.now().toString(36)}_${Math.random().toString(16).slice(2)}`;
}

function normalize(value: unknown): JournalRecord | null {
  if (!isRecord(value)) return null;
  const rawDate = value.dateISO ?? value.timestamp ?? value.createdAt ?? value.date ?? value.savedAt;
  const parsedDate = new Date(typeof rawDate === 'string' || typeof rawDate === 'number' ? rawDate : Date.now());
  const rawIntensity = scale(value.intensity ?? value.intensityValue);
  const notesValue = value.notes ?? value.text ?? value.entry;
  const notes = typeof notesValue === 'string' ? notesValue.trim() : '';
  const emotionValue = value.emotion;
  const fallbackEmotion = typeof emotionValue === 'string' ? emotionValue.trim() : '';
  const feelings = feelingRatings(value.feelings, fallbackEmotion, rawIntensity);
  const emotion = feelings.length ? feelings.map((item) => item.feeling).join(', ') : fallbackEmotion;
  const intensity = feelings.length ? Math.max(...feelings.map((item) => item.intensity)) : rawIntensity;
  const needs = list(value.needs ?? value.need ?? value.primaryNeed);
  const tags = list(value.tags ?? value.tagList ?? value.tag).map((tag) => tag.replace(/^#/, ''));
  const supportContext = guidedSupport(value.guidedSupport);
  const mood = normalizeJournalMood(value.mood);
  const validDate = (date: unknown) => typeof date === 'string' && Number.isFinite(Date.parse(date)) ? new Date(date).toISOString() : undefined;
  const createdAtISO = validDate(value.createdAtISO);
  const experiencedAtISO = validDate(value.experiencedAtISO);
  return {
    id: typeof value.id === 'string' && value.id.trim() ? value.id.trim() : makeId(),
    dateISO: Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
    ...(createdAtISO ? { createdAtISO } : {}),
    ...(experiencedAtISO ? { experiencedAtISO } : {}),
    ...(mood ? { mood } : {}),
    emotion,
    ...(intensity === undefined ? {} : { intensity }),
    feelings,
    needs,
    tags,
    notes,
    sensations: list(value.sensations ?? value.bodySignals ?? value.bodySensations),
    strategies: list(value.strategies ?? value.strategy ?? value.actions),
    source: value.source === 'lane' ? 'lane' : 'journal',
    ...(supportContext ? { guidedSupport: supportContext } : {}),
  };
}

function isJournalDataWire(value: unknown): value is JournalDataWire {
  return isRecord(value) && Array.isArray(value.entries);
}

function store(storage: StorageDriver | null) {
  return new VersionedStore<JournalDataWire>({ key: JOURNAL_STORAGE_KEY, schemaVersion: 1, storage, validate: isJournalDataWire });
}

function legacyEntries(storage: StorageDriver) {
  const entries: JournalRecord[] = [];
  const seen = new Set<string>();
  [LEGACY_STORAGE_KEYS.journalCurrent, LEGACY_STORAGE_KEYS.journalLegacy, LEGACY_STORAGE_KEYS.alexithymiaJournal].forEach((key) => {
    try {
      const parsed: unknown = JSON.parse(storage.getItem(key) ?? 'null');
      const values = Array.isArray(parsed) ? parsed : isRecord(parsed) && Array.isArray(parsed.entries) ? parsed.entries : [];
      values.map(normalize).forEach((entry) => {
        if (!entry || seen.has(entry.id)) return;
        seen.add(entry.id);
        entries.push(entry);
      });
    } catch {
      // Leave malformed legacy data untouched for manual recovery.
    }
  });
  return entries;
}

export function readJournal(storage: StorageDriver | null = getBrowserStorage()) {
  if (!storage) return [];
  const result = store(storage).read();
  if (result.status === 'ready') {
    return result.value.entries
      .map(normalize)
      .filter((entry): entry is JournalRecord => entry !== null)
      .sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  }
  if (result.status !== 'empty') return [];
  const entries = legacyEntries(storage).sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  if (entries.length) store(storage).write({ entries });
  return entries;
}

export function writeJournal(entries: JournalRecord[], storage: StorageDriver | null = getBrowserStorage()) {
  if (!storage) throw new Error('Device storage is unavailable. The journal was not saved.');
  const sorted = [...entries].sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  store(storage).write({ entries: sorted });
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(JOURNAL_CHANGED_EVENT, { detail: { count: sorted.length } }));
  return sorted;
}

export function createJournalRecord(input: {
  notes: string;
  emotion?: string;
  intensity?: number;
  feelings?: JournalFeelingRating[];
  needs?: string[];
  tags?: string[];
  sensations?: string[];
  strategies?: string[];
  source?: JournalRecord['source'];
  guidedSupport?: JournalGuidedSupport;
  mood?: JournalMood;
  experiencedAtISO?: string;
}): JournalRecord {
  const feelings = feelingRatings(input.feelings, input.emotion ?? '', input.intensity);
  const supportContext = guidedSupport(input.guidedSupport);
  const now = new Date().toISOString();
  const mood = normalizeJournalMood(input.mood);
  return {
    id: makeId(),
    dateISO: now,
    createdAtISO: now,
    ...(input.experiencedAtISO && Number.isFinite(Date.parse(input.experiencedAtISO)) ? { experiencedAtISO: new Date(input.experiencedAtISO).toISOString() } : {}),
    ...(mood ? { mood } : {}),
    emotion: feelings.length ? feelings.map((item) => item.feeling).join(', ') : input.emotion?.trim() ?? '',
    intensity: feelings.length
      ? Math.max(...feelings.map((item) => item.intensity))
      : Math.min(10, Math.max(0, Math.round(input.intensity ?? 5))),
    feelings,
    needs: list(input.needs),
    tags: list(input.tags),
    notes: input.notes.trim(),
    sensations: list(input.sensations),
    strategies: list(input.strategies),
    source: input.source === 'lane' ? 'lane' : 'journal',
    ...(supportContext ? { guidedSupport: supportContext } : {}),
  };
}
