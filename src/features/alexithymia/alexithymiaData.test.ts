import { describe, expect, it } from 'vitest';

import { fauxFeelings, feelings, needs } from '../../data/catalog';
import { alexithymiaCandidates, alexithymiaSupportData } from './alexithymiaData';

describe('canonical Alexithymia Support candidate data', () => {
  it('preserves the fixed catalogs and the approved 24-profile candidate universe', () => {
    expect(feelings).toHaveLength(48);
    expect(needs).toHaveLength(67);
    expect(fauxFeelings).toHaveLength(56);
    expect(alexithymiaCandidates).toHaveLength(24);
    expect(alexithymiaCandidates.some((candidate) => candidate.key === 'love-caring')).toBe(false);
  });

  it('gives every candidate an explicit role, body profile, coverage, and bridge state', () => {
    alexithymiaCandidates.forEach((candidate) => {
      expect(['feeling', 'working']).toContain(candidate.role);
      expect(candidate.bodyProfileKey).toBe(candidate.key);
      expect(candidate.coverage.body).toBe(true);
      expect(candidate.coverage.shape).toBe(Boolean(candidate.shape));
      if (candidate.role === 'feeling') {
        expect(candidate.catalogSlug).toBeTruthy();
        expect(candidate.route).toBe(`/feelings/${candidate.catalogSlug}`);
      } else {
        expect(candidate.catalogSlug).toBeNull();
        expect(candidate.route).toBeNull();
        expect(candidate.definitionSource).toMatch(/^https:\/\//);
      }
    });
  });

  it('does not invent shape coverage for candidates absent from the reviewed table', () => {
    expect(alexithymiaCandidates.filter((candidate) => !candidate.coverage.shape)
      .map((candidate) => candidate.display))
      .toEqual(['Calm', 'Contented', 'Determined', 'Numb', 'Tired']);
    expect(alexithymiaCandidates.filter((candidate) => candidate.coverage.shape)).toHaveLength(19);
  });

  it('retains fixed source coordinates without on-screen normalization', () => {
    const angry = alexithymiaCandidates.find((candidate) => candidate.key === 'anger')!;
    expect(angry.shape?.termForm).toBe('Angry');
    expect(angry.shape?.raw).toEqual({
      pleasantness: -0.59,
      energy: 0.91,
      power: 2.36,
      expectedness: 0.02,
    });
    expect(angry.shape?.coordinates.power).toBeCloseTo(0.937063);
    expect(alexithymiaSupportData.sources['coregrid-2026']?.url)
      .toBe('https://doi.org/10.1016/j.langsci.2026.101807');
  });
});
