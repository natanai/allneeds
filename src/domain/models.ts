export type NeedSatisfaction = 'met' | 'unmet' | 'both';
export type StrategyProvenance = 'system' | 'user';
export type SupportingSourceKind = 'scholarly' | 'official-resource';

export interface EntityRef {
  slug: string;
  title: string;
}

export interface EvidenceSource {
  url: string;
  description?: string;
  kind?: SupportingSourceKind;
}

export interface Feeling {
  slug: string;
  title: string;
  summary: string;
  needSatisfaction: NeedSatisfaction;
  bodySignals: string[];
  needs: EntityRef[];
  fauxFeelings: EntityRef[];
  poem?: {
    quotation: string;
    url?: string;
  };
}

export interface Need {
  slug: string;
  title: string;
  category?: string;
  summary: string;
  feelings: EntityRef[];
  fauxFeelings: EntityRef[];
  strategies: EntityRef[];
  evidence?: {
    claimSummary?: string;
    narrative?: string;
    sources: EvidenceSource[];
  };
}

export interface FauxFeeling {
  slug: string;
  title: string;
  feelings: EntityRef[];
  needs: EntityRef[];
}

export interface Strategy {
  slug: string;
  title: string;
  summary: string;
  supportedNeeds: EntityRef[];
  provenance: StrategyProvenance;
  contributor?: {
    name?: string;
    location?: string;
  };
  evidence?: EvidenceSource;
}

export interface BodyCueOption {
  id: string;
  title: string;
  note?: string;
  insight?: string;
  feelingWeights: Record<string, number>;
}

export interface BodyCueRegion {
  id: string;
  label: string;
  prompt?: string;
  options: BodyCueOption[];
}

export interface EmotionCandidate {
  feelingSlug: string;
  confidence?: number;
}

export interface JournalEntry {
  id: string;
  createdAt: string;
  feelingSlug?: string;
  intensity?: number;
  confidence?: number;
  sensations: string[];
  needSlugs: string[];
  strategyIds: string[];
  tags: string[];
  notes: string;
  energy?: number;
  valence?: number;
  zone?: string;
  candidates: EmotionCandidate[];
  regulationUsed: string[];
  source: 'journal' | 'guided-support';
}
