import { useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useDialogFocus } from '../../app/useDialogFocus';
import { shouldDismissSheet } from './sheetGesture';
import styles from './OverlayShell.module.css';

type OverlayShellProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  variant?: 'dialog' | 'alert' | 'sheet' | 'fullscreen';
  titleId?: string;
  id?: string;
  wide?: boolean;
  closeLabel?: string;
  closeInitialFocus?: boolean;
  bodyClassName?: string;
  dialogRole?: 'dialog' | 'alertdialog';
};

export function OverlayShell({
  open,
  title,
  onClose,
  children,
  footer,
  variant = 'dialog',
  titleId,
  id,
  wide = false,
  closeLabel = `Close ${title}`,
  closeInitialFocus = false,
  bodyClassName = '',
  dialogRole = 'dialog',
}: OverlayShellProps) {
  const generatedId = useId();
  const headingId = titleId ?? `overlay-title-${generatedId}`;
  const dialogRef = useDialogFocus<HTMLElement>({ open, onClose });
  const drag = useRef<{ pointer: number; x: number; y: number; lastY: number; time: number; velocity: number } | null>(null);
  const resetDrag = () => {
    drag.current = null;
    dialogRef.current?.style.removeProperty('--sheet-drag-y');
    dialogRef.current?.removeAttribute('data-sheet-dragging');
  };
  if (!open) return null;

  return createPortal(
    <div className={`${styles.backdrop} ${styles[`${variant}Backdrop`]}`} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        ref={dialogRef}
        id={id}
        className={`${styles.panel} ${styles[variant]} ${wide ? styles.wide : ''}`}
        role={dialogRole}
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
      >
        <div className={styles.chrome} data-sheet-chrome={variant === 'sheet' ? '' : undefined}
          onPointerDown={(event) => {
            if (variant !== 'sheet' || !event.isPrimary || event.button !== 0
              || !window.matchMedia('(max-width: 719px)').matches
              || (event.target as Element).closest('button, a, input, select, textarea, summary')) return;
            drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, lastY: event.clientY, time: event.timeStamp, velocity: 0 };
            event.currentTarget.setPointerCapture(event.pointerId);
            dialogRef.current?.setAttribute('data-sheet-dragging', 'true');
          }}
          onPointerMove={(event) => {
            const current = drag.current;
            if (!current || current.pointer !== event.pointerId) return;
            current.velocity = (event.clientY - current.lastY) / Math.max(1, event.timeStamp - current.time);
            current.lastY = event.clientY;
            current.time = event.timeStamp;
            dialogRef.current?.style.setProperty('--sheet-drag-y', `${Math.max(0, event.clientY - current.y)}px`);
          }}
          onPointerUp={(event) => {
            const current = drag.current;
            if (!current || current.pointer !== event.pointerId) return;
            const velocity = event.timeStamp - current.time <= 100 ? current.velocity : 0;
            const dismiss = shouldDismissSheet(event.clientY - current.y, event.clientX - current.x, velocity);
            resetDrag();
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
            if (dismiss) onClose();
          }}
          onPointerCancel={resetDrag}
          onLostPointerCapture={resetDrag}
        >
          {variant === 'sheet' ? <div className={styles.handle} aria-hidden="true" /> : null}
          <header className={styles.header}>
            <h2 id={headingId}>{title}</h2>
            <button type="button" className={styles.close} onClick={onClose} aria-label={closeLabel} {...(closeInitialFocus ? { 'data-dialog-initial-focus': true } : {})}>×</button>
          </header>
        </div>
        <div className={`${styles.body} ${bodyClassName}`.trim()} data-overlay-body>{children}</div>
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </section>
    </div>,
    document.body,
  );
}
