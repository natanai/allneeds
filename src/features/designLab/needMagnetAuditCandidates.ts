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
    id: 'understanding-u4-route-terrain',
    needSlug: 'understanding',
    needTitle: 'Understanding',
    title: 'U4A · Route / Terrain',
    description: 'Keeps the original U4 map and people icons, then adds a route that travels across the entire face. It treats understanding as orienting through shared terrain rather than two isolated symbols.',
    iconPath: '/design-lab/need-magnets/understanding-map.svg',
    secondaryIconPath: '/design-lab/need-magnets/understanding-people.svg',
    artMaskPath: '/design-lab/need-magnets/understanding-art-route.svg',
    faceBackground: 'linear-gradient(100deg, color-mix(in srgb, var(--selection) 68%, var(--quiet) 32%), color-mix(in srgb, var(--quiet) 58%, var(--positive) 42%))',
    iconFill: 'var(--primary)',
    secondaryIconFill: 'var(--secondary)',
    artA: 'var(--primary)',
    artB: 'var(--secondary)',
    artOpacity: 0.27,
  },
  {
    id: 'understanding-u4-contour-viewpoints',
    needSlug: 'understanding',
    needTitle: 'Understanding',
    title: 'U4B · Contours / Viewpoints',
    description: 'A contour-heavy map pairs with two facing profiles. Topographic lines occupy both ends and cross behind the label, making different viewpoints feel like positions within the same terrain.',
    iconPath: '/design-lab/need-magnets/understanding-map-contour.svg',
    secondaryIconPath: '/design-lab/need-magnets/understanding-people-facing.svg',
    artMaskPath: '/design-lab/need-magnets/understanding-art-contours.svg',
    faceBackground: 'linear-gradient(105deg, color-mix(in srgb, var(--quiet) 58%, var(--selection) 42%), color-mix(in srgb, var(--selection) 70%, var(--attention) 30%))',
    iconFill: 'var(--secondary)',
    secondaryIconFill: 'var(--primary)',
    artA: 'var(--secondary)',
    artB: 'var(--primary)',
    artOpacity: 0.31,
  },
  {
    id: 'understanding-u4-folded-perspectives',
    needSlug: 'understanding',
    needTitle: 'Understanding',
    title: 'U4C · Folded Perspectives',
    description: 'A compass-map and overlapping people sit over broad folded planes entering from opposite sides. This is the most graphic version, using the whole magnet face to imply partial views of one larger picture.',
    iconPath: '/design-lab/need-magnets/understanding-map-compass.svg',
    secondaryIconPath: '/design-lab/need-magnets/understanding-people-overlap.svg',
    artMaskPath: '/design-lab/need-magnets/understanding-art-folds.svg',
    faceBackground: 'linear-gradient(100deg, color-mix(in srgb, var(--selection) 72%, var(--primary) 28%), color-mix(in srgb, var(--quiet) 68%, var(--attention) 32%))',
    iconFill: 'var(--primary)',
    secondaryIconFill: 'var(--secondary)',
    artA: 'var(--primary)',
    artB: 'var(--attention)',
    artOpacity: 0.24,
  },
  {
    id: 'understanding-u4-converging-map',
    needSlug: 'understanding',
    needTitle: 'Understanding',
    title: 'U4D · Converging Map',
    description: 'A route-map and perspective pair frame two fields that converge toward the center. It makes the two lenses feel distinct but related: orienting yourself and locating another perspective both contribute to a workable shared picture.',
    iconPath: '/design-lab/need-magnets/understanding-map-route.svg',
    secondaryIconPath: '/design-lab/need-magnets/understanding-people-perspective.svg',
    artMaskPath: '/design-lab/need-magnets/understanding-art-converge.svg',
    faceBackground: 'linear-gradient(100deg, color-mix(in srgb, var(--quiet) 62%, var(--selection) 38%), color-mix(in srgb, var(--selection) 66%, var(--action) 34%))',
    iconFill: 'var(--primary)',
    secondaryIconFill: 'var(--secondary)',
    artA: 'var(--primary)',
    artB: 'var(--action)',
    artOpacity: 0.3,
  },
];
