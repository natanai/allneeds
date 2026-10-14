import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import observationGuide from './observationGuide.json';

const approvedCopy = readFileSync(new URL('../../docs/observation-research-guide-proposal-2026-10-14.md', import.meta.url), 'utf8');
const approvedSections = approvedCopy.split(/^## /m).slice(1).map((section) => {
  const firstLine = section.indexOf('\n');
  return { title: section.slice(0, firstLine), body: section.slice(firstLine + 1).trim() };
});
const sources = observationGuide.sources;
const topicIds = ['methods', 'language', 'concrete', 'affect', 'communication', 'needs', 'training', 'examples', 'references'];

describe('Approved Observation research guide', () => {
  it('matches the exact approved document fingerprint', () => {
    expect(createHash('sha256').update(approvedCopy).digest('hex'))
      .toBe('28e8e4257311e02fa443599f7ab4a283e0a3190167a672e1d8c701f91d53beea');
  });

  it('provides the same canonical research topics for all viewports', () => {
    expect('desktop' in observationGuide).toBe(false);
    expect('mobile' in observationGuide).toBe(false);
    expect(observationGuide.sections.map((section) => section.id)).toEqual(topicIds);
    expect(observationGuide.sections.map((section) => section.title)).toEqual(approvedSections.slice(2).map((section) => section.title));
    expect(new Set(topicIds).size).toBe(topicIds.length);
    expect(sources).toHaveLength(18);
  });

  it('uses the approved short and research introductions without extra source claims', () => {
    expect(observationGuide.overview).toEqual({ title: 'Why try this?', paragraphs: approvedSections[0]!.body.split(/\n\n+/) });
    expect(observationGuide.intro).toEqual({ title: 'Research behind observations', paragraphs: approvedSections[1]!.body.split(/\n\n+/) });
  });

  it('preserves every approved paragraph and fictional example exactly', () => {
    observationGuide.sections.forEach((section, index) => {
      const approved = approvedSections[index + 2]!;
      if (section.id === 'references') {
        expect(section.content).toEqual([]);
        return;
      }
      const expected = approved.body.split(/\n\n+/).map((block) => {
        if (!block.startsWith('|')) return { type: 'paragraph', text: block };
        const items = block.split('\n').slice(2).map((row) => {
          const cells = row.split('|').slice(1, -1).map((cell) => cell.trim());
          expect(cells).toHaveLength(2);
          return { evaluation: cells[0], observation: cells[1] };
        });
        return { type: 'examples', items };
      });
      expect(section.content).toEqual(expected);
    });
  });

  it('numbers citations by first use, including the research introduction and grouped citations', () => {
    const paragraphs = [
      ...observationGuide.intro.paragraphs,
      ...observationGuide.sections.flatMap((section) => section.content.flatMap((block) => 'text' in block && typeof block.text === 'string' ? [block.text] : [])),
    ];
    const firstUse: number[] = [];
    for (const paragraph of paragraphs) {
      for (const match of paragraph.matchAll(/\[(\d+(?:,\d+)*)\]/g)) {
        for (const number of match[1]!.split(',').map(Number)) {
          expect(sources[number - 1]).toBeDefined();
          if (!firstUse.includes(number)) firstUse.push(number);
        }
      }
    }
    expect(firstUse).toEqual(Array.from({ length: 18 }, (_, index) => index + 1));
    expect(new Set(sources.map((source) => source.id)).size).toBe(sources.length);
    expect(sources.every((source) => /^[a-z0-9-]+$/.test(source.id))).toBe(true);
  });

  it('uses only the approved bibliography and publisher or official-resource URLs', () => {
    const approved = approvedSections.at(-1)!.body.split(/\n\n+/).map((entry, index) => {
      const match = /^\[(\d+)\] (.+)\n(https:\/\/\S+)$/.exec(entry);
      expect(match).not.toBeNull();
      expect(Number(match![1])).toBe(index + 1);
      return { citation: match![2]!.replace(/\*/g, ''), url: match![3] };
    });
    expect(sources.map(({ citation, url }) => ({ citation, url }))).toEqual(approved);
    for (const source of sources) {
      const url = new URL(source.url);
      expect(url.protocol).toBe('https:');
      expect(url.hostname).not.toMatch(/(?:doi\.org|chatgpt|openai)/);
      expect([...url.searchParams.keys()]).toEqual(url.hostname === 'psycnet.apa.org' ? ['doi'] : []);
      expect(source.citation.length).toBeGreaterThan(50);
      expect('fit' in source).toBe(false);
    }
  });

  it('keeps the app-effect, harm and user-choice boundaries intact', () => {
    const copy = JSON.stringify(observationGuide);
    expect(copy).toContain('These sources do not establish the clinical effectiveness of the allneeds app.');
    expect(copy).toContain('adding detail should not soften or erase it');
    expect(copy).toContain('You can ignore a prompt that does not fit.');
    expect(copy).toContain('Only 153 completed both assessment points.');
    expect(copy).toContain('no statistically significant group difference in self-reported fear');
    expect(copy).not.toMatch(/physiological benefit|PMC4766977|PMC8773921|PMC4841258|\u2014/);
    expect(copy).not.toContain('APPROVED_CORE');
    expect(copy).not.toContain('Hostile attributional bias');
    expect(copy).not.toContain('Our epidemic of loneliness');
  });
});
