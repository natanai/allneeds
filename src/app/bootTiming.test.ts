import { describe, expect, it } from 'vitest';

import { MAX_BOOT_GATE_MS, remainingBootGateMs } from './bootTiming';

describe('boot gate timing', () => {
  it('counts import time against the entrance deadline', () => {
    expect(remainingBootGateMs(100, 1_600)).toBe(2_000);
  });

  it('mounts immediately once the navigation-wide deadline has passed', () => {
    expect(remainingBootGateMs(100, 4_000)).toBe(0);
  });

  it('never extends beyond the documented maximum', () => {
    expect(remainingBootGateMs(2_000, 1_000)).toBe(MAX_BOOT_GATE_MS);
    expect(remainingBootGateMs(Number.NaN, 1_000)).toBe(MAX_BOOT_GATE_MS);
  });
});
