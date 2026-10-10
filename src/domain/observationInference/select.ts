import type { ObservationAnalysis, ObservationEntityMatch } from './types';

export type ExactObservationEntities = {
  feelings: ObservationEntityMatch[];
  needs: ObservationEntityMatch[];
  fauxFeelings: ObservationEntityMatch[];
};

export function selectExactObservationEntities(analysis: ObservationAnalysis): ExactObservationEntities {
  const feelings = new Map<string, ObservationEntityMatch>();
  const needs = new Map<string, ObservationEntityMatch>();
  const fauxFeelings = new Map<string, ObservationEntityMatch>();

  analysis.entities.forEach((entity) => {
    if (entity.matchKind !== 'title') return;
    if (entity.entityType === 'feeling') feelings.set(entity.slug, entity);
    else if (entity.entityType === 'need') needs.set(entity.slug, entity);
    else fauxFeelings.set(entity.slug, entity);
  });

  return {
    feelings: [...feelings.values()],
    needs: [...needs.values()],
    fauxFeelings: [...fauxFeelings.values()],
  };
}
