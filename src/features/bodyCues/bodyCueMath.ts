export type BodyCueReference = {
  optionId: string;
  relativeWeight?: number;
};

export type ReverseInferenceEntry = {
  bodyCues?: BodyCueReference[];
};

export type ReverseInferenceData = Record<string, ReverseInferenceEntry | { slugMap?: Record<string, string> }>;

export type BodyCueMatch = {
  key: string;
  score: number;
  percent: number;
};

export function computeBodyCueMatches(
  reverseInference: ReverseInferenceData,
  selected: Record<string, number>,
): BodyCueMatch[] {
  const scored = Object.entries(reverseInference)
    .filter(([key]) => key !== '_meta')
    .map(([key, entry]) => {
      const bodyCues = 'bodyCues' in entry && Array.isArray(entry.bodyCues) ? entry.bodyCues : [];
      const score = bodyCues.reduce((total, cue) => {
        const intensity = Math.max(0, Math.min(100, selected[cue.optionId] ?? 0)) / 100;
        return total + intensity * (Number.isFinite(cue.relativeWeight) ? (cue.relativeWeight ?? 0) : 0);
      }, 0);

      return { key, score, percent: 0 };
    })
    .filter((match) => match.score > 0);

  const totalScore = scored.reduce((total, match) => total + match.score, 0);
  return scored
    .map((match) => ({
      ...match,
      percent: totalScore > 0 ? (match.score / totalScore) * 100 : 0,
    }))
    .sort((left, right) => right.percent - left.percent || left.key.localeCompare(right.key));
}

export function describeCueIntensity(value: number) {
  if (value <= 0) return 'Off';
  if (value < 35) return `Hint · ${value}%`;
  if (value < 70) return `Noticeable · ${value}%`;
  return `Strong · ${value}%`;
}
