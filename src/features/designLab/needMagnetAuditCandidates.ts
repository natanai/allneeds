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
    id: 'accountability-a1-responsibility-mosaic',
    needSlug: 'accountability',
    needTitle: 'Accountability',
    title: 'A1 · Responsibility Mosaic',
    description: 'Contributing pieces fill the face while one piece sits distinctly forward: recognizing the part that is yours without claiming the whole outcome.',
    iconPath: '/design-lab/need-magnets/accountability-mosaic-icon.svg',
    artMaskPath: '/design-lab/need-magnets/accountability-mosaic-field.svg',
    faceBackground: 'linear-gradient(135deg, color-mix(in srgb, var(--quiet) 72%, var(--selection) 28%), color-mix(in srgb, var(--selection) 76%, var(--positive) 24%))',
    iconFill: 'color-mix(in srgb, var(--primary) 82%, var(--text) 18%)',
    artA: 'color-mix(in srgb, var(--primary) 76%, var(--text) 24%)',
    artB: 'color-mix(in srgb, var(--action) 70%, var(--text) 30%)',
    artOpacity: 0.34,
  },
  {
    id: 'accountability-a2-ripple-response',
    needSlug: 'accountability',
    needTitle: 'Accountability',
    title: 'A2 · Ripple & Response',
    description: 'An action mark sends effects outward while the field turns back toward them: accountability as remaining willing to respond to what our actions set in motion.',
    iconPath: '/design-lab/need-magnets/accountability-ripple-icon.svg',
    artMaskPath: '/design-lab/need-magnets/accountability-ripple-field.svg',
    faceBackground: 'linear-gradient(125deg, color-mix(in srgb, var(--quiet) 78%, var(--selection) 22%), color-mix(in srgb, var(--selection) 72%, var(--action) 28%))',
    iconFill: 'color-mix(in srgb, var(--action) 74%, var(--text) 26%)',
    artA: 'color-mix(in srgb, var(--primary) 72%, var(--text) 28%)',
    artB: 'color-mix(in srgb, var(--positive) 68%, var(--text) 32%)',
    artOpacity: 0.32,
  },
  {
    id: 'accountability-a3-open-account',
    needSlug: 'accountability',
    needTitle: 'Accountability',
    title: 'A3 · Open Account',
    description: 'An open record rather than a verdict or checklist: what happened and our part in it can be named, explained, and answered for.',
    iconPath: '/design-lab/need-magnets/accountability-account-icon.svg',
    artMaskPath: '/design-lab/need-magnets/accountability-account-field.svg',
    faceBackground: 'linear-gradient(140deg, color-mix(in srgb, var(--quiet) 84%, var(--selection) 16%), color-mix(in srgb, var(--selection) 82%, var(--primary) 18%))',
    iconFill: 'color-mix(in srgb, var(--text) 72%, var(--primary) 28%)',
    artA: 'color-mix(in srgb, var(--outline) 58%, var(--text) 42%)',
    artB: 'color-mix(in srgb, var(--primary) 62%, var(--text) 38%)',
    artOpacity: 0.3,
  },
  {
    id: 'accountability-a4-repair-seam',
    needSlug: 'accountability',
    needTitle: 'Accountability',
    title: 'A4 · Repair Seam',
    description: 'A visible break is met by a deliberate seam. This direction emphasizes responding to effects and the possibility of repair without using punishment or blame imagery.',
    iconPath: '/design-lab/need-magnets/accountability-repair-icon.svg',
    artMaskPath: '/design-lab/need-magnets/accountability-repair-field.svg',
    faceBackground: 'linear-gradient(130deg, color-mix(in srgb, var(--quiet) 74%, var(--selection) 26%), color-mix(in srgb, var(--selection) 74%, var(--positive) 26%))',
    iconFill: 'color-mix(in srgb, var(--primary) 76%, var(--text) 24%)',
    artA: 'color-mix(in srgb, var(--primary) 66%, var(--text) 34%)',
    artB: 'color-mix(in srgb, var(--positive) 70%, var(--text) 30%)',
    artOpacity: 0.31,
  },
  {
    id: 'accountability-a5-effect-loop',
    needSlug: 'accountability',
    needTitle: 'Accountability',
    title: 'A5 · Effect Loop',
    description: 'Three linked points read as action, effect, and response. The final link makes this more than a causality diagram: accountability includes what happens after our part is recognized.',
    iconPath: '/design-lab/need-magnets/accountability-loop-icon.svg',
    artMaskPath: '/design-lab/need-magnets/accountability-loop-field.svg',
    faceBackground: 'linear-gradient(135deg, color-mix(in srgb, var(--quiet) 76%, var(--selection) 24%), color-mix(in srgb, var(--selection) 70%, var(--action) 30%))',
    iconFill: 'color-mix(in srgb, var(--action) 70%, var(--text) 30%)',
    artA: 'color-mix(in srgb, var(--primary) 68%, var(--text) 32%)',
    artB: 'color-mix(in srgb, var(--action) 70%, var(--text) 30%)',
    artOpacity: 0.3,
  },
];