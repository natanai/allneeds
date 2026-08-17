import { getBrowserStorage } from './storage';

export type StoredMagnetLayout = {
  version: 1;
  boardHeight: number;
  magnets: Record<string, { xPct: number; yPct: number }>;
};

const STORAGE_PREFIX = 'allneeds:v2:magnets:';

function isFiniteUnit(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function parseLayout(value: unknown): StoredMagnetLayout | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<StoredMagnetLayout>;
  if (candidate.version !== 1 || typeof candidate.boardHeight !== 'number' || !Number.isFinite(candidate.boardHeight)) {
    return null;
  }
  if (candidate.boardHeight <= 0 || !candidate.magnets || typeof candidate.magnets !== 'object') return null;

  const magnets: StoredMagnetLayout['magnets'] = {};
  for (const [id, raw] of Object.entries(candidate.magnets)) {
    if (!raw || typeof raw !== 'object') continue;
    const point = raw as { xPct?: unknown; yPct?: unknown };
    if (!isFiniteUnit(point.xPct) || !isFiniteUnit(point.yPct)) continue;
    magnets[id] = { xPct: point.xPct, yPct: point.yPct };
  }

  return {
    version: 1,
    boardHeight: candidate.boardHeight,
    magnets,
  };
}

export function readMagnetLayout(storageKey: string): StoredMagnetLayout | null {
  const storage = getBrowserStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(`${STORAGE_PREFIX}${storageKey}`);
    if (!raw) return null;
    return parseLayout(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeMagnetLayout(storageKey: string, layout: StoredMagnetLayout): void {
  const storage = getBrowserStorage();
  if (!storage) return;

  try {
    storage.setItem(`${STORAGE_PREFIX}${storageKey}`, JSON.stringify(layout));
  } catch {
    // Persistence is an enhancement. The board remains usable when storage is blocked.
  }
}
