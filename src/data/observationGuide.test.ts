import { describe, expect, it } from 'vitest';

import observationGuide from './observationGuide.json';

function authoredStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(authoredStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(authoredStrings);
  return [];
}

describe('Canonical Observation guide', () => {
  const referenceSection = observationGuide.sections.find(
    (section) => section.id === 'observation-guide-references',
  )!;
  const sectionsWithoutReferences = observationGuide.sections.filter(
    (section) => section !== referenceSection,
  );

  it('uses one content collection regardless of viewport', () => {
    expect('desktop' in observationGuide).toBe(false);
    expect('mobile' in observationGuide).toBe(false);
    expect(observationGuide.sections.length).toBeGreaterThan(5);
  });

  it('uses plain-language guidance without deleting interpretations', () => {
    const renderedCopy = JSON.stringify({ intro: observationGuide.intro, sections: sectionsWithoutReferences });
    expect(renderedCopy).not.toMatch(/low-inference|camera-ready|psycholinguistics|limbic|nervous systems|observer drift|\bkappa\b/i);
    expect(renderedCopy).not.toContain('—');
    expect(renderedCopy).toContain('not a test of whether your experience or interpretation is true');
    expect(renderedCopy).toContain('Both can stay.');
  });

  it('has correctly ordered citations, each pointing to exactly one source', () => {
    const citations = authoredStrings(sectionsWithoutReferences).flatMap(
      (value) => [...value.matchAll(/href="#observation-guide-source-([^"]+)">\[(\d+)\]/g)],
    );
    const firstUse = new Map<string, number>();
    for (const [, id, label] of citations) {
      if (!firstUse.has(id)) firstUse.set(id, firstUse.size + 1);
      expect(Number(label)).toBe(firstUse.get(id));
    }

    const listed = authoredStrings(referenceSection).flatMap(
      (value) => [...value.matchAll(/id="observation-guide-source-([^"]+)"[^>]*>\[(\d+)\]/g)],
    );
    expect(listed.length).toBeGreaterThan(0);
    expect(listed.map(([, id]) => id)).toEqual([...firstUse.keys()]);
    expect(listed.map(([, , label]) => Number(label))).toEqual([...firstUse.values()]);
    expect(new Set(listed.map(([, id]) => id)).size).toBe(listed.length);

    const sources = authoredStrings(referenceSection).filter((item) => item.includes('id="observation-guide-source-'));
    for (const source of sources) {
      expect(source).toMatch(/href="https:\/\//);
      expect(source).toContain('target="_blank"');
      expect(source).toContain('rel="noopener noreferrer"');
    }
  });

  it('does not ship the previously misidentified citations', () => {
    const allCopy = JSON.stringify(observationGuide);
    expect(allCopy).not.toMatch(/PMC4766977|PMC8773921|PMC6353691|PMC4841258/);
  });
});
