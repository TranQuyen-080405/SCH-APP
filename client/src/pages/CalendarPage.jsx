import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import PriorityBadge from "../components/PriorityBadge.jsx";
import EmptyState from "../components/EmptyState.jsx";
import {
  formatDay,
  isOverdue,
  localTodayIso,
  monthCells,
  selectedHeading,
  shiftMonth,
} from "../dates.js";
import { useTaskEditor } from "../hooks/useTaskEditor.jsx";
import { listTasks } from "../services/taskApi.js";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const STATUS_LABEL = { todo: "Cần làm", doing: "Đang làm", done: "Hoàn thành" };

function startOfToday() {
  const today = localTodayIso();
  return {
    year: Number(today.slice(0, 4)),
    month: Number(today.slice(5, 7)) - 1,
    selected: today,
  };
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [cursor, setCursor] = useState(startOfToday);
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState("loading");
  const today = localTodayIso();

  const load = useCallback(async () => {
    try {
      const data = await listTasks("all", "due_asc");
      setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
      setStatus("ready");
      return true;
    } catch (error) {
      if (error.status === 401) {
        navigate("/login", { replace: true });
        return false;
      }
      setStatus(error.network ? "network" : "error");
      return false;
    }
  }, [navigate]);

  const editor = useTaskEditor(load);

  useEffect(() => {
    load();
  }, [load]);

  const byDate = useMemo(() => {
    const map = new Map();
    for (const task of tasks) {
      if (!task.deadline) continue;
      const list = map.get(task.deadline) || [];
      list.push(task);
      map.set(task.deadline, list);
    }
    return map;
  }, [tasks]);

  const cells = monthCells(cursor.year, cursor.month);
  const selectedTasks = byDate.get(cursor.selected) || [];

  function move(delta) {
    const next = shiftMonth(cursor.year, cursor.month, delta);
    setCursor((current) => ({ ...current, ...next }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="hidden md:block">
        <h1 className="text-2xl font-semibold text-ink">Lịch</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="flex h-11 w-11 items-center justify-center rounded-control border border-line bg-surface" aria-label="Tháng trước" onClick={() => move(-1)}>
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <p className="min-w-36 text-center text-base font-semibold text-ink">
          Tháng {cursor.month + 1}, {cursor.year}
        </p>
        <button type="button" className="flex h-11 w-11 items-center justify-center rounded-control border border-line bg-surface" aria-label="Tháng sau" onClick={() => move(1)}>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="h-11 rounded-control border border-line bg-surface px-3 text-sm font-medium"
          onClick={() => setCursor(startOfToday())}
        >
          Hôm nay
        </button>
      </div>

      {status === "loading" ? <p className="text-sm text-muted">Đang tải...</p> : null}
      {status === "error" || status === "network" ? (
        <EmptyState
          variant="error"
          message={status === "network" ? "Không kết nối được máy chủ." : "Không thể tải công việc"}
          onRetry={load}
        />
      ) : null}

      {status === "ready" ? (
        <div className="flex flex-col gap-6 min-[1200px]:flex-row min-[1200px]:items-start">
          <div className="min-w-0 flex-1 overflow-x-auto">
            <div className="min-w-[308px] border border-line bg-surface">
              <div className="grid grid-cols-7">
                {WEEKDAYS.map((label) => (
                  <div key={label} className="border-b border-line px-1 py-2 text-center text-[13px] text-muted">
                    {label}
                  </div>
                ))}
                {cells.map((iso, index) => {
                  if (!iso) {
                    return <div key={`empty-${index}`} className="min-h-11 border-t border-line bg-canvas md:min-h-24" />;
                  }
                  const items = byDate.get(iso) || [];
                  const selected = iso === cursor.selected;
                  const day = Number(iso.slice(8, 10));
                  return (
                    <div key={iso} className="min-h-16 border-t border-line p-1 md:min-h-24">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-1"
                        aria-pressed={selected}
                        aria-label={`${formatDay(iso)}${items.length ? `, ${items.length} công việc` : ""}`}
                        onClick={() => setCursor((current) => ({ ...current, selected: iso }))}
                      >
                        <span
                          className={`inline-flex size-7 items-center justify-center rounded-full text-sm ${
                            selected ? "bg-primary text-white" : iso === today ? "ring-1 ring-primary" : ""
                          }`}
                        >
                          {day}
                        </span>
                      </button>
                      <ul className="mt-1 flex flex-col gap-0.5">
                        {items.slice(0, 2).map((task, index) => (
                          <li key={task.id} className={index === 1 ? "hidden sm:block" : ""}>
                            <button
                              type="button"
                              className={`line-clamp-1 w-full text-left text-[13px] ${
                                task.status === "done"
                                  ? "text-success line-through"
                                  : isOverdue(task.deadline, task.status)
                                    ? "text-danger"
                                    : "text-ink"
                              }`}
                              onClick={() => {
                                setCursor((current) => ({ ...current, selected: iso }));
                                editor.openEdit(task);
                              }}
                            >
                              {task.title}
                            </button>
                          </li>
                        ))}
                        {items.length > 2 ? (
                          <li className="text-[13px] text-muted">+{items.length - 2} công việc</li>
                        ) : null}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <section className="flex w-full flex-col gap-2 min-[1200px]:w-[300px] min-[1200px]:shrink-0">
            <h2 className="text-base font-semibold text-ink">{selectedHeading(cursor.selected)}</h2>
            <p className="text-[13px] text-muted">Việc đến hạn ngày này. Bấm tên để sửa.</p>
            {selectedTasks.length === 0 ? (
              <p className="text-sm text-muted">Không có công việc đến hạn.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {selectedTasks.map((task) => {
                  const overdue = isOverdue(task.deadline, task.status);
                  return (
                    <li key={task.id}>
                      <button
                        type="button"
                        className="flex w-full flex-col gap-2 rounded-card border border-line bg-surface p-3 text-left"
                        onClick={() => editor.openEdit(task)}
                      >
                        <span
                          className={`text-[15px] font-semibold ${
                            task.status === "done" ? "text-success line-through" : overdue ? "text-danger" : "text-ink"
                          }`}
                        >
                          {task.title}
                        </span>
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
                          <span>{STATUS_LABEL[task.status] || "Cần làm"}</span>
                          <span>Hạn {formatDay(task.deadline)}</span>
                          {overdue ? <span className="text-danger">Quá hạn</span> : null}
                          <PriorityBadge priority={task.priority} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <button
              type="button"
              className="h-11 rounded-control bg-primary px-4 font-medium text-white hover:bg-primary-hover"
              onClick={() => editor.openCreate({ deadline: cursor.selected })}
            >
              Thêm việc hạn {formatDay(cursor.selected)}
            </button>
          </section>
        </div>
      ) : null}
      {editor.banner}
      {editor.ui}
    </div>
  );
}
