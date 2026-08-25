export type NeedMagnetAuditCandidate = Readonly<{
  id: string;
  needSlug: 'connection' | 'support';
  needTitle: 'Connection' | 'Support';
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
    id: 'connection-current',
    needSlug: 'connection',
    needTitle: 'Connection',
    title: 'Current control',
    description: 'Current production Need treatment, kept beside the selected proposal as the baseline.',
    iconPath: 'icons/needs/connection.svg',
    faceBackground: 'var(--selection)',
    iconFill: '#000000',
    artA: 'var(--selection)',
    artB: 'var(--selection)',
  },
  {
    id: 'connection-constellation',
    needSlug: 'connection',
    needTitle: 'Connection',
    title: 'C3 · Constellation',
    description: 'Networked points and a connecting route across the face for a playful, recognizable sense of relation.',
    iconPath: 'icons/needs/connection.svg',
    artMaskPath: 'design-lab/need-magnets/connection-constellation.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 84%, var(--quiet) 16%)',
    iconFill: gradientIcon,
    artA: 'var(--positive)',
    artB: 'var(--primary)',
    artOpacity: 0.9,
  },
  {
    id: 'support-current',
    needSlug: 'support',
    needTitle: 'Support',
    title: 'Current control',
    description: 'Current production Need treatment, kept beside the selected proposal as the baseline.',
    iconPath: 'icons/needs/support.svg',
    faceBackground: 'var(--selection)',
    iconFill: '#000000',
    artA: 'var(--selection)',
    artB: 'var(--selection)',
  },
  {
    id: 'support-mountain-range',
    needSlug: 'support',
    needTitle: 'Support',
    title: 'S1 · Mountain Range',
    description: 'A tall peak begins in the reserved icon space and the range continues behind the word, suggesting the support that helps us climb difficult mountains.',
    iconPath: 'icons/needs/support.svg',
    hideIcon: true,
    artMaskPath: 'design-lab/need-magnets/support-mountain-range.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 82%, var(--positive) 18%)',
    iconFill: gradientIcon,
    artA: 'color-mix(in srgb, var(--attention) 68%, var(--primary) 32%)',
    artB: 'color-mix(in srgb, var(--positive) 62%, var(--primary) 38%)',
    artOpacity: 0.94,
  },
];
