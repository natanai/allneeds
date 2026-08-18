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
  homeX: number;
  homeY: number;
  phase: number;
  phase2: number;
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
  lastPointer: Point;
  lastTime: number;
  pointerVx: number;
  pointerVy: number;
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
const DRAG_THRESHOLD = 4;
const TOUCH_HOLD_MS = 180;
const CLICK_SUPPRESS_MS = 320;

const CURRENT_ACCELERATION = 1.35;
const FLUID_DAMPING_PER_SECOND = 1.05;
const HOME_DEAD_ZONE = 52;
const HOME_ACCELERATION = 0.065;
const HOME_MAX_ACCELERATION = 7.5;

const SOFT_COLLISION_GAP = 10;
const PAIR_ACCELERATION = 34;
const CONTACT_SLOP = 1.75;
const PENETRATION_CORRECTION = 0.42;

const EDGE_CUSHION = 24;
const EDGE_ACCELERATION = 18;
const EDGE_BOUNCE = 0.32;

const POINTER_RADIUS = 124;
const POINTER_ACCELERATION = 7;

const MAX_SPEED = 110;
const RELEASE_VELOCITY_SCALE = 0.14;
const MAX_RELEASE_SPEED = 72;

const DRAG_WAKE_MIN_RADIUS = 112;
const DRAG_WAKE_MAX_RADIUS = 188;
const DRAG_WAKE_TRANSFER = 0.105;
const DRAG_RADIAL_IMPULSE = 30;
const DRAG_HOME_CARRY = 0.24;

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

function phaseFor(seed: string) {
  return ((stableHash(seed) % 3600) / 3600) * Math.PI * 2;
}

function applyMagnetTransform(magnet: MagnetState, smooth = false) {
  const x = smooth ? Math.round(magnet.x * 4) / 4 : Math.round(magnet.x);
  const y = smooth ? Math.round(magnet.y * 4) / 4 : Math.round(magnet.y);
  magnet.element.style.setProperty('--magnet-x', `${x}px`);
  magnet.element.style.setProperty('--magnet-y', `${y}px`);
}

function overlaps(a: MagnetState, b: MagnetState, gap = 0) {
  return !(
    a.x + a.w + gap <= b.x ||
    b.x + b.w + gap <= a.x ||
    a.y + a.h + gap <= b.y ||
    b.y + b.h + gap <= a.y
  );
}

function clampMagnet(magnet: MagnetState, boardWidth: number, boardHeight: number) {
  magnet.x = clamp(
    magnet.x,
    BOARD_PADDING,
    Math.max(BOARD_PADDING, boardWidth - magnet.w - BOARD_PADDING),
  );
  magnet.y = clamp(
    magnet.y,
    BOARD_PADDING,
    Math.max(BOARD_PADDING, boardHeight - magnet.h - BOARD_PADDING),
  );
  magnet.homeX = clamp(
    magnet.homeX,
    BOARD_PADDING,
    Math.max(BOARD_PADDING, boardWidth - magnet.w - BOARD_PADDING),
  );
  magnet.homeY = clamp(
    magnet.homeY,
    BOARD_PADDING,
    Math.max(BOARD_PADDING, boardHeight - magnet.h - BOARD_PADDING),
  );
}

