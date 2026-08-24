export type FeelingBodyCue = {
  regionId: string;
  regionLabel: string;
  optionId: string;
  title: string;
  note?: string;
  intensityBand?: number[];
  arousal?: string;
  relativeWeight?: number;
  evidenceKey?: string;
};

export type FeelingInferenceEntry = {
  zones?: string[];
  bodyCues?: FeelingBodyCue[];
  skills?: string[];
  evidenceKeys?: string[];
};

export type ReverseInferenceIndex = Record<string, FeelingInferenceEntry | unknown> & {
  _meta?: { slugMap?: Record<string, string> };
};

export type ZoneSuggestion = { label?: string };

export type EvidenceSupport = {
  label: string;
  ref?: string | null;
  href?: string | null;
};

type EvidenceRecord = {
  supports: EvidenceSupport[];
  limitations: string[];
};

export type FeelingEvidence = {
  supports: EvidenceSupport[];
  limitations: string[];
};

const somaticEvidence: EvidenceRecord = {
  supports: [
    {
      label: 'Circumplex (valence × arousal)',
      ref: 'Posner & Russell 2005',
      href: 'https://doi.org/10.1017/S0954579405050340',
    },
    {
      label: 'Bodily maps arise from self-report topographies',
      ref: 'Nummenmaa et al. 2014',
      href: 'https://doi.org/10.1073/pnas.1321664111',
    },
  ],
  limitations: ['Somatic cues guide hypotheses but do not diagnose emotions.'],
};

const zoneEvidence: EvidenceRecord = {
  supports: [
    {
      label: 'Core affect mapped by valence and arousal',
      ref: 'Russell & Barrett 1999',
      href: 'https://doi.org/10.1037/0022-3514.76.5.805',
    },
    {
      label: 'Circumplex reliably clusters feeling families',
      ref: 'Russell 1980',
      href: 'https://doi.org/10.1037/h0077714',
    },
  ],
  limitations: ['Zones capture averages—personal context still matters.'],
};

const labelingEvidence: EvidenceRecord = {
  supports: [
    {
      label: 'Affect labeling dampens limbic activity',
      ref: 'Lieberman et al. 2007',
      href: 'https://doi.org/10.1111/j.1467-9280.2007.01916.x',
    },
    {
      label: 'Naming feelings supports regulation in practice',
      ref: 'Kircanski et al. 2012',
      href: 'https://doi.org/10.1177/0956797612443830',
    },
  ],
  limitations: ['Language access varies by culture and learning history.'],
};

const sighEvidence: EvidenceRecord = {
  supports: [
    {
      label: 'Double-inhale sigh lowers autonomic arousal',
      ref: 'Hubner et al. 2023',
      href: 'https://doi.org/10.1016/j.xcrm.2022.100895',
    },
    {
      label: 'Slow exhalation improves state anxiety',
      ref: 'Iwabe et al. 2025',
      href: 'https://doi.org/10.3389/fnhum.2025.1605862',
    },
  ],
  limitations: ['Breathing practices may need adaptation for respiratory conditions.'],
};

const resonanceEvidence: EvidenceRecord = {
  supports: [
    {
      label: 'Resonance breathing stabilises HRV',
      ref: 'Zaccaro et al. 2018',
      href: 'https://doi.org/10.3389/fnhum.2018.00353',
    },
    {
      label: '6 bpm breathing aids emotion regulation',
      ref: 'Lehrer & Gevirtz 2014',
      href: 'https://doi.org/10.3389/fpsyg.2014.00756',
    },
  ],
  limitations: ['Breathing practices may need adaptation for respiratory conditions.'],
};

const slowBreathEvidence: EvidenceRecord = {
  supports: [
    {
      label: 'Slow paced breathing steadies autonomic tone',
      ref: 'Brown & Gerbarg 2005',
      href: 'https://doi.org/10.1089/acm.2005.11.189',
    },
    {
      label: 'Extended exhale promotes parasympathetic shift',
      ref: 'Strauss-Blasche et al. 2000',
      href: 'https://doi.org/10.1046/j.1440-1681.2000.03306.x',
    },
  ],
  limitations: ['Breathing practices may need adaptation for respiratory conditions.'],
};

