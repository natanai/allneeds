export type SensationOption = {
  emotions?: Record<string, number>;
};

export type SensationSelection = {
  option: SensationOption;
  intensity: number;
};

export type EmotionCandidate = {
  key: string;
  score: number;
  confidence: number;
};

const anchors: Record<string, { valence: string; arousal: string }> = {
  anxiety: { valence: 'unpleasant', arousal: 'high' }, fear: { valence: 'unpleasant', arousal: 'high' },
  anger: { valence: 'unpleasant', arousal: 'high' }, overwhelm: { valence: 'unpleasant', arousal: 'high' },
  stress: { valence: 'unpleasant', arousal: 'high' }, frustration: { valence: 'unpleasant', arousal: 'high' },
  worry: { valence: 'unpleasant', arousal: 'medium' }, guilt: { valence: 'unpleasant', arousal: 'medium' },
  shame: { valence: 'unpleasant', arousal: 'medium' }, sadness: { valence: 'unpleasant', arousal: 'low' },
  grief: { valence: 'unpleasant', arousal: 'low' }, lonely: { valence: 'unpleasant', arousal: 'low' },
  tired: { valence: 'neutral', arousal: 'low' }, numb: { valence: 'neutral', arousal: 'low' },
  bored: { valence: 'neutral', arousal: 'low' }, curiosity: { valence: 'neutral', arousal: 'medium' },
  thoughtful: { valence: 'neutral', arousal: 'medium' }, uncertain: { valence: 'neutral', arousal: 'medium' },
  determined: { valence: 'neutral', arousal: 'high' }, focused: { valence: 'neutral', arousal: 'high' },
  anticipation: { valence: 'neutral', arousal: 'high' }, excitement: { valence: 'pleasant', arousal: 'high' },
  excited: { valence: 'pleasant', arousal: 'high' }, calm: { valence: 'pleasant', arousal: 'low' },
  relief: { valence: 'pleasant', arousal: 'low' }, contentment: { valence: 'pleasant', arousal: 'medium' },
  contented: { valence: 'pleasant', arousal: 'medium' }, hope: { valence: 'pleasant', arousal: 'medium' },
  hopeful: { valence: 'pleasant', arousal: 'medium' }, gratitude: { valence: 'pleasant', arousal: 'medium' },
  joy: { valence: 'pleasant', arousal: 'high' }, joyful: { valence: 'pleasant', arousal: 'high' },
  pride: { valence: 'pleasant', arousal: 'high' },
};

function safeIntensity(value: number) {
  return Math.max(0, Math.min(10, Number.isFinite(value) ? value : 0)) / 10;
}

export function scoreSensations(selections: SensationSelection[], rejections: Record<string, number> = {}) {
  const scores = new Map<string, number>();
  selections.forEach(({ option, intensity }) => {
    Object.entries(option.emotions ?? {}).forEach(([key, weight]) => {
      const score = Number(weight) * safeIntensity(intensity);
      if (Number.isFinite(score) && score > 0) scores.set(key, (scores.get(key) ?? 0) + score);
    });
  });
  const ranked = [...scores.entries()]
    .map(([key, rawScore]) => ({ key, score: rawScore / (1 + Math.max(0, rejections[key] ?? 0)), confidence: 0 }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.key.localeCompare(right.key));
  const max = ranked[0]?.score ?? 1;
  return ranked.map((candidate) => ({ ...candidate, confidence: candidate.score / max }));
}

export function inferZone(selections: SensationSelection[]) {
  if (!selections.length) return null;
  const valence = new Map([['pleasant', 0], ['neutral', 0], ['unpleasant', 0]]);
  const arousal = new Map([['low', 0], ['medium', 0], ['high', 0]]);
  selections.forEach(({ option, intensity }) => {
    Object.entries(option.emotions ?? {}).forEach(([key, weight]) => {
      const anchor = anchors[key];
      const score = Number(weight) * safeIntensity(intensity);
      if (!anchor || !Number.isFinite(score) || score <= 0) return;
      valence.set(anchor.valence, (valence.get(anchor.valence) ?? 0) + score);
      arousal.set(anchor.arousal, (arousal.get(anchor.arousal) ?? 0) + score);
    });
  });
  const bestValence = [...valence].sort((a, b) => b[1] - a[1])[0];
  const bestArousal = [...arousal].sort((a, b) => b[1] - a[1])[0];
  return !bestValence || !bestArousal || bestValence[1] <= 0 || bestArousal[1] <= 0
    ? null
    : `${bestArousal[0]}-${bestValence[0]}`;
}

export function categorizeCompass(value: number, kind: 'energy' | 'valence') {
  if (kind === 'energy') {
    if (value <= -0.33) return { key: 'low', label: 'Low' };
    if (value >= 0.33) return { key: 'high', label: 'High' };
    return { key: 'medium', label: 'Steady' };
  }
  if (value <= -0.33) return { key: 'unpleasant', label: 'Unpleasant' };
  if (value >= 0.33) return { key: 'pleasant', label: 'Pleasant' };
  return { key: 'neutral', label: 'Neutral' };
}
