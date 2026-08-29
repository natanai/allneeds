import { observationInferenceIndex } from '../../data/generated/observationInference';
import type { ObservationAnnotation, ObservationEvidence, ObservationSuggestionResult } from './types';

const slotById = new Map(observationInferenceIndex.slots.map((slot) => [slot.id, slot]));

export function suggestionBasisSummary(suggestions: ObservationSuggestionResult) {
  if (suggestions.basis === 'direct') return 'Some suggestions are linked directly to words in your text.';
  if (suggestions.basis === 'related') return 'Some words in your text are linked with these suggestions.';
  if (suggestions.basis === 'broad') return 'These are broader possibilities connected with language in your text.';
  if (suggestions.basis === 'exploration') return 'No close word match was found, so the app added varied starting points instead of leaving this blank.';
  if (suggestions.basis === 'mixed') return 'Some suggestions are linked to your words; the rest are broader starting points.';
  return '';
}

export function evidenceDescription(text: string, evidence: ObservationEvidence) {
  if (evidence.kind === 'formula') {
    const slot = slotById.get(evidence.slot);
    return `“${text}” helps answer ${slot?.question ?? evidence.slot}.`;
  }
  if (evidence.kind === 'entity') {
    if (evidence.entityType === 'feeling') return `“${text}” is listed as the Feeling ${evidence.title}.`;
    if (evidence.entityType === 'need') return `“${text}” is listed as the Need ${evidence.title}.`;
    return `“${text}” is listed as the Faux Feeling ${evidence.title}. A Faux Feeling may combine an emotion with an interpretation of what happened; the label does not mean the event was unreal.`;
  }
  if (evidence.kind === 'guidance') return `${evidence.label}: ${evidence.explanation}`;
  if (evidence.kind === 'surface') return '';
  return `“${text}” helped shape some of the suggestions below.`;
}

export function annotationDescriptions(annotation: ObservationAnnotation) {
  const userFacingEvidence = annotation.evidence.filter((evidence) => evidence.kind !== 'surface');
  const entityEvidence = userFacingEvidence.filter((evidence) => evidence.kind === 'entity');
  const selectedEvidence = entityEvidence.length ? entityEvidence : userFacingEvidence;
  return selectedEvidence
    .map((evidence) => ({ evidence, description: evidenceDescription(annotation.text, evidence) }));
}
