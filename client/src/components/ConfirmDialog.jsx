import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  busy,
  onConfirm,
  onClose,
}) {
  const cancelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);
  onCloseRef.current = onClose;
  busyRef.current = busy;

  useEffect(() => {
    if (!open) return undefined;
    cancelRef.current?.focus();
    function onKey(event) {
      if (event.key === "Escape" && !busyRef.current) onCloseRef.current();
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        aria-busy={busy || undefined}
        className="w-full max-w-[400px] rounded-card bg-surface p-6 shadow-overlay"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="confirm-title" className="text-base font-medium">
            {title}
          </h2>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center disabled:opacity-60"
            aria-label="Đóng"
            disabled={busy}
            onClick={() => {
              if (!busy) onClose();
            }}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <p id="confirm-body" className="mt-2 text-sm text-muted">
          {body}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-control border border-line bg-surface px-4 disabled:opacity-60"
            disabled={busy}
            onClick={() => {
              if (!busy) onClose();
            }}
          >
            Hủy
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-control bg-danger px-4 text-white transition-colors duration-200 disabled:opacity-60"
            disabled={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
