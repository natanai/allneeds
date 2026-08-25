export type NeedMagnetAuditCandidate = Readonly<{
  id: string;
  needSlug: 'connection' | 'support';
  needTitle: 'Connection' | 'Support';
  title: string;
  description: string;
  iconPath: string;
  artMaskPath?: string;
  faceBackground: string;
  iconFill: string;
  artA: string;
  artB: string;
  artOpacity?: number;
}>;

const gradientIcon = 'linear-gradient(135deg, var(--audit-art-a), var(--audit-art-b))';
const refrigeratorSafe = (color: string) => `color-mix(in srgb, ${color} 72%, var(--primary) 28%)`;

export const needMagnetAuditCandidates: readonly NeedMagnetAuditCandidate[] = [
  {
    id: 'connection-current',
    needSlug: 'connection',
    needTitle: 'Connection',
    title: 'Current control',
    description: 'Current production Need treatment, kept beside every proposal as the baseline.',
    iconPath: 'icons/needs/connection.svg',
    faceBackground: 'var(--selection)',
    iconFill: '#000000',
    artA: 'var(--selection)',
    artB: 'var(--selection)',
  },
  {
    id: 'connection-weave',
    needSlug: 'connection',
    needTitle: 'Connection',
    title: 'C1 · Weave',
    description: 'Crossing full-face bands that make relation and reciprocity visible across the entire magnet.',
    iconPath: 'icons/needs/connection.svg',
    artMaskPath: 'design-lab/need-magnets/connection-weave.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 82%, var(--quiet) 18%)',
    iconFill: gradientIcon,
    artA: refrigeratorSafe('var(--action)'),
    artB: refrigeratorSafe('var(--positive)'),
    artOpacity: 0.9,
  },
  {
    id: 'connection-bridge',
    needSlug: 'connection',
    needTitle: 'Connection',
    title: 'C2 · Bridge',
    description: 'Two sides visibly joined through a central span, retaining the linking metaphor without relying only on the icon.',
    iconPath: 'icons/needs/connection.svg',
    artMaskPath: 'design-lab/need-magnets/connection-bridge.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 82%, var(--attention) 18%)',
    iconFill: gradientIcon,
    artA: 'var(--primary)',
    artB: 'var(--positive)',
    artOpacity: 0.88,
  },
  {
    id: 'connection-constellation',
    needSlug: 'connection',
    needTitle: 'Connection',
    title: 'C3 · Constellation',
    description: 'Networked points and a connecting route across the face for a more playful, recognizable pattern.',
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
    description: 'Current production Need treatment, kept beside every proposal as the baseline.',
    iconPath: 'icons/needs/support.svg',
    faceBackground: 'var(--selection)',
    iconFill: '#000000',
    artA: 'var(--selection)',
    artB: 'var(--selection)',
  },
  {
    id: 'support-cradle',
    needSlug: 'support',
    needTitle: 'Support',
    title: 'S1 · Cradle',
    description: 'A visible base and lifting curves make the whole face feel held, carried, and reinforced.',
    iconPath: 'icons/needs/support.svg',
    artMaskPath: 'design-lab/need-magnets/support-cradle.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 82%, var(--positive) 18%)',
    iconFill: gradientIcon,
    artA: refrigeratorSafe('var(--attention)'),
    artB: refrigeratorSafe('var(--positive)'),
    artOpacity: 0.9,
  },
  {
    id: 'support-protective-arc',
    needSlug: 'support',
    needTitle: 'Support',
    title: 'S2 · Protective Arc',
    description: 'A sheltering outer arc and inner support form make protection and assistance readable across the face.',
    iconPath: 'icons/needs/support.svg',
    artMaskPath: 'design-lab/need-magnets/support-protective-arc.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 84%, var(--quiet) 16%)',
    iconFill: gradientIcon,
    artA: 'var(--positive)',
    artB: 'var(--primary)',
    artOpacity: 0.88,
  },
  {
    id: 'support-structure',
    needSlug: 'support',
    needTitle: 'Support',
    title: 'S3 · Structure',
    description: 'Foundation, supports, and a beam create a literal load-bearing interpretation of Support.',
    iconPath: 'icons/needs/support.svg',
    artMaskPath: 'design-lab/need-magnets/support-structure.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 82%, var(--attention) 18%)',
    iconFill: gradientIcon,
    artA: 'var(--action)',
    artB: 'var(--primary)',
    artOpacity: 0.88,
  },
];
