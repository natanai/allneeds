import { describe, expect, it } from 'vitest';
import { shapeToJournalMood, shapeWithJournalMood } from './shapeCoordinates';

describe('shared check-in and Journal coordinates', () => {
  it('maps pleasantness and energy to the exact Journal valence/arousal axes', () => {
    expect(shapeToJournalMood({ pleasantness: 0, energy: 1 })).toEqual({
      kind: 'rated', value: -5, arousal: 5,
    });
    expect(shapeToJournalMood({ pleasantness: 0.2, energy: 0.7 })).toEqual({
      kind: 'rated', value: -3, arousal: 2,
    });
    expect(shapeWithJournalMood({ power: 0.25 }, { kind: 'rated', value: -3, arousal: 2 })).toEqual({
      power: 0.25, pleasantness: 0.2, energy: 0.7,
    });
  });

  it('does not silently turn an unanswered axis into neutral', () => {
    expect(shapeToJournalMood({ pleasantness: 0.75 })).toBeUndefined();
    expect(shapeWithJournalMood({ energy: 0.5, power: 0.75 }, undefined)).toEqual({ power: 0.75 });
  });

  it('preserves mixed and unsure as explicit user choices without scoring a coordinate', () => {
    expect(shapeToJournalMood({}, 'mixed')).toEqual({ kind: 'mixed' });
    expect(shapeToJournalMood({}, 'unsure')).toEqual({ kind: 'unsure' });
    expect(shapeWithJournalMood({ pleasantness: 0.5, energy: 1, expectedness: 0.25 }, { kind: 'mixed' }))
      .toEqual({ expectedness: 0.25 });
  });
});
