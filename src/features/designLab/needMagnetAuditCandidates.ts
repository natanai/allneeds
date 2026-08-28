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
    id: 'honesty-belief-speech-alignment',
    needSlug: 'honesty',
    needTitle: 'Honesty',
    title: 'H1 · Belief + Speech · Alignment Field',
    description: 'A thought bubble and a speech bubble face one another while two separate tracks settle into one shared line across the magnet. This treats Honesty as keeping what you communicate aligned with what you actually take to be true, without implying that everything must be disclosed.',
    iconPath: '/design-lab/need-magnets/honesty-belief.svg',
    secondaryIconPath: '/design-lab/need-magnets/honesty-speech.svg',
    artMaskPath: '/design-lab/need-magnets/honesty-alignment-field.svg',
    faceBackground: 'linear-gradient(100deg, color-mix(in srgb, var(--quiet) 84%, var(--selection) 16%), color-mix(in srgb, var(--selection) 72%, var(--quiet) 28%))',
    iconFill: 'color-mix(in srgb, var(--primary) 72%, var(--text) 28%)',
    secondaryIconFill: 'color-mix(in srgb, var(--action) 58%, var(--text) 42%)',
    artA: 'color-mix(in srgb, var(--primary) 74%, var(--text) 26%)',
    artB: 'color-mix(in srgb, var(--action) 66%, var(--text) 34%)',
    artOpacity: 0.27,
  },
  {
    id: 'honesty-matched-signal',
    needSlug: 'honesty',
    needTitle: 'Honesty',
    title: 'H2 · Inner Signal + Spoken Signal · Same Pattern',
    description: 'The same small waveform appears inside a source circle and inside a speech bubble. Repeated matching waves cross the full face, making this the most abstract version of the idea that the signal being communicated matches the signal you actually hold.',
    iconPath: '/design-lab/need-magnets/honesty-inner-signal.svg',
    secondaryIconPath: '/design-lab/need-magnets/honesty-spoken-signal.svg',
    artMaskPath: '/design-lab/need-magnets/honesty-matched-signal.svg',
    faceBackground: 'linear-gradient(96deg, color-mix(in srgb, var(--selection) 72%, var(--quiet) 28%), color-mix(in srgb, var(--quiet) 72%, var(--positive) 28%))',
    iconFill: 'color-mix(in srgb, var(--primary) 62%, var(--text) 38%)',
    secondaryIconFill: 'color-mix(in srgb, var(--positive) 48%, var(--text) 52%)',
    artA: 'color-mix(in srgb, var(--primary) 68%, var(--text) 32%)',
    artB: 'color-mix(in srgb, var(--positive) 58%, var(--text) 42%)',
    artOpacity: 0.24,
  },
  {
    id: 'honesty-revision-path',
    needSlug: 'honesty',
    needTitle: 'Honesty',
    title: 'H3 · Revision + Update · Corrected Path',
    description: 'A revision mark and an update arrow flank a path that visibly changes course and then continues cleanly. This direction emphasizes that Honesty can include correcting something that no longer represents what you believe, while leaving room for ordinary uncertainty and mistakes.',
    iconPath: '/design-lab/need-magnets/honesty-revise.svg',
    secondaryIconPath: '/design-lab/need-magnets/honesty-update.svg',
    artMaskPath: '/design-lab/need-magnets/honesty-corrected-path.svg',
    faceBackground: 'linear-gradient(105deg, color-mix(in srgb, var(--quiet) 80%, var(--selection) 20%), color-mix(in srgb, var(--selection) 76%, var(--action) 24%))',
    iconFill: 'color-mix(in srgb, var(--outline) 52%, var(--text) 48%)',
    secondaryIconFill: 'color-mix(in srgb, var(--action) 58%, var(--text) 42%)',
    artA: 'color-mix(in srgb, var(--outline) 54%, var(--text) 46%)',
    artB: 'color-mix(in srgb, var(--primary) 64%, var(--text) 36%)',
    artOpacity: 0.28,
  },
  {
    id: 'honesty-statement-impression-overlap',
    needSlug: 'honesty',
    needTitle: 'Honesty',
    title: 'H4 · Statement + Impression · Shared Outline',
    description: 'A statement bubble and its echoed impression use the same central shape while two larger outlines overlap behind the word. This direction focuses on the audited distinction that technically true words can still mislead, so Honesty can involve whether the impression created matches what you actually mean to communicate.',
    iconPath: '/design-lab/need-magnets/honesty-statement.svg',
    secondaryIconPath: '/design-lab/need-magnets/honesty-impression.svg',
    artMaskPath: '/design-lab/need-magnets/honesty-impression-overlap.svg',
    faceBackground: 'linear-gradient(92deg, color-mix(in srgb, var(--selection) 80%, var(--quiet) 20%), color-mix(in srgb, var(--quiet) 76%, var(--action) 24%))',
    iconFill: 'color-mix(in srgb, var(--primary) 66%, var(--text) 34%)',
    secondaryIconFill: 'color-mix(in srgb, var(--secondary) 46%, var(--text) 54%)',
    artA: 'color-mix(in srgb, var(--primary) 66%, var(--text) 34%)',
    artB: 'color-mix(in srgb, var(--secondary) 48%, var(--text) 52%)',
    artOpacity: 0.25,
  },
];
