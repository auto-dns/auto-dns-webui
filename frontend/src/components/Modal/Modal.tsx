import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './Modal.module.scss';

interface ModalProps {
  onClose: () => void;
  // id of the element that labels the dialog (for aria-labelledby)
  labelledBy?: string;
  children: ReactNode;
}

// A lightweight accessible dialog: rendered into a portal, closes on Escape or
// backdrop click, locks body scroll while open, and moves focus into itself so
// keyboard users land inside the dialog. Mount it conditionally from the parent
// (`{active && <Modal .../>}`) — it assumes it is only present while open.
export default function Modal({ onClose, labelledBy, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  // Keep the latest onClose in a ref so the effect can run once (on mount) and
  // not tear down / re-steal focus when the parent re-renders with a new inline
  // onClose (e.g. on a background data refresh while the modal is open).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const close = () => onCloseRef.current();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      // Trap Tab focus within the dialog so keyboard users can't tab out into
      // the inert background content behind the modal.
      if (e.key === 'Tab') {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        const inDialog = active instanceof Node && dialog.contains(active);

        if (e.shiftKey) {
          // Backward from the first focusable (or the container) wraps to last.
          if (!inDialog || active === first || active === dialog) {
            e.preventDefault();
            (last ?? dialog).focus();
          }
        } else {
          // Forward from the last focusable (or the container, which is where
          // focus lands on open and sits last in the portal DOM) wraps to first.
          if (!inDialog || active === last || active === dialog) {
            e.preventDefault();
            (first ?? dialog).focus();
          }
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);

    // Lock background scroll while the dialog is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Remember what had focus so we can restore it on close, then focus the
    // dialog itself.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
