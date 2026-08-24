import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const focusableSelector = [
  '[data-dialog-initial-focus]',
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

type DialogFocusOptions = {
  open: boolean;
  onClose: () => void;
  modal?: boolean;
};

function focusableElements(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>(focusableSelector)]
    .filter((element) => !element.hidden
      && element.getAttribute('aria-hidden') !== 'true'
      && element.getClientRects().length > 0);
}

export function useDialogFocus<T extends HTMLElement>({
  open,
  onClose,
  modal = true,
}: DialogFocusOptions): RefObject<T | null> {
  const dialogRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open || !dialogRef.current) return undefined;

    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousBodyOverflow = document.body.style.overflow;
    if (modal) document.body.style.overflow = 'hidden';

    const focusFrame = window.requestAnimationFrame(() => {
      const initial = dialog.querySelector<HTMLElement>('[data-dialog-initial-focus]')
        ?? focusableElements(dialog)[0]
        ?? dialog;
      initial.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (!modal || event.key !== 'Tab') return;

      const focusable = focusableElements(dialog);
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0]!;
      const last = focusable.at(-1)!;
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown, true);
      if (modal) document.body.style.overflow = previousBodyOverflow;
      if (previousFocus?.isConnected) {
        window.requestAnimationFrame(() => previousFocus.focus({ preventScroll: true }));
      }
    };
  }, [modal, open]);

  return dialogRef;
}
