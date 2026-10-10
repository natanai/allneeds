import { describe, expect, it } from 'vitest';

import observationGuide from './observationGuide.json';

describe('Observation guide public copy', () => {
  const referenceSection = observationGuide.mobile.sections
    .find((section) => section.id === 'observation-guide-mobile-references')!;
  const guideWithoutReferences = {
    intro: observationGuide.intro,
    sections: observationGuide.mobile.sections.filter((section) => section !== referenceSection),
  };

  it('uses plain language in every rendered guidance section', () => {
    const renderedCopy = JSON.stringify(guideWithoutReferences);
    expect(renderedCopy).not.toMatch(/low-inference|camera-ready|psycholinguistics|limbic|nervous systems|observer drift|\bkappa\b/i);
    expect(renderedCopy).not.toContain('—');
    expect(renderedCopy).toContain('not as a test you have to pass');
  });

  it('gives every rendered citation a matching source anchor', () => {
    const citedIds = [...JSON.stringify(guideWithoutReferences).matchAll(/observation-guide-ref-(\d+)/g)]
      .map((match) => match[1])
      .sort((left, right) => Number(left) - Number(right));
    const anchorIds = [...JSON.stringify(referenceSection).matchAll(/id=\\"observation-guide-ref-(\d+)/g)]
      .map((match) => match[1])
      .sort((left, right) => Number(left) - Number(right));
    expect([...new Set(anchorIds)]).toEqual([...new Set(citedIds)]);
  });
});
