import { observationInferenceIndex } from '../../data/generated/observationInference';
import type { ObservationAnnotation, ObservationEvidence, ObservationSuggestionResult } from './types';

const slotById = new Map(observationInferenceIndex.slots.map((slot) => [slot.id, slot]));

export function suggestionBasisSummary(suggestions: ObservationSuggestionResult) {
  if (suggestions.basis === 'direct') return 'Some possibilities come directly from words you used.';
  if (suggestions.basis === 'related') return 'These possibilities come from related wording in your observation.';
  if (suggestions.basis === 'broad') return 'These possibilities come from the broader context of your observation.';
  if (suggestions.basis === 'exploration') return 'We could not find a close language match, so these are broad starting points to explore.';
  if (suggestions.basis === 'mixed') return 'Some possibilities come directly from your words, while others come from related wording or broader starting points.';
  return '';
}

export function evidenceDescription(text: string, evidence: ObservationEvidence) {
  if (evidence.kind === 'formula') {
    const slot = slotById.get(evidence.slot);
    return `“${text}” helps answer ${slot?.question ?? evidence.slot}.`;
  }
  if (evidence.kind === 'entity') {
    if (evidence.entityType === 'feeling') return `“${text}” matches the Feeling ${evidence.title}.`;
    if (evidence.entityType === 'need') return `“${text}” matches the Need ${evidence.title}.`;
    return `“${text}” matches the faux feeling ${evidence.title}.`;
  }
  if (evidence.kind === 'guidance') return `${evidence.label}: ${evidence.explanation}`;
  if (evidence.kind === 'surface') return `“${text}” is preserved as your wording.`;
  return `“${text}” matches an authored observation cue used to offer possibilities.`;
}

export function annotationDescriptions(annotation: ObservationAnnotation) {
  return annotation.evidence.map((evidence) => ({ evidence, description: evidenceDescription(annotation.text, evidence) }));
}
