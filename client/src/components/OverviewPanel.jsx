import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  Check,
  CircleCheck,
  Clock3,
} from "lucide-react";
import { useNavigate } from "react-router";
import EmptyState from "./EmptyState.jsx";
import { RATING_LABELS } from "./ReflectionForm.jsx";
import { formatDay, formatShort, stampDay } from "../dates.js";
import { getDashboard } from "../services/taskApi.js";

function Metric({ label, value, note }) {
  return (
    <section className="flex min-w-0 flex-col items-center gap-1 px-2 py-2 text-center">
      <p className="text-[26px] leading-8 font-light text-primary tabular-nums">
        {value}
      </p>
      <h2 className="text-[11px] text-muted">{label}</h2>
      {note && <p className="text-[11px] text-muted">{note}</p>}
    </section>
  );
}

function StatusMix({ todo, doing, done }) {
  const total = todo + doing + done;
  const segments = [
    {
      label: "Cần làm",
      count: todo,
      color: "var(--color-ochre)",
      dot: "bg-ochre",
    },
    {
      label: "Đang làm",
      count: doing,
      color: "var(--color-primary)",
      dot: "bg-primary",
    },
    {
      label: "Hoàn thành",
      count: done,
      color: "var(--color-forest)",
      dot: "bg-forest",
    },
  ];
  let offset = 0;
  return (
    <section className="rounded-card border border-line bg-surface p-6">
      <h2 className="font-display text-xl font-normal">Phân bổ công việc</h2>
      <div className="relative mx-auto my-6 size-44">
        <svg
          viewBox="0 0 110 110"
          className="size-full -rotate-90"
          role="img"
          aria-label={`${todo} cần làm, ${doing} đang làm, ${done} hoàn thành`}
        >
          <circle
            cx="55"
            cy="55"
            r="43"
            fill="none"
            stroke="var(--color-line)"
            strokeWidth="12"
          />
          {segments.map((segment) => {
            const size = total ? (segment.count / total) * 100 : 0;
            const start = offset;
            offset += size;
            return (
              <circle
                key={segment.label}
                cx="55"
                cy="55"
                r="43"
                pathLength="100"
                fill="none"
                stroke={segment.color}
                strokeWidth="12"
                strokeDasharray={`${size} ${100 - size}`}
                strokeDashoffset={-start}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[36px] tabular-nums">{total}</span>
          <span className="text-[12px] text-muted">Tổng công việc</span>
        </div>
      </div>
      <ul className="flex flex-col gap-3">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2 text-sm">
            <span className={`size-2 rounded-full ${segment.dot}`} />
            <span className="text-muted">{segment.label}</span>
            <span className="ml-auto font-medium tabular-nums">
              {segment.count}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function WeekChart({ days, total }) {
  const max = Math.max(1, ...days.map((day) => day.count));
  return (
    <section className="min-w-0 rounded-card border border-line bg-surface p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-normal">
            Hoàn thành trong 7 ngày
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1.5 text-[12px] font-medium text-success">
          <CircleCheck size={14} aria-hidden="true" />
          {total} việc đã xong
        </span>
      </div>
      <div className="relative mt-8">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 flex h-44 flex-col justify-between"
          aria-hidden="true"
        >
          {[0, 1, 2, 3].map((line) => (
            <div key={line} className="border-t border-dashed border-line" />
          ))}
        </div>
        <ol
          className="relative grid h-44 grid-cols-7 gap-3"
          aria-label="Số việc hoàn thành theo ngày"
        >
          {days.map((day) => (
            <li
              key={day.date}
              className="flex min-w-0 flex-col items-center justify-end gap-2"
            >
              <span className="text-[12px] font-medium text-muted tabular-nums">
                {day.count}
              </span>
              <span className="sr-only">
                {formatDay(day.date)}: {day.count} công việc
              </span>
              <span
                className={`block w-full max-w-10 rounded-t-md ${day.count > 0 ? "bg-primary" : "bg-line"}`}
                style={{
                  height:
                    day.count > 0
                      ? `${Math.max(5, (day.count / max) * 85)}%`
                      : "3px",
                }}
              />
            </li>
          ))}
        </ol>
        <ol className="mt-3 grid grid-cols-7 gap-3">
          {days.map((day) => (
            <li key={day.date} className="text-center text-[12px] text-muted">
              {formatShort(day.date)}
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-6 border-t border-line pt-4 text-[13px] text-muted">
        {total === 0
          ? "Chưa có việc hoàn thành trong 7 ngày này."
          : `${total} công việc đã hoàn thành trong 7 ngày qua.`}
      </p>
    </section>
  );
}

function DeadlineMix({ overdue, within }) {
  const total = overdue + within;
  return (
    <section className="rounded-card border border-line bg-surface p-6">
      <h2 className="font-display text-xl font-normal">Theo dõi thời hạn</h2>
      <p className="mt-1 text-[13px] text-muted">Công việc chưa hoàn thành</p>
      <div className="mt-6 flex items-center gap-3 rounded-control bg-peach p-4">
        <Clock3 size={20} className="text-terracotta" aria-hidden="true" />
        <span className="text-sm text-muted">Đã quá hạn</span>
        <span className="ml-auto text-xl font-semibold text-danger tabular-nums">
          {overdue}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-control bg-sage p-4">
        <CalendarCheck2 size={20} className="text-forest" aria-hidden="true" />
        <span className="text-sm text-muted">Chưa quá hạn</span>
        <span className="ml-auto text-xl font-semibold text-success tabular-nums">
          {within}
        </span>
      </div>
      <p className="mt-5 text-[12px] leading-5 text-muted">
        {total
          ? "Việc không có ngày đến hạn được tính vào nhóm chưa quá hạn."
          : "Bạn chưa có công việc đang chờ hoàn thành."}
      </p>
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
    getDashboard()
      .then((dash) => {
        if (!live || id !== requestId.current) return;
        const data = dash?.dashboard;
        if (
          !data ||
          !Array.isArray(data.trend) ||
          !Array.isArray(data.recentCompleted)
        ) {
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
  const doing = Number(dashboard?.doing) || 0;
  const overdue = Number(dashboard?.overdue) || 0;
  const completed = Number(dashboard?.completed) || 0;
  const rate = completion?.rate == null ? "—" : `${Math.round(completion.rate * 100)}%`;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[32px] leading-tight font-normal tracking-tight md:text-[44px]">
          Tổng quan
        </h1>
      </div>
      {status === "loading" && (
        <div className="grid grid-cols-2 gap-4" aria-busy="true">
          <p className="sr-only">Đang tải tổng quan</p>
          {[0, 1, 2, 3].map((id) => (
            <div key={id} className="h-28 animate-pulse rounded-card bg-line" />
          ))}
        </div>
      )}
      {(status === "error" || status === "network") && (
        <EmptyState
          variant="error"
          message={
            status === "network"
              ? "Không kết nối được máy chủ."
              : "Không thể tải tổng quan"
          }
          onRetry={() => {
            setStatus("loading");
            setAttempt((value) => value + 1);
          }}
        />
      )}
      {status === "ready" && dashboard && (
        <>
          <div className="grid grid-cols-2 divide-x divide-line overflow-hidden rounded-card bg-surface py-4 sm:grid-cols-4">
            <Metric label="Đã xong (7 ngày)" value={completed} />
            <Metric label="Đang làm" value={doing} />
            <Metric label="Quá hạn" value={overdue} />
            <Metric
              label="Tỷ lệ hoàn thành"
              value={rate}
              note="Toàn bộ công việc"
            />
          </div>
          <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <WeekChart days={dashboard.trend} total={completed} />
            <StatusMix
              todo={Math.max(0, total - done - doing)}
              doing={doing}
              done={done}
            />
          </div>
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <section className="min-w-0 rounded-card border border-line bg-surface p-5 md:p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-xl font-normal">
                  Hoàn thành gần đây
                </h2>
                <button
                  type="button"
                  className="flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium text-primary"
                  onClick={onSeeAll}
                >
                  Xem tất cả <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
              {dashboard.recentCompleted.length === 0 ? (
                <p className="py-8 text-sm text-muted">
                  Chưa có công việc hoàn thành.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-line">
                  {dashboard.recentCompleted.map((task) => (
                    <li key={task.id}>
                      <button
                        type="button"
                        className="flex w-full items-start gap-3 rounded-control py-4 text-left hover:bg-canvas"
                        onClick={() => onOpen(task)}
                      >
                        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-sage text-forest">
                          <Check size={16} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {task.title}
                          </span>
                          {(task.outcomeRating || task.outcomeNote) && (
                            <span className="mt-1 block truncate text-[12px] text-muted">
                              {[
                                RATING_LABELS[task.outcomeRating],
                                task.outcomeNote,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          )}
                        </span>
                        <span className="pt-1 text-[12px] whitespace-nowrap text-muted">
                          {task.completedAt
                            ? formatDay(stampDay(task.completedAt))
                            : "Chưa có ngày"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <DeadlineMix
              overdue={overdue}
              within={Math.max(0, total - done - overdue)}
            />
          </div>
        </>
      )}
    </div>
  );
}
