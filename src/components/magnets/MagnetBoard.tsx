import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type {
  AriaAttributes,
  CSSProperties,
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react';
import { Link } from 'react-router';

import {
  getAabbCollision,
  getMagnetTilt,
  limitVector,
  mergeVisibleMagnetOrder,
  NAV_REST_PACKING,
  orderMagnetsByVisualRows,
  packMagnets,
  scalePointerDelta,
} from './magnetMath';
import {
  magnetViewportForWidth,
  readMagnetViewportLayout,
  writeMagnetViewportLayout,
} from '../../persistence/magnetLayoutStore';
import styles from './MagnetBoard.module.css';
import { PhysicsToggle } from './PhysicsToggle';

export type MagnetTone = 'rose' | 'mint' | 'gold' | 'sky' | 'lavender' | 'peach';
export type MagnetKind = 'default' | 'feeling' | 'need' | 'nav';

export type MagnetBoardItem = {
  id: string;
  label: string;
  to?: string;
  onActivate?: () => void;
  tone?: MagnetTone;
  kind?: MagnetKind;
  icon?: ReactNode;
  iconUrl?: string;
  active?: boolean;
  count?: number;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  ariaHasPopup?: AriaAttributes['aria-haspopup'];
  ariaControls?: string;
};

type Point = { x: number; y: number };
type MagnetElement = HTMLAnchorElement | HTMLButtonElement;

type KineticMagnet = {
  id: string;
  element: MagnetElement;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  mass: number;
  wobble: number;
  wobbleVelocity: number;
  dragging: boolean;
};

type DragState = {
  id: string;
  pointerId: number;
  element: MagnetElement;
  startPointer: Point;
  origin: Point;
  pointerScale: Point;
  lastPointer: Point;
  lastTime: number;
  releaseVx: number;
  releaseVy: number;
  moved: boolean;
};

type PointerField = {
  active: boolean;
  pressed: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  lastTime: number;
};

type SurfaceGesture = {
  pointerId: number;
  pointerType: string;
  startPointer: Point;
  lastPointer: Point;
  active: boolean;
  holdTimer: number | null;
};

type DropWave = {
  sourceId: string;
  x: number;
  y: number;
  startedAt: number;
  strength: number;
  reached: Set<string>;
};

type MagnetBoardProps = {
  items: MagnetBoardItem[];
  playMode: boolean;
  onPlayModeChange: (checked: boolean) => void;
  ariaLabel?: string;
  storageKey: string;
  variant?: 'content' | 'nav';
  shuffleVersion?: number;
  className?: string;
};

const DRAG_THRESHOLD = 6;
const CLICK_SUPPRESSION_MS = 320;
const MAX_POINTER_SPEED = 960;
const RELEASE_VELOCITY_SCALE = 0.85;
const MAX_RELEASE_SPEED = 780;
const RELEASE_DEAD_ZONE = 7;
const LINEAR_DRAG = 3.2;
const EDGE_RESTITUTION = 0.16;
const COLLISION_RESTITUTION = 0.07;
const SURFACE_RADIUS = 170;
const SURFACE_COUPLING = 0.14;
const LIFTED_CLEARANCE = 22;
const LIFTED_CLEARING_ACCELERATION = 16;
const LIFTED_NEIGHBOR_MAX_SPEED = 7;
const REST_CONTACT_CORRECTION = 0.2;
const DROP_WAVE_SPEED = 235;
const DROP_WAVE_IMPULSE = 9;
const WOBBLE_SPRING = 34;
const WOBBLE_DAMPING = 6.8;
const PUSHER_SIZE = 44;
const PUSHER_CONTACT_CORRECTION = 0.76;
const PUSHER_VELOCITY_TRANSFER = 0.82;
const PUSHER_MAX_IMPULSE_SPEED = 520;
const TOUCH_PUSH_HOLD_MS = 240;
const TOUCH_PUSH_CANCEL_DISTANCE = 8;

function clamp(value: number, min: number, max: number) {
  if (min > max) return min;
  return Math.min(max, Math.max(min, value));
}

function applyPosition(magnet: KineticMagnet) {
  magnet.element.style.setProperty('--magnet-x', `${magnet.x.toFixed(2)}px`);
  magnet.element.style.setProperty('--magnet-y', `${magnet.y.toFixed(2)}px`);
  magnet.element.style.setProperty('--magnet-wobble-y', `${clamp(magnet.wobble, -3, 3).toFixed(2)}px`);
  magnet.element.style.setProperty('--magnet-rock', `${clamp(magnet.vx * 0.0035 + magnet.wobble * 0.2, -2.6, 2.6).toFixed(2)}deg`);
}

function kickWobble(magnet: KineticMagnet, impulse: number) {
  magnet.wobbleVelocity = clamp(
    magnet.wobbleVelocity + impulse / Math.max(magnet.mass, 0.5),
    -95,
    95,
  );
}

function shuffled<T>(values: T[]) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other]!, copy[index]!];
  }
  return copy;
}

function boardPointFromClient(
  board: HTMLDivElement,
  clientX: number,
  clientY: number,
): Point {
  const rect = board.getBoundingClientRect();
  const point = scalePointerDelta(
    clientX - rect.left,
    clientY - rect.top,
    board.offsetWidth,
    board.offsetHeight,
    rect.width,
    rect.height,
  );
  return {
    x: point.x - board.clientLeft,
    y: point.y - board.clientTop,
  };
}

