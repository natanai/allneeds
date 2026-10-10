import { getBrowserStorage } from './storage';
import type { StorageDriver } from './storage';
import { VersionedStore } from './versionedStore';
import alexithymiaSupportData from '../data/generated/alexithymiaSupport.json';

export const JOURNAL_DRAFT_STORAGE_KEY = 'allneeds.v2.journal.draft';
export const OBSERVATION_DRAFT_STORAGE_KEY = 'allneeds.v2.observation.draft';
export const BODY_CUES_DRAFT_STORAGE_KEY = 'allneeds.v2.body-cues.draft';
export const INVENTORY_DRAFT_STORAGE_KEY = 'allneeds.v2.inventory.draft';
export const ALEXITHYMIA_DRAFT_STORAGE_KEY = 'allneeds.v2.alexithymia.draft';
export const NEED_STRATEGY_DRAFT_STORAGE_PREFIX = 'allneeds.v2.need-strategy.draft';

export type JournalComposerDraft = {
  notes: string;
  emotion: string;
  intensity: number;
  feelings?: Array<{ feeling: string; intensity: number }>;
  selectedNeeds: string[];
  tags: string;
  editingId: string | null;
  guidedSupport?: {
    observation: string;
    terms: Array<{ label: string; role: 'feeling' | 'faux-feeling' | 'working' }>;
    statement: string;
  };
};

export type ObservationDraft = {
  text: string;
  feelingsMode: 'unmet' | 'met';
  showSuggestions: boolean;
  showExample: boolean;
};

export type BodyCuesDraft = {
  selected: Record<string, number>;
  showAll: boolean;
};

export type InventoryDraft = {
  coverageFilter: 'all' | 'missing' | 'covered' | 'hidden';
  expandedNeed: string | null;
  add: {
    title: string;
    description: string;
    selectedNeeds: string[];
    firstName: string;
    location: string;
  };
  edit: {
    id: string;
    title: string;
    description: string;
    selectedNeeds: string[];
    firstName: string;
    location: string;
    visibility: 'private' | 'followers' | 'public';
  } | null;
};

export type AlexithymiaDraft = {
  stage: number;
  observation: string;
  openRegion: string | null;
  selectedCues: Record<string, number>;
  bodyClear: boolean;
  shape: Partial<Record<'pleasantness' | 'energy' | 'power' | 'expectedness', number>>;
  decisions: Record<string, 'fits' | 'maybe' | 'not-this-time'>;
  termOrder: string[];
  customTerms: string[];
  noWordYet: boolean;
  selectedNeeds: string[];
  statement: string;
  statementEdited: boolean;
};

type LegacyAlexithymiaDraftV1 = {
  phase: number;
  openRegion: string | null;
  selectedCues: Record<string, number>;
  energy: number;
  valence: number;
  compassTouched: boolean;
  selectedEmotion: string | null;
  journalOpen: boolean;
  reflection: string;
  journalNeeds: string[];
  intensity: number;
};

const alexithymiaCandidateKeys = new Set(
  alexithymiaSupportData.candidates.map((candidate) => candidate.key),
);

export type NeedStrategyDraft = {
  title: string;
  description: string;
  selectedNeeds: string[];
  firstName: string;
  location: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  return isRecord(value)
    && Object.values(value).every((item) => typeof item === 'number' && Number.isFinite(item));
}

function isFeelingRatings(value: unknown) {
  return Array.isArray(value) && value.every((item) => isRecord(item)
    && typeof item.feeling === 'string'
    && typeof item.intensity === 'number'
    && Number.isFinite(item.intensity));
}

function isGuidedSupportDraft(value: unknown) {
  return isRecord(value)
    && typeof value.observation === 'string'
    && typeof value.statement === 'string'
    && Array.isArray(value.terms)
    && value.terms.every((term) => isRecord(term)
      && typeof term.label === 'string'
      && (term.role === 'feeling' || term.role === 'faux-feeling' || term.role === 'working'));
}

