import { useRef } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router';

import { getMagnetTilt } from './magnetMath';
import styles from './MagnetBoard.module.css';

export type MagnetTone = 'rose' | 'mint' | 'gold' | 'sky' | 'lavender' | 'peach';

export type MagnetBoardItem = {
  id: string;
  label: string;
  to: string;
  tone?: MagnetTone;
};

type Point = { x: number; y: number };

type DragState = {
  id: string;
  pointerId: number;
  element: HTMLAnchorElement;
  startPointer: Point;
  startPosition: Point;
  moved: boolean;
};

type MagnetBoardProps = {
  items: MagnetBoardItem[];
  playMode: boolean;
  ariaLabel?: string;
};

const DRAG_THRESHOLD = 5;
const BOARD_EDGE_GAP = 8;
const CLICK_SUPPRESSION_MS = 320;

function clamp(value: number, min: number, max: number) {
  if (min > max) return 0;
  return Math.min(max, Math.max(min, value));
}

function applyPosition(element: HTMLElement, point: Point) {
  element.style.setProperty('--magnet-x', `${point.x}px`);
  element.style.setProperty('--magnet-y', `${point.y}px`);
}

export function MagnetBoard({ items, playMode, ariaLabel = 'Magnet board' }: MagnetBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const positionsRef = useRef(new Map<string, Point>());
  const dragRef = useRef<DragState | null>(null);
  const pendingFrameRef = useRef<number | null>(null);
  const pendingPositionRef = useRef<{ element: HTMLElement; point: Point } | null>(null);
  const suppressClickUntilRef = useRef(new Map<string, number>());

  const queuePosition = (element: HTMLElement, point: Point) => {
    pendingPositionRef.current = { element, point };
    if (pendingFrameRef.current !== null) return;

    pendingFrameRef.current = window.requestAnimationFrame(() => {
      pendingFrameRef.current = null;
      const pending = pendingPositionRef.current;
      pendingPositionRef.current = null;
      if (pending) applyPosition(pending.element, pending.point);
    });
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLAnchorElement>, id: string) => {
    if (!playMode || event.button !== 0) return;

    const startPosition = positionsRef.current.get(id) ?? { x: 0, y: 0 };
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      element: event.currentTarget,
      startPointer: { x: event.clientX, y: event.clientY },
      startPosition,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    const drag = dragRef.current;
    const board = boardRef.current;
    if (!playMode || !drag || drag.pointerId !== event.pointerId || !board) return;

    const deltaX = event.clientX - drag.startPointer.x;
    const deltaY = event.clientY - drag.startPointer.y;

    if (!drag.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) return;
    if (!drag.moved) {
      drag.moved = true;
      drag.element.dataset.dragging = 'true';
    }

    event.preventDefault();

    const minX = BOARD_EDGE_GAP - drag.element.offsetLeft;
    const maxX = board.clientWidth - drag.element.offsetLeft - drag.element.offsetWidth - BOARD_EDGE_GAP;
    const minY = BOARD_EDGE_GAP - drag.element.offsetTop;
    const maxY = board.clientHeight - drag.element.offsetTop - drag.element.offsetHeight - BOARD_EDGE_GAP;

    const nextPosition = {
      x: clamp(drag.startPosition.x + deltaX, minX, maxX),
      y: clamp(drag.startPosition.y + deltaY, minY, maxY),
    };

    positionsRef.current.set(drag.id, nextPosition);
    queuePosition(drag.element, nextPosition);
  };

  const finishDrag = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (pendingFrameRef.current !== null) {
      window.cancelAnimationFrame(pendingFrameRef.current);
      pendingFrameRef.current = null;
    }
    const pending = pendingPositionRef.current;
    pendingPositionRef.current = null;
    if (pending) applyPosition(pending.element, pending.point);

    if (drag.moved) {
      suppressClickUntilRef.current.set(drag.id, performance.now() + CLICK_SUPPRESSION_MS);
    }

    delete drag.element.dataset.dragging;
    if (drag.element.hasPointerCapture(event.pointerId)) {
      drag.element.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  };

  const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>, id: string) => {
    const suppressUntil = suppressClickUntilRef.current.get(id) ?? 0;
    if (performance.now() < suppressUntil) {
      event.preventDefault();
      suppressClickUntilRef.current.delete(id);
    }
  };

  return (
    <div
      ref={boardRef}
      className={`${styles.board} ${playMode ? styles.playMode : ''}`}
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const style = {
          '--magnet-tilt': `${getMagnetTilt(item.id)}deg`,
        } as CSSProperties;

        return (
          <Link
            key={item.id}
            to={item.to}
            className={`${styles.magnet} ${styles[item.tone ?? 'lavender']}`}
            style={style}
            data-magnet-id={item.id}
            onPointerDown={(event) => handlePointerDown(event, item.id)}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onClick={(event) => handleClick(event, item.id)}
          >
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
