const TILT_STEPS = [-2, -1.25, -0.5, 0, 0.5, 1.25, 2] as const;

export function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getMagnetTilt(id: string): number {
  return TILT_STEPS[stableHash(id) % TILT_STEPS.length];
}
