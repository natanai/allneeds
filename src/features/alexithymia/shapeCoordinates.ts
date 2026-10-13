import type { JournalMood } from '../journal/journalRepository';
import type { ShapeSelections } from './alexithymiaMath';

export type OverallMoodChoice = 'mixed' | 'unsure';

const unitToCoordinate = (value: number) => Math.max(-5, Math.min(5, Math.round(value * 10 - 5)));
const coordinateToUnit = (value: number) => (Math.max(-5, Math.min(5, value)) + 5) / 10;

/** The matching model uses 0–1 coordinates; the Journal map uses −5 to +5. */
export function shapeToJournalMood(
  shape: ShapeSelections,
  choice?: OverallMoodChoice,
): JournalMood | undefined {
  if (choice) return { kind: choice };
  const { pleasantness, energy } = shape;
  if (!Number.isFinite(pleasantness) || !Number.isFinite(energy)
    || pleasantness === undefined || energy === undefined) return undefined;
  return {
    kind: 'rated',
    value: unitToCoordinate(pleasantness),
    arousal: unitToCoordinate(energy),
  };
}

/** Do not replace optional situational clues or manufacture a missing coordinate. */
export function shapeWithJournalMood(shape: ShapeSelections, mood: JournalMood | undefined): ShapeSelections {
  const next = { ...shape };
  delete next.pleasantness;
  delete next.energy;
  if (mood?.kind === 'rated' && mood.arousal !== undefined) {
    next.pleasantness = coordinateToUnit(mood.value);
    next.energy = coordinateToUnit(mood.arousal);
  }
  return next;
}
