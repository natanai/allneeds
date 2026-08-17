import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';

import { readMagnetLayout, writeMagnetLayout } from '../../persistence/magnetLayoutStore';
import { getMagnetTilt, stableHash } from './magnetMath';
import styles from './MagnetBoard.module.css';

type Point = { x: number; y: number };

type MagnetState = Point & {
  id: string;
  element: HTMLElement;
  w: number;
  h: number;
  vx: number;
  vy: number;
  driftX: number;
  driftY: number;
  dragging: boolean;
};

type DragCandidate = {
  pointerId: number;
  pointerType: string;
  magnet: MagnetState;
  down: Point;
  offset: Point;
  started: boolean;
  moved: boolean;
  holdTimer: number | null;
};

type MagnetBoardProps = {
  children: ReactNode;
  playMode: boolean;
  storageKey: string;
  shuffleVersion?: number;
  className?: string;
  ariaLabel?: string;
};

const BOARD_PADDING = 12;
const FLOW_GAP = 12;
const DRAG_THRESHOLD = 6;
const TOUCH_HOLD_MS = 180;
const CLICK_SUPPRESS_MS = 320;
const DRIFT_ACCELERATION = 2.1;
const VELOCITY_DAMPING_PER_SECOND = 1.8;
const POINTER_RADIUS = 128;
const POINTER_ACCELERATION = 7;
const EDGE_BOUNCE = 0.24;
const MAX_SPEED = 12;

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

