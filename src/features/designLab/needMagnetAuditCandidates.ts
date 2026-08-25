export type NeedMagnetAuditCandidate = Readonly<{
  id: string;
  needSlug: string;
  needTitle: string;
  title: string;
  description: string;
  iconPath: string;
  hideIcon?: boolean;
  artMaskPath?: string;
  faceBackground: string;
  iconFill: string;
  artA: string;
  artB: string;
  artOpacity?: number;
}>;

export const needMagnetAuditCandidates: readonly NeedMagnetAuditCandidate[] = [
  {
    id: 'safety-protective-canopy',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3a · Protective Canopy',
    description: 'The preferred S3 concept stays as the control: a recognizable umbrella canopy, ribs, and hooked handle. It keeps Safety grounded in the concrete idea of something standing between you and harmful exposure.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-protective-canopy.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 70%, var(--quiet) 30%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--action) 36%, var(--primary) 64%))',
    artA: 'color-mix(in srgb, var(--primary) 70%, var(--action) 30%)',
    artB: 'color-mix(in srgb, var(--outline) 30%, var(--primary) 70%)',
    artOpacity: 0.62,
  },
  {
    id: 'safety-shelter-arc',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3b · Shelter Arc',
    description: 'The umbrella object is stripped away until only its protective geometry remains: one strong outer arc and a quieter inner arc. The meaning is overhead cover and a protected zone beneath it, without depicting a specific shelter.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-shelter-arc.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 76%, var(--quiet) 24%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--outline) 24%, var(--primary) 76%))',
    artA: 'color-mix(in srgb, var(--primary) 78%, var(--action) 22%)',
    artB: 'color-mix(in srgb, var(--outline) 36%, var(--primary) 64%)',
    artOpacity: 0.64,
  },
  {
    id: 'safety-layered-cover',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3c · Layered Cover',
    description: 'Several offset membranes overlap above and around the word. Instead of a single hard barrier, Safety is represented as layers that absorb, diffuse, and reduce what reaches the protected space.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-layered-cover.svg',
    faceBackground: 'color-mix(in srgb, var(--quiet) 58%, var(--selection) 42%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--positive) 28%, var(--primary) 72%))',
    artA: 'color-mix(in srgb, var(--primary) 68%, var(--positive) 32%)',
    artB: 'color-mix(in srgb, var(--action) 30%, var(--primary) 70%)',
    artOpacity: 0.6,
  },
  {
    id: 'safety-quiet-understory',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3d · Quiet Understory',
    description: 'The canopy becomes negative space: a broad upper field presses toward the magnet while a calm hollow is left open underneath. It tests whether Safety can read as the experience of reduced exposure rather than as the protective object itself.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-quiet-understory.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 68%, var(--quiet) 32%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--secondary) 26%, var(--primary) 74%))',
    artA: 'color-mix(in srgb, var(--outline) 38%, var(--primary) 62%)',
    artB: 'color-mix(in srgb, var(--primary) 72%, var(--quiet) 28%)',
    artOpacity: 0.58,
  },
  {
    id: 'safety-enfolding-field',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3e · Enfolding Field',
    description: 'Two broad protective fields curve inward from opposite sides and nearly meet around the center. It is the most abstract descendant of S3: Safety as being buffered and held within a surrounding field, with enough openness left to avoid feeling trapped.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-enfolding-field.svg',
    faceBackground: 'color-mix(in srgb, var(--quiet) 64%, var(--selection) 36%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--positive) 34%, var(--primary) 66%))',
    artA: 'color-mix(in srgb, var(--primary) 74%, var(--positive) 26%)',
    artB: 'color-mix(in srgb, var(--outline) 30%, var(--primary) 70%)',
    artOpacity: 0.6,
  },
];
