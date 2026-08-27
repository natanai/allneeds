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
    id: 'clarity-focus-compass-thread',
    needSlug: 'clarity',
    needTitle: 'Clarity',
    title: 'C4A · One Thread',
    description: 'The original C4 background. One continuous path crosses the magnet and passes through marked points, linking external distinction with internal orientation.',
    iconPath: '/design-lab/need-magnets/clarity-explicit-focus.svg',
    secondaryIconPath: '/design-lab/need-magnets/clarity-inner-compass.svg',
    artMaskPath: '/design-lab/need-magnets/clarity-one-thread.svg',
    faceBackground: 'linear-gradient(105deg, color-mix(in srgb, var(--quiet) 86%, var(--selection) 14%), color-mix(in srgb, var(--selection) 70%, var(--action) 30%))',
    iconFill: 'color-mix(in srgb, var(--primary) 70%, var(--text) 30%)',
    secondaryIconFill: 'color-mix(in srgb, var(--action) 62%, var(--outline) 38%)',
    artA: 'color-mix(in srgb, var(--primary) 78%, var(--text) 22%)',
    artB: 'color-mix(in srgb, var(--action) 72%, var(--outline) 28%)',
    artOpacity: 0.27,
  },
  {
    id: 'clarity-focus-compass-pulse',
    needSlug: 'clarity',
    needTitle: 'Clarity',
    title: 'C4B · Pulse',
    description: 'A continuous signal runs from one side to the other, changing sharply as distinctions become visible and passing through a shared center point. It treats both lenses as ways of reading the same signal more clearly.',
    iconPath: '/design-lab/need-magnets/clarity-explicit-focus.svg',
    secondaryIconPath: '/design-lab/need-magnets/clarity-inner-compass.svg',
    artMaskPath: '/design-lab/need-magnets/clarity-pulse.svg',
    faceBackground: 'linear-gradient(100deg, color-mix(in srgb, var(--quiet) 84%, var(--selection) 16%), color-mix(in srgb, var(--selection) 76%, var(--positive) 24%))',
    iconFill: 'color-mix(in srgb, var(--primary) 72%, var(--text) 28%)',
    secondaryIconFill: 'color-mix(in srgb, var(--positive) 54%, var(--text) 46%)',
    artA: 'var(--primary)',
    artB: 'color-mix(in srgb, var(--positive) 62%, var(--text) 38%)',
    artOpacity: 0.3,
  },
  {
    id: 'clarity-focus-compass-blueprint',
    needSlug: 'clarity',
    needTitle: 'Clarity',
    title: 'C4C · Blueprint Grid',
    description: 'Graph-paper lines cover the whole face. A measured rectangular field on the left and radial field on the right share one reference line, suggesting that both outside information and inner orientation become clearer through explicit reference points.',
    iconPath: '/design-lab/need-magnets/clarity-explicit-focus.svg',
    secondaryIconPath: '/design-lab/need-magnets/clarity-inner-compass.svg',
    artMaskPath: '/design-lab/need-magnets/clarity-blueprint-grid.svg',
    faceBackground: 'linear-gradient(90deg, color-mix(in srgb, var(--quiet) 88%, var(--selection) 12%), color-mix(in srgb, var(--selection) 82%, var(--quiet) 18%))',
    iconFill: 'color-mix(in srgb, var(--primary) 74%, var(--outline) 26%)',
    secondaryIconFill: 'color-mix(in srgb, var(--action) 56%, var(--text) 44%)',
    artA: 'color-mix(in srgb, var(--primary) 76%, var(--outline) 24%)',
    artB: 'color-mix(in srgb, var(--action) 64%, var(--text) 36%)',
    artOpacity: 0.24,
  },
  {
    id: 'clarity-focus-compass-alignment',
    needSlug: 'clarity',
    needTitle: 'Clarity',
    title: 'C4D · Alignment Field',
    description: 'Two reference fields sit at opposite ends while crossing curves meet at the center. The background suggests that clarity can come from locating what is outside you and what is inside you against a shared set of reference points.',
    iconPath: '/design-lab/need-magnets/clarity-explicit-focus.svg',
    secondaryIconPath: '/design-lab/need-magnets/clarity-inner-compass.svg',
    artMaskPath: '/design-lab/need-magnets/clarity-alignment-field.svg',
    faceBackground: 'linear-gradient(95deg, color-mix(in srgb, var(--quiet) 80%, var(--secondary) 20%), color-mix(in srgb, var(--selection) 76%, var(--action) 24%))',
    iconFill: 'color-mix(in srgb, var(--primary) 66%, var(--text) 34%)',
    secondaryIconFill: 'color-mix(in srgb, var(--action) 60%, var(--outline) 40%)',
    artA: 'color-mix(in srgb, var(--primary) 74%, var(--text) 26%)',
    artB: 'color-mix(in srgb, var(--action) 68%, var(--outline) 32%)',
    artOpacity: 0.26,
  },
];
