const TILT_STEPS = [-2, -1.25, -0.5, 0, 0.5, 1.25, 2] as const;

export type MagnetSize = {
  id: string;
  width: number;
  height: number;
};

export type MagnetPlacement = MagnetSize & {
  x: number;
  y: number;
};

export type Vector = {
  x: number;
  y: number;
};

export type CollisionBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AabbCollision = {
  normalX: number;
  normalY: number;
  depth: number;
};

export type PackMagnetsOptions = {
  boardWidth: number;
  gapX?: number;
  gapY?: number;
  padding?: number;
  firstRowRightInset?: number;
};

export const NAV_REST_PACKING = {
  padding: 10,
  gapX: 8,
  gapY: 10,
  firstRowRightInset: 38,
} as const;

export function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getMagnetTilt(id: string): number {
  return TILT_STEPS[stableHash(id) % TILT_STEPS.length] ?? 0;
}

export function limitVector(x: number, y: number, maximum: number): Vector {
  const magnitude = Math.hypot(x, y);
  if (magnitude === 0 || magnitude <= maximum) return { x, y };
  const scale = maximum / magnitude;
  return { x: x * scale, y: y * scale };
}

/**
 * Converts a movement measured in visual-viewport pixels into the board's
 * layout coordinate space. Mobile Safari can change the visual viewport while
 * a long board is scrolled, so drag math must depend on pointer deltas rather
 * than mixing client coordinates with absolute board positions.
 */
export function scalePointerDelta(
  x: number,
  y: number,
  layoutWidth: number,
  layoutHeight: number,
  visualWidth: number,
  visualHeight: number,
): Vector {
  const scaleX = visualWidth > 0 ? layoutWidth / visualWidth : 1;
  const scaleY = visualHeight > 0 ? layoutHeight / visualHeight : 1;
  return {
    x: x * scaleX,
    y: y * scaleY,
  };
}

export function getAabbCollision(a: CollisionBox, b: CollisionBox): AabbCollision | null {
  const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  if (overlapX <= 0 || overlapY <= 0) return null;

  const aCenterX = a.x + a.width / 2;
  const aCenterY = a.y + a.height / 2;
  const bCenterX = b.x + b.width / 2;
  const bCenterY = b.y + b.height / 2;

  if (overlapX < overlapY) {
    return {
      normalX: aCenterX <= bCenterX ? 1 : -1,
      normalY: 0,
      depth: overlapX,
    };
  }

  return {
    normalX: 0,
    normalY: aCenterY <= bCenterY ? 1 : -1,
    depth: overlapY,
  };
}

export function orderMagnetsByVisualRows<T extends MagnetPlacement>(
  magnets: T[],
  rowToleranceFactor = 0.72,
): T[] {
  if (magnets.length < 2) return [...magnets];
  const heights = magnets.map((magnet) => magnet.height).sort((a, b) => a - b);
  const typicalHeight = heights[Math.floor(heights.length / 2)] ?? 44;
  const rows: Array<{ centerY: number; magnets: T[] }> = [];

  [...magnets]
    .sort((a, b) => (a.y + a.height / 2) - (b.y + b.height / 2))
    .forEach((magnet) => {
      const centerY = magnet.y + magnet.height / 2;
      const row = rows.find((candidate) =>
        Math.abs(candidate.centerY - centerY) <= typicalHeight * rowToleranceFactor,
      );
      if (!row) {
        rows.push({ centerY, magnets: [magnet] });
        return;
      }
      row.magnets.push(magnet);
      row.centerY = row.magnets.reduce(
        (sum, item) => sum + item.y + item.height / 2,
        0,
      ) / row.magnets.length;
    });

  return rows
    .sort((a, b) => a.centerY - b.centerY)
    .flatMap((row) => row.magnets.sort((a, b) =>
      (a.x + a.width / 2) - (b.x + b.width / 2),
    ));
}

/**
 * Applies a newly arranged visible order without forgetting temporarily hidden
 * magnets. Hidden entries keep their previous slots while visible entries are
 * replaced, in order, with the user's latest top-to-bottom/left-to-right order.
 */
export function mergeVisibleMagnetOrder(
  previousOrder: string[],
  visibleOrder: string[],
): string[] {
  const uniqueVisible = [...new Set(visibleOrder)];
  if (!previousOrder.length) return uniqueVisible;

  const visible = new Set(uniqueVisible);
  const merged: string[] = [];
  let visibleIndex = 0;

  previousOrder.forEach((id) => {
    if (visible.has(id)) {
      const replacement = uniqueVisible[visibleIndex];
      visibleIndex += 1;
      if (replacement) merged.push(replacement);
      return;
    }
    merged.push(id);
  });

  while (visibleIndex < uniqueVisible.length) {
    merged.push(uniqueVisible[visibleIndex]!);
    visibleIndex += 1;
  }

  return [...new Set(merged)];
}

export function packMagnets(
  magnets: MagnetSize[],
  {
    boardWidth,
    gapX = 12,
    gapY = 14,
    padding = 16,
    firstRowRightInset = 0,
  }: PackMagnetsOptions,
): { height: number; placements: MagnetPlacement[] } {
  const safeWidth = Math.max(boardWidth, padding * 2 + 1);
  const fullRightEdge = Math.max(safeWidth - padding, padding + 1);
  let cursorX = padding;
  let cursorY = padding;
  let rowHeight = 0;
  let maxBottom = padding;

  const placements = magnets.map((magnet) => {
    const width = Math.max(0, Math.min(magnet.width, safeWidth - padding * 2));
    const height = Math.max(0, magnet.height);
    const rightEdge = cursorY === padding
      ? Math.max(fullRightEdge - firstRowRightInset, padding + 1)
      : fullRightEdge;

    if (cursorX > padding && cursorX + width > rightEdge) {
      cursorX = padding;
      cursorY += rowHeight + gapY;
      rowHeight = 0;
    }

    const placement = { ...magnet, width, height, x: cursorX, y: cursorY };
    cursorX += width + gapX;
    rowHeight = Math.max(rowHeight, height);
    maxBottom = Math.max(maxBottom, cursorY + height);
    return placement;
  });

  return {
    height: Math.ceil(maxBottom + padding),
    placements,
  };
}

export function placementsOverlap(a: MagnetPlacement, b: MagnetPlacement, gap = 0): boolean {
  return !(
    a.x + a.width + gap <= b.x ||
    b.x + b.width + gap <= a.x ||
    a.y + a.height + gap <= b.y ||
    b.y + b.height + gap <= a.y
  );
}
