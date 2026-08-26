export type NeedMagnetAuditCandidate = Readonly<{
  id: string;
  needSlug: string;
  needTitle: string;
  title: string;
  description: string;
  iconPath: string;
  secondaryIconPath?: string;
  hideIcon?: boolean;
  artMaskPath?: string;
  faceBackground: string;
  iconFill: string;
  secondaryIconFill?: string;
  artA: string;
  artB: string;
  artOpacity?: number;
}>;

export const needMagnetAuditCandidates: readonly NeedMagnetAuditCandidate[] = [
  {
    id: 'understanding-question-dialogue',
    needSlug: 'understanding',
    needTitle: 'Understanding',
    title: 'U1 · Question / Dialogue',
    description: 'Making sense is a question-in-a-magnifier on the left; understanding between people is dialogue on the right. The clearest literal two-lens reading.',
    iconPath: '/design-lab/need-magnets/understanding-question-search.svg',
    secondaryIconPath: '/design-lab/need-magnets/understanding-dialogue.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 76%, var(--quiet) 24%)',
    iconFill: 'var(--primary)',
    secondaryIconFill: 'var(--secondary)',
    artA: 'var(--primary)',
    artB: 'var(--secondary)',
    artOpacity: 0,
  },
  {
    id: 'understanding-model-minds',
    needSlug: 'understanding',
    needTitle: 'Understanding',
    title: 'U2 · Model / Minds',
    description: 'A connected model stands for building a workable picture; two people stand for grasping one another. More conceptual and less tied to reading or verbal conversation.',
    iconPath: '/design-lab/need-magnets/understanding-model.svg',
    secondaryIconPath: '/design-lab/need-magnets/understanding-people.svg',
    faceBackground: 'linear-gradient(100deg, color-mix(in srgb, var(--quiet) 64%, var(--selection) 36%), color-mix(in srgb, var(--selection) 74%, var(--positive) 26%))',
    iconFill: 'var(--secondary)',
    secondaryIconFill: 'var(--primary)',
    artA: 'var(--secondary)',
    artB: 'var(--primary)',
    artOpacity: 0,
  },
  {
    id: 'understanding-book-dialogue',
    needSlug: 'understanding',
    needTitle: 'Understanding',
    title: 'U3 · Book / Conversation',
    description: 'Keeps the current open-book lineage for learning and adds dialogue on the opposite side for interpersonal understanding. The most evolutionary rather than revolutionary option.',
    iconPath: '/icons/needs/understanding.svg',
    secondaryIconPath: '/design-lab/need-magnets/understanding-dialogue.svg',
    faceBackground: 'color-mix(in srgb, var(--selection) 82%, var(--positive) 18%)',
    iconFill: 'var(--primary)',
    secondaryIconFill: 'var(--action)',
    artA: 'var(--primary)',
    artB: 'var(--action)',
    artOpacity: 0,
  },
  {
    id: 'understanding-map-perspectives',
    needSlug: 'understanding',
    needTitle: 'Understanding',
    title: 'U4 · Map / Perspectives',
    description: 'A map suggests orienting yourself inside a confusing situation; two people suggest locating another person’s perspective as well as your own.',
    iconPath: '/design-lab/need-magnets/understanding-map.svg',
    secondaryIconPath: '/design-lab/need-magnets/understanding-people.svg',
    faceBackground: 'linear-gradient(100deg, color-mix(in srgb, var(--selection) 68%, var(--quiet) 32%), color-mix(in srgb, var(--quiet) 62%, var(--attention) 38%))',
    iconFill: 'var(--primary)',
    secondaryIconFill: 'var(--secondary)',
    artA: 'var(--primary)',
    artB: 'var(--secondary)',
    artOpacity: 0,
  },
];