function isJournalDraft(value: unknown): value is JournalComposerDraft {
  return isRecord(value)
    && typeof value.notes === 'string'
    && typeof value.emotion === 'string'
    && typeof value.intensity === 'number'
    && Number.isFinite(value.intensity)
    && (value.feelings === undefined || isFeelingRatings(value.feelings))
    && isStringList(value.selectedNeeds)
    && typeof value.tags === 'string'
    && (value.editingId === null || typeof value.editingId === 'string')
    && (value.guidedSupport === undefined || isGuidedSupportDraft(value.guidedSupport));
}

function isObservationDraft(value: unknown): value is ObservationDraft {
  return isRecord(value)
    && typeof value.text === 'string'
    && (value.feelingsMode === 'unmet' || value.feelingsMode === 'met')
    && typeof value.showSuggestions === 'boolean'
    && typeof value.showExample === 'boolean';
}

function isBodyCuesDraft(value: unknown): value is BodyCuesDraft {
  return isRecord(value)
    && isNumberRecord(value.selected)
    && typeof value.showAll === 'boolean';
}

function isInventoryDraft(value: unknown): value is InventoryDraft {
  if (!isRecord(value) || !isRecord(value.add)) return false;
  const editValid = value.edit === null || (isRecord(value.edit)
    && typeof value.edit.id === 'string'
    && typeof value.edit.title === 'string'
    && typeof value.edit.description === 'string'
    && isStringList(value.edit.selectedNeeds)
    && typeof value.edit.firstName === 'string'
    && typeof value.edit.location === 'string'
    && (value.edit.visibility === 'private'
      || value.edit.visibility === 'followers'
      || value.edit.visibility === 'public'));
  return (value.coverageFilter === 'all'
      || value.coverageFilter === 'missing'
      || value.coverageFilter === 'covered'
      || value.coverageFilter === 'hidden')
    && (value.expandedNeed === null || typeof value.expandedNeed === 'string')
    && typeof value.add.title === 'string'
    && typeof value.add.description === 'string'
    && isStringList(value.add.selectedNeeds)
    && typeof value.add.firstName === 'string'
    && typeof value.add.location === 'string'
    && editValid;
}

function isAlexithymiaDraft(value: unknown): value is AlexithymiaDraft {
  return isRecord(value)
    && typeof value.stage === 'number'
    && Number.isFinite(value.stage)
    && typeof value.observation === 'string'
    && (value.openRegion === null || typeof value.openRegion === 'string')
    && isNumberRecord(value.selectedCues)
    && typeof value.bodyClear === 'boolean'
    && isRecord(value.shape)
    && Object.entries(value.shape).every(([key, item]) => (
      (key === 'pleasantness' || key === 'energy' || key === 'power' || key === 'expectedness')
      && typeof item === 'number'
      && Number.isFinite(item)
    ))
    && isRecord(value.decisions)
    && Object.values(value.decisions).every((decision) => (
      decision === 'fits' || decision === 'maybe' || decision === 'not-this-time'
    ))
    && isStringList(value.termOrder)
    && isStringList(value.customTerms)
    && typeof value.noWordYet === 'boolean'
    && isStringList(value.selectedNeeds)
    && typeof value.statement === 'string'
    && typeof value.statementEdited === 'boolean';
}

function isLegacyAlexithymiaDraftV1(value: unknown): value is LegacyAlexithymiaDraftV1 {
  return isRecord(value)
    && typeof value.phase === 'number'
    && Number.isFinite(value.phase)
    && (value.openRegion === null || typeof value.openRegion === 'string')
    && isNumberRecord(value.selectedCues)
    && typeof value.energy === 'number'
    && Number.isFinite(value.energy)
    && typeof value.valence === 'number'
    && Number.isFinite(value.valence)
    && typeof value.compassTouched === 'boolean'
    && (value.selectedEmotion === null || typeof value.selectedEmotion === 'string')
    && typeof value.journalOpen === 'boolean'
    && typeof value.reflection === 'string'
    && isStringList(value.journalNeeds)
    && typeof value.intensity === 'number'
    && Number.isFinite(value.intensity);
}

function isNeedStrategyDraft(value: unknown): value is NeedStrategyDraft {
  return isRecord(value)
    && typeof value.title === 'string'
    && typeof value.description === 'string'
    && isStringList(value.selectedNeeds)
    && typeof value.firstName === 'string'
    && typeof value.location === 'string';
}