function correctPenetration(
  a: MagnetState,
  b: MagnetState,
  boardWidth: number,
  boardHeight: number,
) {
  const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);

  if (overlapX <= CONTACT_SLOP || overlapY <= CONTACT_SLOP) return false;

  const centerAX = a.x + a.w / 2;
  const centerAY = a.y + a.h / 2;
  const centerBX = b.x + b.w / 2;
  const centerBY = b.y + b.h / 2;

  const aMovable = !a.dragging;
  const bMovable = !b.dragging;
  if (!aMovable && !bMovable) return false;

  const divisor = aMovable && bMovable ? 2 : 1;

  if (overlapX < overlapY) {
    const direction = centerAX <= centerBX ? -1 : 1;
    const correction =
      Math.max(overlapX - CONTACT_SLOP, 0) * PENETRATION_CORRECTION / divisor;

    if (aMovable) {
      a.x += direction * correction;
      a.vx *= 0.82;
    }
    if (bMovable) {
      b.x -= direction * correction;
      b.vx *= 0.82;
    }
  } else {
    const direction = centerAY <= centerBY ? -1 : 1;
    const correction =
      Math.max(overlapY - CONTACT_SLOP, 0) * PENETRATION_CORRECTION / divisor;

    if (aMovable) {
      a.y += direction * correction;
      a.vy *= 0.82;
    }
    if (bMovable) {
      b.y -= direction * correction;
      b.vy *= 0.82;
    }
  }

  if (aMovable) clampMagnet(a, boardWidth, boardHeight);
  if (bMovable) clampMagnet(b, boardWidth, boardHeight);
  return true;
}

function applySoftPairForce(
  a: MagnetState,
  b: MagnetState,
  boardWidth: number,
  boardHeight: number,
  dt: number,
) {
  const centerAX = a.x + a.w / 2;
  const centerAY = a.y + a.h / 2;
  const centerBX = b.x + b.w / 2;
  const centerBY = b.y + b.h / 2;
  let dx = centerBX - centerAX;
  let dy = centerBY - centerAY;

  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
    const direction = phaseFor(`${a.id}:${b.id}`);
    dx = Math.cos(direction);
    dy = Math.sin(direction);
  }

  const reachX = (a.w + b.w) / 2 + SOFT_COLLISION_GAP;
  const reachY = (a.h + b.h) / 2 + SOFT_COLLISION_GAP;
  const scaledDistance = Math.hypot(dx / Math.max(reachX, 1), dy / Math.max(reachY, 1));

  if (scaledDistance < 1) {
    const distance = Math.max(Math.hypot(dx, dy), 0.001);
    const nx = dx / distance;
    const ny = dy / distance;
    const closeness = 1 - scaledDistance;
    const acceleration = closeness * closeness * PAIR_ACCELERATION;

    if (!a.dragging) {
      a.vx -= nx * acceleration * dt;
      a.vy -= ny * acceleration * dt;
    }
    if (!b.dragging) {
      b.vx += nx * acceleration * dt;
      b.vy += ny * acceleration * dt;
    }
  }

  correctPenetration(a, b, boardWidth, boardHeight);
}

function settleHomes(states: MagnetState[]) {
  for (const magnet of states) {
    magnet.homeX = magnet.x;
    magnet.homeY = magnet.y;
  }
}

function resolveInitialLayout(
  states: MagnetState[],
  boardWidth: number,
  initialHeight: number,
) {
  let boardHeight = Math.max(initialHeight, 1);

  for (let attempt = 0; attempt < 45; attempt += 1) {
    let changed = false;

    for (let i = 0; i < states.length; i += 1) {
      const a = states[i];
      if (!a) continue;

      for (let j = i + 1; j < states.length; j += 1) {
        const b = states[j];
        if (!b) continue;

        const beforeAX = a.x;
        const beforeAY = a.y;
        const beforeBX = b.x;
        const beforeBY = b.y;

        if (overlaps(a, b, 1)) {
          const centerAX = a.x + a.w / 2;
          const centerAY = a.y + a.h / 2;
          const centerBX = b.x + b.w / 2;
          const centerBY = b.y + b.h / 2;
          const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
          const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);

          if (overlapX < overlapY) {
            const direction = centerAX <= centerBX ? -1 : 1;
            const correction = (overlapX + 2) / 2;
            a.x += direction * correction;
            b.x -= direction * correction;
          } else {
            const direction = centerAY <= centerBY ? -1 : 1;
            const correction = (overlapY + 2) / 2;
            a.y += direction * correction;
            b.y -= direction * correction;
          }

          a.x = clamp(
            a.x,
            BOARD_PADDING,
            Math.max(BOARD_PADDING, boardWidth - a.w - BOARD_PADDING),
          );
          b.x = clamp(
            b.x,
            BOARD_PADDING,
            Math.max(BOARD_PADDING, boardWidth - b.w - BOARD_PADDING),
          );
          a.y = clamp(a.y, BOARD_PADDING, Math.max(BOARD_PADDING, boardHeight - a.h - BOARD_PADDING));
          b.y = clamp(b.y, BOARD_PADDING, Math.max(BOARD_PADDING, boardHeight - b.h - BOARD_PADDING));
        }

        if (
          a.x !== beforeAX ||
          a.y !== beforeAY ||
          b.x !== beforeBX ||
          b.y !== beforeBY
        ) {
          changed = true;
        }
      }
    }

    if (!changed) break;
  }

  const hasOverlap = states.some((a, index) =>
    states.slice(index + 1).some((b) => overlaps(a, b, 1)),
  );

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
    const bottom = states.reduce(
      (max, magnet) => Math.max(max, magnet.y + magnet.h + BOARD_PADDING),
      0,
    );
    boardHeight = Math.max(boardHeight, bottom);
  }

  settleHomes(states);
  return boardHeight;
}

