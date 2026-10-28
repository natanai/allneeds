import { describe, expect, it } from 'vitest';

import { alexithymiaCandidates } from './alexithymiaData';
import {
  buildSupportStatement,
  candidateTerm,
  createSupportJournalDraft,
  customWorkingTerm,
  customTermId,
  fauxFeelingTerms,
  profileTerms,
  catalogOnlyTerms,
  suggestedNeedsForTerms,
} from './alexithymiaTerms';
import { feelingsBySlug, needsBySlug } from '../../data/catalog';

describe('Feeling to Need suggestions', () => {
  it('uses every existing cross-reference for both profiled and catalog-only Feelings', () => {
    for (const term of [...profileTerms, ...catalogOnlyTerms].filter((term) => term.role === 'feeling')) {
      const feeling = feelingsBySlug.get(term.catalogSlug!)!;
      const suggestions = suggestedNeedsForTerms([term], { [term.id]: 'fits' });
      expect(suggestions.map(({ need }) => need.slug).sort(), term.label)
        .toEqual([...new Set(feeling.needs.map((need) => need.slug))].sort());
      for (const suggestion of suggestions) {
        expect(suggestion.need).toBe(needsBySlug.get(suggestion.need.slug));
        expect(suggestion.fromFeelings).toEqual([{ slug: feeling.slug, title: feeling.title }]);
      }
    }
  });

  it('deduplicates shared Needs and retains which fitting Feelings suggested them', () => {
    const calm = profileTerms.find((term) => term.catalogSlug === 'calm')!;
    const tired = profileTerms.find((term) => term.catalogSlug === 'tired')!;
    const decisions = { [calm.id]: 'fits', [tired.id]: 'fits' };
    const suggestions = suggestedNeedsForTerms([calm, tired], decisions);
    expect(suggestions.filter(({ need }) => need.slug === 'rest')).toHaveLength(1);
    expect(suggestions.find(({ need }) => need.slug === 'rest')?.fromFeelings)
      .toEqual([{ slug: 'calm', title: 'Calm' }, { slug: 'tired', title: 'Tired' }]);
    expect(suggestedNeedsForTerms([tired, calm], decisions).map(({ need }) => need.slug))
      .toEqual(suggestions.map(({ need }) => need.slug));
  });

  it('does not infer a map for tentative, rejected, custom, Faux, or unbridged emotion words', () => {
    const calm = profileTerms.find((term) => term.catalogSlug === 'calm')!;
    for (const decision of ['maybe', 'not-this-time', '']) {
      expect(suggestedNeedsForTerms([calm], { [calm.id]: decision })).toEqual([]);
    }
    const unbridged = profileTerms.find((term) => term.label === 'Gratitude')!;
    const custom = customWorkingTerm('Calm');
    const faux = fauxFeelingTerms[0]!;
    expect(suggestedNeedsForTerms([unbridged, custom, faux], {
      [unbridged.id]: 'fits', [custom.id]: 'fits', [faux.id]: 'fits',
    })).toEqual([]);
    expect(suggestedNeedsForTerms([], {})).toEqual([]);
  });
});

