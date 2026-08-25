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

export const needMagnetAuditCandidates: readonly NeedMagnetAuditCandidate[] = [
  {
    id: 'connection-current',
    needSlug: 'connection',
    needTitle: 'Connection',
    title: 'Current control',
    description: 'Current production Need treatment, kept beside every proposal as the baseline.',
    iconPath: 'icons/needs/connection.svg',
    faceBackground: 'var(--sky)',
    iconFill: '#000000',
    artA: 'var(--sky)',
    artB: 'var(--sky)',
  },
  {
    id: 'connection-weave',
    needSlug: 'connection',
    needTitle: 'Connection',
    title: 'C1 · Weave',
    description: 'Crossing full-face bands that make relation and reciprocity visible across the entire magnet.',
    iconPath: 'icons/needs/connection.svg',
    artMaskPath: 'design-lab/need-magnets/connection-weave.svg',
    faceBackground: 'color-mix(in srgb, var(--sky) 82%, var(--lavender) 18%)',
    iconFill: gradientIcon,
    artA: 'var(--rose)',
    artB: 'var(--mint)',
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
    faceBackground: 'color-mix(in srgb, var(--sky) 82%, var(--gold) 18%)',
    iconFill: gradientIcon,
    artA: 'var(--plum)',
    artB: 'var(--mint)',
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
    faceBackground: 'color-mix(in srgb, var(--sky) 84%, var(--lavender) 16%)',
    iconFill: gradientIcon,
    artA: 'var(--mint)',
    artB: 'var(--plum)',
    artOpacity: 0.9,
  },
  {
    id: 'support-current',
    needSlug: 'support',
    needTitle: 'Support',
    title: 'Current control',
    description: 'Current production Need treatment, kept beside every proposal as the baseline.',
    iconPath: 'icons/needs/support.svg',
    faceBackground: 'var(--sky)',
    iconFill: '#000000',
    artA: 'var(--sky)',
    artB: 'var(--sky)',
  },
  {
    id: 'support-cradle',
    needSlug: 'support',
    needTitle: 'Support',
    title: 'S1 · Cradle',
    description: 'A visible base and lifting curves make the whole face feel held, carried, and reinforced.',
    iconPath: 'icons/needs/support.svg',
    artMaskPath: 'design-lab/need-magnets/support-cradle.svg',
    faceBackground: 'color-mix(in srgb, var(--sky) 82%, var(--mint) 18%)',
    iconFill: gradientIcon,
    artA: 'var(--gold)',
    artB: 'var(--mint)',
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
    faceBackground: 'color-mix(in srgb, var(--sky) 84%, var(--lavender) 16%)',
    iconFill: gradientIcon,
    artA: 'var(--mint)',
    artB: 'var(--plum)',
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
    faceBackground: 'color-mix(in srgb, var(--sky) 82%, var(--gold) 18%)',
    iconFill: gradientIcon,
    artA: 'var(--rose)',
    artB: 'var(--plum)',
    artOpacity: 0.88,
  },
];
