export type ObservationMode = 'unmet' | 'met';
export type ObservationSlotId = 'time' | 'context' | 'sensory' | 'measure';
export type ObservationEntityType = 'feeling' | 'need' | 'fauxFeeling';
export type EvidenceTier = 'direct' | 'related' | 'broad' | 'exploratory';
export type EventEvidenceTier = Extract<EvidenceTier, 'related' | 'broad'>;
export type EntityMatchKind = 'title' | 'bridge' | 'fuzzy';

export type FormulaEvidence = {
  kind: 'formula';
  slot: ObservationSlotId;
  detectorId: string;
};

export type EntityEvidence = {
  kind: 'entity';
  entityType: ObservationEntityType;
  slug: string;
  title: string;
  matchKind: EntityMatchKind;
};

export type CueEvidence = {
  kind: 'cue';
  expressionId: string;
  tier: EventEvidenceTier;
};

export type EventFamilyEvidence = {
  kind: 'eventFamily';
  familyId: string;
  tier: EventEvidenceTier;
  label: string;
  explanation: string;
};

export type GuidanceEvidence = {
  kind: 'guidance';
  ruleId: string;
  label: string;
  explanation: string;
};

export type SurfaceEvidence = {
  kind: 'surface';
  termId: string;
  label: string;
};

export type ObservationEvidence =
  | FormulaEvidence
  | EntityEvidence
  | CueEvidence
  | EventFamilyEvidence
  | GuidanceEvidence
  | SurfaceEvidence;

export type ObservationAnnotation = {
  id: string;
  start: number;
  end: number;
  text: string;
  evidence: ObservationEvidence[];
};

export type ObservationToken = {
  start: number;
  end: number;
  text: string;
  normalized: string;
  clauseIndex: number;
  quoted: boolean;
};

export type TextRange = {
  start: number;
  end: number;
};

export type ObservationSlotResult = {
  id: ObservationSlotId;
  satisfied: boolean;
  annotationIds: string[];
  detectorIds: string[];
};

export type SuggestionEvidence = {
  kind: 'entity' | 'cue' | 'eventFamily' | 'fauxFeeling' | 'retrieval' | 'starter';
  tier: EvidenceTier;
  annotationId: string;
  evidenceId: string;
};

export type ObservationSuggestion = {
  slug: string;
  title: string;
  basis: EvidenceTier;
  evidence: SuggestionEvidence[];
};

export type ObservationSuggestionResult = {
  feelings: ObservationSuggestion[];
  needs: ObservationSuggestion[];
  basis: EvidenceTier | 'mixed' | null;
};

export type ObservationSurfaceTerm = {
  id: string;
  label: string;
  text: string;
  start: number;
  end: number;
};

export type ObservationEntityMatch = {
  entityType: ObservationEntityType;
  slug: string;
  title: string;
  matchKind: EntityMatchKind;
  text: string;
  start: number;
  end: number;
  annotationId: string;
};

export type ObservationModelMetadata = {
  schemaVersion: number;
  modelVersion: string;
  sourceChecksum: string;
  catalogChecksum: string;
  inputFingerprint: string;
};

export type ObservationAnalysis = {
  text: string;
  mode: ObservationMode;
  version: string;
  annotations: ObservationAnnotation[];
  slots: Record<ObservationSlotId, ObservationSlotResult>;
  suggestions: ObservationSuggestionResult;
  surfaceTerms: ObservationSurfaceTerm[];
  entities: ObservationEntityMatch[];
  model: ObservationModelMetadata;
};
