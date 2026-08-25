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

const gradientIcon = 'linear-gradient(135deg, var(--audit-art-a), var(--audit-art-b))';

export const needMagnetAuditCandidates: readonly NeedMagnetAuditCandidate[] = [
  {
    id: 'support-alpine-fade',
    needSlug: 'support',
    needTitle: 'Support',
    title: 'S1A · Alpine Fade',
    description: 'Closest to the detailed alpine direction, but simplified to two main ranges and one restrained snow plane. A strong left peak fades into a softer range behind the word.',
    iconPath: 'icons/needs/support.svg',
    hideIcon: true,
    artMaskPath: 'design-lab/need-magnets/support-alpine-fade.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 84%, var(--quiet) 16%)',
    iconFill: gradientIcon,
    artA: 'color-mix(in srgb, var(--primary) 78%, var(--attention) 22%)',
    artB: 'color-mix(in srgb, var(--positive) 70%, var(--primary) 30%)',
    artOpacity: 0.94,
  },
  {
    id: 'support-soft-peaks',
    needSlug: 'support',
    needTitle: 'Support',
    title: 'S1B · Soft Peaks',
    description: 'The most abstract variation. Rounded mountain forms preserve the older S1 softness while the left peak and continuous range still read as a climb.',
    iconPath: 'icons/needs/support.svg',
    hideIcon: true,
    artMaskPath: 'design-lab/need-magnets/support-soft-peaks.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 82%, var(--positive) 18%)',
    iconFill: gradientIcon,
    artA: 'color-mix(in srgb, var(--primary) 72%, var(--quiet) 28%)',
    artB: 'color-mix(in srgb, var(--positive) 62%, var(--primary) 38%)',
    artOpacity: 0.9,
  },
  {
    id: 'support-ridgeline',
    needSlug: 'support',
    needTitle: 'Support',
    title: 'S1C · Ridgeline',
    description: 'A cleaner version of the detailed mountain idea: one dominant alpine silhouette, one quieter rear ridge, and only two small highlight planes.',
    iconPath: 'icons/needs/support.svg',
    hideIcon: true,
    artMaskPath: 'design-lab/need-magnets/support-ridgeline.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 84%, var(--quiet) 16%)',
    iconFill: gradientIcon,
    artA: 'var(--primary)',
    artB: 'color-mix(in srgb, var(--attention) 66%, var(--primary) 34%)',
    artOpacity: 0.92,
  },
  {
    id: 'support-distant-range',
    needSlug: 'support',
    needTitle: 'Support',
    title: 'S1D · Distant Range',
    description: 'Three quieter overlapping ridges create depth without small details. The color fade does more of the visual work than individual mountain features.',
    iconPath: 'icons/needs/support.svg',
    hideIcon: true,
    artMaskPath: 'design-lab/need-magnets/support-distant-range.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 86%, var(--quiet) 14%)',
    iconFill: gradientIcon,
    artA: 'color-mix(in srgb, var(--primary) 70%, var(--positive) 30%)',
    artB: 'color-mix(in srgb, var(--selection) 68%, var(--primary) 32%)',
    artOpacity: 0.86,
  },
];
