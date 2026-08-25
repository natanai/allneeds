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

export const needMagnetAuditCandidates: readonly NeedMagnetAuditCandidate[] = [];
