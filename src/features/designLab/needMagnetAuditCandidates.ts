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
    id: 'honesty-alignment-field',
    needSlug: 'honesty',
    needTitle: 'Honesty',
    title: 'H1 · Alignment Field',
    description: 'One communication icon anchors the magnet while two separate tracks settle into one shared line across the face. The background carries the idea that what is communicated stays aligned with what the person actually takes to be true, without implying that everything must be disclosed.',
    iconPath: '/design-lab/need-magnets/honesty-statement.svg',
    artMaskPath: '/design-lab/need-magnets/honesty-alignment-field.svg',
    faceBackground: 'linear-gradient(100deg, color-mix(in srgb, var(--quiet) 84%, var(--selection) 16%), color-mix(in srgb, var(--selection) 72%, var(--quiet) 28%))',
    iconFill: 'color-mix(in srgb, var(--primary) 72%, var(--text) 28%)',
    artA: 'color-mix(in srgb, var(--primary) 74%, var(--text) 26%)',
    artB: 'color-mix(in srgb, var(--action) 66%, var(--text) 34%)',
    artOpacity: 0.27,
  },
  {
    id: 'honesty-matched-signal',
    needSlug: 'honesty',
    needTitle: 'Honesty',
    title: 'H2 · Same Pattern',
    description: 'A speech bubble containing a signal waveform acts as the single icon. Repeated matching waves cross the full face, making this the most abstract version of communication carrying the same pattern rather than changing into a different one.',
    iconPath: '/design-lab/need-magnets/honesty-spoken-signal.svg',
    artMaskPath: '/design-lab/need-magnets/honesty-matched-signal.svg',
    faceBackground: 'linear-gradient(96deg, color-mix(in srgb, var(--selection) 72%, var(--quiet) 28%), color-mix(in srgb, var(--quiet) 72%, var(--positive) 28%))',
    iconFill: 'color-mix(in srgb, var(--positive) 48%, var(--text) 52%)',
    artA: 'color-mix(in srgb, var(--primary) 68%, var(--text) 32%)',
    artB: 'color-mix(in srgb, var(--positive) 58%, var(--text) 42%)',
    artOpacity: 0.24,
  },
  {
    id: 'honesty-revision-path',
    needSlug: 'honesty',
    needTitle: 'Honesty',
    title: 'H3 · Corrected Path',
    description: 'A single update icon sits beside a path that visibly changes course and then continues cleanly. This direction emphasizes that Honesty can include correcting something that no longer represents what you believe, while leaving room for ordinary uncertainty and mistakes.',
    iconPath: '/design-lab/need-magnets/honesty-update.svg',
    artMaskPath: '/design-lab/need-magnets/honesty-corrected-path.svg',
    faceBackground: 'linear-gradient(105deg, color-mix(in srgb, var(--quiet) 80%, var(--selection) 20%), color-mix(in srgb, var(--selection) 76%, var(--action) 24%))',
    iconFill: 'color-mix(in srgb, var(--action) 58%, var(--text) 42%)',
    artA: 'color-mix(in srgb, var(--outline) 54%, var(--text) 46%)',
    artB: 'color-mix(in srgb, var(--primary) 64%, var(--text) 36%)',
    artOpacity: 0.28,
  },
  {
    id: 'honesty-impression-overlap',
    needSlug: 'honesty',
    needTitle: 'Honesty',
    title: 'H4 · Shared Outline',
    description: 'One layered speech-bubble icon represents a statement and the impression it leaves. Larger overlapping outlines continue that idea across the face, focusing on whether the impression created matches what is actually meant rather than whether isolated words are merely technically true.',
    iconPath: '/design-lab/need-magnets/honesty-impression.svg',
    artMaskPath: '/design-lab/need-magnets/honesty-impression-overlap.svg',
    faceBackground: 'linear-gradient(92deg, color-mix(in srgb, var(--selection) 80%, var(--quiet) 20%), color-mix(in srgb, var(--quiet) 76%, var(--action) 24%))',
    iconFill: 'color-mix(in srgb, var(--secondary) 46%, var(--text) 54%)',
    artA: 'color-mix(in srgb, var(--primary) 66%, var(--text) 34%)',
    artB: 'color-mix(in srgb, var(--secondary) 48%, var(--text) 52%)',
    artOpacity: 0.25,
  },
];
