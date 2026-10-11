import { useId } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useDialogFocus } from '../../app/useDialogFocus';
import styles from './OverlayShell.module.css';

type OverlayShellProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
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
        {variant === 'sheet' ? <div className={styles.handle} aria-hidden="true" /> : null}
        <header className={styles.header}>
          <h2 id={headingId}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label={closeLabel} {...(closeInitialFocus ? { 'data-dialog-initial-focus': true } : {})}>×</button>
        </header>
        <div className={`${styles.body} ${bodyClassName}`.trim()} data-overlay-body>{children}</div>
      </section>
    </div>,
    document.body,
  );
}
