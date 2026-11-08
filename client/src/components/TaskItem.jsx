import { useEffect, useRef, useState } from "react";
import { Check, MoreHorizontal } from "lucide-react";
import { formatDay, isOverdue } from "../dates.js";
import StatusSelect from "./StatusSelect.jsx";
import PriorityBadge from "./PriorityBadge.jsx";

export default function TaskItem({
  task,
  pending,
  onEdit,
  onDelete,
  onStatus,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const overdue = isOverdue(task.deadline, task.status);
  useEffect(() => {
    if (!open) return undefined;
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

  const deadline = task.deadline ? (
    <span
      className={`text-[12px] whitespace-nowrap ${overdue ? "text-danger" : "text-muted"}`}
    >
      {formatDay(task.deadline)}
      {overdue ? " · Quá hạn" : ""}
    </span>
  ) : null;
  return (
    <article className="flex min-h-16 flex-wrap items-center gap-x-2 rounded-card bg-surface px-2 py-1.5">
      <button
        type="button"
        disabled={pending}
        aria-label={`${task.status === "done" ? "Mở lại" : "Hoàn thành"}: ${task.title}`}
        aria-pressed={task.status === "done"}
        onClick={() => onStatus(task, task.status === "done" ? "todo" : "done")}
        className="grid size-11 shrink-0 place-items-center rounded-control text-muted hover:text-primary disabled:opacity-50"
      >
        <span
          className={`grid size-[17px] place-items-center rounded-full border ${task.status === "done" ? "border-primary bg-primary text-white" : overdue ? "border-danger" : "border-current"}`}
        >
          {task.status === "done" && <Check size={12} aria-hidden="true" />}
        </span>
      </button>
      <button
        type="button"
        aria-label={task.title}
        className="flex min-h-11 min-w-0 flex-1 flex-col justify-center gap-1 py-1 text-left"
        onClick={() => onEdit(task)}
      >
        <span
          className={`line-clamp-2 text-sm leading-5 break-words ${task.status === "done" ? "text-muted line-through" : "text-ink"}`}
        >
          {task.title}
        </span>
        <PriorityBadge priority={task.priority} />
      </button>
      <div className="hidden shrink-0 items-center gap-4 pl-2 md:flex">
        {deadline}
        <StatusSelect
          value={task.status}
          disabled={pending}
          className="!h-9 !border-0 !bg-transparent !px-2 !text-[12px]"
          onChange={(status) => onStatus(task, status)}
        />
      </div>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          aria-label="Mở menu công việc"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="grid size-11 place-items-center rounded-control text-muted hover:bg-doing-bg hover:text-primary"
        >
          <MoreHorizontal size={18} aria-hidden="true" />
        </button>
        {open && (
          <div
            role="menu"
            className="dropdown-panel absolute right-0 z-20 mt-1.5 w-40"
          >
            <button
              type="button"
              role="menuitem"
              className="flex h-11 w-full items-center rounded-control px-3 text-left text-sm hover:bg-doing-bg hover:text-primary"
              onClick={() => {
                setOpen(false);
                onEdit(task);
              }}
            >
              Sửa
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex h-11 w-full items-center rounded-control px-3 text-left text-sm text-danger hover:bg-high-bg"
              onClick={() => {
                setOpen(false);
                onDelete(task);
              }}
            >
              Xóa
            </button>
          </div>
        )}
      </div>
      <div className="ml-11 flex w-[calc(100%_-_2.75rem)] flex-wrap items-center justify-between gap-2 pb-1 md:hidden">
        {deadline}
        <StatusSelect
          value={task.status}
          disabled={pending}
          className="!h-11 max-w-40 !border-0 !bg-transparent !px-0 !text-[12px]"
          onChange={(status) => onStatus(task, status)}
        />
      </div>
    </article>
  );
}
