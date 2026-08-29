import { describe, expect, it } from 'vitest';

import { observationInferenceIndex } from '../../data/generated/observationInference';
import { analyzeObservation } from './analyze';
import { selectExactObservationEntities } from './select';

const EXAMPLE = "Last Thursday, two days after my partner and I had agreed to have dinner together at home at 7 p.m., I arrived back at the apartment at 6:50 p.m. and started setting the table. At 7:15 p.m. my partner was not home yet, and at 7:20 p.m. I saw a message on my phone sent at 6:55 p.m. that said, 'I decided to stay late at work and will eat here tonight.'";

describe('Observation Inference Engine 2.0', () => {
  it('returns no suggestions for blank input and four official possibilities for every nonblank input', () => {
    expect(analyzeObservation('   ').suggestions).toEqual({ feelings: [], needs: [], basis: null });
    for (const text of ['banana telescope purple', '🙂', 'a', '这是一次观察', EXAMPLE]) {
      const analysis = analyzeObservation(text);
      expect(analysis.suggestions.feelings).toHaveLength(4);
      expect(analysis.suggestions.needs).toHaveLength(4);
      expect(new Set(analysis.suggestions.feelings.map((candidate) => candidate.slug)).size).toBe(4);
      expect(new Set(analysis.suggestions.needs.map((candidate) => candidate.slug)).size).toBe(4);
    }
  });

  it('uses the approved exploration pools for text without language evidence', () => {
    const unmet = analyzeObservation('banana telescope purple', 'unmet');
    expect(unmet.suggestions.feelings.map((candidate) => candidate.slug)).toEqual(['upset', 'anxious', 'sad', 'frustrated']);
    expect(unmet.suggestions.needs.map((candidate) => candidate.slug)).toEqual(['safety', 'connection', 'understanding', 'autonomy']);
    expect(unmet.suggestions.feelings.every((candidate) => candidate.basis === 'exploration')).toBe(true);

    const met = analyzeObservation('banana telescope purple', 'met');
    expect(met.suggestions.feelings.map((candidate) => candidate.slug)).toEqual(['calm', 'contented', 'hopeful', 'relieved']);
  });

  it('ranks direct first-person Feeling and Need language first', () => {
    const analysis = analyzeObservation('I feel anxious and I need rest.');
    expect(analysis.suggestions.feelings[0]).toMatchObject({ slug: 'anxious', basis: 'direct' });
    expect(analysis.suggestions.needs[0]).toMatchObject({ slug: 'rest', basis: 'direct' });
  });

  it('uses current canonical relationships around direct Feeling and Need words', () => {
    const fromFeeling = analyzeObservation('I feel anxious.');
    expect(fromFeeling.suggestions.needs).toHaveLength(4);
    expect(fromFeeling.suggestions.needs.every((candidate) => candidate.basis === 'related')).toBe(true);

    const fromNeed = analyzeObservation('I need rest.');
    expect(fromNeed.suggestions.feelings).toContainEqual(expect.objectContaining({ slug: 'tired', basis: 'related' }));
  });

  it('executes migrated authored cue expressions instead of only compiling their relationships', () => {
    const analysis = analyzeObservation('I reached to hug them and they stepped back.');
    expect(analysis.annotations.some((annotation) => annotation.evidence.some((evidence) => (
      evidence.kind === 'cue' && evidence.expressionId === 'comfort-turned-away'
    )))).toBe(true);
    expect(analysis.suggestions.needs.some((candidate) => candidate.slug === 'love-caring')).toBe(true);
    expect(analysis.suggestions.needs.some((candidate) => candidate.basis === 'direct')).toBe(true);
  });

  it('does not treat negated, third-person, or quoted Feeling language as direct self-report', () => {
    expect(analyzeObservation('I am not angry.').suggestions.feelings[0]?.slug).not.toBe('angry');
    expect(analyzeObservation('She is angry.').suggestions.feelings[0]?.slug).not.toBe('angry');
    const quoted = analyzeObservation('She said “I am angry.”');
    expect(quoted.suggestions.feelings[0]?.slug).not.toBe('angry');
    expect(quoted.entities.some((entity) => entity.slug === 'angry')).toBe(false);
  });

  it('keeps typo support bounded and guidance ranges available to the shared annotation ledger', () => {
    const typo = analyzeObservation('I feel anxios.');
    expect(typo.suggestions.feelings[0]).toMatchObject({ slug: 'anxious', basis: 'related' });
    expect(typo.entities.find((entity) => entity.slug === 'anxious')).toMatchObject({ matchKind: 'fuzzy' });
    const guidance = analyzeObservation('You are always rude on purpose.');
    expect(guidance.annotations.some((annotation) => annotation.text.toLocaleLowerCase('en-US') === 'always'
      && annotation.evidence.some((evidence) => evidence.kind === 'guidance'))).toBe(true);
    expect(guidance.annotations.some((annotation) => annotation.text.toLocaleLowerCase('en-US') === 'on purpose'
      && annotation.evidence.some((evidence) => evidence.kind === 'guidance'))).toBe(true);
  });

  it('does not treat a diagnosis or neurodivergent identity as a writing problem', () => {
    for (const text of ['I am autistic.', 'I have ADHD.', 'I am bipolar.', 'I have OCD.']) {
      const identity = text.split(/\s+/).at(-1)!.replace('.', '').toLocaleLowerCase('en-US');
      const guidanceText = analyzeObservation(text).annotations
        .filter((annotation) => annotation.evidence.some((evidence) => evidence.kind === 'guidance'))
        .map((annotation) => annotation.text.toLocaleLowerCase('en-US'));
      expect(guidanceText, text).not.toContain(identity);
    }
  });

  it('projects exact catalog titles without silently translating bridges or fuzzy wording', () => {
    const exact = selectExactObservationEntities(analyzeObservation('I felt sad and betrayed, and I wanted safety.'));
    expect(exact.feelings.map((entity) => entity.slug)).toContain('sad');
    expect(exact.fauxFeelings.map((entity) => entity.slug)).toContain('betrayed');
    expect(exact.needs.map((entity) => entity.slug)).toContain('safety');

    const inexact = selectExactObservationEntities(analyzeObservation('I felt sadness and anxios.'));
    expect(inexact.feelings).toEqual([]);
  });

  it('preserves guilt as unlinked user wording without inventing an official mapping', () => {
    const analysis = analyzeObservation('I feel guilty.');
    expect(analysis.surfaceTerms.map((term) => term.text)).toContain('guilty');
    expect(analysis.entities.some((entity) => entity.text.toLocaleLowerCase('en-US') === 'guilty')).toBe(false);
    expect(analysis.suggestions.feelings).toHaveLength(4);
    expect(analysis.suggestions.needs).toHaveLength(4);
  });

  it('recognizes every canonical Feeling title in the appropriate mode', () => {
    observationInferenceIndex.catalog.feelings.forEach((feeling) => {
      const mode = feeling.needSatisfaction === 'met' ? 'met' : 'unmet';
      const analysis = analyzeObservation(`I feel ${feeling.title}.`, mode);
      expect(analysis.suggestions.feelings[0]?.slug, feeling.slug).toBe(feeling.slug);
      expect(analysis.entities.some((entity) => entity.entityType === 'feeling' && entity.slug === feeling.slug), feeling.slug).toBe(true);
    });
  });

  it('recognizes every canonical Need title', () => {
    observationInferenceIndex.catalog.needs.forEach((need) => {
      const analysis = analyzeObservation(`I need ${need.title}.`);
      expect(analysis.suggestions.needs[0]?.slug, need.slug).toBe(need.slug);
      expect(analysis.entities.some((entity) => entity.entityType === 'need' && entity.slug === need.slug), need.slug).toBe(true);
    });
  });

  it('recognizes and links all canonical Faux Feeling titles', () => {
    observationInferenceIndex.catalog.fauxFeelings.forEach((fauxFeeling) => {
      const analysis = analyzeObservation(`I feel ${fauxFeeling.title}.`);
      expect(analysis.entities.some((entity) => entity.entityType === 'fauxFeeling' && entity.slug === fauxFeeling.slug), fauxFeeling.slug).toBe(true);
      expect(analysis.suggestions.feelings).toHaveLength(4);
      expect(analysis.suggestions.needs).toHaveLength(4);
    });
  });

  it('rolls Quick Check signals up from the same exact formula annotations', () => {
    const text = 'Tuesday at 3 p.m. in the kitchen, I heard “Please wait” twice.';
    const analysis = analyzeObservation(text);
    expect(Object.values(analysis.slots).every((slot) => slot.satisfied)).toBe(true);
    Object.values(analysis.slots).forEach((slot) => {
      expect(slot.annotationIds.length).toBeGreaterThan(0);
      slot.annotationIds.forEach((annotationId) => {
        const annotation = analysis.annotations.find((candidate) => candidate.id === annotationId);
        expect(annotation?.evidence.some((evidence) => evidence.kind === 'formula' && evidence.slot === slot.id)).toBe(true);
      });
    });
    const twiceStart = text.indexOf('twice');
    expect(analysis.annotations.some((annotation) => (
      annotation.start === twiceStart
      && annotation.end === twiceStart + 'twice'.length
      && annotation.evidence.some((evidence) => evidence.kind === 'formula' && evidence.slot === 'measure')
    ))).toBe(true);
  });

  it('retains exact UTF-16 offsets for repeated and Unicode text', () => {
    const text = '🙂 I feel sad, then I wrote sad.';
    const analysis = analyzeObservation(text);
    const sadOffsets = analysis.entities
      .filter((entity) => entity.slug === 'sad')
      .map((entity) => [entity.start, entity.end]);
    expect(sadOffsets).toEqual([
      [text.indexOf('sad'), text.indexOf('sad') + 3],
      [text.lastIndexOf('sad'), text.lastIndexOf('sad') + 3],
    ]);
  });

  it('is byte-stable for the same text and mode', () => {
    expect(JSON.stringify(analyzeObservation(EXAMPLE, 'unmet'))).toBe(JSON.stringify(analyzeObservation(EXAMPLE, 'unmet')));
    expect(analyzeObservation(EXAMPLE, 'unmet').version).not.toBe(analyzeObservation(EXAMPLE, 'met').version);
  });

  it('does not throw on long adversarial text', () => {
    const text = `${'a'.repeat(3_000)} ${'(without '.repeat(120)} ${EXAMPLE}`;
    expect(() => analyzeObservation(text)).not.toThrow();
  });
});