function saveStoredLayout(
  storageKey: string,
  board: HTMLElement,
  states: MagnetState[],
) {
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

function clientToBorderBoxHeight(
  board: HTMLElement,
  desiredClientHeight: number,
) {
  const borderDelta = Math.max(
    board.getBoundingClientRect().height - board.clientHeight,
    0,
  );
  return Math.max(desiredClientHeight + borderDelta, 1);
}

function shuffleIntoRows(states: MagnetState[], boardWidth: number) {
  const order = [...states]
    .map((magnet) => ({ magnet, random: Math.random() }))
    .sort((a, b) => a.random - b.random)
    .map(({ magnet }) => magnet);

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
    magnet.homeX = x;
    magnet.homeY = y;
    x += magnet.w + FLOW_GAP;
    rowHeight = Math.max(rowHeight, magnet.h);
  }

  return y + rowHeight + BOARD_PADDING;
}

function applyHomeTether(magnet: MagnetState, dt: number) {
  const dx = magnet.homeX - magnet.x;
  const dy = magnet.homeY - magnet.y;
  const distance = Math.hypot(dx, dy);

  if (distance <= HOME_DEAD_ZONE || distance <= 0.001) return;

  const excess = distance - HOME_DEAD_ZONE;
  const acceleration = Math.min(
    excess * HOME_ACCELERATION,
    HOME_MAX_ACCELERATION,
  );

  magnet.vx += (dx / distance) * acceleration * dt;
  magnet.vy += (dy / distance) * acceleration * dt;
}

function applyEdgePressure(
  magnet: MagnetState,
  boardWidth: number,
  boardHeight: number,
  dt: number,
) {
  const maxX = Math.max(
    BOARD_PADDING,
    boardWidth - magnet.w - BOARD_PADDING,
  );
  const maxY = Math.max(
    BOARD_PADDING,
    boardHeight - magnet.h - BOARD_PADDING,
  );

  const leftDistance = magnet.x - BOARD_PADDING;
  const rightDistance = maxX - magnet.x;
  const topDistance = magnet.y - BOARD_PADDING;
  const bottomDistance = maxY - magnet.y;

  if (leftDistance < EDGE_CUSHION) {
    magnet.vx +=
      (1 - clamp(leftDistance / EDGE_CUSHION, 0, 1)) *
      EDGE_ACCELERATION *
      dt;
  }
  if (rightDistance < EDGE_CUSHION) {
    magnet.vx -=
      (1 - clamp(rightDistance / EDGE_CUSHION, 0, 1)) *
      EDGE_ACCELERATION *
      dt;
  }
  if (topDistance < EDGE_CUSHION) {
    magnet.vy +=
      (1 - clamp(topDistance / EDGE_CUSHION, 0, 1)) *
      EDGE_ACCELERATION *
      dt;
  }
  if (bottomDistance < EDGE_CUSHION) {
    magnet.vy -=
      (1 - clamp(bottomDistance / EDGE_CUSHION, 0, 1)) *
      EDGE_ACCELERATION *
      dt;
  }

  if (magnet.x <= BOARD_PADDING || magnet.x >= maxX) {
    magnet.x = clamp(magnet.x, BOARD_PADDING, maxX);
    magnet.vx *= -EDGE_BOUNCE;
  }
  if (magnet.y <= BOARD_PADDING || magnet.y >= maxY) {
    magnet.y = clamp(magnet.y, BOARD_PADDING, maxY);
    magnet.vy *= -EDGE_BOUNCE;
  }
}