export function MagnetBoard({
  items,
  playMode,
  onPlayModeChange,
  ariaLabel = 'Magnet board',
  storageKey,
  variant = 'content',
  shuffleVersion = 0,
  className = '',
}: MagnetBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLSpanElement>(null);
  const elementsRef = useRef(new Map<string, MagnetElement>());
  const magnetsRef = useRef(new Map<string, KineticMagnet>());
  const dragRef = useRef<DragState | null>(null);
  const surfaceGestureRef = useRef<SurfaceGesture | null>(null);
  const suppressClickUntilRef = useRef(new Map<string, number>());
  const pointerFieldRef = useRef<PointerField>({
    active: false,
    pressed: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    lastTime: 0,
  });
  const tiltFieldRef = useRef({ x: 0, y: 0, baselineGamma: null as number | null, baselineBeta: null as number | null });
  const dropWavesRef = useRef<DropWave[]>([]);
  const motionDirtyRef = useRef(false);
  const settledSinceRef = useRef(0);
  const lastCollisionRippleRef = useRef(0);
  const readyRef = useRef(false);
  const lastLayoutWidthRef = useRef(0);
  const lastLayoutHeightRef = useRef(0);
  const lastStorageKeyRef = useRef(storageKey);
  const navOrderRef = useRef<string[]>([]);
  const navOrderViewportRef = useRef<ReturnType<typeof magnetViewportForWidth> | null>(null);
  const previousShuffleVersionRef = useRef(shuffleVersion);
  const [layoutReady, setLayoutReady] = useState(false);

  const emitRipple = useCallback((x: number, y: number, intensity = 0.5) => {
    const surface = surfaceRef.current;
    if (!surface || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ripple = document.createElement('span');
    const strength = clamp(intensity, 0.18, 1);
    ripple.className = styles.ripple ?? '';
    ripple.style.left = `${x.toFixed(1)}px`;
    ripple.style.top = `${y.toFixed(1)}px`;
    ripple.style.setProperty('--ripple-size', `${64 + strength * 94}px`);
    ripple.style.setProperty('--ripple-opacity', `${0.045 + strength * 0.085}`);
    surface.append(ripple);
    window.setTimeout(() => ripple.remove(), 1_350);
  }, []);

  const persist = useCallback((layoutWidth?: number, layoutHeight?: number) => {
    const board = boardRef.current;
    if (!board || !readyRef.current) return;
    const width = Math.max(layoutWidth ?? board.clientWidth, 1);
    const height = Math.max(layoutHeight ?? board.clientHeight, 1);
    const magnets: Record<string, { x: number; y: number; xPct: number; yPct: number }> = {};

    magnetsRef.current.forEach((magnet) => {
      magnets[magnet.id] = {
        x: Number(magnet.x.toFixed(2)),
        y: Number(magnet.y.toFixed(2)),
        xPct: Number((magnet.x / width).toFixed(4)),
        yPct: Number((magnet.y / height).toFixed(4)),
      };
    });

    let order: string[] | undefined;
    if (variant === 'nav') {
      const visibleOrder = orderMagnetsByVisualRows(
        [...magnetsRef.current.values()],
      ).map((magnet) => magnet.id);
      navOrderRef.current = mergeVisibleMagnetOrder(navOrderRef.current, visibleOrder);
      order = navOrderRef.current;
    }

    try {
      writeMagnetViewportLayout(storageKey, {
        magnets,
        boardWidth: Number(width.toFixed(2)),
        boardHeight: Number(height.toFixed(2)),
        ...(order ? { order } : {}),
      }, playMode);
    } catch {
      // Persistence is optional in restricted/private browser contexts.
    }
  }, [playMode, storageKey, variant]);

  const layout = useCallback((
    shouldShuffle = false,
    preferStored = true,
    forceNavRestPack = false,
  ) => {
    const board = boardRef.current;
    if (!board) return;

    const boardWidth = board.clientWidth;
    if (boardWidth < 80) {
      readyRef.current = false;
      setLayoutReady(false);
      return;
    }

    const elements = items
      .map((item) => ({ item, element: elementsRef.current.get(item.id) }))
      .filter((entry): entry is { item: MagnetBoardItem; element: MagnetElement } => Boolean(entry.element));
    const mobileNavOrder = [
      'nav-menu',
      'nav-home',
      'nav-customizer',
      'nav-journal',
      'nav-observations',
      'nav-faux-feelings',
      'nav-feelings',
      'nav-needs',
      'nav-body-cues',
      'nav-journal-dashboard',
      'nav-inventory',
    ];
    const displayElements = variant === 'nav' && boardWidth <= 640
      ? [...elements].sort((a, b) => mobileNavOrder.indexOf(a.item.id) - mobileNavOrder.indexOf(b.item.id))
      : elements;
    if (!displayElements.length || displayElements.some(({ element }) => element.offsetWidth <= 0 || element.offsetHeight <= 0)) {
      readyRef.current = false;
      setLayoutReady(false);
      return;
    }

    const packNavAtRest = variant === 'nav' && (forceNavRestPack || !playMode);
    const stored = preferStored
      ? readMagnetViewportLayout(storageKey, boardWidth)
      : null;
    const viewportClass = magnetViewportForWidth(boardWidth);
    if (variant === 'nav' && navOrderViewportRef.current !== viewportClass) {
      navOrderViewportRef.current = viewportClass;
      navOrderRef.current = stored?.order ?? [];
    }
    const canReuseCurrent = preferStored
      && !shouldShuffle
      && !packNavAtRest
      && lastStorageKeyRef.current === storageKey
      && Math.abs(lastLayoutWidthRef.current - boardWidth) < 0.5;
    if (!canReuseCurrent) {
      pointerFieldRef.current.active = false;
      pointerFieldRef.current.pressed = false;
      pointerFieldRef.current.vx = 0;
      pointerFieldRef.current.vy = 0;
    }
    const elementById = new Map(displayElements.map((entry) => [entry.item.id, entry]));
    const orderEntries = (ids: string[]) => {
      const seen = new Set<string>();
      const result: typeof displayElements = [];
      ids.forEach((id) => {
        const entry = elementById.get(id);
        if (!entry || seen.has(id)) return;
        seen.add(id);
        result.push(entry);
      });
      displayElements.forEach((entry) => {
        if (seen.has(entry.item.id)) return;
        seen.add(entry.item.id);
        result.push(entry);
      });
      return result;
    };
    const sameViewportClass = lastLayoutWidthRef.current > 0
      && magnetViewportForWidth(lastLayoutWidthRef.current) === magnetViewportForWidth(boardWidth);
    const currentNavOrder = packNavAtRest && sameViewportClass && magnetsRef.current.size > 0
      ? orderMagnetsByVisualRows(
          [...magnetsRef.current.values()].filter((magnet) => elementById.has(magnet.id)),
        ).map((magnet) => magnet.id)
      : [];
    if (variant === 'nav' && currentNavOrder.length > 0) {
      navOrderRef.current = mergeVisibleMagnetOrder(navOrderRef.current, currentNavOrder);
    } else if (variant === 'nav' && navOrderRef.current.length === 0 && stored?.order?.length) {
      navOrderRef.current = stored.order;
    }
    const ordered = shouldShuffle
      ? shuffled(displayElements)
      : variant === 'nav'
        ? orderEntries(navOrderRef.current)
        : displayElements;
    const measured = ordered.map(({ item, element }) => ({
      id: item.id,
      width: element.offsetWidth,
      height: element.offsetHeight,
    }));
    const packing = variant === 'nav'
      ? NAV_REST_PACKING
      : { padding: 12, gapX: 12, gapY: 14, firstRowRightInset: 46 };
    const padding = packing.padding;
    const packed = packMagnets(measured, {
      boardWidth,
      ...packing,
    });
    const minimumHeight = variant === 'nav' ? 78 : 112;
    const boardHeight = Math.max(packed.height, minimumHeight);
    const sameStoredSize = stored
      && Math.abs(stored.boardWidth - boardWidth) < 1
      && Math.abs(stored.boardHeight - boardHeight) < 1;
    const placements = packed.placements.map((placement) => {
      const current = canReuseCurrent ? magnetsRef.current.get(placement.id) : null;
      const saved = packNavAtRest ? undefined : stored?.magnets[placement.id];
      const restoredX = current?.x
        ?? (sameStoredSize ? saved?.x : saved?.xPct === undefined ? undefined : saved.xPct * boardWidth);
      const restoredY = current?.y
        ?? (sameStoredSize ? saved?.y : saved?.yPct === undefined ? undefined : saved.yPct * boardHeight);
      if (restoredX === undefined || restoredY === undefined) return placement;
      return {
        ...placement,
        x: clamp(restoredX, padding, boardWidth - padding - placement.width),
        y: clamp(restoredY, padding, boardHeight - padding - placement.height),
      };
    });

    board.style.height = `${boardHeight}px`;
    const next = new Map<string, KineticMagnet>();
    const placementById = new Map(placements.map((placement) => [placement.id, placement]));

    elements.forEach(({ item, element }) => {
      const placement = placementById.get(item.id);
      if (!placement) return;
      const previous = magnetsRef.current.get(item.id);
      const magnet: KineticMagnet = {
        id: item.id,
        element,
        x: placement.x,
        y: placement.y,
        width: placement.width,
        height: placement.height,
        vx: canReuseCurrent ? previous?.vx ?? 0 : 0,
        vy: canReuseCurrent ? previous?.vy ?? 0 : 0,
        mass: clamp((placement.width * placement.height) / 3_400, 0.75, 3.2),
        wobble: canReuseCurrent ? previous?.wobble ?? 0 : 0,
        wobbleVelocity: canReuseCurrent ? previous?.wobbleVelocity ?? 0 : 0,
        dragging: dragRef.current?.id === item.id,
      };
      next.set(item.id, magnet);
      applyPosition(magnet);
    });

    magnetsRef.current = next;
    lastLayoutWidthRef.current = boardWidth;
    lastLayoutHeightRef.current = boardHeight;
    lastStorageKeyRef.current = storageKey;
    readyRef.current = true;
    setLayoutReady(true);
  }, [items, playMode, storageKey, variant]);

  useLayoutEffect(() => {
    let cancelled = false;
    let fontsReady = !document.fonts || document.fonts.status === 'loaded';
    let observedWidth = boardRef.current?.clientWidth ?? 0;
    const run = () => {
      if (!cancelled && fontsReady) {
        layout(false, true, variant === 'nav' && !playMode);
      }
    };
    readyRef.current = false;
    setLayoutReady(false);
    if (fontsReady) {
      run();
    } else {
      void document.fonts.ready.then(() => {
        fontsReady = true;
        run();
      });
    }
    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? boardRef.current?.clientWidth ?? 0;
      if (Math.abs(nextWidth - observedWidth) < 0.5) return;
      observedWidth = nextWidth;
      run();
    });
    if (boardRef.current) observer.observe(boardRef.current);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [layout, playMode, variant]);

  useEffect(() => {
    if (shuffleVersion === previousShuffleVersionRef.current) return;
    previousShuffleVersionRef.current = shuffleVersion;
    layout(true, false);
    persist();
  }, [layout, persist, shuffleVersion]);

  useEffect(() => {
    if (!playMode || typeof window.DeviceOrientationEvent === 'undefined') return;
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const field = tiltFieldRef.current;
      if (typeof event.gamma === 'number') {
        if (field.baselineGamma === null) field.baselineGamma = event.gamma;
        field.x = clamp((event.gamma - field.baselineGamma) / 30, -1, 1);
      }
      if (typeof event.beta === 'number') {
        if (field.baselineBeta === null) field.baselineBeta = event.beta;
        field.y = clamp((event.beta - field.baselineBeta) / 30, -1, 1);
      }
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      tiltFieldRef.current = { x: 0, y: 0, baselineGamma: null, baselineBeta: null };
    };
  }, [playMode]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board || !playMode) {
      dropWavesRef.current = [];
      const surfaceGesture = surfaceGestureRef.current;
      if (surfaceGesture?.holdTimer !== null && surfaceGesture?.holdTimer !== undefined) {
        window.clearTimeout(surfaceGesture.holdTimer);
      }
      if (board && surfaceGesture) {
        try {
          if (board.hasPointerCapture(surfaceGesture.pointerId)) {
            board.releasePointerCapture(surfaceGesture.pointerId);
          }
        } catch {
          // Pointer capture may already be gone when play mode changes.
        }
      }
      surfaceGestureRef.current = null;
      pointerFieldRef.current = {
        ...pointerFieldRef.current,
        active: false,
        pressed: false,
        vx: 0,
        vy: 0,
      };
      magnetsRef.current.forEach((magnet) => {
        magnet.dragging = false;
        magnet.vx = 0;
        magnet.vy = 0;
        magnet.wobble = 0;
        magnet.wobbleVelocity = 0;
        delete magnet.element.dataset.dragging;
        applyPosition(magnet);
      });
      if (board) {
        delete board.dataset.dragging;
        delete board.dataset.pushing;
      }
      persist();
      return;
    }

    let frame = 0;
    let previousTime = performance.now();
    const tick = (time: number) => {
      const dt = Math.min(Math.max((time - previousTime) / 1000, 0), 0.034);
      previousTime = time;
      const magnets = [...magnetsRef.current.values()];
      const stepCount = Math.max(1, Math.min(4, Math.ceil(dt / (1 / 100))));
      const step = dt / stepCount;
      const pointer = pointerFieldRef.current;
      const tilt = tiltFieldRef.current;
      let layoutChanged = false;

      for (let substep = 0; substep < stepCount; substep += 1) {
        const liftedId = dragRef.current?.id ?? null;
        const hasLiftedMagnet = liftedId !== null;
        magnets.forEach((magnet) => {
          if (!magnet.dragging && magnet.id !== liftedId) {
            if (pointer.active && pointer.pressed) {
              const collision = getAabbCollision(
                {
                  x: pointer.x - PUSHER_SIZE / 2,
                  y: pointer.y - PUSHER_SIZE / 2,
                  width: PUSHER_SIZE,
                  height: PUSHER_SIZE,
                },
                magnet,
              );
              if (collision) {
                const correction = Math.max(collision.depth - 0.1, 0) * PUSHER_CONTACT_CORRECTION;
                if (correction > 0) {
                  magnet.x += collision.normalX * correction;
                  magnet.y += collision.normalY * correction;
                  layoutChanged = true;
                }

                const relativeNormalVelocity =
                  (magnet.vx - pointer.vx) * collision.normalX
                  + (magnet.vy - pointer.vy) * collision.normalY;
                const transferredSpeed = clamp(
                  -relativeNormalVelocity * (1 + COLLISION_RESTITUTION) * PUSHER_VELOCITY_TRANSFER,
                  0,
                  PUSHER_MAX_IMPULSE_SPEED,
                );
                if (transferredSpeed > 0) {
                  magnet.vx += collision.normalX * transferredSpeed;
                  magnet.vy += collision.normalY * transferredSpeed;
                  kickWobble(magnet, clamp(transferredSpeed * 0.055, -38, 38));
                } else if (correction > 0) {
                  kickWobble(magnet, clamp(correction * 0.35, -12, 12));
                }
              }
            } else if (pointer.active) {
              const dx = magnet.x + magnet.width / 2 - pointer.x;
              const dy = magnet.y + magnet.height / 2 - pointer.y;
              const distance = Math.hypot(dx, dy);
              if (distance > 0 && distance < 155) {
                const influence = (1 - distance / 155) ** 2;
                magnet.vx += (dx / distance) * influence * 24 * step;
                magnet.vy += (dy / distance) * influence * 24 * step;
                kickWobble(magnet, influence * 4 * step);
              }
            }

            magnet.vx += tilt.x * 72 * step;
            magnet.vy += tilt.y * 72 * step;
            const damping = Math.exp(-LINEAR_DRAG * step);
            magnet.vx *= damping;
            magnet.vy *= damping;
            magnet.x += magnet.vx * step;
            magnet.y += magnet.vy * step;

            const maxX = Math.max(board.clientWidth - magnet.width, 0);
            const maxY = Math.max(board.clientHeight - magnet.height, 0);
            if (magnet.x < 0 || magnet.x > maxX) {
              magnet.x = clamp(magnet.x, 0, maxX);
              magnet.vx *= -EDGE_RESTITUTION;
              kickWobble(magnet, Math.sign(magnet.vx || 1) * Math.min(Math.abs(magnet.vx) * 0.09, 35));
            }
            if (magnet.y < 0 || magnet.y > maxY) {
              magnet.y = clamp(magnet.y, 0, maxY);
              magnet.vy *= -EDGE_RESTITUTION;
              kickWobble(magnet, Math.sign(magnet.vy || 1) * Math.min(Math.abs(magnet.vy) * 0.09, 35));
            }
          }

          magnet.wobbleVelocity += -magnet.wobble * WOBBLE_SPRING * step;
          magnet.wobbleVelocity *= Math.exp(-WOBBLE_DAMPING * step);
          magnet.wobble += magnet.wobbleVelocity * step;
          if (Math.abs(magnet.wobble) < 0.02 && Math.abs(magnet.wobbleVelocity) < 0.08) {
            magnet.wobble = 0;
            magnet.wobbleVelocity = 0;
          }
        });

        const boardDiagonal = Math.hypot(board.clientWidth, board.clientHeight);
        dropWavesRef.current.forEach((wave) => {
          const waveAge = Math.max((time - wave.startedAt) / 1000, 0);
          const waveRadius = waveAge * DROP_WAVE_SPEED;
          magnets.forEach((magnet) => {
            if (magnet.dragging || magnet.id === wave.sourceId || wave.reached.has(magnet.id)) return;
            const dx = magnet.x + magnet.width / 2 - wave.x;
            const dy = magnet.y + magnet.height / 2 - wave.y;
            const distance = Math.max(Math.hypot(dx, dy), 0.001);
            if (distance > waveRadius) return;
            wave.reached.add(magnet.id);
            const falloff = 0.45 + 0.55 * (1 - clamp(distance / Math.max(boardDiagonal, 1), 0, 1));
            const impulse = DROP_WAVE_IMPULSE * wave.strength * falloff / magnet.mass;
            magnet.vx += (dx / distance) * impulse;
            magnet.vy += (dy / distance) * impulse;
            kickWobble(magnet, impulse * 0.7);
          });
        });
        dropWavesRef.current = dropWavesRef.current.filter((wave) =>
          time - wave.startedAt < ((boardDiagonal + 80) / DROP_WAVE_SPEED) * 1000,
        );

        for (let first = 0; first < magnets.length; first += 1) {
          const a = magnets[first]!;
          for (let second = first + 1; second < magnets.length; second += 1) {
            const b = magnets[second]!;
            const aCenterX = a.x + a.width / 2;
            const aCenterY = a.y + a.height / 2;
            const bCenterX = b.x + b.width / 2;
            const bCenterY = b.y + b.height / 2;
            const dx = bCenterX - aCenterX;
            const dy = bCenterY - aCenterY;
            const distance = Math.max(Math.hypot(dx, dy), 0.001);
            const involvesLiftedMagnet = a.dragging
              || b.dragging
              || a.id === liftedId
              || b.id === liftedId;

            if (involvesLiftedMagnet) {
              const lifted = a.dragging || a.id === liftedId ? a : b;
              const resting = lifted === a ? b : a;
              const liftedCenterX = lifted.x + lifted.width / 2;
              const liftedCenterY = lifted.y + lifted.height / 2;
              const restingCenterX = resting.x + resting.width / 2;
              const restingCenterY = resting.y + resting.height / 2;
              let clearX = restingCenterX - liftedCenterX;
              let clearY = restingCenterY - liftedCenterY;
              let clearDistance = Math.hypot(clearX, clearY);
              if (clearDistance < 0.001) {
                clearX = lifted.id < resting.id ? -1 : 1;
                clearY = 0;
                clearDistance = 1;
              }
              const reachX = (lifted.width + resting.width) / 2 + LIFTED_CLEARANCE;
              const reachY = (lifted.height + resting.height) / 2 + LIFTED_CLEARANCE;
              const scaledDistance = Math.hypot(clearX / Math.max(reachX, 1), clearY / Math.max(reachY, 1));
              if (scaledDistance < 1) {
                const influence = (1 - scaledDistance) ** 2;
                resting.vx += (clearX / clearDistance) * LIFTED_CLEARING_ACCELERATION * influence * step;
                resting.vy += (clearY / clearDistance) * LIFTED_CLEARING_ACCELERATION * influence * step;
                kickWobble(resting, influence * 2.2 * step);
              }
              continue;
            }

            // While a magnet is above the surface, resting magnets stay in a
            // viscous layer. Their tiny avoidance motion must not cascade
            // through a tightly packed row as a chain of hard contacts.
            if (hasLiftedMagnet) continue;

            const falloff = distance < SURFACE_RADIUS ? (1 - distance / SURFACE_RADIUS) ** 2 : 0;

            if (falloff > 0) {
              const aSpeed = Math.hypot(a.vx, a.vy);
              const bSpeed = Math.hypot(b.vx, b.vy);
              if (aSpeed > 45 && !b.dragging) {
                const transfer = falloff * SURFACE_COUPLING * step;
                b.vx += (a.vx + (dx / distance) * aSpeed * 0.2) * transfer;
                b.vy += (a.vy + (dy / distance) * aSpeed * 0.2) * transfer;
                kickWobble(b, aSpeed * falloff * 0.12 * step);
              }
              if (bSpeed > 45 && !a.dragging) {
                const transfer = falloff * SURFACE_COUPLING * step;
                a.vx += (b.vx - (dx / distance) * bSpeed * 0.2) * transfer;
                a.vy += (b.vy - (dy / distance) * bSpeed * 0.2) * transfer;
                kickWobble(a, -bSpeed * falloff * 0.12 * step);
              }
            }

            const collision = getAabbCollision(a, b);
            if (!collision) continue;
            const inverseMassA = a.dragging ? 0 : 1 / a.mass;
            const inverseMassB = b.dragging ? 0 : 1 / b.mass;
            const inverseMassTotal = inverseMassA + inverseMassB;
            if (inverseMassTotal === 0) continue;

            const correction = Math.max(collision.depth - 0.15, 0) * REST_CONTACT_CORRECTION;
            if (correction > 0) layoutChanged = true;
            a.x -= collision.normalX * correction * (inverseMassA / inverseMassTotal);
            a.y -= collision.normalY * correction * (inverseMassA / inverseMassTotal);
            b.x += collision.normalX * correction * (inverseMassB / inverseMassTotal);
            b.y += collision.normalY * correction * (inverseMassB / inverseMassTotal);

            const relativeNormalVelocity =
              (b.vx - a.vx) * collision.normalX +
              (b.vy - a.vy) * collision.normalY;
            if (relativeNormalVelocity >= 0) continue;
            const impulse = -(1 + COLLISION_RESTITUTION)
              * relativeNormalVelocity
              / inverseMassTotal;
            a.vx -= impulse * inverseMassA * collision.normalX;
            a.vy -= impulse * inverseMassA * collision.normalY;
            b.vx += impulse * inverseMassB * collision.normalX;
            b.vy += impulse * inverseMassB * collision.normalY;
            kickWobble(a, -Math.min(impulse * 0.08, 55));
            kickWobble(b, Math.min(impulse * 0.08, 55));

            if (impulse > 190 && time - lastCollisionRippleRef.current > 220) {
              lastCollisionRippleRef.current = time;
              emitRipple((aCenterX + bCenterX) / 2, (aCenterY + bCenterY) / 2, impulse / 700);
            }
          }
        }

        if (hasLiftedMagnet) {
          magnets.forEach((magnet) => {
            if (magnet.dragging || magnet.id === liftedId) return;
            const limited = limitVector(magnet.vx, magnet.vy, LIFTED_NEIGHBOR_MAX_SPEED);
            magnet.vx = limited.x;
            magnet.vy = limited.y;
          });
        }
      }

      let isMoving = false;
      magnets.forEach((magnet) => {
        const speed = Math.hypot(magnet.vx, magnet.vy);
        if (!magnet.dragging && speed < 1.25) {
          magnet.vx = 0;
          magnet.vy = 0;
        }
        applyPosition(magnet);
        if (magnet.dragging
          || Math.hypot(magnet.vx, magnet.vy) > 3
          || Math.abs(magnet.wobble) > 0.05) {
          isMoving = true;
        }
      });

      if (layoutChanged) {
        motionDirtyRef.current = true;
        settledSinceRef.current = 0;
      }

      if (isMoving) {
        motionDirtyRef.current = true;
        settledSinceRef.current = 0;
      } else if (motionDirtyRef.current) {
        if (!settledSinceRef.current) settledSinceRef.current = time;
        if (time - settledSinceRef.current > 320) {
          motionDirtyRef.current = false;
          settledSinceRef.current = 0;
          persist();
        }
      }

      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      persist();
    };
  }, [emitRipple, persist, playMode]);

  useEffect(() => {
    const saveBeforeLeaving = () => persist();
    const saveBeforeViewportRelayout = () => {
      if (lastLayoutWidthRef.current <= 0 || lastLayoutHeightRef.current <= 0) return;
      persist(lastLayoutWidthRef.current, lastLayoutHeightRef.current);
    };
    const saveWhenHidden = () => {
      if (document.visibilityState === 'hidden') persist();
    };
    window.addEventListener('pagehide', saveBeforeLeaving);
    window.addEventListener('resize', saveBeforeViewportRelayout);
    document.addEventListener('visibilitychange', saveWhenHidden);
    return () => {
      window.removeEventListener('pagehide', saveBeforeLeaving);
      window.removeEventListener('resize', saveBeforeViewportRelayout);
      document.removeEventListener('visibilitychange', saveWhenHidden);
    };
  }, [persist]);

  const completeDrag = useCallback((pointerId: number, cancelled = false) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== pointerId) return;
    const magnet = magnetsRef.current.get(drag.id);
    if (magnet) {
      magnet.dragging = false;
      if (drag.moved && !cancelled) {
        const releaseDelay = Math.max((performance.now() - drag.lastTime) / 1000, 0);
        const releaseDecay = Math.exp(-releaseDelay * 9);
        const release = limitVector(
          drag.releaseVx * releaseDecay * RELEASE_VELOCITY_SCALE,
          drag.releaseVy * releaseDecay * RELEASE_VELOCITY_SCALE,
          MAX_RELEASE_SPEED,
        );
        magnet.vx = Math.abs(release.x) < RELEASE_DEAD_ZONE ? 0 : release.x;
        magnet.vy = Math.abs(release.y) < RELEASE_DEAD_ZONE ? 0 : release.y;
        const speed = Math.hypot(magnet.vx, magnet.vy);
        kickWobble(magnet, clamp((magnet.vy - magnet.vx * 0.2) * 0.024, -34, 34));
        const centerX = magnet.x + magnet.width / 2;
        const centerY = magnet.y + magnet.height / 2;
        dropWavesRef.current.push({
          sourceId: magnet.id,
          x: centerX,
          y: centerY,
          startedAt: performance.now(),
          strength: 0.65 + (speed / MAX_RELEASE_SPEED) * 0.55,
          reached: new Set([magnet.id]),
        });
        emitRipple(
          centerX,
          centerY,
          0.2 + (speed / MAX_RELEASE_SPEED) * 0.34,
        );
        motionDirtyRef.current = true;
      } else if (cancelled) {
        magnet.vx = 0;
        magnet.vy = 0;
        motionDirtyRef.current = true;
      }
    }
    if (drag.moved) {
      suppressClickUntilRef.current.set(drag.id, performance.now() + CLICK_SUPPRESSION_MS);
    }
    delete drag.element.dataset.dragging;
    delete drag.element.dataset.pickedUp;
    if (boardRef.current) delete boardRef.current.dataset.dragging;
    dragRef.current = null;
    try {
      if (drag.element.hasPointerCapture(pointerId)) {
        drag.element.releasePointerCapture(pointerId);
      }
    } catch {
      // Pointer capture can already be gone after a browser gesture cancel.
    }
    persist();
  }, [emitRipple, persist]);

  const updatePointerField = useCallback((
    board: HTMLDivElement,
    clientX: number,
    clientY: number,
    pressed: boolean,
  ) => {
    const point = boardPointFromClient(board, clientX, clientY);
    const previous = pointerFieldRef.current;
    const now = performance.now();
    const elapsed = clamp((now - previous.lastTime) / 1000, 1 / 240, 0.08);
    const velocity = previous.active
      ? limitVector(
          (point.x - previous.x) / elapsed,
          (point.y - previous.y) / elapsed,
          MAX_POINTER_SPEED,
        )
      : { x: 0, y: 0 };
    pointerFieldRef.current = {
      active: true,
      pressed,
      x: point.x,
      y: point.y,
      vx: velocity.x,
      vy: velocity.y,
      lastTime: now,
    };
  }, []);

  const completeSurfaceGesture = useCallback((pointerId: number) => {
    const gesture = surfaceGestureRef.current;
    if (!gesture || gesture.pointerId !== pointerId) return;
    if (gesture.holdTimer !== null) window.clearTimeout(gesture.holdTimer);
    const board = boardRef.current;
    if (board) {
      delete board.dataset.pushing;
      try {
        if (board.hasPointerCapture(pointerId)) {
          board.releasePointerCapture(pointerId);
        }
      } catch {
        // Capture can already be released by a browser scroll/cancel gesture.
      }
    }
    pointerFieldRef.current = {
      ...pointerFieldRef.current,
      active: false,
      pressed: false,
      vx: 0,
      vy: 0,
      lastTime: performance.now(),
    };
    surfaceGestureRef.current = null;
  }, []);

  useEffect(() => {
    if (!playMode) return;
    const handlePointerEnd = (event: PointerEvent) => {
      completeDrag(event.pointerId, event.type === 'pointercancel');
      completeSurfaceGesture(event.pointerId);
    };
    const handleBlur = () => {
      const drag = dragRef.current;
      if (drag) completeDrag(drag.pointerId, true);
      const surfaceGesture = surfaceGestureRef.current;
      if (surfaceGesture) completeSurfaceGesture(surfaceGesture.pointerId);
    };
    window.addEventListener('pointerup', handlePointerEnd, true);
    window.addEventListener('pointercancel', handlePointerEnd, true);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('pointerup', handlePointerEnd, true);
      window.removeEventListener('pointercancel', handlePointerEnd, true);
      window.removeEventListener('blur', handleBlur);
    };
  }, [completeDrag, completeSurfaceGesture, playMode]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board || !playMode) return;

    const keepInteractiveTouchGesture = (event: TouchEvent) => {
      if ((dragRef.current || surfaceGestureRef.current?.active) && event.cancelable) {
        event.preventDefault();
      }
    };

    board.addEventListener('touchmove', keepInteractiveTouchGesture, { passive: false });
    return () => {
      board.removeEventListener('touchmove', keepInteractiveTouchGesture);
    };
  }, [playMode]);

  const handlePointerDown = (event: ReactPointerEvent<MagnetElement>, id: string) => {
    if (!playMode || !event.isPrimary || event.button !== 0 || dragRef.current) return;
    const magnet = magnetsRef.current.get(id);
    const board = boardRef.current;
    if (!magnet || !board) return;
    const now = performance.now();
    const boardRect = board.getBoundingClientRect();
    const pointerScale = {
      x: boardRect.width > 0 ? board.offsetWidth / boardRect.width : 1,
      y: boardRect.height > 0 ? board.offsetHeight / boardRect.height : 1,
    };
    magnet.dragging = true;
    magnet.vx = 0;
    magnet.vy = 0;
    event.currentTarget.dataset.pickedUp = 'true';
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      element: event.currentTarget,
      // iOS Safari can report page coordinates inconsistently after pointer
      // capture on a deeply scrolled document. Client coordinates stay in one
      // viewport coordinate space and therefore cannot accumulate scrollY.
      startPointer: { x: event.clientX, y: event.clientY },
      lastPointer: { x: event.clientX, y: event.clientY },
      lastTime: now,
      releaseVx: 0,
      releaseVy: 0,
      origin: { x: magnet.x, y: magnet.y },
      pointerScale,
      moved: false,
    };
    if (event.pointerType !== 'touch') {
      event.currentTarget.focus({ preventScroll: true });
    }
    if (event.pointerType !== 'mouse' && event.cancelable) event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Window-level pointer cleanup still completes the drag if capture is unavailable.
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<MagnetElement>) => {
    const drag = dragRef.current;
    const board = boardRef.current;
    if (!playMode || !drag || drag.pointerId !== event.pointerId || !board) return;
    if (event.pointerType === 'mouse' && event.buttons === 0) {
      completeDrag(event.pointerId);
      return;
    }
    const magnet = magnetsRef.current.get(drag.id);
    if (!magnet) return;
    magnet.dragging = true;
    const distance = Math.hypot(
      event.clientX - drag.startPointer.x,
      event.clientY - drag.startPointer.y,
    );
    if (!drag.moved && distance < DRAG_THRESHOLD) return;
    if (!drag.moved) {
      drag.moved = true;
      drag.element.dataset.dragging = 'true';
      board.dataset.dragging = 'true';
    }
    if (event.cancelable) event.preventDefault();
    const delta = {
      x: (event.clientX - drag.startPointer.x) * drag.pointerScale.x,
      y: (event.clientY - drag.startPointer.y) * drag.pointerScale.y,
    };
    const nextX = clamp(drag.origin.x + delta.x, 0, board.clientWidth - magnet.width);
    const nextY = clamp(drag.origin.y + delta.y, 0, board.clientHeight - magnet.height);
    const now = performance.now();
    const elapsed = clamp((now - drag.lastTime) / 1000, 1 / 240, 0.08);
    const frameDelta = {
      x: (event.clientX - drag.lastPointer.x) * drag.pointerScale.x,
      y: (event.clientY - drag.lastPointer.y) * drag.pointerScale.y,
    };
    const pointerVelocity = limitVector(
      frameDelta.x / elapsed,
      frameDelta.y / elapsed,
      MAX_POINTER_SPEED,
    );
    drag.releaseVx = drag.releaseVx * 0.38 + pointerVelocity.x * 0.62;
    drag.releaseVy = drag.releaseVy * 0.38 + pointerVelocity.y * 0.62;
    drag.lastPointer = { x: event.clientX, y: event.clientY };
    drag.lastTime = now;
    magnet.x = nextX;
    magnet.y = nextY;
    magnet.vx = drag.releaseVx;
    magnet.vy = drag.releaseVy;
    kickWobble(magnet, clamp((pointerVelocity.y - pointerVelocity.x * 0.25) * 0.025, -28, 28));
    motionDirtyRef.current = true;
    applyPosition(magnet);
  };

  const finishDrag = (event: ReactPointerEvent<MagnetElement>) => {
    completeDrag(event.pointerId, event.type === 'pointercancel');
  };

  const handleClick = (event: ReactMouseEvent<MagnetElement>, id: string) => {
    const suppressUntil = suppressClickUntilRef.current.get(id) ?? 0;
    if (performance.now() < suppressUntil) {
      event.preventDefault();
      suppressClickUntilRef.current.delete(id);
    }
  };

  const handleBoardPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!playMode
      || !event.isPrimary
      || event.button !== 0
      || dragRef.current
      || surfaceGestureRef.current
      || event.target !== event.currentTarget) return;

    const board = event.currentTarget;
    const gesture: SurfaceGesture = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startPointer: { x: event.clientX, y: event.clientY },
      lastPointer: { x: event.clientX, y: event.clientY },
      active: event.pointerType !== 'touch',
      holdTimer: null,
    };
    surfaceGestureRef.current = gesture;

    const activate = () => {
      const current = surfaceGestureRef.current;
      if (!current || current.pointerId !== gesture.pointerId || current.active) return;
      current.active = true;
      current.holdTimer = null;
      updatePointerField(board, current.lastPointer.x, current.lastPointer.y, true);
      board.dataset.pushing = 'true';
      try {
        board.setPointerCapture(current.pointerId);
      } catch {
        // Window cleanup still ends the gesture if capture is unavailable.
      }
    };

    if (gesture.active) {
      updatePointerField(board, event.clientX, event.clientY, true);
      board.dataset.pushing = 'true';
      if (event.cancelable) event.preventDefault();
      try {
        board.setPointerCapture(event.pointerId);
      } catch {
        // Window cleanup still ends the gesture if capture is unavailable.
      }
      return;
    }

    gesture.holdTimer = window.setTimeout(activate, TOUCH_PUSH_HOLD_MS);
  };

  const handleBoardPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!playMode || dragRef.current) return;
    const gesture = surfaceGestureRef.current;
    if (gesture && gesture.pointerId === event.pointerId) {
      gesture.lastPointer = { x: event.clientX, y: event.clientY };
      if (!gesture.active) {
        const distance = Math.hypot(
          event.clientX - gesture.startPointer.x,
          event.clientY - gesture.startPointer.y,
        );
        if (distance >= TOUCH_PUSH_CANCEL_DISTANCE) {
          if (gesture.holdTimer !== null) window.clearTimeout(gesture.holdTimer);
          pointerFieldRef.current.active = false;
          pointerFieldRef.current.pressed = false;
          surfaceGestureRef.current = null;
        }
        return;
      }

      if (event.pointerType === 'mouse' && event.buttons === 0) {
        completeSurfaceGesture(event.pointerId);
        return;
      }
      updatePointerField(event.currentTarget, event.clientX, event.clientY, true);
      if (event.cancelable) event.preventDefault();
      return;
    }

    if (event.pointerType !== 'mouse' || event.buttons !== 0) return;
    updatePointerField(event.currentTarget, event.clientX, event.clientY, false);
  };

  const handleBoardPointerLeave = () => {
    if (surfaceGestureRef.current) return;
    pointerFieldRef.current.active = false;
    pointerFieldRef.current.pressed = false;
    pointerFieldRef.current.vx = 0;
    pointerFieldRef.current.vy = 0;
  };

  const handlePlayModeChange = (nextPlayMode: boolean) => {
    if (variant === 'nav' && playMode && !nextPlayMode) {
      const visibleOrder = orderMagnetsByVisualRows(
        [...magnetsRef.current.values()],
      ).map((magnet) => magnet.id);
      navOrderRef.current = mergeVisibleMagnetOrder(navOrderRef.current, visibleOrder);
      persist();
    }
    onPlayModeChange(nextPlayMode);
  };

  return (
    <div
      ref={boardRef}
      className={`${styles.board} ${styles[variant]} ${playMode ? styles.playMode : ''} ${className}`}
      style={{ visibility: layoutReady ? 'visible' : 'hidden' }}
      aria-label={ariaLabel}
      aria-busy={!layoutReady}
      data-ready={layoutReady ? 'true' : undefined}
      data-active={playMode ? 'true' : 'false'}
      onPointerDown={handleBoardPointerDown}
      onPointerMove={handleBoardPointerMove}
      onPointerLeave={handleBoardPointerLeave}
    >
      <span ref={surfaceRef} className={styles.surface} aria-hidden="true" />
      <PhysicsToggle
        checked={playMode}
        onChange={handlePlayModeChange}
        className={styles.boardToggle}
      />
      {items.map((item) => {
        const customProperties = {
          '--magnet-tilt': `${getMagnetTilt(item.id)}deg`,
          ...(item.iconUrl ? { '--magnet-icon': `url("${item.iconUrl}")` } : {}),
        } as CSSProperties;
        const classes = [
          styles.magnet,
          styles[item.tone ?? 'lavender'],
          styles[item.kind ?? 'default'],
          item.active ? styles.active : '',
        ].filter(Boolean).join(' ');
        const content = (
          <>
            {item.icon ? <span className={styles.icon} aria-hidden="true">{item.icon}</span> : null}
            <span className={styles.label}>{item.label}</span>
            {typeof item.count === 'number' ? <span className={styles.count}>{item.count}</span> : null}
          </>
        );
        const shared = {
          className: classes,
          style: customProperties,
          'data-magnet-id': item.id,
          'aria-label': item.ariaLabel,
          'aria-current': item.active ? ('page' as const) : undefined,
          'aria-expanded': item.ariaExpanded,
          'aria-haspopup': item.ariaHasPopup,
          'aria-controls': item.ariaControls,
          draggable: false,
          ref: (element: MagnetElement | null) => {
            if (element) elementsRef.current.set(item.id, element);
            else elementsRef.current.delete(item.id);
          },
          onPointerDown: (event: ReactPointerEvent<MagnetElement>) => handlePointerDown(event, item.id),
          onPointerMove: handlePointerMove,
          onPointerUp: finishDrag,
          onPointerCancel: finishDrag,
          onLostPointerCapture: finishDrag,
          onDragStart: (event: ReactDragEvent<MagnetElement>) => event.preventDefault(),
          onClick: (event: ReactMouseEvent<MagnetElement>) => handleClick(event, item.id),
        };

        if (item.to) {
          return <Link key={item.id} to={item.to} {...shared}>{content}</Link>;
        }
        return (
          <button
            key={item.id}
            type="button"
            {...shared}
            onClick={(event) => {
              handleClick(event, item.id);
              if (!event.defaultPrevented) item.onActivate?.();
            }}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
