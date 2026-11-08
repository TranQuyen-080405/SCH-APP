import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
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
import { shiftDay } from "../taskViews.js";
import { useTaskEditor } from "../hooks/useTaskEditor.jsx";
import { listTasks } from "../services/taskApi.js";

const STATUSES = [
  {
    id: "todo",
    label: "Cần làm",
    dot: "bg-ochre",
    accent: "accent-ochre",
    bar: "border-ochre bg-todo-bg text-todo-fg",
  },
  {
    id: "doing",
    label: "Đang làm",
    dot: "bg-primary",
    accent: "accent-primary",
    bar: "border-primary bg-doing-bg text-doing-fg",
  },
  {
    id: "done",
    label: "Hoàn thành",
    dot: "bg-forest",
    accent: "accent-forest",
    bar: "border-forest bg-done-bg text-done-fg",
  },
];

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
  const [visibleStatuses, setVisibleStatuses] = useState([
    "todo",
    "doing",
    "done",
  ]);
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
      if (!task.deadline || !visibleStatuses.includes(task.status)) continue;
      const list = map.get(task.deadline) || [];
      list.push(task);
      map.set(task.deadline, list);
    }
    return map;
  }, [tasks, visibleStatuses]);

  const cells = monthCells(cursor.year, cursor.month);
  const firstDay = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-01`;
  const offset = cells.findIndex(Boolean);
  const selectedTasks = byDate.get(cursor.selected) || [];
  const monthCount = tasks.filter((task) =>
    task.deadline?.startsWith(firstDay.slice(0, 7)),
  ).length;

  function move(delta) {
    const next = shiftMonth(cursor.year, cursor.month, delta);
    setCursor({
      ...next,
      selected: `${next.year}-${String(next.month + 1).padStart(2, "0")}-01`,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[32px] leading-tight font-normal tracking-tight md:text-[44px]">
            Lịch biểu
          </h1>
        </div>
        <button
          type="button"
          className="hidden min-h-11 items-center gap-1.5 rounded-control bg-primary px-3 text-sm font-medium text-white hover:bg-primary-hover md:inline-flex"
          onClick={() => editor.openCreate({ deadline: cursor.selected })}
        >
          <Plus size={18} aria-hidden="true" />
          Thêm công việc
        </button>
      </div>

      {editor.actionError && (
        <p role="alert" className="text-danger">
          {editor.actionError}
        </p>
      )}
      {editor.banner}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_270px]">
        <section
          className="min-w-0 overflow-hidden rounded-card border border-line bg-surface"
          aria-label="Lịch tháng"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 md:px-5">
            <div className="flex items-center gap-2">
              <div className="mr-1 grid size-10 place-items-center rounded-control bg-doing-bg text-primary">
                <CalendarDays size={21} aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold">
                  Tháng {cursor.month + 1}, {cursor.year}
                </h2>
                <p className="mt-0.5 text-[12px] text-muted">
                  {status === "ready"
                    ? `${monthCount} công việc có hạn`
                    : "Đang tải công việc…"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="mr-1 h-11 rounded-control border border-line px-3 text-sm text-muted hover:bg-canvas"
                onClick={() => setCursor(startOfToday())}
              >
                Hôm nay
              </button>
              <button
                type="button"
                className="grid size-11 place-items-center rounded-control text-muted hover:bg-canvas"
                aria-label="Tháng trước"
                onClick={() => move(-1)}
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="grid size-11 place-items-center rounded-control text-muted hover:bg-canvas"
                aria-label="Tháng sau"
                onClick={() => move(1)}
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div
            className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-line px-4 py-2 md:px-5"
            aria-label="Lọc lịch theo trạng thái"
          >
            {STATUSES.map((item) => (
              <label
                key={item.id}
                className="flex min-h-11 cursor-pointer items-center gap-2 text-[13px] text-muted"
              >
                <input
                  type="checkbox"
                  checked={visibleStatuses.includes(item.id)}
                  onChange={(event) =>
                    setVisibleStatuses((current) =>
                      event.target.checked
                        ? [...current, item.id]
                        : current.filter((value) => value !== item.id),
                    )
                  }
                  className={`size-4 ${item.accent}`}
                />
                {item.label}
              </label>
            ))}
          </div>
          {status === "error" || status === "network" ? (
            <EmptyState
              variant="error"
              message={
                status === "network"
                  ? "Không kết nối được máy chủ."
                  : "Không thể tải công việc"
              }
              onRetry={load}
            />
          ) : (
            <div className="grid grid-cols-7" aria-busy={status === "loading"}>
              {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"].map(
                (day) => (
                  <div
                    key={day}
                    className="border-b border-line bg-stone/50 py-3 text-center text-[12px] font-medium text-muted"
                  >
                    {day}
                  </div>
                ),
              )}
              {cells.map((iso, index) => {
                const items = byDate.get(iso) || [];
                const selected = iso === cursor.selected;
                if (!iso)
                  return (
                    <div
                      key={`empty-${index}`}
                      className="min-h-20 border-r border-b border-line bg-canvas/60 p-1.5 text-center text-[12px] text-muted md:min-h-24"
                    >
                      {Number(shiftDay(firstDay, index - offset).slice(8))}
                    </div>
                  );
                return (
                  <div
                    key={iso}
                    className={`min-w-0 border-r border-b border-line p-1 md:min-h-24 md:p-1.5 ${selected ? "bg-doing-bg/60" : ""}`}
                  >
                    <button
                      type="button"
                      className="flex min-h-11 w-full items-center justify-center md:min-h-8"
                      aria-pressed={selected}
                      aria-label={`${formatDay(iso)}, ${items.length} công việc`}
                      onClick={() =>
                        setCursor((current) => ({ ...current, selected: iso }))
                      }
                    >
                      <span
                        className={`grid size-7 place-items-center rounded-full text-[13px] ${iso === today ? "bg-primary font-semibold text-white" : selected ? "font-semibold text-primary" : "text-muted"}`}
                      >
                        {Number(iso.slice(8))}
                      </span>
                    </button>
                    <div className="min-h-7 md:hidden">
                      {items.length > 0 && (
                        <span className="block w-full rounded-md bg-doing-bg py-1 text-center text-[11px] text-primary">
                          {items.length} việc
                        </span>
                      )}
                    </div>
                    <ul className="hidden flex-col gap-1 md:flex">
                      {items.slice(0, 2).map((task) => {
                        const tone =
                          STATUSES.find((item) => item.id === task.status) ||
                          STATUSES[0];
                        const overdue = isOverdue(task.deadline, task.status);
                        return (
                          <li key={task.id}>
                            <button
                              type="button"
                              title={`${task.title} · ${tone.label}${overdue ? " · Quá hạn" : ""}`}
                              className={`block w-full truncate rounded-r-md border-l-[3px] px-1.5 py-1.5 text-left text-[12px] ${tone.bar}`}
                              onClick={() => {
                                setCursor((current) => ({
                                  ...current,
                                  selected: iso,
                                }));
                                editor.openEdit(task);
                              }}
                            >
                              {overdue && <span aria-label="Quá hạn">! </span>}
                              {task.title}
                            </button>
                          </li>
                        );
                      })}
                      {items.length > 2 && (
                        <li>
                          <button
                            type="button"
                            className="w-full py-1 text-left text-[11px] font-medium text-primary"
                            onClick={() =>
                              setCursor((current) => ({
                                ...current,
                                selected: iso,
                              }))
                            }
                          >
                            +{items.length - 2} công việc
                          </button>
                        </li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside
          className="min-w-0 rounded-card border border-line bg-surface p-5"
          aria-label="Công việc ngày đang chọn"
        >
          <p className="text-[11px] font-semibold tracking-[0.12em] text-primary">
            KẾ HOẠCH TRONG NGÀY
          </p>
          <h2 className="mt-3 text-base font-semibold">
            {selectedHeading(cursor.selected)}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {selectedTasks.length} công việc
            {visibleStatuses.length < 3 ? " theo bộ lọc" : " đến hạn"}
          </p>
          {status === "loading" ? (
            <p className="py-8 text-center text-muted">Đang tải…</p>
          ) : status !== "ready" ? (
            <p className="py-8 text-sm text-muted">
              Chưa tải được kế hoạch trong ngày.
            </p>
          ) : selectedTasks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-canvas text-muted">
                <CalendarDays size={24} strokeWidth={1.4} aria-hidden="true" />
              </span>
              <p className="text-sm text-muted">
                Chưa có việc đến hạn ngày này.
              </p>
            </div>
          ) : (
            <ul className="my-5 flex flex-col gap-3">
              {selectedTasks.map((task) => {
                const tone =
                  STATUSES.find((item) => item.id === task.status) ||
                  STATUSES[0];
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      className="flex w-full flex-col gap-2 rounded-control border border-line p-3 text-left hover:border-primary/40"
                      onClick={() => editor.openEdit(task)}
                    >
                      <span className="text-sm font-medium leading-6 break-words">
                        {task.title}
                      </span>
                      <span className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
                        <span className={`size-1.5 rounded-full ${tone.dot}`} />
                        {tone.label}
                        <PriorityBadge priority={task.priority} />
                      </span>
                      {isOverdue(task.deadline, task.status) && (
                        <span className="text-[12px] text-danger">Quá hạn</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-doing-bg px-3 font-medium text-primary hover:bg-primary/15"
            onClick={() => editor.openCreate({ deadline: cursor.selected })}
          >
            <Plus size={17} aria-hidden="true" />
            Thêm việc cho ngày này
          </button>
        </aside>
      </div>
      {editor.ui}
    </div>
  );
}
