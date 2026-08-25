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
    description: 'Lead direction. Keeps the soft two-range fade, with more ridge planes concentrated in the first left peak so it reads as a climb without making the whole magnet busy.',
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
    id: 'support-alpine-split-ridges',
    needSlug: 'support',
    needTitle: 'Support',
    title: 'S1A2 · Split Ridges',
    description: 'A closer study of the same Alpine Fade idea. The left peak breaks into several descending ridge planes while the rest of the range stays quiet and faded.',
    iconPath: 'icons/needs/support.svg',
    hideIcon: true,
    artMaskPath: 'design-lab/need-magnets/support-alpine-split-ridges.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 84%, var(--quiet) 16%)',
    iconFill: gradientIcon,
    artA: 'color-mix(in srgb, var(--primary) 82%, var(--attention) 18%)',
    artB: 'color-mix(in srgb, var(--positive) 66%, var(--primary) 34%)',
    artOpacity: 0.95,
  },
  {
    id: 'support-soft-peaks',
    needSlug: 'support',
    needTitle: 'Support',
    title: 'S1B · Soft Peaks',
    description: 'The most abstract original direction. Rounded mountain forms preserve the older S1 softness while the left peak and continuous range still read as a climb.',
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
    id: 'support-soft-terraces',
    needSlug: 'support',
    needTitle: 'Support',
    title: 'S1B2 · Soft Terraces',
    description: 'Keeps the rounded abstract silhouette but adds one softer interior ridge through the left half, giving the mountain more structure without turning alpine.',
    iconPath: 'icons/needs/support.svg',
    hideIcon: true,
    artMaskPath: 'design-lab/need-magnets/support-soft-terraces.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 82%, var(--positive) 18%)',
    iconFill: gradientIcon,
    artA: 'color-mix(in srgb, var(--primary) 76%, var(--quiet) 24%)',
    artB: 'color-mix(in srgb, var(--positive) 68%, var(--primary) 32%)',
    artOpacity: 0.91,
  },
  {
    id: 'support-ridgeline',
    needSlug: 'support',
    needTitle: 'Support',
    title: 'S1C · Ridgeline',
    description: 'A cleaner detailed mountain direction: one dominant alpine silhouette, one quieter rear ridge, and only two small highlight planes.',
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
    id: 'support-ridgeline-twin-crest',
    needSlug: 'support',
    needTitle: 'Support',
    title: 'S1C2 · Twin Crest',
    description: 'A Ridgeline variation where the left mountain has two close crests and a second highlight plane, adding detail mostly where the icon space used to be.',
    iconPath: 'icons/needs/support.svg',
    hideIcon: true,
    artMaskPath: 'design-lab/need-magnets/support-ridgeline-twin-crest.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 84%, var(--quiet) 16%)',
    iconFill: gradientIcon,
    artA: 'color-mix(in srgb, var(--primary) 86%, var(--secondary) 14%)',
    artB: 'color-mix(in srgb, var(--attention) 64%, var(--primary) 36%)',
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
  {
    id: 'support-distant-horizon-fade',
    needSlug: 'support',
    needTitle: 'Support',
    title: 'S1D2 · Horizon Fade',
    description: 'A softer Distant Range study with an extra low horizon band and a wider Customizer-role fade, making depth and color transition more prominent than ridge detail.',
    iconPath: 'icons/needs/support.svg',
    hideIcon: true,
    artMaskPath: 'design-lab/need-magnets/support-distant-horizon-fade.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 86%, var(--quiet) 14%)',
    iconFill: gradientIcon,
    artA: 'color-mix(in srgb, var(--primary) 66%, var(--positive) 34%)',
    artB: 'color-mix(in srgb, var(--selection) 56%, var(--primary) 44%)',
    artOpacity: 0.88,
  },
];
