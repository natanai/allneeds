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
    id: 'safety-signal',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S1 · Safety Signal',
    description: 'The existing shield stays as the anchor while layered signal-like curves spread outward across the face. The motif is meant to hold both sides of Safety: noticing danger and taking in credible cues that it is safe enough to stand down.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-signal.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 82%, var(--quiet) 18%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--attention) 55%, var(--primary) 45%))',
    artA: 'color-mix(in srgb, var(--primary) 84%, var(--attention) 16%)',
    artB: 'color-mix(in srgb, var(--positive) 58%, var(--primary) 42%)',
    artOpacity: 0.72,
  },
  {
    id: 'safety-shelter',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S2 · Shelter',
    description: 'Broad protective arches grow from the shield into a layered canopy behind the word. It is more literal than Safety Signal, emphasizing shelter, cover, and a protected place without turning the magnet into a house icon.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-shelter.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 78%, var(--quiet) 22%)',
    iconFill: 'linear-gradient(135deg, var(--primary), var(--secondary))',
    artA: 'color-mix(in srgb, var(--primary) 70%, var(--positive) 30%)',
    artB: 'color-mix(in srgb, var(--attention) 55%, var(--primary) 45%)',
    artOpacity: 0.7,
  },
  {
    id: 'safety-boundary-map',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3 · Boundary Map',
    description: 'Nested contour-like boundaries extend from the shield across the face, suggesting distance, limits, and a protected zone. The softer topographic treatment is intended to stay recognizable without feeling like warning signage.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-boundary-map.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 84%, var(--quiet) 16%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--positive) 45%, var(--primary) 55%))',
    artA: 'color-mix(in srgb, var(--primary) 74%, var(--secondary) 26%)',
    artB: 'color-mix(in srgb, var(--positive) 45%, var(--primary) 55%)',
    artOpacity: 0.68,
  },
  {
    id: 'safety-safe-passage',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S4 · Safe Passage',
    description: 'Two sweeping bands create a protected route through the magnet rather than a static enclosure. It gestures toward moving away from danger, finding a safer path, and continuing once protection is sufficient.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-safe-passage.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 84%, var(--quiet) 16%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--positive) 52%, var(--primary) 48%))',
    artA: 'color-mix(in srgb, var(--action) 38%, var(--primary) 62%)',
    artB: 'color-mix(in srgb, var(--positive) 55%, var(--primary) 45%)',
    artOpacity: 0.66,
  },
];