function journalStore(storage: StorageDriver | null) {
  return new VersionedStore<JournalComposerDraft>({
    key: JOURNAL_DRAFT_STORAGE_KEY,
    schemaVersion: 1,
    storage,
    validate: isJournalDraft,
  });
}

function observationStore(storage: StorageDriver | null) {
  return new VersionedStore<ObservationDraft>({
    key: OBSERVATION_DRAFT_STORAGE_KEY,
    schemaVersion: 1,
    storage,
    validate: isObservationDraft,
  });
}

function bodyCuesStore(storage: StorageDriver | null) {
  return new VersionedStore<BodyCuesDraft>({
    key: BODY_CUES_DRAFT_STORAGE_KEY,
    schemaVersion: 1,
    storage,
    validate: isBodyCuesDraft,
  });
}

function inventoryDraftStore(storage: StorageDriver | null) {
  return new VersionedStore<InventoryDraft>({
    key: INVENTORY_DRAFT_STORAGE_KEY,
    schemaVersion: 2,
    storage,
    validate: isInventoryDraft,
  });
}

function alexithymiaStore(storage: StorageDriver | null) {
  return new VersionedStore<AlexithymiaDraft>({
    key: ALEXITHYMIA_DRAFT_STORAGE_KEY,
    schemaVersion: 2,
    storage,
    validate: isAlexithymiaDraft,
  });
}

function needStrategyStore(needSlug: string, storage: StorageDriver | null) {
  return new VersionedStore<NeedStrategyDraft>({
    key: `${NEED_STRATEGY_DRAFT_STORAGE_PREFIX}:${needSlug}`,
    schemaVersion: 1,
    storage,
    validate: isNeedStrategyDraft,
  });
}

export function readJournalDraft(storage: StorageDriver | null = getBrowserStorage()) {
  const result = journalStore(storage).read();
  return result.status === 'ready' ? result.value : null;
}

export function writeJournalDraft(
  draft: JournalComposerDraft,
  storage: StorageDriver | null = getBrowserStorage(),
) {
  const store = journalStore(storage);
  const hasContent = Boolean(
    draft.notes.trim()
    || draft.emotion.trim()
    || draft.feelings?.some((item) => item.feeling.trim() && item.intensity > 0)
    || draft.selectedNeeds.length
    || draft.tags.trim()
    || draft.editingId
    || draft.guidedSupport?.observation.trim()
    || draft.guidedSupport?.terms.length
    || draft.guidedSupport?.statement.trim(),
  );
  if (!hasContent) {
    store.clear();
    return null;
  }
  const feelings = draft.feelings?.map((item) => ({
    feeling: item.feeling.trim(),
    intensity: Math.min(10, Math.max(0, Math.round(item.intensity))),
  })).filter((item) => item.feeling && item.intensity > 0);
  const guidedSupport = draft.guidedSupport ? {
    observation: draft.guidedSupport.observation.trim(),
    terms: draft.guidedSupport.terms
      .map((term) => ({ ...term, label: term.label.trim() }))
      .filter((term) => term.label),
    statement: draft.guidedSupport.statement.trim(),
  } : undefined;
  return store.write({
    ...draft,
    intensity: Math.min(10, Math.max(0, Math.round(draft.intensity))),
    ...(feelings ? { feelings } : {}),
    selectedNeeds: [...new Set(draft.selectedNeeds.filter(Boolean))],
    ...(guidedSupport ? { guidedSupport } : {}),
  });
}

export function clearJournalDraft(storage: StorageDriver | null = getBrowserStorage()) {
  journalStore(storage).clear();
}

export function readObservationDraft(storage: StorageDriver | null = getBrowserStorage()) {
  const result = observationStore(storage).read();
  return result.status === 'ready' ? result.value : null;
}

export function writeObservationDraft(
  draft: ObservationDraft,
  storage: StorageDriver | null = getBrowserStorage(),
) {
  const store = observationStore(storage);
  if (!draft.text.trim()) {
    store.clear();
    return null;
  }
  return store.write(draft);
}

export function clearObservationDraft(storage: StorageDriver | null = getBrowserStorage()) {
  observationStore(storage).clear();
}

