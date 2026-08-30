import { observationInferenceIndex } from '../../data/generated/observationInference';
import type { ObservationAnnotation, ObservationEvidence, ObservationSuggestionResult } from './types';

const slotById = new Map(observationInferenceIndex.slots.map((slot) => [slot.id, slot]));

export function suggestionBasisSummary(suggestions: ObservationSuggestionResult) {
  const trace = new Set<string>();
  [...suggestions.needs, ...suggestions.feelings].forEach((suggestion) => {
    suggestion.evidence.forEach((evidence) => {
      if (evidence.kind === 'retrieval' && evidence.evidenceId && !evidence.evidenceId.startsWith('need:')) {
        evidence.evidenceId.split('|').filter(Boolean).forEach((term) => trace.add(`word: ${term}`));
        return;
      }
      trace.add(`${evidence.kind}: ${evidence.evidenceId}`);
    });
  });
  return [...trace].join(' · ');
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
  if (evidence.kind === 'eventFamily') return `${evidence.label}: ${evidence.explanation}`;
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