const emotionEvidenceGroups: Record<string, EvidenceRecord> = {
  threat: {
    supports: [
      { label: 'Anxiety involves exaggerated threat appraisal', ref: 'Zorowitz et al. 2020', href: 'https://doi.org/10.1162/cpsy_a_00026' },
      { label: 'Uncertainty amplifies vigilance and worry', ref: 'Grupe & Nitschke 2013', href: 'https://doi.org/10.1038/nrn3524' },
    ],
    limitations: ['Threat responses are shaped by experience and context.'],
  },
  anger: {
    supports: [
      { label: 'Approach-related anger activates sympathetic arousal', ref: 'Carver & Harmon-Jones 2009', href: 'https://doi.org/10.1037/a0013965' },
      { label: 'Anger often defends threatened goals or boundaries', ref: 'Kassinove & Tafrate 2002' },
    ],
    limitations: ['Anger can mask secondary emotions like hurt or fear.'],
  },
  loss: {
    supports: [
      { label: 'Sadness and grief follow attachment disruption', ref: 'Bonanno & Keltner 1997', href: 'https://doi.org/10.1037/0021-843X.106.1.126' },
      { label: 'Grief processing varies across mourning phases', ref: 'Stroebe et al. 2007', href: 'https://doi.org/10.2190/OM.61.4.b' },
    ],
    limitations: ['Timelines for loss responses differ widely among individuals.'],
  },
  shame: {
    supports: [
      { label: 'Shame and guilt regulate social belonging', ref: 'Tangney & Dearing 2002', href: 'https://doi.org/10.1037/10371-000' },
      { label: 'Self-conscious emotions rely on internal standards', ref: 'Leach & Cidam 2015', href: 'https://doi.org/10.1037/pspa0000037' },
    ],
    limitations: ['Cultural norms shape how shame and guilt appear.'],
  },
  depletion: {
    supports: [
      { label: 'Boredom signals unmet engagement needs', ref: 'Eastwood et al. 2012', href: 'https://doi.org/10.1177/1745691612456044' },
      { label: 'Low arousal states can blend with negative affect', ref: 'Kuppens et al. 2010', href: 'https://doi.org/10.1037/a0020225' },
    ],
    limitations: ['Physical health factors can mimic low-energy emotions.'],
  },
  curiosity: {
    supports: [
      { label: 'Curiosity rises with manageable uncertainty', ref: 'Kidd & Hayden 2015', href: 'https://doi.org/10.1016/j.neuron.2015.05.005' },
      { label: 'Information gaps motivate exploration', ref: 'Loewenstein 1994', href: 'https://doi.org/10.1037/0033-2909.116.1.75' },
    ],
    limitations: ['Tolerance for ambiguity differs by person and culture.'],
  },
  approach: {
    supports: [
      { label: 'Approach motivation energises goal pursuit', ref: 'Gable & Harmon-Jones 2010', href: 'https://doi.org/10.1177/1754073910375479' },
      { label: 'Positive challenge can heighten focus', ref: 'Seo et al. 2010', href: 'https://doi.org/10.1037/a0020566' },
    ],
    limitations: ['Approach states can co-occur with anxiety or doubt.'],
  },
  positive: {
    supports: [
      { label: 'Positive emotions broaden attention and build resources', ref: 'Fredrickson 2001', href: 'https://doi.org/10.1037/0003-066X.56.3.218' },
      { label: 'Gratitude strengthens relational bonds', ref: 'Algoe 2012', href: 'https://doi.org/10.1111/j.1751-9004.2012.00455.x' },
    ],
    limitations: ['Not everyone resonates with the same positive emotion cues.'],
  },
};

