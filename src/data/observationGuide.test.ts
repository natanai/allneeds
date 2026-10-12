import { describe, expect, it } from 'vitest';
import observationGuide from './observationGuide.json';

describe('Observation research guide', () => {
  const findings = observationGuide.sections.flatMap((section) =>
    section.content.filter((block) => block.type === 'finding'),
  );
  const sources = observationGuide.sources;

  it('provides the same canonical research topics for all viewports', () => {
    expect('desktop' in observationGuide).toBe(false);
    expect('mobile' in observationGuide).toBe(false);
    expect(observationGuide.sections).toHaveLength(9);
    expect(sources.length).toBeGreaterThanOrEqual(15);
    expect(new Set(observationGuide.sections.map((section) => section.id)).size).toBe(observationGuide.sections.length);
    expect(observationGuide.sections.at(-1)?.id).toBe('references');
  });

  it('maintains one source per substantive finding, in first-citation order', () => {
    const usedSourceIds = findings.map((block) => {
      if (!('sourceId' in block)) throw new Error('Expected evidence finding');
      return block.sourceId;
    });
    expect(usedSourceIds).toEqual(sources.map((source) => source.id));
    expect(new Set(usedSourceIds).size).toBe(usedSourceIds.length);
    expect(new Set(sources.map((source) => source.id)).size).toBe(sources.length);
    for (const source of sources) {
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.title.length).toBeGreaterThan(12);
      expect(source.type.length).toBeGreaterThan(8);
      expect(source.fit.length).toBeGreaterThan(30);
    }
  });

  it('distinguishes findings, real-world relevance and limitations', () => {
    for (const block of findings) {
      if (!('sourceId' in block)) throw new Error('Expected evidence finding');
      for (const value of [block.method, block.result, block.meaning, block.limits]) {
        expect(value.length).toBeGreaterThan(35);
      }
    }
    const copy = JSON.stringify(observationGuide);
    expect(copy).toContain('Both can stay.');
    expect(copy).toContain('not a clinically proven causal chain');
    expect(copy).not.toMatch(/PMC4766977|PMC8773921|PMC4841258/);
  });

  it('retains the historical research domains, not only observation writing tips', () => {
    const titles = observationGuide.sections.map((section) => section.title).join(' | ');
    for (const term of ['Observation', 'Language', 'Feelings', 'Communication', 'Measurement', 'Needs', 'Recall', 'Practice', 'Source']) {
      expect(titles).toContain(term);
    }
  });
});
