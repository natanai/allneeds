import {
  computeBodyCueMatches,
  type BodyCueScoringSelection,
} from '../bodyCues/bodyCueMath';
import {
  shapeDimensions,
  type AlexithymiaCandidate,
  type ShapeDimension,
} from './alexithymiaData';

export type ShapeSelections = Partial<Record<ShapeDimension, number>>;

export type CandidateClueScore = {
  key: string;
  complete: boolean;
  clueMatch: number | null;
  usedChannels: Array<'body' | 'shape'>;
  body: { match: number; cueCount: number } | null;
  shape: { match: number; dimensions: ShapeDimension[] } | null;
  missingChannels: Array<'body' | 'shape'>;
};

function clampUnit(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

export function selectedShapeDimensions(selections: ShapeSelections) {
  return shapeDimensions.filter((dimension) => Number.isFinite(selections[dimension]));
}

export function shapeMatch(
  candidate: Pick<AlexithymiaCandidate, 'shape'>,
  selections: ShapeSelections,
) {
  const dimensions = selectedShapeDimensions(selections);
  if (dimensions.length < 2 || !candidate.shape) return null;
  const match = dimensions.reduce((total, dimension) => {
    const selected = clampUnit(selections[dimension] ?? 0);
    const coordinate = clampUnit(candidate.shape?.coordinates[dimension] ?? 0);
    return total + (1 - Math.abs(selected - coordinate));
  }, 0) / dimensions.length;
  return { match, dimensions };
}

export function scoreCandidateClues(
  candidates: AlexithymiaCandidate[],
  bodySelections: BodyCueScoringSelection[],
  shapeSelections: ShapeSelections,
  maximumBodyIntensity = 100,
): CandidateClueScore[] {
  const activeBodySelections = bodySelections.filter(({ intensity }) => (
    Number.isFinite(intensity) && intensity > 0
  ));
  const bodyUsed = activeBodySelections.length > 0;
  const shapeUsed = selectedShapeDimensions(shapeSelections).length >= 2;
  const usedChannels: Array<'body' | 'shape'> = [
    ...(bodyUsed ? ['body' as const] : []),
    ...(shapeUsed ? ['shape' as const] : []),
  ];
  const bodyMatches = new Map(
    computeBodyCueMatches(activeBodySelections, maximumBodyIntensity)
      .map((match) => [match.key, match.percent / 100]),
  );

  return candidates.map((candidate) => {
    const body = bodyUsed && candidate.coverage.body
      ? { match: bodyMatches.get(candidate.bodyProfileKey) ?? 0, cueCount: activeBodySelections.length }
      : null;
    const shape = shapeUsed ? shapeMatch(candidate, shapeSelections) : null;
    const missingChannels = usedChannels.filter((channel) => (
      (channel === 'body' && !body) || (channel === 'shape' && !shape)
    ));
    const complete = usedChannels.length > 0 && missingChannels.length === 0;
    const channelValues = [body?.match, shape?.match].filter((value): value is number => (
      typeof value === 'number'
    ));
    return {
      key: candidate.key,
      complete,
      clueMatch: complete
        ? channelValues.reduce((total, value) => total + value, 0) / channelValues.length
        : null,
      usedChannels,
      body,
      shape,
      missingChannels,
    };
  });
}

export function roundedMatchPercent(match: number | null) {
  return match === null ? null : Math.round(clampUnit(match) * 100);
}
