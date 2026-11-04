import { useEffect, useRef, useState } from "react";

const OPTIONS = [
  ["due_asc", "Hạn gần nhất"],
  ["due_desc", "Hạn xa nhất"],
  ["newest", "Mới tạo"],
];

export default function SortSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (!ref.current?.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="inline-flex h-11 items-center gap-1 rounded-control border border-line bg-surface px-3 text-sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        Sắp xếp <span aria-hidden="true">▾</span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 min-w-44 rounded-card border border-line bg-surface p-1 shadow-overlay"
        >
          {OPTIONS.map(([id, label]) => {
            const selected = value === id;
            return (
              <button
                key={id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                className={`flex h-11 w-full items-center rounded-control px-3 text-left text-sm ${
                  selected ? "bg-doing-bg font-medium text-primary" : "text-ink"
                }`}
                onClick={() => {
                  onChange(id);
                  setOpen(false);
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
