import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { formatDay, isOverdue } from "../dates.js";
import PriorityBadge from "./PriorityBadge.jsx";
import StatusSelect from "./StatusSelect.jsx";

export default function TaskItem({ task, pending, onEdit, onDelete, onStatus }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const description = task.description?.trim() ? task.description : "";
  const overdue = isOverdue(task.deadline, task.status);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
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
    <article className="rounded-card border border-line bg-surface p-4 md:min-h-[76px] md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-x-4">
      <div className="min-w-0 md:col-start-1 md:row-start-1">
        <div className="flex items-start gap-2">
          <h2 className="line-clamp-2 min-w-0 flex-1 text-[15px] font-semibold break-words text-ink">
            {task.title}
          </h2>
          <div ref={menuRef} className="relative md:hidden">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center"
              aria-label="Mở menu công việc"
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              <MoreHorizontal size={20} aria-hidden="true" />
            </button>
            {open ? (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1 w-40 rounded-card border border-line bg-surface p-1 shadow-overlay"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="flex h-11 w-full items-center rounded-control px-3 text-left"
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
                  className="flex h-11 w-full items-center rounded-control px-3 text-left text-danger"
                  onClick={() => {
                    setOpen(false);
                    onDelete(task);
                  }}
                >
                  Xóa
                </button>
              </div>
            ) : null}
          </div>
        </div>
        {description ? (
          <p className="mt-1 line-clamp-2 text-sm break-words whitespace-pre-wrap text-muted">
            {description}
          </p>
        ) : null}
      </div>

      {task.deadline || task.priority ? (
        <div className="mt-2 flex flex-col gap-2 md:col-start-1 md:row-start-2 md:flex-row md:flex-wrap md:items-center">
          {task.deadline ? (
            <p className={`text-sm ${overdue ? "text-danger" : "text-muted"}`}>
              {formatDay(task.deadline)}
              {overdue ? " · Quá hạn" : ""}
            </p>
          ) : null}
          <PriorityBadge priority={task.priority} />
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-2 md:col-start-2 md:row-start-1 md:mt-0">
        <StatusSelect
          className="w-full min-w-0 flex-1 md:w-auto md:flex-none"
          value={task.status}
          disabled={pending}
          onChange={(status) => onStatus(task, status)}
        />
        <button
          type="button"
          className="hidden h-11 w-11 items-center justify-center md:flex"
          aria-label="Sửa công việc"
          onClick={() => onEdit(task)}
        >
          <Pencil size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="hidden h-11 w-11 items-center justify-center text-danger md:flex"
          aria-label="Xóa công việc"
          onClick={() => onDelete(task)}
        >
          <Trash2 size={20} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