function unitVector(seed: string): Point {
  const hash = stableHash(seed);
  const angle = ((hash % 3600) / 3600) * Math.PI * 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function applyMagnetTransform(magnet: MagnetState) {
  magnet.element.style.setProperty('--magnet-x', `${magnet.x}px`);
  magnet.element.style.setProperty('--magnet-y', `${magnet.y}px`);
}

function overlaps(a: MagnetState, b: MagnetState, gap = 0) {
  return !(
    a.x + a.w + gap <= b.x ||
    b.x + b.w + gap <= a.x ||
    a.y + a.h + gap <= b.y ||
    b.y + b.h + gap <= a.y
  );
}

function resolveOverlap(a: MagnetState, b: MagnetState, boardWidth: number, boardHeight: number) {
  const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  if (overlapX <= 0 || overlapY <= 0) return false;

  const centerAX = a.x + a.w / 2;
  const centerAY = a.y + a.h / 2;
  const centerBX = b.x + b.w / 2;
  const centerBY = b.y + b.h / 2;
  const aMovable = !a.dragging;
  const bMovable = !b.dragging;
  const divisor = aMovable && bMovable ? 2 : 1;

  if (overlapX < overlapY) {
    const direction = centerAX <= centerBX ? -1 : 1;
    const correction = (overlapX + 1.5) / divisor;
    if (aMovable) a.x += direction * correction;
    if (bMovable) b.x -= direction * correction;
    if (aMovable) a.vx += direction * 0.8;
    if (bMovable) b.vx -= direction * 0.8;
  } else {
    const direction = centerAY <= centerBY ? -1 : 1;
    const correction = (overlapY + 1.5) / divisor;
    if (aMovable) a.y += direction * correction;
    if (bMovable) b.y -= direction * correction;
    if (aMovable) a.vy += direction * 0.8;
    if (bMovable) b.vy -= direction * 0.8;
  }

  if (aMovable) {
    a.x = clamp(a.x, BOARD_PADDING, Math.max(BOARD_PADDING, boardWidth - a.w - BOARD_PADDING));
    a.y = clamp(a.y, BOARD_PADDING, Math.max(BOARD_PADDING, boardHeight - a.h - BOARD_PADDING));
  }
  if (bMovable) {
    b.x = clamp(b.x, BOARD_PADDING, Math.max(BOARD_PADDING, boardWidth - b.w - BOARD_PADDING));
    b.y = clamp(b.y, BOARD_PADDING, Math.max(BOARD_PADDING, boardHeight - b.h - BOARD_PADDING));
  }
  return true;
}

function resolveAll(states: MagnetState[], boardWidth: number, initialHeight: number) {
  let boardHeight = Math.max(initialHeight, 1);
  for (let attempt = 0; attempt < 45; attempt += 1) {
    let changed = false;
    for (let i = 0; i < states.length; i += 1) {
      const a = states[i];
      if (!a) continue;
      for (let j = i + 1; j < states.length; j += 1) {
        const b = states[j];
        if (!b) continue;
        if (resolveOverlap(a, b, boardWidth, boardHeight)) changed = true;
      }
    }
    if (!changed) break;
  }

  const hasOverlap = states.some((a, index) => states.slice(index + 1).some((b) => overlaps(a, b, 1)));
  if (hasOverlap) {
    let x = BOARD_PADDING;
    let y = BOARD_PADDING;
    let rowHeight = 0;
    for (const magnet of states) {
      if (x > BOARD_PADDING && x + magnet.w > boardWidth - BOARD_PADDING) {
        x = BOARD_PADDING;
        y += rowHeight + FLOW_GAP;
        rowHeight = 0;
      }
      magnet.x = x;
      magnet.y = y;
      magnet.vx = 0;
      magnet.vy = 0;
      x += magnet.w + FLOW_GAP;
      rowHeight = Math.max(rowHeight, magnet.h);
    }
    boardHeight = Math.max(boardHeight, y + rowHeight + BOARD_PADDING);
  } else {
    const bottom = states.reduce((max, magnet) => Math.max(max, magnet.y + magnet.h + BOARD_PADDING), 0);
    boardHeight = Math.max(boardHeight, bottom);
  }
  return boardHeight;
}

function saveStoredLayout(storageKey: string, board: HTMLElement, states: MagnetState[]) {
  const width = Math.max(board.clientWidth, 1);
  const height = Math.max(board.clientHeight, 1);
  const boardHeight = Math.max(board.getBoundingClientRect().height, 1);
  const magnets: Record<string, { xPct: number; yPct: number }> = {};
  for (const magnet of states) {
    magnets[magnet.id] = {
      xPct: clamp(magnet.x / width, 0, 1),
      yPct: clamp(magnet.y / height, 0, 1),
    };
  }
  writeMagnetLayout(storageKey, { version: 1, boardHeight, magnets });
}

function clientToBorderBoxHeight(board: HTMLElement, desiredClientHeight: number) {
  const borderDelta = Math.max(board.getBoundingClientRect().height - board.clientHeight, 0);
  return Math.max(desiredClientHeight + borderDelta, 1);
}

function shuffleIntoRows(states: MagnetState[], boardWidth: number) {
  const order = [...states].sort(() => Math.random() - 0.5);
  let x = BOARD_PADDING;
  let y = BOARD_PADDING;
  let rowHeight = 0;
  for (const magnet of order) {
    if (x > BOARD_PADDING && x + magnet.w > boardWidth - BOARD_PADDING) {
      x = BOARD_PADDING;
      y += rowHeight + FLOW_GAP;
      rowHeight = 0;
    }
    magnet.x = x;
    magnet.y = y;
    magnet.vx = 0;
    magnet.vy = 0;
    x += magnet.w + FLOW_GAP;
    rowHeight = Math.max(rowHeight, magnet.h);
  }
  return y + rowHeight + BOARD_PADDING;
}

export function MagnetBoard({
  children,
  playMode,
  storageKey,
  shuffleVersion = 0,
  className = '',
  ariaLabel,
}: MagnetBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const magnetsRef = useRef<MagnetState[]>([]);
  const playModeRef = useRef(playMode);
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const dragRef = useRef<DragCandidate | null>(null);
  const pointerRef = useRef({ active: false, x: 0, y: 0 });
  const suppressClickUntilRef = useRef(new Map<string, number>());
  const lastShuffleRef = useRef(shuffleVersion);

  playModeRef.current = playMode;

  const persist = () => {
    const board = boardRef.current;
    if (board && magnetsRef.current.length) saveStoredLayout(storageKey, board, magnetsRef.current);
  };

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    board.dataset.magnetReady = '0';
    board.dataset.physics = playModeRef.current ? 'on' : 'off';
    board.style.removeProperty('height');

    const elements = Array.from(board.querySelectorAll<HTMLElement>(':scope > [data-magnet-id]')).filter(
      (element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true',
    );

    for (const element of elements) {
      element.style.removeProperty('position');
      element.style.removeProperty('width');
      element.style.removeProperty('height');
      element.style.removeProperty('--magnet-x');
      element.style.removeProperty('--magnet-y');
      element.style.setProperty('--magnet-tilt', `${getMagnetTilt(element.dataset.magnetId ?? '')}deg`);
    }

    const boardRect = board.getBoundingClientRect();
    const naturalHeight = Math.max(board.scrollHeight, boardRect.height, 1);
    const stored = readMagnetLayout(storageKey);
    const initialBorderHeight = Math.max(stored?.boardHeight ?? 0, naturalHeight);
    board.style.height = `${initialBorderHeight}px`;
    let boardHeight = Math.max(board.clientHeight, 1);

    const states = elements.map((element) => {
      const rect = element.getBoundingClientRect();
      const id = element.dataset.magnetId ?? element.textContent?.trim() ?? '';
      const saved = stored?.magnets[id];
      const drift = unitVector(`${storageKey}:${id}`);
      const x = saved
        ? saved.xPct * Math.max(board.clientWidth, 1)
        : rect.left - boardRect.left - board.clientLeft;
      const y = saved
        ? saved.yPct * Math.max(board.clientHeight, 1)
        : rect.top - boardRect.top - board.clientTop;
      return {
        id,
        element,
        x,
        y,
        w: rect.width,
        h: rect.height,
        vx: 0,
        vy: 0,
        driftX: drift.x,
        driftY: drift.y,
        dragging: false,
      } satisfies MagnetState;
    });

    boardHeight = resolveAll(states, Math.max(board.clientWidth, 1), boardHeight);
    board.style.height = `${clientToBorderBoxHeight(board, boardHeight)}px`;

    for (const magnet of states) {
      magnet.element.style.position = 'absolute';
      magnet.element.style.left = '0';
      magnet.element.style.top = '0';
      applyMagnetTransform(magnet);
    }

    magnetsRef.current = states;
    board.dataset.magnetReady = '1';
    persist();

    let lastWidth = Math.max(board.clientWidth, 1);
    let resizeFrame: number | null = null;
    const scheduleRepair = () => {
      if (resizeFrame !== null) return;
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = null;
        if (!magnetsRef.current.length) return;

        const newWidth = Math.max(board.clientWidth, 1);
        const oldWidth = lastWidth;
        const widthChanged = Math.abs(newWidth - oldWidth) >= 2;
        let sizeChanged = false;
        const currentHeight = Math.max(board.clientHeight, 1);

        for (const magnet of magnetsRef.current) {
          const nextW = magnet.element.offsetWidth || magnet.w;
          const nextH = magnet.element.offsetHeight || magnet.h;
          if (Math.abs(nextW - magnet.w) >= 0.5 || Math.abs(nextH - magnet.h) >= 0.5) sizeChanged = true;
          magnet.w = nextW;
          magnet.h = nextH;

          if (widthChanged) {
            const xPct = clamp(magnet.x / Math.max(oldWidth, 1), 0, 1);
            magnet.x = xPct * newWidth;
          }
          magnet.x = clamp(magnet.x, BOARD_PADDING, Math.max(BOARD_PADDING, newWidth - magnet.w - BOARD_PADDING));
          magnet.y = clamp(magnet.y, BOARD_PADDING, Math.max(BOARD_PADDING, currentHeight - magnet.h - BOARD_PADDING));
        }

        if (!widthChanged && !sizeChanged) return;
        const nextClientHeight = resolveAll(magnetsRef.current, newWidth, currentHeight);
        board.style.height = `${clientToBorderBoxHeight(board, nextClientHeight)}px`;
        magnetsRef.current.forEach(applyMagnetTransform);
        lastWidth = newWidth;
        persist();
      });
    };

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(scheduleRepair) : null;
    resizeObserver?.observe(board);
    for (const magnet of states) resizeObserver?.observe(magnet.element);

    // Web fonts can change magnet metrics after React's first layout pass. Repair once fonts settle,
    // without hiding or randomly re-laying out the board in the meantime.
    void document.fonts?.ready?.then(scheduleRepair).catch(() => undefined);

    return () => {
      resizeObserver?.disconnect();
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
    };
    // storageKey identifies a stable board. Its children are intentionally expected to retain IDs.
  }, [storageKey]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    board.dataset.physics = playMode ? 'on' : 'off';

    if (!playMode) {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastFrameRef.current = null;
      pointerRef.current.active = false;
      persist();
      return;
    }

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduceMotion) {
      // Play mode still enables intentional dragging; only continuous ambient motion is skipped.
      return;
    }

    const tick = (time: number) => {
      const states = magnetsRef.current;
      const width = Math.max(board.clientWidth, 1);
      const height = Math.max(board.clientHeight, 1);
      const previous = lastFrameRef.current ?? time;
      const dt = Math.min(Math.max((time - previous) / 1000, 0), 0.04);
      lastFrameRef.current = time;
      const damping = Math.exp(-VELOCITY_DAMPING_PER_SECOND * dt);

      for (const magnet of states) {
        if (magnet.dragging) continue;
        magnet.vx = (magnet.vx + magnet.driftX * DRIFT_ACCELERATION * dt) * damping;
        magnet.vy = (magnet.vy + magnet.driftY * DRIFT_ACCELERATION * dt) * damping;

        if (pointerRef.current.active) {
          const centerX = magnet.x + magnet.w / 2;
          const centerY = magnet.y + magnet.h / 2;
          const dx = centerX - pointerRef.current.x;
          const dy = centerY - pointerRef.current.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < POINTER_RADIUS) {
            const strength = (1 - distance / POINTER_RADIUS) * POINTER_ACCELERATION * dt;
            magnet.vx += (dx / distance) * strength;
            magnet.vy += (dy / distance) * strength;
          }
        }

        const speed = Math.hypot(magnet.vx, magnet.vy);
        if (speed > MAX_SPEED) {
          magnet.vx = (magnet.vx / speed) * MAX_SPEED;
          magnet.vy = (magnet.vy / speed) * MAX_SPEED;
        }

        magnet.x += magnet.vx * dt;
        magnet.y += magnet.vy * dt;

        const maxX = Math.max(BOARD_PADDING, width - magnet.w - BOARD_PADDING);
        const maxY = Math.max(BOARD_PADDING, height - magnet.h - BOARD_PADDING);
        if (magnet.x <= BOARD_PADDING || magnet.x >= maxX) {
          magnet.x = clamp(magnet.x, BOARD_PADDING, maxX);
          magnet.vx *= -EDGE_BOUNCE;
          magnet.driftX *= -1;
        }
        if (magnet.y <= BOARD_PADDING || magnet.y >= maxY) {
          magnet.y = clamp(magnet.y, BOARD_PADDING, maxY);
          magnet.vy *= -EDGE_BOUNCE;
          magnet.driftY *= -1;
        }
      }

      for (let pass = 0; pass < 2; pass += 1) {
        for (let i = 0; i < states.length; i += 1) {
          const a = states[i];
          if (!a) continue;
          for (let j = i + 1; j < states.length; j += 1) {
            const b = states[j];
            if (!b) continue;
            resolveOverlap(a, b, width, height);
          }
        }
      }

      states.forEach(applyMagnetTransform);
      if (playModeRef.current) frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastFrameRef.current = null;
    };
  }, [playMode, storageKey]);

  useEffect(() => {
    if (shuffleVersion === lastShuffleRef.current) return;
    lastShuffleRef.current = shuffleVersion;
    const board = boardRef.current;
    if (!board || !magnetsRef.current.length) return;
    const height = shuffleIntoRows(magnetsRef.current, Math.max(board.clientWidth, 1));
    const nextClientHeight = Math.max(height, board.clientHeight);
    board.style.height = `${clientToBorderBoxHeight(board, nextClientHeight)}px`;
    magnetsRef.current.forEach(applyMagnetTransform);
    persist();
  }, [shuffleVersion]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const preventTouchScrollWhileDragging = (event: TouchEvent) => {
      if (dragRef.current?.started && event.cancelable) event.preventDefault();
    };
    board.addEventListener('touchmove', preventTouchScrollWhileDragging, { passive: false });
    return () => board.removeEventListener('touchmove', preventTouchScrollWhileDragging);
  }, []);

  const findMagnet = (element: HTMLElement) => magnetsRef.current.find((magnet) => magnet.element === element) ?? null;

  const beginDrag = (candidate: DragCandidate) => {
    if (candidate.started || !playModeRef.current) return;
    candidate.started = true;
    candidate.magnet.dragging = true;
    candidate.magnet.vx = 0;
    candidate.magnet.vy = 0;
    candidate.magnet.element.dataset.dragging = 'true';
    boardRef.current?.setAttribute('data-dragging', '1');
    try {
      candidate.magnet.element.setPointerCapture(candidate.pointerId);
    } catch {
      // Pointer capture can fail when the browser has already claimed a scroll gesture.
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!playModeRef.current || event.button !== 0) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-magnet-id]');
    if (!target || !boardRef.current?.contains(target)) return;
    const magnet = findMagnet(target);
    if (!magnet) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const candidate: DragCandidate = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      magnet,
      down: { x: event.clientX, y: event.clientY },
      offset: {
        x: event.clientX - boardRect.left - magnet.x,
        y: event.clientY - boardRect.top - magnet.y,
      },
      started: false,
      moved: false,
      holdTimer: null,
    };
    dragRef.current = candidate;

    if (event.pointerType === 'touch') {
      candidate.holdTimer = window.setTimeout(() => beginDrag(candidate), TOUCH_HOLD_MS);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const board = boardRef.current;
    if (!board || !playModeRef.current) return;
    const candidate = dragRef.current;

    if (candidate && candidate.pointerId === event.pointerId) {
      const dx = event.clientX - candidate.down.x;
      const dy = event.clientY - candidate.down.y;
      const distance = Math.hypot(dx, dy);

      if (!candidate.started) {
        if (candidate.pointerType === 'touch') {
          if (distance > DRAG_THRESHOLD) {
            if (candidate.holdTimer !== null) clearTimeout(candidate.holdTimer);
            dragRef.current = null;
          }
          return;
        }
        if (distance < DRAG_THRESHOLD) return;
        beginDrag(candidate);
      }

      candidate.moved = true;
      if (event.cancelable) event.preventDefault();
      const rect = board.getBoundingClientRect();
      const magnet = candidate.magnet;
      magnet.x = clamp(
        event.clientX - rect.left - candidate.offset.x,
        BOARD_PADDING,
        Math.max(BOARD_PADDING, board.clientWidth - magnet.w - BOARD_PADDING),
      );
      magnet.y = clamp(
        event.clientY - rect.top - candidate.offset.y,
        BOARD_PADDING,
        Math.max(BOARD_PADDING, board.clientHeight - magnet.h - BOARD_PADDING),
      );
      for (let pass = 0; pass < 2; pass += 1) {
        for (const other of magnetsRef.current) {
          if (other !== magnet) resolveOverlap(magnet, other, board.clientWidth, board.clientHeight);
        }
      }
      magnetsRef.current.forEach(applyMagnetTransform);
      return;
    }

    if (event.pointerType === 'mouse' && event.buttons === 0) {
      const rect = board.getBoundingClientRect();
      pointerRef.current = {
        active: true,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    }
  };

  const finishPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const candidate = dragRef.current;
    if (!candidate || candidate.pointerId !== event.pointerId) return;
    if (candidate.holdTimer !== null) clearTimeout(candidate.holdTimer);
    if (candidate.started) {
      candidate.magnet.dragging = false;
      delete candidate.magnet.element.dataset.dragging;
      boardRef.current?.removeAttribute('data-dragging');
      try {
        if (candidate.magnet.element.hasPointerCapture(event.pointerId)) {
          candidate.magnet.element.releasePointerCapture(event.pointerId);
        }
      } catch {
        // Ignore capture cleanup races.
      }
      if (candidate.moved || candidate.pointerType === 'touch') {
        suppressClickUntilRef.current.set(candidate.magnet.id, performance.now() + CLICK_SUPPRESS_MS);
      }
      persist();
    }
    dragRef.current = null;
  };

  const handleClickCapture = (event: ReactPointerEvent<HTMLDivElement> | ReactMouseEvent<HTMLDivElement>) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-magnet-id]');
    if (!target) return;
    const id = target.dataset.magnetId ?? '';
    const until = suppressClickUntilRef.current.get(id) ?? 0;
    if (performance.now() < until) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickUntilRef.current.delete(id);
    }
  };

  const boardStyle = {
    '--magnet-board-padding': `${BOARD_PADDING}px`,
  } as CSSProperties;

  return (
    <div
      ref={boardRef}
      className={`${styles.board} ${className}`}
      style={boardStyle}
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
      onPointerLeave={(event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.pointerType === 'mouse' && !dragRef.current) pointerRef.current.active = false;
      }}
      onClickCapture={handleClickCapture}
    >
      {children}
    </div>
  );
}
