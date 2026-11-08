import { useEffect, useRef, useState } from "react";
import { GripVertical, MoreHorizontal, X } from "lucide-react";
import { formatDay } from "../dates.js";
import { NOTE_HEIGHT } from "../noteLayout.js";
export default function NoteCard({
  card,
  position,
  active,
  pending,
  onEdit,
  onDelete,
  onFront,
  onStart,
  onMove,
  onEnd,
  onCancel,
  onNudge,
  floating = false,
  onReturn,
}) {
  const { note } = card;
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    function close(event) {
      if (
        event.type === "keydown"
          ? event.key === "Escape"
          : !menuRef.current?.contains(event.target)
      )
        setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <article
      aria-label={note.title || "Ghi chú không có tiêu đề"}
      data-note-id={note.id}
      data-note-color={note.color ?? note.id % 4}
      data-floating={floating || undefined}
      className={`sticky-note pointer-events-auto flex min-w-0 flex-col ${floating ? "fixed" : "absolute"}`}
      style={{
        left: position.x,
        top: position.y,
        width: card.width,
        height: card.height || NOTE_HEIGHT,
        zIndex: floating ? (active ? 41 : 40) : active ? 10 : 0,
      }}
      onPointerDownCapture={onFront}
      onFocusCapture={onFront}
    >
      <div className="sticky-note-bar flex min-h-11 items-center">
        <button
          type="button"
          disabled={pending}
          aria-label={`Di chuyển ghi chú: ${note.title || "Không có tiêu đề"}`}
          aria-describedby="note-move-help"
          title="Kéo để di chuyển; dùng phím mũi tên"
          className="flex min-h-11 min-w-0 flex-1 touch-none items-center gap-2 px-3 text-left select-none enabled:cursor-grab active:cursor-grabbing disabled:opacity-50"
          onPointerDown={(event) => onStart(event, card)}
          onPointerMove={onMove}
          onPointerUp={onEnd}
          onPointerCancel={onCancel}
          onLostPointerCapture={onCancel}
          onKeyDown={(event) => {
            if (event.key === "Escape") onCancel();
            const delta = {
              ArrowLeft: [-1, 0],
              ArrowRight: [1, 0],
              ArrowUp: [0, -1],
              ArrowDown: [0, 1],
            }[event.key];
            if (!delta) return;
            event.preventDefault();
            if (!pending)
              onNudge(
                card,
                delta,
                event.shiftKey ? 50 : 10,
                event.currentTarget.closest("article").getBoundingClientRect(),
              );
          }}
        >
          <GripVertical
            size={16}
            className="shrink-0 text-ink/50"
            aria-hidden="true"
          />
          <time
            dateTime={note.notedOn || undefined}
            className="truncate text-[12px] text-ink/65"
          >
            {note.notedOn ? formatDay(note.notedOn) : "Chưa có ngày"}
          </time>
        </button>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            disabled={pending}
            aria-label="Mở menu ghi chú"
            aria-haspopup="menu"
            aria-expanded={open}
            className="grid size-11 place-items-center rounded-control text-ink/65 hover:bg-ink/5"
            onClick={() => setOpen((value) => !value)}
          >
            <MoreHorizontal size={20} aria-hidden="true" />
          </button>
          {open && (
            <div
              role="menu"
              className="dropdown-panel absolute right-0 z-20 mt-1.5 w-48"
            >
              <button
                type="button"
                role="menuitem"
                className="flex h-11 w-full items-center rounded-control px-3 text-left hover:bg-doing-bg hover:text-primary"
                onClick={() => {
                  setOpen(false);
                  onEdit(note);
                }}
              >
                Sửa
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex h-11 w-full items-center rounded-control px-3 text-left text-danger hover:bg-high-bg"
                onClick={() => {
                  setOpen(false);
                  onDelete(note);
                }}
              >
                Xóa
              </button>
            </div>
          )}
        </div>
        {onReturn && (
          <button
            type="button"
            disabled={pending}
            aria-label="Đưa ghi chú về trang Ghi chú"
            title="Đưa về Ghi chú"
            className="grid size-11 shrink-0 place-items-center rounded-control text-ink/65 hover:bg-ink/5"
            onClick={onReturn}
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      <button
        type="button"
        disabled={pending}
        className="flex min-h-0 w-full flex-1 flex-col items-start gap-3 overflow-hidden px-5 pt-4 pb-7 text-left"
        aria-label={`Mở ghi chú: ${note.title || "Không có tiêu đề"}`}
        onClick={() => onEdit(note)}
      >
        {note.title && (
          <span className="line-clamp-2 w-full shrink-0 text-base leading-6 font-semibold break-words">
            {note.title}
          </span>
        )}
        {note.content && (
          <span className="line-clamp-7 w-full text-sm leading-6 break-words whitespace-pre-wrap text-ink/85">
            {note.content}
          </span>
        )}
      </button>
    </article>
  );
}
