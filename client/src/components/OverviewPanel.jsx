import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import EmptyState from "./EmptyState.jsx";
import { RATING_LABELS } from "./ReflectionForm.jsx";
import { formatDay, formatShort, stampDay } from "../dates.js";
import { getDashboard } from "../services/taskApi.js";

function BarRow({ label, count, max, tone }) {
  const width = max > 0 ? Math.max(count > 0 ? 4 : 0, Math.round((count / max) * 100)) : 0;
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)_2.25rem] items-center gap-2">
      <span className="text-[13px] text-ink">{label}</span>
      <span className="h-2.5 bg-line" aria-hidden="true">
        <span className={`block h-2.5 ${tone}`} style={{ width: `${width}%` }} />
      </span>
      <span className="text-right text-[13px] text-ink tabular-nums">{count}</span>
    </div>
  );
}

function StatusMix({ todo, doing, done }) {
  const max = Math.max(todo, doing, done, 1);
  const total = todo + doing + done;
  return (
    <section className="border border-line bg-surface p-4">
      <h2 className="text-base font-semibold text-ink">Việc theo trạng thái</h2>
      {total === 0 ? (
        <p className="mt-3 text-sm text-muted">Chưa có việc nào.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2" aria-label="Số việc theo trạng thái">
          <BarRow label="Cần làm" count={todo} max={max} tone="bg-todo-fg" />
          <BarRow label="Đang làm" count={doing} max={max} tone="bg-doing-fg" />
          <BarRow label="Hoàn thành" count={done} max={max} tone="bg-done-fg" />
        </div>
      )}
    </section>
  );
}

function WeekChart({ days, total }) {
  const max = Math.max(1, ...days.map((day) => day.count));
  return (
    <section className="border border-line bg-surface p-4">
      <h2 className="text-base font-semibold text-ink">Hoàn thành trong 7 ngày</h2>
      {total === 0 ? (
        <p className="mt-3 text-sm text-muted">Chưa có việc hoàn thành trong 7 ngày này.</p>
      ) : (
        <div className="mt-3 grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-2">
          <div className="flex h-24 flex-col justify-between text-[13px] text-muted tabular-nums">
            <span>{max}</span>
            <span>0</span>
          </div>
          <ol className="flex h-24 min-w-0 items-end border-b border-ink" aria-label="Số việc hoàn thành theo ngày">
            {days.map((day) => {
              const height = day.count === 0 ? 0 : Math.max(10, Math.round((day.count / max) * 80));
              return (
                <li key={day.date} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                  <span className="sr-only">{`${formatDay(day.date)}: ${day.count} việc`}</span>
                  <span className="text-[13px] text-ink tabular-nums">{day.count}</span>
                  <span
                    className={`mt-0.5 w-full max-w-7 ${day.count > 0 ? "bg-primary" : ""}`}
                    style={{ height: `${height}px` }}
                  />
                </li>
              );
            })}
          </ol>
          <span />
          <ol className="flex min-w-0">
            {days.map((day) => (
              <li key={day.date} className="min-w-0 flex-1 pt-1 text-center text-[12px] text-muted">
                {formatShort(day.date)}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function DeadlineMix({ overdue, within }) {
  const max = Math.max(overdue, within, 1);
  const total = overdue + within;
  return (
    <section className="border border-line bg-surface p-4">
      <h2 className="text-base font-semibold text-ink">Hạn của việc chưa xong</h2>
      {total === 0 ? (
        <p className="mt-3 text-sm text-muted">Không có việc chưa xong để so hạn.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2" aria-label="Việc quá hạn và còn hạn">
          <BarRow label="Quá hạn" count={overdue} max={max} tone="bg-danger" />
          <BarRow label="Còn hạn" count={within} max={max} tone="bg-primary" />
        </div>
      )}
    </section>
  );
}

export default function OverviewPanel({ revision = 0, onOpen, onSeeAll }) {
  const navigate = useNavigate();
  const requestId = useRef(0);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("loading");
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    const id = ++requestId.current;
    let live = true;
    getDashboard("7d")
      .then((dash) => {
        if (!live || id !== requestId.current) return;
        const data = dash?.dashboard;
        if (!data || !Array.isArray(data.dailyCompletions) || !Array.isArray(data.recentCompleted)) {
          setStatus("error");
          return;
        }
        setDashboard(data);
        setStatus("ready");
      })
      .catch((error) => {
        if (!live || id !== requestId.current) return;
        if (error.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setStatus(error.network ? "network" : "error");
      });
    return () => {
      live = false;
    };
  }, [attempt, navigate, revision]);

  const completion = dashboard?.completion;
  const done = Number(completion?.done) || 0;
  const total = Number(completion?.total) || 0;
  const doing = Number(dashboard?.doingCount) || 0;
  const overdue = Number(dashboard?.overdueCount) || 0;
  const todo = Math.max(0, total - done - doing);
  const within = Math.max(0, total - done - overdue);
  const days = dashboard?.dailyCompletions || [];
  const recent = dashboard?.recentCompleted || [];

  return (
    <div className="flex flex-col gap-4">
      <div className="hidden md:block">
        <h1 className="text-2xl font-semibold text-ink">Tổng quan</h1>
        <p className="mt-1 text-sm text-muted">Số việc của bạn, không phải điểm năng suất.</p>
      </div>

      {status === "loading" ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <p className="sr-only">Đang tải tổng quan</p>
          <div className="h-28 animate-pulse border border-line bg-line" />
          <div className="h-40 animate-pulse border border-line bg-line" />
        </div>
      ) : null}

      {status === "error" || status === "network" ? (
        <EmptyState
          variant="error"
          message={status === "network" ? "Không kết nối được máy chủ." : "Không thể tải tổng quan"}
          onRetry={() => {
            setStatus("loading");
            setAttempt((value) => value + 1);
          }}
        />
      ) : null}

      {status === "ready" && dashboard ? (
        <>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <StatusMix todo={todo} doing={doing} done={done} />
            <DeadlineMix overdue={overdue} within={within} />
          </div>
          <WeekChart days={days} total={Number(dashboard.completedLast7Days) || 0} />

          <section>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-ink">Hoàn thành gần đây</h2>
              <button type="button" className="h-11 shrink-0 px-2 text-sm font-medium text-primary" onClick={onSeeAll}>
                Xem tất cả
              </button>
            </div>
            <p className="text-[13px] text-muted">Tối đa 5 việc, mới hoàn thành trước. Bấm tên để mở việc.</p>
            {recent.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Chưa có công việc hoàn thành.</p>
            ) : (
              <ul className="mt-2 border-t border-line">
                {recent.map((task) => {
                  const when = task.completedAt ? formatDay(stampDay(task.completedAt)) : "Chưa có ngày";
                  const rating = RATING_LABELS[task.outcomeRating];
                  return (
                    <li key={task.id} className="border-b border-line">
                      <button type="button" className="grid w-full grid-cols-[5.5rem_minmax(0,1fr)] gap-3 py-2 text-left" onClick={() => onOpen(task)}>
                        <span className="text-[13px] text-muted">{when}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] font-semibold text-ink">{task.title}</span>
                          {rating || task.outcomeNote ? (
                            <span className="mt-0.5 block truncate text-[13px] text-muted">
                              {[rating, task.outcomeNote].filter(Boolean).join(" · ")}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
