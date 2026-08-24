export type MagnetViewport = 'compact' | 'wide';

export type StoredMagnetPosition = {
  x: number;
  y: number;
  xPct: number;
  yPct: number;
};

export type StoredMagnetViewportLayout = {
  boardWidth: number;
  boardHeight: number;
  savedAt: string;
  magnets: Record<string, StoredMagnetPosition>;
  order?: string[];
};

export type StoredMagnetBoardState = {
  layoutVersion: 7;
  layouts: Partial<Record<MagnetViewport, StoredMagnetViewportLayout>>;
  meta: { playActive: boolean };
};

type LegacyMagnetBoardState = {
  layoutVersion?: number;
  boardWidth?: number;
  boardHeight?: number;
  magnets?: Record<string, Partial<StoredMagnetPosition>>;
  order?: string[];
  meta?: { playActive?: boolean };
};

type ReadableMagnetBoardState = StoredMagnetBoardState | LegacyMagnetBoardState;
type StorageReader = Pick<Storage, 'getItem'>;
type StorageWriter = Pick<Storage, 'getItem' | 'setItem'>;

const STORAGE_PREFIX = 'magnetPositions:';
const LAYOUT_VERSION = 7;

export function magnetStorageName(key: string) {
  return key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;
}

export function magnetViewportForWidth(width: number): MagnetViewport {
  return width <= 640 ? 'compact' : 'wide';
}

function readRawState(key: string, storage: StorageReader): ReadableMagnetBoardState | null {
  try {
    const raw = storage.getItem(magnetStorageName(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReadableMagnetBoardState;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function readMagnetPlayPreference(
  key: string,
  fallback = true,
  storage: StorageReader = window.localStorage,
) {
  const stored = readRawState(key, storage);
  return typeof stored?.meta?.playActive === 'boolean'
    ? stored.meta.playActive
    : fallback;
}

export function readMagnetViewportLayout(
  key: string,
  boardWidth: number,
  storage: StorageReader = window.localStorage,
): StoredMagnetViewportLayout | null {
  const stored = readRawState(key, storage);
  if (!stored) return null;

  if (stored.layoutVersion === LAYOUT_VERSION && 'layouts' in stored) {
    return stored.layouts[magnetViewportForWidth(boardWidth)] ?? null;
  }

  if (stored.layoutVersion !== 6
    || typeof stored.boardWidth !== 'number'
    || typeof stored.boardHeight !== 'number'
    || !stored.magnets) {
    return null;
  }

  const magnets: Record<string, StoredMagnetPosition> = {};
  Object.entries(stored.magnets).forEach(([id, position]) => {
    if (typeof position.xPct !== 'number' || typeof position.yPct !== 'number') return;
    magnets[id] = {
      x: position.xPct * stored.boardWidth!,
      y: position.yPct * stored.boardHeight!,
      xPct: position.xPct,
      yPct: position.yPct,
    };
  });

  return {
    boardWidth: stored.boardWidth,
    boardHeight: stored.boardHeight,
    savedAt: new Date(0).toISOString(),
    magnets,
    ...(Array.isArray(stored.order) ? { order: stored.order } : {}),
  };
}

export function writeMagnetViewportLayout(
  key: string,
  layout: Omit<StoredMagnetViewportLayout, 'savedAt'>,
  playActive: boolean,
  storage: StorageWriter = window.localStorage,
) {
  const previous = readRawState(key, storage);
  const layouts = previous?.layoutVersion === LAYOUT_VERSION && 'layouts' in previous
    ? previous.layouts
    : {};
  const next: StoredMagnetBoardState = {
    layoutVersion: LAYOUT_VERSION,
    layouts: {
      ...layouts,
      [magnetViewportForWidth(layout.boardWidth)]: {
        ...layout,
        savedAt: new Date().toISOString(),
      },
    },
    meta: { playActive },
  };
  storage.setItem(magnetStorageName(key), JSON.stringify(next));
}
