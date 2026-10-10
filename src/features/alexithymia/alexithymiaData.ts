import generatedData from '../../data/generated/alexithymiaSupport.json';

export const shapeDimensions = [
  'pleasantness',
  'energy',
  'power',
  'expectedness',
] as const;

export type ShapeDimension = typeof shapeDimensions[number];
export type AlexithymiaCandidateRole = 'feeling' | 'working';

export type AlexithymiaShapeProfile = {
  source: string;
  termForm: string;
  partOfSpeech: 'noun' | 'adjective';
  raw: Record<ShapeDimension, number>;
  coordinates: Record<ShapeDimension, number>;
};

export type AlexithymiaCandidate = {
  key: string;
  display: string;
  role: AlexithymiaCandidateRole;
  bodyProfileKey: string;
  catalogSlug: string | null;
  route: string | null;
  definition: string | null;
  definitionSource: string;
  coverage: { body: boolean; shape: boolean };
  shape: AlexithymiaShapeProfile | null;
};

export type ShapeNormalization = Record<ShapeDimension, {
  sourceDimension: string;
  rawMin: number;
  rawMax: number;
  lowLabel: string;
  highLabel: string;
}>;

type AlexithymiaRuntimeData = {
  version: 1;
  sources: Record<string, { title: string; url: string; role: string; license?: string }>;
  shapeNormalization: ShapeNormalization;
  candidates: AlexithymiaCandidate[];
};

export const alexithymiaSupportData = generatedData as AlexithymiaRuntimeData;
export const alexithymiaCandidates = alexithymiaSupportData.candidates;
export const alexithymiaCandidateByKey = new Map(
  alexithymiaCandidates.map((candidate) => [candidate.key, candidate]),
);
export const alexithymiaCandidateByDisplay = new Map(
  alexithymiaCandidates.map((candidate) => [candidate.display.toLocaleLowerCase(), candidate]),
);