describe('Alexithymia Support statement builder', () => {
  it('keeps tentative choices tentative and preserves their provenance in Journal', () => {
    const fear = candidateTerm(alexithymiaCandidates.find((candidate) => candidate.key === 'fear')!);
    const decisions = { [fear.id]: 'maybe' };
    const statement = buildSupportStatement({ observation: '', terms: [fear], needSlugs: [], noWordYet: false, decisions });
    expect(statement).toBe('I might feel fear.');
    const draft = createSupportJournalDraft({ observation: '', terms: [fear], needSlugs: [], statement, decisions });
    expect(draft.guidedSupport?.terms).toEqual([{ label: 'Fear', role: 'feeling', decision: 'maybe' }]);
    expect(draft.feelings?.[0]?.ratingSource).toBe('unknown');
  });

  it('keeps different Unicode and punctuation words distinct without losing equivalent spellings', () => {
    const words = ['😶', '😕', '不安', '安心', 'mixed up', 'mixed-up', 'a/b', 'a b', '\ud800'];
    expect(new Set(words.map(customTermId)).size).toBe(words.length);
    expect(customTermId(' É ')).toBe(customTermId('e\u0301'));
    expect(customTermId('Mixed up')).toBe(customTermId('mixed up'));
  });

  it('allows an explicitly uncertain check-in to keep context without generating prose or a rating', () => {
    const draft = createSupportJournalDraft({ observation: '', terms: [], needSlugs: [], statement: '', noWordYet: true, bodyClear: true, checkInId: 'one-check-in' });
    expect(draft.notes).toBe('');
    expect(draft.feelings).toEqual([]);
    expect(draft.mood).toBeUndefined();
    expect(draft.guidedSupport).toMatchObject({ noWordYet: true, bodyClear: true, checkInId: 'one-check-in' });
  });

  it('uses only the observation, terms, and Needs the person selected', () => {
    expect(buildSupportStatement({
      observation: 'We stopped talking after dinner.',
      terms: [customWorkingTerm('mixed up')],
      needSlugs: ['understanding'],
      noWordYet: false,
    })).toBe('When we stopped talking after dinner, I feel mixed up because I need understanding.');
  });

  it('never inserts a fallback Need or a generated request', () => {
    expect(buildSupportStatement({
      observation: '',
      terms: [customWorkingTerm('guilt')],
      needSlugs: [],
      noWordYet: false,
    })).toBe('I feel guilt.');
  });

  it('does not lowercase a first-person observation', () => {
    expect(buildSupportStatement({
      observation: 'I heard the door close.',
      terms: [customWorkingTerm('uneasy')],
      needSlugs: [],
      noWordYet: false,
    })).toBe('When I heard the door close, I feel uneasy.');
  });

  it('preserves a selected Faux Feeling in the person’s language', () => {
    const betrayed = fauxFeelingTerms.find((term) => term.label === 'Betrayed')!;
    expect(buildSupportStatement({
      observation: '',
      terms: [betrayed],
      needSlugs: [],
      noWordYet: false,
    })).toBe('I feel betrayed.');
  });

  it('repeats the feeling phrase so mixed nouns and adjectives remain grammatical', () => {
    expect(buildSupportStatement({
      observation: '',
      terms: [customWorkingTerm('anxiety'), customWorkingTerm('overwhelmed')],
      needSlugs: ['understanding'],
      noWordYet: false,
    })).toBe('I feel anxiety and I feel overwhelmed because I need understanding.');
  });

  it('uses the exact no-word-yet sentence and omits empty clauses', () => {
    expect(buildSupportStatement({
      observation: '',
      terms: [],
      needSlugs: [],
      noWordYet: true,
    })).toBe('I’m not sure what I feel yet.');
    expect(buildSupportStatement({ observation: '', terms: [], needSlugs: [], noWordYet: false })).toBe('');
  });

  it('puts the full support-lane sentence in Reflection exactly once and preserves the original observation as context', () => {
    const observation = 'My colleague closed the door before I finished speaking.';
    const statement = 'When my colleague closed the door before I finished speaking, I feel uneasy because I need understanding.';
    const draft = createSupportJournalDraft({
      observation, terms: [customWorkingTerm('uneasy')], needSlugs: ['understanding'], statement,
    });
    expect(draft.notes).toBe(statement);
    expect(draft.guidedSupport?.observation).toBe(observation);
    expect(draft.guidedSupport?.statement).toBe(statement);
  });

  it('respects a manually edited sentence without appending observation text', () => {
    const draft = createSupportJournalDraft({
      observation: 'The meeting went longer than expected.',
      terms: [], needSlugs: [], statement: 'I need time to think about this.',
    });
    expect(draft.notes).toBe('I need time to think about this.');
    expect(draft.guidedSupport?.observation).toBe('The meeting went longer than expected.');
  });

  it('uses the observation by itself when no completed sentence exists', () => {
    const draft = createSupportJournalDraft({
      observation: 'The phone rang.', terms: [], needSlugs: [], statement: '',
    });
    expect(draft.notes).toBe('The phone rang.');
  });

  it('transfers only explicitly rated canonical Feelings to History-compatible Journal ratings', () => {
    const anxiety = candidateTerm(alexithymiaCandidates.find((candidate) => candidate.key === 'anxiety')!);
    const working = candidateTerm(alexithymiaCandidates.find((candidate) => candidate.key === 'guilt')!);
    const context = { observation: 'The door closed.', terms: [anxiety, working], needSlugs: [], statement: 'I feel anxiety.' };
    const rated = createSupportJournalDraft({
      ...context,
      feelingIntensities: { [anxiety.id]: 8, [working.id]: 7 },
    });
    expect(rated.feelings).toEqual([{ feeling: 'Anxiety', intensity: 8 }]);
    expect(rated.emotion).toBe('Anxiety');

    const unrated = createSupportJournalDraft(context);
    expect(unrated.feelings).toEqual([{ feeling: 'Anxiety', intensity: 5, ratingSource: 'unknown' }]);
    const invalid = createSupportJournalDraft({ ...context, feelingIntensities: { [anxiety.id]: 0 } });
    expect(invalid.feelings).toEqual([{ feeling: 'Anxiety', intensity: 5, ratingSource: 'unknown' }]);
  });

  it('preserves all chosen roles in Journal without classifying working or Faux terms as Feelings', () => {
    const feeling = candidateTerm(alexithymiaCandidates.find((candidate) => candidate.key === 'anxiety')!);
    const working = candidateTerm(alexithymiaCandidates.find((candidate) => candidate.key === 'guilt')!);
    const faux = fauxFeelingTerms[0]!;
    const draft = createSupportJournalDraft({
      observation: 'We stopped talking.',
      terms: [feeling, working, faux],
      needSlugs: ['understanding'],
      statement: `I feel anxious, guilt, and ${faux.label.toLocaleLowerCase()} because I need understanding.`,
    });
    expect(draft.feelings).toEqual([{ feeling: 'Anxiety', intensity: 5, ratingSource: 'unknown' }]);
    expect(draft.selectedNeeds).toEqual(['understanding']);
    expect(draft.guidedSupport?.terms).toEqual([
      { label: 'Anxiety', role: 'feeling' },
      { label: 'Guilt', role: 'working' },
      { label: faux.label, role: 'faux-feeling' },
    ]);
  });
});
