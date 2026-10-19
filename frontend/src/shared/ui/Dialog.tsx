import { useEffect, useRef, type ReactNode } from 'react';

import { Button } from './Button';

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Modal on top of the native <dialog>: focus trap, Esc and backdrop click close it. */
export function Dialog({ open, title, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-card bg-surface p-0 text-ink shadow-card backdrop:bg-espresso/40 backdrop:backdrop-blur-[2px]"
    >
      {open && (
        <div className="p-6">
          <header className="mb-5 flex items-start justify-between gap-4">
            <h2 id="dialog-title" className="text-xl font-bold">
              {title}
            </h2>
            <Button
              variant="ghost"
              className="-mt-2 -mr-2 h-9 px-3"
              onClick={onClose}
              aria-label="Закрыть"
            >
              ✕
            </Button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}
