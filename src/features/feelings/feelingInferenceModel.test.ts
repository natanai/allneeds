import { describe, expect, it } from 'vitest';

import reverseInferenceJson from '../../../public/data/reverse-inference.json';
import { feelings } from '../../data/catalog';
import {
  collectFeelingEvidence,
  formatZoneLabel,
  normalizeIntensityBand,
  resolveFeelingInference,
  type ReverseInferenceIndex,
} from './feelingInferenceModel';

const reverseInference = reverseInferenceJson as ReverseInferenceIndex;

describe('canonical Feeling detail inference', () => {
  it('maps the same 40 production feelings and leaves the eight current gaps alone', () => {
    const missing = feelings
      .filter((feeling) => !resolveFeelingInference(reverseInference, feeling.slug))
      .map((feeling) => feeling.slug)
      .sort();
    expect(missing).toEqual([
      'bewildered',
      'confused',
      'disappointment',
      'energized',
      'inspired',
      'peaceful',
      'playful',
      'relaxed',
    ]);
    expect(feelings.length - missing.length).toBe(40);
  });

  it('resolves Hurt to the canonical sadness pattern and all eleven body cues', () => {
    const resolved = resolveFeelingInference(reverseInference, 'hurt');
    expect(resolved?.feelingKey).toBe('sadness');
    expect(resolved?.entry.zones).toEqual(['low-unpleasant']);
    expect(resolved?.entry.bodyCues).toHaveLength(11);
    expect(resolved?.entry.bodyCues?.[0]).toMatchObject({
      regionId: 'gut',
      title: 'Hollow or empty',
      intensityBand: [2, 7],
    });
  });

  it('keeps intensity and zone labels defensive', () => {
    expect(normalizeIntensityBand([-4, 18])).toEqual([0, 10]);
    expect(normalizeIntensityBand([8, 3])).toEqual([8, 8]);
    expect(normalizeIntensityBand([Number.NaN, 4])).toBeNull();
    expect(formatZoneLabel('medium-unpleasant')).toBe('Steady energy · Unpleasant');
  });

  it('deduplicates the canonical evidence and always includes the baseline limitation', () => {
    const resolved = resolveFeelingInference(reverseInference, 'hurt')!;
    const evidence = collectFeelingEvidence(resolved.entry, resolved.feelingKey);
    expect(evidence.supports.map((support) => support.ref)).toEqual([
      'Russell & Barrett 1999',
      'Russell 1980',
      'Bonanno & Keltner 1997',
      'Stroebe et al. 2007',
      'Lieberman et al. 2007',
      'Kircanski et al. 2012',
      'Zaccaro et al. 2018',
      'Lehrer & Gevirtz 2014',
      'Posner & Russell 2005',
      'Nummenmaa et al. 2014',
    ]);
    expect(evidence.limitations.at(-1)).toBe(
      'Self-report body maps and affect clusters are directional hints, not diagnoses.',
    );
    expect(new Set(evidence.limitations).size).toBe(evidence.limitations.length);
  });
});
