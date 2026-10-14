import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const focusableSelector = [
  '[data-dialog-initial-focus]',
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const modalDialogs: HTMLElement[] = [];
let bodyOverflowBeforeModals = '';

type DialogFocusOptions = {
  open: boolean;
  onClose: () => void;
  modal?: boolean;
};

function focusableElements(container: HTMLElement) {
  const closedDisclosures = [...container.querySelectorAll('details:not([open])')]
    .map((details) => ({ details, summary: details.querySelector(':scope > summary') }));
  return [...container.querySelectorAll<HTMLElement>(focusableSelector)]
    .filter((element) => !element.hidden
      && element.getAttribute('aria-hidden') !== 'true'
      && element.tabIndex >= 0
      && !closedDisclosures.some(({ details, summary }) => details.contains(element) && !summary?.contains(element))
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
    if (modal) {
      if (!modalDialogs.length) bodyOverflowBeforeModals = document.body.style.overflow;
      modalDialogs.push(dialog);
    }
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousBodyOverflow = document.body.style.overflow;
    if (modal) document.body.style.overflow = 'hidden';

    const focusFrame = window.requestAnimationFrame(() => {
      if (modal && modalDialogs.at(-1) !== dialog) return;
      const initial = dialog.querySelector<HTMLElement>('[data-dialog-initial-focus]')
        ?? focusableElements(dialog)[0]
        ?? dialog;
      initial.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (modal && modalDialogs.at(-1) !== dialog) return;
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
      const modalIndex = modalDialogs.indexOf(dialog);
      if (modalIndex >= 0) modalDialogs.splice(modalIndex, 1);
      document.removeEventListener('keydown', handleKeyDown, true);
      if (modal) document.body.style.overflow = modalDialogs.length ? 'hidden' : bodyOverflowBeforeModals;
      else document.body.style.overflow = previousBodyOverflow;
      if (previousFocus?.isConnected) {
        window.requestAnimationFrame(() => {
          const active = modalDialogs.at(-1);
          if (!active || active.contains(previousFocus)) previousFocus.focus({ preventScroll: true });
        });
      }
    };
  }, [modal, open]);

  return dialogRef;
}