function limitVelocity(magnet: MagnetState, maxSpeed = MAX_SPEED) {
  const speed = Math.hypot(magnet.vx, magnet.vy);
  if (speed <= maxSpeed || speed <= 0.001) return;

  magnet.vx = (magnet.vx / speed) * maxSpeed;
  magnet.vy = (magnet.vy / speed) * maxSpeed;
}

function applyDragWake(
  dragged: MagnetState,
  states: MagnetState[],
  moveX: number,
  moveY: number,
  pointerVx: number,
  pointerVy: number,
  boardWidth: number,
  boardHeight: number,
) {
  const dragCenterX = dragged.x + dragged.w / 2;
  const dragCenterY = dragged.y + dragged.h / 2;

  for (const other of states) {
    if (other === dragged || other.dragging) continue;

    const otherCenterX = other.x + other.w / 2;
    const otherCenterY = other.y + other.h / 2;
    let dx = otherCenterX - dragCenterX;
    let dy = otherCenterY - dragCenterY;
    let distance = Math.hypot(dx, dy);

    if (distance < 0.001) {
      const angle = phaseFor(`${dragged.id}:wake:${other.id}`);
      dx = Math.cos(angle);
      dy = Math.sin(angle);
      distance = 1;
    }

    const radius = clamp(
      (dragged.w + other.w) * 0.72 + 72,
      DRAG_WAKE_MIN_RADIUS,
      DRAG_WAKE_MAX_RADIUS,
    );

    if (distance >= radius) continue;

    const influence = Math.pow(1 - distance / radius, 1.55);
    const nx = dx / distance;
    const ny = dy / distance;

    const transferX = clamp(pointerVx * DRAG_WAKE_TRANSFER, -52, 52);
    const transferY = clamp(pointerVy * DRAG_WAKE_TRANSFER, -52, 52);

    other.vx +=
      (nx * DRAG_RADIAL_IMPULSE + transferX) * influence;
    other.vy +=
      (ny * DRAG_RADIAL_IMPULSE + transferY) * influence;

    // A magnet pushed through the "water" gently carries nearby resting spots
    // with it so displaced magnets do not immediately spring back.
    other.homeX += moveX * DRAG_HOME_CARRY * influence;
    other.homeY += moveY * DRAG_HOME_CARRY * influence;
    clampMagnet(other, boardWidth, boardHeight);
    limitVelocity(other);
  }
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
    if (board && magnetsRef.current.length) {
      saveStoredLayout(storageKey, board, magnetsRef.current);
    }
  };

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    board.dataset.magnetReady = '0';
    board.dataset.physics = playModeRef.current ? 'on' : 'off';
    board.style.removeProperty('height');

    const elements = Array.from(
      board.querySelectorAll<HTMLElement>(':scope > [data-magnet-id]'),
    ).filter(
      (element) =>
        !element.hidden && element.getAttribute('aria-hidden') !== 'true',
    );

    for (const element of elements) {
      element.style.removeProperty('position');
      element.style.removeProperty('width');
      element.style.removeProperty('height');
      element.style.removeProperty('--magnet-x');
      element.style.removeProperty('--magnet-y');
      element.style.setProperty(
        '--magnet-tilt',
        `${getMagnetTilt(element.dataset.magnetId ?? '')}deg`,
      );
      if (element instanceof HTMLAnchorElement) element.draggable = false;
    }

    const boardRect = board.getBoundingClientRect();
    const naturalHeight = Math.max(board.scrollHeight, boardRect.height, 1);
    const stored = readMagnetLayout(storageKey);
    const initialBorderHeight = Math.max(
      stored?.boardHeight ?? 0,
      naturalHeight,
    );
    board.style.height = `${initialBorderHeight}px`;
    let boardHeight = Math.max(board.clientHeight, 1);

    const states = elements.map((element) => {
      const rect = element.getBoundingClientRect();
      const id =
        element.dataset.magnetId ?? element.textContent?.trim() ?? '';
      const saved = stored?.magnets[id];
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
        homeX: x,
        homeY: y,
        phase: phaseFor(`${storageKey}:${id}`),
        phase2: phaseFor(`${id}:${storageKey}:surface`),
        dragging: false,
      } satisfies MagnetState;
    });

    boardHeight = resolveInitialLayout(
      states,
      Math.max(board.clientWidth, 1),
      boardHeight,
    );
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

          if (
            Math.abs(nextW - magnet.w) >= 0.5 ||
            Math.abs(nextH - magnet.h) >= 0.5
          ) {
            sizeChanged = true;
          }

          magnet.w = nextW;
          magnet.h = nextH;

          if (widthChanged) {
            const xPct = clamp(
              magnet.x / Math.max(oldWidth, 1),
              0,
              1,
            );
            const homePct = clamp(
              magnet.homeX / Math.max(oldWidth, 1),
              0,
              1,
            );
            magnet.x = xPct * newWidth;
            magnet.homeX = homePct * newWidth;
          }

          clampMagnet(
            magnet,
            newWidth,
            currentHeight,
          );
        }

        if (!widthChanged && !sizeChanged) return;

        const nextClientHeight = resolveInitialLayout(
          magnetsRef.current,
          newWidth,
          currentHeight,
        );
        board.style.height = `${clientToBorderBoxHeight(
          board,
          nextClientHeight,
        )}px`;
        magnetsRef.current.forEach((magnet) =>
          applyMagnetTransform(magnet, playModeRef.current),
        );
        lastWidth = newWidth;
        persist();
      });
    };

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(scheduleRepair)
        : null;

    resizeObserver?.observe(board);
    for (const magnet of states) resizeObserver?.observe(magnet.element);

    void document.fonts?.ready?.then(scheduleRepair).catch(() => undefined);

    return () => {
      resizeObserver?.disconnect();
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
    };
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

      for (const magnet of magnetsRef.current) {
        magnet.vx = 0;
        magnet.vy = 0;
        magnet.x = Math.round(magnet.x);
        magnet.y = Math.round(magnet.y);
        applyMagnetTransform(magnet);
      }

      settleHomes(magnetsRef.current);
      persist();
      return;
    }

    const reduceMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ??
      false;
    if (reduceMotion) return;

    const tick = (time: number) => {
      const states = magnetsRef.current;
      const width = Math.max(board.clientWidth, 1);
      const height = Math.max(board.clientHeight, 1);
      const previous = lastFrameRef.current ?? time;
      const dt = Math.min(Math.max((time - previous) / 1000, 0), 0.04);
      lastFrameRef.current = time;
      const damping = Math.exp(-FLUID_DAMPING_PER_SECOND * dt);
      const t = time / 1000;

      for (const magnet of states) {
        if (magnet.dragging) continue;

        // Two long-period currents keep the surface alive without a single
        // back-and-forth spring rhythm.
        const currentX =
          (Math.sin(t * 0.28 + magnet.phase) +
            0.52 * Math.sin(t * 0.13 + magnet.phase2)) *
          CURRENT_ACCELERATION;
        const currentY =
          (Math.cos(t * 0.23 + magnet.phase2) +
            0.46 * Math.sin(t * 0.17 + magnet.phase * 1.31)) *
          CURRENT_ACCELERATION;

        magnet.vx = (magnet.vx + currentX * dt) * damping;
        magnet.vy = (magnet.vy + currentY * dt) * damping;

        // The home position has a large dead zone. It is only a safety tether
        // against long-term migration, not something the user should feel.
        applyHomeTether(magnet, dt);

        if (pointerRef.current.active) {
          const centerX = magnet.x + magnet.w / 2;
          const centerY = magnet.y + magnet.h / 2;
          const dx = centerX - pointerRef.current.x;
          const dy = centerY - pointerRef.current.y;
          const distance = Math.hypot(dx, dy);

          if (distance > 0 && distance < POINTER_RADIUS) {
            const influence = Math.pow(1 - distance / POINTER_RADIUS, 1.7);
            magnet.vx +=
              (dx / distance) * POINTER_ACCELERATION * influence * dt;
            magnet.vy +=
              (dy / distance) * POINTER_ACCELERATION * influence * dt;
          }
        }

        applyEdgePressure(magnet, width, height, dt);
        limitVelocity(magnet);

        magnet.x += magnet.vx * dt;
        magnet.y += magnet.vy * dt;
        clampMagnet(magnet, width, height);
      }

      // Soft pressure begins before contact. Hard positional correction is
      // reserved only for genuine penetration, which avoids idle jitter.
      for (let i = 0; i < states.length; i += 1) {
        const a = states[i];
        if (!a) continue;

        for (let j = i + 1; j < states.length; j += 1) {
          const b = states[j];
          if (!b) continue;
          applySoftPairForce(a, b, width, height, dt);
        }
      }

      states.forEach((magnet) => {
        limitVelocity(magnet);
        applyMagnetTransform(magnet, true);
      });

      if (playModeRef.current) {
        frameRef.current = requestAnimationFrame(tick);
      }
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

    const height = shuffleIntoRows(
      magnetsRef.current,
      Math.max(board.clientWidth, 1),
    );
    const nextClientHeight = Math.max(height, board.clientHeight);
    board.style.height = `${clientToBorderBoxHeight(
      board,
      nextClientHeight,
    )}px`;
    magnetsRef.current.forEach((magnet) =>
      applyMagnetTransform(magnet, playModeRef.current),
    );
    persist();
  }, [shuffleVersion]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const preventTouchScrollWhileDragging = (event: TouchEvent) => {
      if (dragRef.current?.started && event.cancelable) {
        event.preventDefault();
      }
    };

    board.addEventListener('touchmove', preventTouchScrollWhileDragging, {
      passive: false,
    });

    return () => {
      board.removeEventListener(
        'touchmove',
        preventTouchScrollWhileDragging,
      );
    };
  }, []);

  const findMagnet = (element: HTMLElement) =>
    magnetsRef.current.find((magnet) => magnet.element === element) ??
    null;

  const beginDrag = (candidate: DragCandidate) => {
    const board = boardRef.current;
    if (candidate.started || !playModeRef.current || !board) return;

    candidate.started = true;
    candidate.magnet.dragging = true;
    candidate.magnet.vx = 0;
    candidate.magnet.vy = 0;
    candidate.magnet.element.dataset.dragging = 'true';
    board.dataset.dragging = '1';

    try {
      board.setPointerCapture(candidate.pointerId);
    } catch {
      // Capture can fail if a touch gesture was already claimed for scrolling.
    }
  };

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const board = boardRef.current;
    if (!board || !playModeRef.current || event.button !== 0) return;

    const target = (event.target as HTMLElement).closest<HTMLElement>(
      '[data-magnet-id]',
    );
    if (!target || !board.contains(target)) return;

    const magnet = findMagnet(target);
    if (!magnet) return;

    const boardRect = board.getBoundingClientRect();
    const now = event.timeStamp || performance.now();

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
      lastPointer: { x: event.clientX, y: event.clientY },
      lastTime: now,
      pointerVx: 0,
      pointerVy: 0,
    };

    dragRef.current = candidate;

    if (event.pointerType === 'touch') {
      candidate.holdTimer = window.setTimeout(
        () => beginDrag(candidate),
        TOUCH_HOLD_MS,
      );
    }
  };

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
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
            if (candidate.holdTimer !== null) {
              clearTimeout(candidate.holdTimer);
            }
            dragRef.current = null;
          }
          return;
        }

        if (distance < DRAG_THRESHOLD) return;
        beginDrag(candidate);
      }

      candidate.moved = true;
      if (event.cancelable) event.preventDefault();

      const now = event.timeStamp || performance.now();
      const pointerDt = Math.max((now - candidate.lastTime) / 1000, 1 / 240);
      const rawVx =
        (event.clientX - candidate.lastPointer.x) / pointerDt;
      const rawVy =
        (event.clientY - candidate.lastPointer.y) / pointerDt;

      candidate.pointerVx =
        candidate.pointerVx * 0.62 + rawVx * 0.38;
      candidate.pointerVy =
        candidate.pointerVy * 0.62 + rawVy * 0.38;
      candidate.lastPointer = {
        x: event.clientX,
        y: event.clientY,
      };
      candidate.lastTime = now;

      const rect = board.getBoundingClientRect();
      const magnet = candidate.magnet;
      const previousX = magnet.x;
      const previousY = magnet.y;

      magnet.x = clamp(
        event.clientX - rect.left - candidate.offset.x,
        BOARD_PADDING,
        Math.max(
          BOARD_PADDING,
          board.clientWidth - magnet.w - BOARD_PADDING,
        ),
      );
      magnet.y = clamp(
        event.clientY - rect.top - candidate.offset.y,
        BOARD_PADDING,
        Math.max(
          BOARD_PADDING,
          board.clientHeight - magnet.h - BOARD_PADDING,
        ),
      );

      const moveX = magnet.x - previousX;
      const moveY = magnet.y - previousY;

      applyDragWake(
        magnet,
        magnetsRef.current,
        moveX,
        moveY,
        candidate.pointerVx,
        candidate.pointerVy,
        board.clientWidth,
        board.clientHeight,
      );

      for (const other of magnetsRef.current) {
        if (other !== magnet) {
          applySoftPairForce(
            magnet,
            other,
            board.clientWidth,
            board.clientHeight,
            1 / 60,
          );
        }
      }

      magnetsRef.current.forEach((item) =>
        applyMagnetTransform(item, true),
      );
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

  const finishPointer = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const board = boardRef.current;
    const candidate = dragRef.current;

    if (!candidate || candidate.pointerId !== event.pointerId) return;

    if (candidate.holdTimer !== null) {
      clearTimeout(candidate.holdTimer);
    }

    if (candidate.started) {
      const magnet = candidate.magnet;
      magnet.dragging = false;
      delete magnet.element.dataset.dragging;
      board?.removeAttribute('data-dragging');

      magnet.homeX = magnet.x;
      magnet.homeY = magnet.y;
      magnet.vx = clamp(
        candidate.pointerVx * RELEASE_VELOCITY_SCALE,
        -MAX_RELEASE_SPEED,
        MAX_RELEASE_SPEED,
      );
      magnet.vy = clamp(
        candidate.pointerVy * RELEASE_VELOCITY_SCALE,
        -MAX_RELEASE_SPEED,
        MAX_RELEASE_SPEED,
      );
      limitVelocity(magnet, MAX_RELEASE_SPEED);

      if (candidate.moved || candidate.pointerType === 'touch') {
        suppressClickUntilRef.current.set(
          magnet.id,
          performance.now() + CLICK_SUPPRESS_MS,
        );
      }

      persist();
    }

    try {
      if (board?.hasPointerCapture(event.pointerId)) {
        board.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore capture cleanup races.
    }

    dragRef.current = null;
  };

  const handleClickCapture = (
    event:
      | ReactPointerEvent<HTMLDivElement>
      | ReactMouseEvent<HTMLDivElement>,
  ) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      '[data-magnet-id]',
    );
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
        if (event.pointerType === 'mouse' && !dragRef.current) {
          pointerRef.current.active = false;
        }
      }}
      onDragStart={(event: ReactMouseEvent<HTMLDivElement>) => event.preventDefault()}
      onClickCapture={handleClickCapture}
    >
      {children}
    </div>
  );
}