export function readBodyCuesDraft(storage: StorageDriver | null = getBrowserStorage()) {
  const result = bodyCuesStore(storage).read();
  return result.status === 'ready' ? result.value : null;
}

export function writeBodyCuesDraft(
  draft: BodyCuesDraft,
  storage: StorageDriver | null = getBrowserStorage(),
) {
  const store = bodyCuesStore(storage);
  const selected = Object.fromEntries(Object.entries(draft.selected)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => [key, Math.min(100, Math.max(0, Math.round(value / 5) * 5))]));
  if (!Object.keys(selected).length) {
    store.clear();
    return null;
  }
  return store.write({ selected, showAll: draft.showAll });
}

export function clearBodyCuesDraft(storage: StorageDriver | null = getBrowserStorage()) {
  bodyCuesStore(storage).clear();
}

export function readInventoryDraft(storage: StorageDriver | null = getBrowserStorage()) {
  const result = inventoryDraftStore(storage).read();
  return result.status === 'ready' ? result.value : null;
}

export function writeInventoryDraft(
  draft: InventoryDraft,
  storage: StorageDriver | null = getBrowserStorage(),
) {
  const store = inventoryDraftStore(storage);
  const normalized: InventoryDraft = {
    ...draft,
    expandedNeed: draft.expandedNeed || null,
    add: {
      ...draft.add,
      selectedNeeds: [...new Set(draft.add.selectedNeeds.filter(Boolean))],
    },
    edit: draft.edit?.id ? {
      ...draft.edit,
      selectedNeeds: [...new Set(draft.edit.selectedNeeds.filter(Boolean))],
    } : null,
  };
  const hasAddContent = Boolean(
    normalized.add.title.trim()
    || normalized.add.description.trim()
    || normalized.add.selectedNeeds.length
    || normalized.add.firstName.trim()
    || normalized.add.location.trim(),
  );
  if (normalized.coverageFilter === 'all'
    && !normalized.expandedNeed
    && !hasAddContent
    && !normalized.edit) {
    store.clear();
    return null;
  }
  return store.write(normalized);
}

export function clearInventoryDraft(storage: StorageDriver | null = getBrowserStorage()) {
  inventoryDraftStore(storage).clear();
}

export function migrateAlexithymiaDraftV1(draft: LegacyAlexithymiaDraftV1): AlexithymiaDraft {
  const selectedCues = Object.fromEntries(Object.entries(draft.selectedCues)
    .map(([key, value]) => [key, Math.min(100, Math.max(0, Math.round(value * 10 / 5) * 5))]));
  const selectedEmotion = draft.selectedEmotion && alexithymiaCandidateKeys.has(draft.selectedEmotion)
    ? draft.selectedEmotion
    : null;
  const hasClues = Object.values(selectedCues).some((value) => value > 0) || draft.compassTouched;
  const stage = selectedEmotion ? 3 : hasClues ? 2 : draft.phase > 0 ? 1 : 0;
  return {
    stage,
    observation: '',
    openRegion: draft.openRegion || null,
    selectedCues,
    bodyClear: false,
    shape: draft.compassTouched ? {
      pleasantness: Math.min(1, Math.max(0, (draft.valence + 1) / 2)),
      energy: Math.min(1, Math.max(0, (draft.energy + 1) / 2)),
    } : {},
    decisions: selectedEmotion ? { [`candidate:${selectedEmotion}`]: 'fits' } : {},
    termOrder: selectedEmotion ? [`candidate:${selectedEmotion}`] : [],
    customTerms: [],
    noWordYet: false,
    selectedNeeds: [],
    statement: '',
    statementEdited: false,
  };
}

function readLegacyAlexithymiaDraft(storage: StorageDriver | null) {
  if (!storage) return null;
  try {
    const parsed: unknown = JSON.parse(storage.getItem(ALEXITHYMIA_DRAFT_STORAGE_KEY) ?? 'null');
    if (!isRecord(parsed) || parsed.schemaVersion !== 1 || !isLegacyAlexithymiaDraftV1(parsed.data)) {
      return null;
    }
    return migrateAlexithymiaDraftV1(parsed.data);
  } catch {
    return null;
  }
}

