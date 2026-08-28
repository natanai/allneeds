export type NeedMagnetAuditCandidate = Readonly<{
  id: string;
  needSlug: string;
  needTitle: string;
  title: string;
  description: string;
  iconPath: string;
  secondaryIconPath?: string;
  hideIcon?: boolean;
  artMaskPath?: string;
  faceBackground: string;
  iconFill: string;
  secondaryIconFill?: string;
  artA: string;
  artB: string;
  artOpacity?: number;
}>;

export const needMagnetAuditCandidates: readonly NeedMagnetAuditCandidate[] = [
  {
    id: 'honesty-speak-from-heart',
    needSlug: 'honesty',
    needTitle: 'Honesty',
    title: 'H1 · Speak from the Heart',
    description: 'A heart with a small open voice channel becomes the primary symbol, while clean lines move outward across the face. The heart is a metaphor for speaking from what you actually mean and take to be true, not a claim that Honesty requires emotional disclosure.',
    iconPath: '/design-lab/need-magnets/honesty-heart-voice.svg',
    artMaskPath: '/design-lab/need-magnets/honesty-heart-voice-field.svg',
    faceBackground: 'linear-gradient(100deg, color-mix(in srgb, var(--quiet) 82%, var(--selection) 18%), color-mix(in srgb, var(--selection) 72%, var(--quiet) 28%))',
    iconFill: 'color-mix(in srgb, var(--primary) 72%, var(--text) 28%)',
    artA: 'color-mix(in srgb, var(--primary) 72%, var(--text) 28%)',
    artB: 'color-mix(in srgb, var(--action) 62%, var(--text) 38%)',
    artOpacity: 0.27,
  },
  {
    id: 'honesty-words-from-heart',
    needSlug: 'honesty',
    needTitle: 'Honesty',
    title: 'H2 · Words from the Heart',
    description: 'Short word-lines sit inside a heart and continue beyond it across the magnet. This is the most literal version of the metaphor: what is expressed comes from the same place as what the person actually means, without turning the magnet into another generic speech-bubble identity.',
    iconPath: '/design-lab/need-magnets/honesty-heart-words.svg',
    artMaskPath: '/design-lab/need-magnets/honesty-heart-words-field.svg',
    faceBackground: 'linear-gradient(96deg, color-mix(in srgb, var(--selection) 74%, var(--quiet) 26%), color-mix(in srgb, var(--quiet) 72%, var(--positive) 28%))',
    iconFill: 'color-mix(in srgb, var(--secondary) 48%, var(--text) 52%)',
    artA: 'color-mix(in srgb, var(--primary) 64%, var(--text) 36%)',
    artB: 'color-mix(in srgb, var(--positive) 56%, var(--text) 44%)',
    artOpacity: 0.25,
  },
  {
    id: 'honesty-open-heart-channel',
    needSlug: 'honesty',
    needTitle: 'Honesty',
    title: 'H3 · Open Heart Channel',
    description: 'A heart outline opens into one uninterrupted channel that continues outward. Unlike a pulse or waveform, the line stays calm and continuous. The visual tests whether Honesty can own the idea of a direct path from what is meant to what is expressed.',
    iconPath: '/design-lab/need-magnets/honesty-heart-channel.svg',
    artMaskPath: '/design-lab/need-magnets/honesty-heart-channel-field.svg',
    faceBackground: 'linear-gradient(102deg, color-mix(in srgb, var(--quiet) 84%, var(--selection) 16%), color-mix(in srgb, var(--selection) 68%, var(--action) 32%))',
    iconFill: 'color-mix(in srgb, var(--action) 58%, var(--text) 42%)',
    artA: 'color-mix(in srgb, var(--primary) 66%, var(--text) 34%)',
    artB: 'color-mix(in srgb, var(--action) 62%, var(--text) 38%)',
    artOpacity: 0.26,
  },
  {
    id: 'honesty-corrected-path',
    needSlug: 'honesty',
    needTitle: 'Honesty',
    title: 'H4 · Corrected Path',
    description: 'A route visibly changes course and then continues cleanly. This keeps the earlier motif you liked while giving it a unique path-correction icon instead of a generic update arrow. It emphasizes that Honesty can include revising what you communicate when it no longer represents what you believe.',
    iconPath: '/design-lab/need-magnets/honesty-path-correction.svg',
    artMaskPath: '/design-lab/need-magnets/honesty-corrected-path.svg',
    faceBackground: 'linear-gradient(105deg, color-mix(in srgb, var(--quiet) 80%, var(--selection) 20%), color-mix(in srgb, var(--selection) 76%, var(--action) 24%))',
    iconFill: 'color-mix(in srgb, var(--outline) 52%, var(--text) 48%)',
    artA: 'color-mix(in srgb, var(--outline) 54%, var(--text) 46%)',
    artB: 'color-mix(in srgb, var(--primary) 64%, var(--text) 36%)',
    artOpacity: 0.28,
  },
];
