import { describe, expect, it } from 'vitest';

import { needsBySlug, strategiesBySlug } from './catalog';

describe('approved Safety audit package', () => {
  it('ships the approved Safety copy, sources, and five-card static deck', () => {
    const safety = needsBySlug.get('safety');

    expect(safety?.summary).toBe(
      'Across evolutionary history, avoiding harm depended on detecting danger, taking protective action, and recognizing when conditions were safe enough to return to other activities. We may be drawn to create distance from harm, seek shelter or trustworthy people, set boundaries, reduce exposure, and look for credible signs that danger has passed. Protective responses can change with the situation rather than following one fixed pattern. Tending to Safety can mean responding when danger is present while also noticing when enough safety has returned for rest, exploration, connection, and other goals.',
    );

    expect(safety?.evidence?.sources.map((source) => source.url)).toEqual([
      'https://pubmed.ncbi.nlm.nih.gov/34957848/',
      'https://pubmed.ncbi.nlm.nih.gov/25852451/',
      'https://pubmed.ncbi.nlm.nih.gov/17717184/',
      'https://pubmed.ncbi.nlm.nih.gov/39167292/',
      'https://pubmed.ncbi.nlm.nih.gov/38698734/',
      'https://pubmed.ncbi.nlm.nih.gov/35501429/',
    ]);

    expect(safety?.strategies).toEqual([
      { title: 'Comfy gaming', slug: 'comfy-gaming' },
      { title: 'Orient with 5-4-3-2-1', slug: '5-4-3-2-1-check' },
      { title: 'Slow your breathing', slug: 'slow-breathing-safety' },
      { title: 'Call or text 988', slug: 'call-or-text-988' },
      { title: 'Call 116 123', slug: 'call-116-123' },
    ]);
  });

  it('keeps Autumn untouched and gives every system Safety strategy a supporting source', () => {
    expect(strategiesBySlug.get('comfy-gaming')).toMatchObject({
      provenance: 'user',
      contributor: { name: 'Autumn' },
      summary: 'Stardew Valley or Skyrim or something else I have played a million times before that I cherish and can decompress with after a long day of uncomfortability.',
    });

    expect(strategiesBySlug.get('5-4-3-2-1-check')).toMatchObject({
      title: 'Orient with 5-4-3-2-1',
      provenance: 'system',
      evidence: {
        url: 'https://www.fhft.nhs.uk/patients-and-visitors/patient-information-library/anxiety-information-pack',
        kind: 'clinical-guidance',
      },
    });

    expect(strategiesBySlug.get('slow-breathing-safety')).toMatchObject({
      title: 'Slow your breathing',
      provenance: 'system',
      evidence: {
        url: 'https://pubmed.ncbi.nlm.nih.gov/38137060/',
        kind: 'scholarly',
      },
    });

    for (const slug of ['call-or-text-988', 'call-116-123']) {
      expect(strategiesBySlug.get(slug)?.evidence?.kind).toBe('official-resource');
      expect(strategiesBySlug.get(slug)?.evidence?.url).toMatch(/^https:\/\//);
    }
  });
});
