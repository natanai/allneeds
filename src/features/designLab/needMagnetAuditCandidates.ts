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
    id: 'safety-fortress',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S1 · Fortress',
    description: 'A crenellated castle wall spans the face, with towers and a visible arched gate. It treats Safety as defended space: a boundary strong enough to keep threats out while still leaving a recognizable way in and out.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-fortress.svg',
    faceBackground: 'color-mix(in srgb, var(--quiet) 76%, var(--selection) 24%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--outline) 32%, var(--primary) 68%))',
    artA: 'color-mix(in srgb, var(--primary) 78%, var(--outline) 22%)',
    artB: 'color-mix(in srgb, var(--primary) 68%, var(--attention) 32%)',
    artOpacity: 0.64,
  },
  {
    id: 'safety-sheltered-home',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S2 · Sheltered Home',
    description: 'A small pitched-roof home with a door, window, chimney, and grounded base makes the idea intentionally literal. This version frames Safety as having somewhere protected and familiar to return to, not only as reacting to danger.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-sheltered-home.svg',
    faceBackground: 'color-mix(in srgb, var(--quiet) 74%, var(--positive) 26%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--positive) 42%, var(--primary) 58%))',
    artA: 'color-mix(in srgb, var(--primary) 72%, var(--positive) 28%)',
    artB: 'color-mix(in srgb, var(--outline) 28%, var(--primary) 72%)',
    artOpacity: 0.6,
  },
  {
    id: 'safety-protective-canopy',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3 · Protective Canopy',
    description: 'A broad umbrella canopy stretches over the word with visible ribs and a hooked handle. It represents Safety as cover from exposure: the outside world can still be present while something protective stands between you and what could harm you.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-protective-canopy.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 70%, var(--quiet) 30%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--action) 36%, var(--primary) 64%))',
    artA: 'color-mix(in srgb, var(--primary) 70%, var(--action) 30%)',
    artB: 'color-mix(in srgb, var(--outline) 30%, var(--primary) 70%)',
    artOpacity: 0.62,
  },
  {
    id: 'safety-safe-nest',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S4 · Safe Nest',
    description: 'A woven nest cups three small forms from below while overlapping branches rise around them. This version emphasizes the held and relational side of Safety: being supported closely enough that the body can settle rather than needing a hard wall.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-safe-nest.svg',
    faceBackground: 'color-mix(in srgb, var(--quiet) 70%, var(--positive) 30%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--positive) 50%, var(--primary) 50%))',
    artA: 'color-mix(in srgb, var(--primary) 66%, var(--positive) 34%)',
    artB: 'color-mix(in srgb, var(--outline) 34%, var(--primary) 66%)',
    artOpacity: 0.58,
  },
];
