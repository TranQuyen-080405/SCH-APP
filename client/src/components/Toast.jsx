import { useEffect } from "react";
import { X } from "lucide-react";

export default function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed top-4 left-1/2 z-50 flex w-[min(100%-2rem,24rem)] -translate-x-1/2 items-start justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3 text-sm shadow-overlay"
    >
      <p>{message}</p>
      <button
        type="button"
        className="flex h-11 w-11 shrink-0 items-center justify-center"
        aria-label="Đóng"
        onClick={onDone}
      >
        <X size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