export function readAlexithymiaDraft(storage: StorageDriver | null = getBrowserStorage()) {
  const result = alexithymiaStore(storage).read();
  if (result.status === 'ready') return result.value;
  if (result.status !== 'unsupported' || result.foundVersion !== 1) return null;
  const migrated = readLegacyAlexithymiaDraft(storage);
  if (!migrated) return null;
  alexithymiaStore(storage).write(migrated);
  return migrated;
}

export function writeAlexithymiaDraft(
  draft: AlexithymiaDraft,
  storage: StorageDriver | null = getBrowserStorage(),
) {
  const store = alexithymiaStore(storage);
  const selectedCues = Object.fromEntries(Object.entries(draft.selectedCues)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => [key, Math.min(100, Math.max(0, Math.round(value / 5) * 5))]));
  const shape = Object.fromEntries(Object.entries(draft.shape)
    .filter(([key, value]) => (
      (key === 'pleasantness' || key === 'energy' || key === 'power' || key === 'expectedness')
      && Number.isFinite(value)
    ))
    .map(([key, value]) => [key, Math.min(1, Math.max(0, value ?? 0))]));
  const decisions = Object.fromEntries(Object.entries(draft.decisions)
    .filter(([key, decision]) => key && (
      decision === 'fits' || decision === 'maybe' || decision === 'not-this-time'
    )));
  const selectedDecisionIds = Object.keys(decisions)
    .filter((id) => decisions[id] === 'fits' || decisions[id] === 'maybe');
  const termOrder = [...new Set([
    ...draft.termOrder.filter((id) => selectedDecisionIds.includes(id)),
    ...selectedDecisionIds,
  ])];
  const normalized: AlexithymiaDraft = {
    ...draft,
    stage: Math.min(4, Math.max(0, Math.round(draft.stage))),
    observation: draft.observation.trimStart(),
    openRegion: draft.openRegion || null,
    selectedCues,
    shape,
    decisions,
    termOrder,
    customTerms: [...new Set(draft.customTerms.map((term) => term.trim()).filter(Boolean))],
    selectedNeeds: [...new Set(draft.selectedNeeds.filter(Boolean))],
  };
  const hasProgress = normalized.stage > 0
    || Boolean(normalized.observation.trim())
    || Object.keys(normalized.selectedCues).length > 0
    || Object.keys(normalized.shape).length > 0
    || Object.keys(normalized.decisions).length > 0
    || normalized.customTerms.length > 0
    || normalized.noWordYet
    || normalized.selectedNeeds.length > 0
    || Boolean(normalized.statement.trim());
  if (!hasProgress) {
    store.clear();
    return null;
  }
  return store.write(normalized);
}

export function clearAlexithymiaDraft(storage: StorageDriver | null = getBrowserStorage()) {
  alexithymiaStore(storage).clear();
}

export function readNeedStrategyDraft(
  needSlug: string,
  storage: StorageDriver | null = getBrowserStorage(),
) {
  if (!needSlug) return null;
  const result = needStrategyStore(needSlug, storage).read();
  return result.status === 'ready' ? result.value : null;
}

export function writeNeedStrategyDraft(
  needSlug: string,
  draft: NeedStrategyDraft,
  storage: StorageDriver | null = getBrowserStorage(),
) {
  if (!needSlug) return null;
  const store = needStrategyStore(needSlug, storage);
  const normalized = {
    ...draft,
    selectedNeeds: [...new Set(draft.selectedNeeds.filter(Boolean))],
  };
  const defaultSelection = normalized.selectedNeeds.length === 1
    && normalized.selectedNeeds[0] === needSlug;
  const hasContent = Boolean(
    normalized.title.trim()
    || normalized.description.trim()
    || normalized.firstName.trim()
    || normalized.location.trim()
    || !defaultSelection,
  );
  if (!hasContent) {
    store.clear();
    return null;
  }
  return store.write(normalized);
}

export function clearNeedStrategyDraft(
  needSlug: string,
  storage: StorageDriver | null = getBrowserStorage(),
) {
  if (needSlug) needStrategyStore(needSlug, storage).clear();
}