const emotionEvidenceMap: Record<string, string> = {
  anxiety: 'threat', fear: 'threat', overwhelm: 'threat', worry: 'threat', stress: 'threat',
  anger: 'anger', frustration: 'anger', sadness: 'loss', grief: 'loss', lonely: 'loss',
  guilt: 'shame', shame: 'shame', tired: 'depletion', numb: 'depletion', bored: 'depletion',
  curiosity: 'curiosity', thoughtful: 'curiosity', uncertain: 'curiosity', determined: 'approach',
  focused: 'approach', anticipation: 'approach', calm: 'positive', relief: 'positive',
  contentment: 'positive', hope: 'positive', gratitude: 'positive', joy: 'positive', pride: 'positive',
  excitement: 'positive',
};

const skillEvidence: Record<string, EvidenceRecord> = {
  'skill-labeling': labelingEvidence,
  'skill-physiological_sigh': sighEvidence,
  'skill-resonance_6bpm': resonanceEvidence,
  'skill-slow_446': slowBreathEvidence,
};

function slugify(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function resolveFeelingInference(index: ReverseInferenceIndex | null, slug: string) {
  if (!index) return null;
  const slugMap = index._meta?.slugMap ?? {};
  const key = slugMap[slug] ?? slugMap[slugify(slug)];
  const entry = key ? index[key] : null;
  if (!key || !entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  return { feelingKey: key, entry: entry as FeelingInferenceEntry };
}

export function normalizeIntensityBand(band?: number[]) {
  if (!Array.isArray(band) || band.length < 2) return null;
  const min = Number(band[0]);
  const max = Number(band[1]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  const clampedMin = Math.max(0, Math.min(10, min));
  const clampedMax = Math.max(clampedMin, Math.min(10, max));
  return [Math.round(clampedMin), Math.round(clampedMax)] as const;
}

export function formatZoneLabel(zoneKey: string, suggestions: Record<string, ZoneSuggestion> = {}) {
  const canonical = suggestions[zoneKey]?.label;
  if (canonical) return canonical;
  const [energy, valence] = zoneKey.split('-');
  if (!energy || !valence) return zoneKey;
  const energyLabel = energy === 'medium'
    ? 'Steady'
    : `${energy.charAt(0).toUpperCase()}${energy.slice(1)}`;
  const valenceLabel = `${valence.charAt(0).toUpperCase()}${valence.slice(1)}`;
  return `${energyLabel} energy · ${valenceLabel}`;
}

function evidenceRecordForKey(key: string): EvidenceRecord | null {
  if (key.startsWith('zone-')) return zoneEvidence;
  if (skillEvidence[key]) return skillEvidence[key];
  if (key.startsWith('emotion-')) {
    const group = emotionEvidenceMap[key.slice('emotion-'.length)];
    return group ? emotionEvidenceGroups[group] ?? null : null;
  }
  return somaticEvidence;
}

export function collectFeelingEvidence(entry: FeelingInferenceEntry, feelingKey: string): FeelingEvidence {
  const keys = new Set(entry.evidenceKeys ?? []);
  const primaryZone = entry.zones?.[0]?.split('-');
  if (primaryZone?.length === 2) keys.add(`zone-${primaryZone[1]}-${primaryZone[0]}`);
  keys.add(`emotion-${feelingKey}`);

  const supports: EvidenceSupport[] = [];
  const limitations: string[] = [];
  const seenSupports = new Set<string>();
  const seenLimitations = new Set<string>();
  keys.forEach((key) => {
    const record = evidenceRecordForKey(key);
    if (!record) return;
    record.supports.forEach((support) => {
      const identity = `${support.label}|${support.ref ?? ''}|${support.href ?? ''}`;
      if (seenSupports.has(identity)) return;
      seenSupports.add(identity);
      supports.push(support);
    });
    record.limitations.forEach((limitation) => {
      if (seenLimitations.has(limitation)) return;
      seenLimitations.add(limitation);
      limitations.push(limitation);
    });
  });

  const baseline = 'Self-report body maps and affect clusters are directional hints, not diagnoses.';
  if (!seenLimitations.has(baseline)) limitations.push(baseline);
  return { supports, limitations };
}
