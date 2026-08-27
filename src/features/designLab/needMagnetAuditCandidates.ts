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
    id: 'clarity-window-compass-horizon',
    needSlug: 'clarity',
    needTitle: 'Clarity',
    title: 'C1 · Window + Compass · Shared Horizon',
    description: 'Left: making outside information explicit through visible panes and distinctions. Right: getting clear within yourself through orientation. The shared horizon turns a grid on the outside into concentric orientation on the inside, with both meeting on one axis.',
    iconPath: '/design-lab/need-magnets/clarity-explicit-window.svg',
    secondaryIconPath: '/design-lab/need-magnets/clarity-inner-compass.svg',
    artMaskPath: '/design-lab/need-magnets/clarity-shared-horizon.svg',
    faceBackground: 'linear-gradient(90deg, color-mix(in srgb, var(--quiet) 82%, var(--selection) 18%), color-mix(in srgb, var(--selection) 78%, var(--quiet) 22%))',
    iconFill: 'color-mix(in srgb, var(--primary) 78%, var(--text) 22%)',
    secondaryIconFill: 'color-mix(in srgb, var(--action) 68%, var(--text) 32%)',
    artA: 'var(--primary)',
    artB: 'var(--action)',
    artOpacity: 0.24,
  },
  {
    id: 'clarity-list-values-flow',
    needSlug: 'clarity',
    needTitle: 'Clarity',
    title: 'C2 · Explicit Rows + Values Center · Distinction Flow',
    description: 'Left: separating information into explicit pieces. Right: noticing which values or priorities are active within you. The background carries several distinct strands toward a common center, then lets them remain distinguishable rather than collapsing them into one answer.',
    iconPath: '/design-lab/need-magnets/clarity-explicit-list.svg',
    secondaryIconPath: '/design-lab/need-magnets/clarity-inner-values.svg',
    artMaskPath: '/design-lab/need-magnets/clarity-distinction-flow.svg',
    faceBackground: 'linear-gradient(100deg, color-mix(in srgb, var(--selection) 76%, var(--quiet) 24%), color-mix(in srgb, var(--quiet) 72%, var(--positive) 28%))',
    iconFill: 'color-mix(in srgb, var(--primary) 74%, var(--outline) 26%)',
    secondaryIconFill: 'color-mix(in srgb, var(--positive) 58%, var(--text) 42%)',
    artA: 'var(--primary)',
    artB: 'color-mix(in srgb, var(--positive) 64%, var(--text) 36%)',
    artOpacity: 0.25,
  },
  {
    id: 'clarity-focus-mirror-overlap',
    needSlug: 'clarity',
    needTitle: 'Clarity',
    title: 'C3 · Focus Frame + Mirror · Overlap Field',
    description: 'Left: making the relevant outside distinction explicit by framing it. Right: reflecting inward on what you think or value. The rectangular outside field and circular inside field overlap behind the word, treating Clarity as the shared act of making something more distinctly recognizable.',
    iconPath: '/design-lab/need-magnets/clarity-explicit-focus.svg',
    secondaryIconPath: '/design-lab/need-magnets/clarity-inner-mirror.svg',
    artMaskPath: '/design-lab/need-magnets/clarity-overlap-field.svg',
    faceBackground: 'linear-gradient(90deg, color-mix(in srgb, var(--quiet) 74%, var(--secondary) 26%), color-mix(in srgb, var(--selection) 82%, var(--quiet) 18%))',
    iconFill: 'color-mix(in srgb, var(--outline) 58%, var(--primary) 42%)',
    secondaryIconFill: 'color-mix(in srgb, var(--secondary) 54%, var(--text) 46%)',
    artA: 'color-mix(in srgb, var(--primary) 72%, var(--outline) 28%)',
    artB: 'color-mix(in srgb, var(--secondary) 52%, var(--text) 48%)',
    artOpacity: 0.23,
  },
  {
    id: 'clarity-focus-compass-thread',
    needSlug: 'clarity',
    needTitle: 'Clarity',
    title: 'C4 · Focus + Compass · One Thread',
    description: 'Left: identify exactly what is being distinguished. Right: orient to what matters within yourself. A single thread crosses the whole magnet and bends through several marked points, emphasizing that both lenses involve following ambiguity until the relevant distinctions become easier to see.',
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
];
