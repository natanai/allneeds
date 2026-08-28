export const MAX_BODY_CUE_ASSOCIATION_WEIGHT = 1.4;

export type BodyCueScoringOption = {
  emotions?: Record<string, number>;
};

export type BodyCueScoringSelection = {
  option: BodyCueScoringOption;
  intensity: number;
};

export type BodyCueMatch = {
  key: string;
  score: number;
  percent: number;
};

export function computeBodyCueMatches(
  selections: BodyCueScoringSelection[],
  maximumIntensity: number,
): BodyCueMatch[] {
  if (!Number.isFinite(maximumIntensity) || maximumIntensity <= 0) return [];

  const activeSelections = selections
    .map(({ option, intensity }) => ({
      option,
      intensity: Math.max(0, Math.min(maximumIntensity, Number.isFinite(intensity) ? intensity : 0))
        / maximumIntensity,
    }))
    .filter(({ intensity }) => intensity > 0);
  const selectedIntensity = activeSelections.reduce((total, selection) => total + selection.intensity, 0);
  const maximumPossibleScore = MAX_BODY_CUE_ASSOCIATION_WEIGHT * selectedIntensity;
  if (maximumPossibleScore <= 0) return [];

  const scores = new Map<string, number>();
  activeSelections.forEach(({ option, intensity }) => {
    Object.entries(option.emotions ?? {}).forEach(([key, authoredWeight]) => {
      const weight = Number.isFinite(authoredWeight)
        ? Math.max(0, Math.min(MAX_BODY_CUE_ASSOCIATION_WEIGHT, authoredWeight))
        : 0;
      const contribution = intensity * weight;
      if (contribution > 0) scores.set(key, (scores.get(key) ?? 0) + contribution);
    });
  });

  return [...scores.entries()]
    .map(([key, score]) => ({
      key,
      score,
      percent: Math.min(100, (score / maximumPossibleScore) * 100),
    }))
    .filter((match) => match.percent > 0)
    .sort((left, right) => right.percent - left.percent || left.key.localeCompare(right.key));
}

export function describeCueIntensity(value: number) {
  if (value <= 0) return 'Off';
  if (value < 35) return `Hint · ${value}%`;
  if (value < 70) return `Noticeable · ${value}%`;
  return `Strong · ${value}%`;
}
