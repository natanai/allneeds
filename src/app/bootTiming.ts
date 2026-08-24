export const MAX_BOOT_GATE_MS = 3_500;

export function remainingBootGateMs(startedAt: number, now: number) {
  if (!Number.isFinite(startedAt) || !Number.isFinite(now)) return MAX_BOOT_GATE_MS;
  return Math.max(0, Math.min(MAX_BOOT_GATE_MS, MAX_BOOT_GATE_MS - (now - startedAt)));
}
