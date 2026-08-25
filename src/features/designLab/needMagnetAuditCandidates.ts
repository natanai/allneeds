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
    description: 'The preferred literal control stays unchanged: a recognizable umbrella canopy, ribs, and hooked handle. It remains the baseline for testing how much more dramatic the same protective idea can become.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-protective-canopy.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 70%, var(--quiet) 30%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--action) 36%, var(--primary) 64%))',
    artA: 'color-mix(in srgb, var(--primary) 70%, var(--action) 30%)',
    artB: 'color-mix(in srgb, var(--outline) 30%, var(--primary) 70%)',
    artOpacity: 0.62,
  },
  {
    id: 'safety-diagonal-guardian',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3b · Diagonal Guardian',
    description: 'A strongly tilted umbrella puts the canopy high on the left while the shaft and hooked handle sweep far out toward the lower right. The asymmetry makes the umbrella feel deliberately placed between the protected space and incoming exposure.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-diagonal-guardian.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 68%, var(--quiet) 32%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--action) 40%, var(--primary) 60%))',
    artA: 'color-mix(in srgb, var(--primary) 76%, var(--action) 24%)',
    artB: 'color-mix(in srgb, var(--attention) 24%, var(--primary) 76%)',
    artOpacity: 0.66,
  },
  {
    id: 'safety-layered-cover',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3c · Layered Cover',
    description: 'The other preferred control stays unchanged: several offset membranes overlap above and around the word. It keeps the umbrella idea abstracted into layered protection that absorbs and reduces what reaches the protected space.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-layered-cover.svg',
    faceBackground: 'color-mix(in srgb, var(--quiet) 58%, var(--selection) 42%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--positive) 28%, var(--primary) 72%))',
    artA: 'color-mix(in srgb, var(--primary) 68%, var(--positive) 32%)',
    artB: 'color-mix(in srgb, var(--action) 30%, var(--primary) 70%)',
    artOpacity: 0.6,
  },
  {
    id: 'safety-cropped-sweep',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3d · Cropped Sweep',
    description: 'The umbrella is enlarged until the canopy is intentionally cropped by the upper-left edge and its shaft cuts diagonally across almost the entire magnet. It treats the umbrella as a bold full-face composition instead of a small centered illustration.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-cropped-sweep.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 74%, var(--quiet) 26%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--secondary) 28%, var(--primary) 72%))',
    artA: 'color-mix(in srgb, var(--primary) 72%, var(--action) 28%)',
    artB: 'color-mix(in srgb, var(--outline) 34%, var(--primary) 66%)',
    artOpacity: 0.64,
  },
  {
    id: 'safety-side-shield',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3e · Side Shield',
    description: 'The umbrella rotates almost sideways so its canopy becomes a barrier on the left and the long handle reaches across the face to the right. It pushes the idea of Safety away from overhead shelter and toward an active shield.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-side-shield.svg',
    faceBackground: 'color-mix(in srgb, var(--quiet) 62%, var(--selection) 38%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--attention) 30%, var(--primary) 70%))',
    artA: 'color-mix(in srgb, var(--primary) 74%, var(--attention) 26%)',
    artB: 'color-mix(in srgb, var(--outline) 32%, var(--primary) 68%)',
    artOpacity: 0.64,
  },
  {
    id: 'safety-echo-canopy',
    needSlug: 'safety',
    needTitle: 'Safety',
    title: 'S3f · Echo Canopy',
    description: 'A clear angled umbrella is backed by two offset canopy echoes. It deliberately combines the literal readability of S3a with the layered rhythm of S3c, making protection feel repeated and reinforced rather than represented by a single barrier.',
    iconPath: 'icons/needs/safety.svg',
    artMaskPath: 'design-lab/need-magnets/safety-echo-canopy.svg',
    faceBackground: 'color-mix(in srgb, var(--quiet) 58%, var(--selection) 42%)',
    iconFill: 'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--positive) 32%, var(--primary) 68%))',
    artA: 'color-mix(in srgb, var(--primary) 68%, var(--positive) 32%)',
    artB: 'color-mix(in srgb, var(--action) 30%, var(--primary) 70%)',
    artOpacity: 0.64,
  },
];
