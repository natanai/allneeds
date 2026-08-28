import { describe, expect, it } from 'vitest';

import { alexithymiaCandidates } from './alexithymiaData';
import {
  buildSupportStatement,
  candidateTerm,
  createSupportJournalDraft,
  customWorkingTerm,
  fauxFeelingTerms,
} from './alexithymiaTerms';

describe('Alexithymia Support statement builder', () => {
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

  it('uses the exact no-word-yet sentence and omits empty clauses', () => {
    expect(buildSupportStatement({
      observation: '',
      terms: [],
      needSlugs: [],
      noWordYet: true,
    })).toBe('I’m not sure what I feel yet.');
    expect(buildSupportStatement({ observation: '', terms: [], needSlugs: [], noWordYet: false })).toBe('');
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
    expect(draft.feelings).toEqual([{ feeling: 'Anxiety', intensity: 5 }]);
    expect(draft.selectedNeeds).toEqual(['understanding']);
    expect(draft.guidedSupport?.terms).toEqual([
      { label: 'Anxiety', role: 'feeling' },
      { label: 'Guilt', role: 'working' },
      { label: faux.label, role: 'faux-feeling' },
    ]);
  });
});
