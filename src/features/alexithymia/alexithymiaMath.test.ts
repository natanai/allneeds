import { describe, expect, it } from 'vitest';

import { alexithymiaCandidateByKey, alexithymiaCandidates } from './alexithymiaData';
import {
  roundedMatchPercent,
  scoreCandidateClues,
  shapeMatch,
} from './alexithymiaMath';

describe('Alexithymia Support clue matching', () => {
  const bodySelections = [{
    option: { emotions: { anxiety: 1.2, calm: 0.6 } },
    intensity: 50,
  }];

  it('keeps body candidates independent instead of normalizing the first result to certainty', () => {
    const scores = scoreCandidateClues(alexithymiaCandidates, bodySelections, {});
    const anxiety = scores.find((score) => score.key === 'anxiety');
    const calm = scores.find((score) => score.key === 'calm');
    const fear = scores.find((score) => score.key === 'fear');

    expect(roundedMatchPercent(anxiety?.clueMatch ?? null)).toBe(86);
    expect(roundedMatchPercent(calm?.clueMatch ?? null)).toBe(43);
    expect(roundedMatchPercent(fear?.clueMatch ?? null)).toBe(0);
    expect((anxiety?.clueMatch ?? 0) + (calm?.clueMatch ?? 0)).not.toBeCloseTo(1);
  });

  it('returns a 100 percent shape match only for exact fixed coordinates', () => {
    const anxiety = alexithymiaCandidateByKey.get('anxiety')!;
    const result = shapeMatch(anxiety, anxiety.shape!.coordinates);
    expect(result?.dimensions).toHaveLength(4);
    expect(roundedMatchPercent(result?.match ?? null)).toBe(100);
  });

  it('requires two shape dimensions and treats missing as absent, not midpoint', () => {
    const anxiety = alexithymiaCandidateByKey.get('anxiety')!;
    expect(shapeMatch(anxiety, { energy: 0.5 })).toBeNull();
    expect(shapeMatch(anxiety, { energy: 0.5, pleasantness: 0.25 })?.dimensions)
      .toEqual(['pleasantness', 'energy']);
  });

  it('uses an equal channel average and rounds only the displayed result', () => {
    const anxiety = alexithymiaCandidateByKey.get('anxiety')!;
    const result = scoreCandidateClues(
      [anxiety],
      bodySelections,
      {
        pleasantness: anxiety.shape!.coordinates.pleasantness,
        energy: anxiety.shape!.coordinates.energy,
      },
    )[0]!;
    expect(result.body?.match).toBeCloseTo(1.2 / 1.4);
    expect(result.shape?.match).toBe(1);
    expect(result.clueMatch).toBeCloseTo(((1.2 / 1.4) + 1) / 2);
    expect(roundedMatchPercent(result.clueMatch)).toBe(93);
  });

  it('marks shape-uncovered candidates partial when both channels were used', () => {
    const calm = alexithymiaCandidateByKey.get('calm')!;
    const result = scoreCandidateClues(
      [calm],
      bodySelections,
      { pleasantness: 0.75, energy: 0.25 },
    )[0]!;
    expect(result.body?.match).toBeCloseTo(0.6 / 1.4);
    expect(result.shape).toBeNull();
    expect(result.complete).toBe(false);
    expect(result.clueMatch).toBeNull();
    expect(result.missingChannels).toEqual(['shape']);
  });

  it('reports no match when neither scored channel is available', () => {
    const anxiety = alexithymiaCandidateByKey.get('anxiety')!;
    const result = scoreCandidateClues([anxiety], [], { pleasantness: 0.5 })[0]!;
    expect(result.usedChannels).toEqual([]);
    expect(result.complete).toBe(false);
    expect(result.clueMatch).toBeNull();
  });
});
