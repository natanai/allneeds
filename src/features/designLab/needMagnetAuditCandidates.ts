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
    description: 'The preferred literal control: a recognizable umbrella canopy, ribs, and hooked handle. It keeps Safety grounded in the concrete idea of something standing between you and harmful exposure.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-protective-canopy.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 70%, var(--quiet) 30%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--action) 36%, var(--primary) 64%))',
    artA: 'color-mix(in srgb, var(--primary) 70%, var(--action) 30%)',
    artB: 'color-mix(in srgb, var(--outline) 30%, var(--primary) 70%)',
    artOpacity: 0.62,
  },
  {
    id: 'safety-wide-parasol',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3b · Wide Parasol',
    description: 'A much wider, flatter umbrella stretches across the face with clearly segmented panels and a compact central handle. It tests whether broad overhead coverage reads as safer and calmer than the steeper original canopy.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-wide-parasol.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 72%, var(--quiet) 28%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--action) 30%, var(--primary) 70%))',
    artA: 'color-mix(in srgb, var(--primary) 74%, var(--action) 26%)',
    artB: 'color-mix(in srgb, var(--outline) 34%, var(--primary) 66%)',
    artOpacity: 0.62,
  },
  {
    id: 'safety-layered-cover',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3c · Layered Cover',
    description: 'The other preferred direction stays in the set: several offset membranes overlap above and around the word. It keeps the umbrella idea abstracted into layered protection that absorbs and reduces what reaches the protected space.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-layered-cover.svg',
    faceBackground: 'color-mix(in srgb, var(--quiet) 58%, var(--selection) 42%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--positive) 28%, var(--primary) 72%))',
    artA: 'color-mix(in srgb, var(--primary) 68%, var(--positive) 32%)',
    artB: 'color-mix(in srgb, var(--action) 30%, var(--primary) 70%)',
    artOpacity: 0.6,
  },
  {
    id: 'safety-deep-bell',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3d · Deep Bell',
    description: 'A taller bell-shaped umbrella drops farther down at the sides, creating a more enveloping protected pocket beneath it. It is still unmistakably an umbrella, but it leans toward shelter and enclosure rather than simple overhead cover.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-deep-bell.svg',
    faceBackground: 'color-mix(in srgb, var(--quiet) 62%, var(--selection) 38%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--positive) 24%, var(--primary) 76%))',
    artA: 'color-mix(in srgb, var(--primary) 72%, var(--positive) 28%)',
    artB: 'color-mix(in srgb, var(--outline) 34%, var(--primary) 66%)',
    artOpacity: 0.62,
  },
  {
    id: 'safety-windward-umbrella',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3e · Windward Umbrella',
    description: 'The umbrella tilts into incoming pressure instead of sitting symmetrically overhead. The angled canopy and outside streaks frame Safety as active protection: orienting toward what is coming and putting a barrier in its path.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-windward-umbrella.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 68%, var(--quiet) 32%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--attention) 26%, var(--primary) 74%))',
    artA: 'color-mix(in srgb, var(--primary) 72%, var(--action) 28%)',
    artB: 'color-mix(in srgb, var(--attention) 28%, var(--primary) 72%)',
    artOpacity: 0.62,
  },
  {
    id: 'safety-twin-canopy',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3f · Twin Canopy',
    description: 'Two offset umbrella canopies overlap across the face, with one shared protected area underneath. It turns the umbrella into a layered motif and tests the idea of redundant protection: more than one source of cover working together.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-twin-canopy.svg',
    faceBackground: 'color-mix(in srgb, var(--quiet) 60%, var(--selection) 40%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--positive) 30%, var(--primary) 70%))',
    artA: 'color-mix(in srgb, var(--primary) 70%, var(--positive) 30%)',
    artB: 'color-mix(in srgb, var(--action) 24%, var(--primary) 76%)',
    artOpacity: 0.6,
  },
];
