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
    description: 'The preferred literal direction remains the control, but the generic shield icon is replaced with a small umbrella glyph. The full-face art stays recognizable and upright so the next angled candidates can be judged against it.',
    iconPath: 'design-lab/need-magnets/icon-umbrella.svg',
    artMaskPath: 'design-lab/need-magnets/safety-protective-canopy.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 70%, var(--quiet) 30%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--action) 36%, var(--primary) 64%))',
    artA: 'color-mix(in srgb, var(--primary) 70%, var(--action) 30%)',
    artB: 'color-mix(in srgb, var(--outline) 30%, var(--primary) 70%)',
    artOpacity: 0.62,
  },
  {
    id: 'safety-aligned-diagonal',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3b · Aligned Diagonal',
    description: 'This directly corrects the last round: the canopy, ribs, straight shaft, and handle are drawn as one umbrella and rotated together. The canopy sits high on the left and the handle reaches toward the lower right without the top and shaft drifting onto different angles. A shelter-roof icon replaces the shield.',
    iconPath: 'design-lab/need-magnets/icon-shelter-roof.svg',
    artMaskPath: 'design-lab/need-magnets/safety-aligned-diagonal.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 68%, var(--quiet) 32%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--action) 40%, var(--primary) 60%))',
    artA: 'color-mix(in srgb, var(--primary) 76%, var(--action) 24%)',
    artB: 'color-mix(in srgb, var(--attention) 22%, var(--primary) 78%)',
    artOpacity: 0.68,
  },
  {
    id: 'safety-layered-cover',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3c · Layered Cover',
    description: 'The preferred abstract direction stays intact while its shield icon is replaced with cupped hands. The icon tests Safety as being held and supported, while the face continues to express multiple layers reducing what reaches the protected space.',
    iconPath: 'design-lab/need-magnets/icon-cupped-hands.svg',
    artMaskPath: 'design-lab/need-magnets/safety-layered-cover.svg',
    faceBackground: 'color-mix(in srgb, var(--quiet) 58%, var(--selection) 42%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--positive) 28%, var(--primary) 72%))',
    artA: 'color-mix(in srgb, var(--primary) 68%, var(--positive) 32%)',
    artB: 'color-mix(in srgb, var(--action) 30%, var(--primary) 70%)',
    artOpacity: 0.6,
  },
  {
    id: 'safety-long-reach',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3d · Long Reach',
    description: 'A smaller canopy is pushed farther into the upper-left corner while an unusually long shaft and hook extend across the magnet. The entire umbrella is rotated as one rigid object, making the shared angle unmistakable. A tree-canopy icon explores protection as natural cover rather than security branding.',
    iconPath: 'design-lab/need-magnets/icon-tree-canopy.svg',
    artMaskPath: 'design-lab/need-magnets/safety-long-reach.svg',
    faceBackground: 'color-mix(in srgb, var(--quiet) 62%, var(--selection) 38%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--positive) 30%, var(--primary) 70%))',
    artA: 'color-mix(in srgb, var(--primary) 74%, var(--positive) 26%)',
    artB: 'color-mix(in srgb, var(--outline) 32%, var(--primary) 68%)',
    artOpacity: 0.66,
  },
  {
    id: 'safety-offframe-tilt',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3e · Off-frame Tilt',
    description: 'The umbrella becomes a bold crop: part of the canopy disappears beyond the upper-left edge while the shaft and hook continue on the exact same rotated axis toward the lower right. The umbrella icon is repeated at small scale to test whether literal consistency helps the concept read immediately.',
    iconPath: 'design-lab/need-magnets/icon-umbrella.svg',
    artMaskPath: 'design-lab/need-magnets/safety-offframe-tilt.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 74%, var(--quiet) 26%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--secondary) 28%, var(--primary) 72%))',
    artA: 'color-mix(in srgb, var(--primary) 72%, var(--action) 28%)',
    artB: 'color-mix(in srgb, var(--outline) 34%, var(--primary) 66%)',
    artOpacity: 0.66,
  },
  {
    id: 'safety-aligned-echo',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3f · Aligned Echo',
    description: 'Three complete umbrellas share the same strong diagonal, with the rear copies fading like protective layers. Because each whole umbrella is transformed as a unit, every canopy remains aligned with its own shaft and handle. The shelter-roof icon keeps this version away from shield imagery.',
    iconPath: 'design-lab/need-magnets/icon-shelter-roof.svg',
    artMaskPath: 'design-lab/need-magnets/safety-aligned-echo.svg',
    faceBackground: 'color-mix(in srgb, var(--quiet) 58%, var(--selection) 42%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--positive) 32%, var(--primary) 68%))',
    artA: 'color-mix(in srgb, var(--primary) 68%, var(--positive) 32%)',
    artB: 'color-mix(in srgb, var(--action) 30%, var(--primary) 70%)',
    artOpacity: 0.64,
  },
];
