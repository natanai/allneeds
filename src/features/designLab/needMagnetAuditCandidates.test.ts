import { describe, expect, it } from 'vitest';

import { needMagnetAuditCandidates } from './needMagnetAuditCandidates';

describe('need magnet audit candidates', () => {
  it('keeps approved identities out of the active review set', () => {
    expect(needMagnetAuditCandidates.some((candidate) => candidate.needSlug === 'safety')).toBe(false);
    expect(needMagnetAuditCandidates.some((candidate) => candidate.needSlug === 'support')).toBe(false);
    expect(needMagnetAuditCandidates.some((candidate) => candidate.needSlug === 'connection')).toBe(false);
  });

  it('offers four two-sided Understanding candidates for the two approved lenses', () => {
    const understanding = needMagnetAuditCandidates.filter((candidate) => candidate.needSlug === 'understanding');

    expect(understanding).toHaveLength(4);
    understanding.forEach((candidate) => {
      expect(candidate.secondaryIconPath).toBeTruthy();
      expect(candidate.iconPath).toBeTruthy();
      expect(candidate.needTitle).toBe('Understanding');
    });
  });
});
