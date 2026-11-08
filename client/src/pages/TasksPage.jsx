import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  FolderPlus,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import SortSelect from "../components/SortSelect.jsx";
import Select from "../components/Select.jsx";
import TaskList from "../components/TaskList.jsx";
import TaskItem from "../components/TaskItem.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useProjects } from "../components/ProjectContext.jsx";
import { useTaskEditor } from "../hooks/useTaskEditor.jsx";
import { createTask, listTasks } from "../services/taskApi.js";
import { isOverdue, localTodayIso } from "../dates.js";
import { groupTasksByProject, matchesTaskPeriod } from "../taskViews.js";

const SCOPES = [
  ["all", "Tất cả"],
  ["today", "Hôm nay"],
  ["week", "7 ngày tới"],
  ["overdue", "Quá hạn"],
  ["high", "Ưu tiên cao"],
  ["low", "Ưu tiên thấp"],
  ["todo", "Cần làm"],
  ["doing", "Đang làm"],
  ["done", "Đã hoàn thành"],
];

export default function TasksPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = ["todo", "doing", "done"].includes(params.get("status"))
    ? params.get("status")
    : "all";
  const period = params.get("when");
  const projectId = params.get("projectId") || undefined;
  const priority = params.get("priority") || undefined;
  const query = params.get("q") || "";
  const scope = period || priority || (tab !== "all" ? tab : "all");
  const workspace = useProjects();
  const { projects, projectRevision, refreshProjects } = workspace;
  const selectedProject = projects.find(
    (project) => String(project.id) === projectId,
  );
  const [sort, setSort] = useState("newest");
  const [tasks, setTasks] = useState([]);
  const [listStatus, setListStatus] = useState("loading");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickBusy, setQuickBusy] = useState(false);
  const [quickError, setQuickError] = useState("");
  const requestId = useRef(0);

  const load = useCallback(
    async (mode) => {
      const id = ++requestId.current;
      if (mode === "skeleton") setListStatus("loading");
      try {
        const data = await listTasks(tab, sort, { projectId, priority });
        if (id !== requestId.current) return false;
        setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
        setListStatus("ready");
        return true;
      } catch (error) {
        if (id !== requestId.current) return false;
        if (error.status === 401) {
          navigate("/login", { replace: true });
          return false;
        }
        setListStatus(error.network ? "network" : "error");
        return false;
      }
    },
    [navigate, tab, sort, projectId, priority, projectRevision],
  );
  const latestLoad = useRef(load);
  latestLoad.current = load;
  const editor = useTaskEditor(load);
  useEffect(() => {
    load("skeleton");
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  const visibleTasks = tasks.filter(
    (task) =>
      matchesTaskPeriod(task, period) &&
      (!query.trim() ||
        `${task.title} ${task.description || ""}`
          .toLocaleLowerCase("vi")
          .includes(query.trim().toLocaleLowerCase("vi"))),
  );
  const groups = groupTasksByProject(visibleTasks, projects);
  const title =
    selectedProject?.name ||
    (projectId === "none"
      ? "Chưa chia dự án"
      : projectId
        ? "Dự án"
        : scope === "all"
          ? "Công việc của tôi"
          : SCOPES.find(([value]) => value === scope)?.[1] || "Công việc");
  const initial = {
    projectId:
      selectedProject?.id ||
      (projectId &&
      projectId !== "none" &&
      Number.isSafeInteger(Number(projectId)) &&
      Number(projectId) > 0
        ? Number(projectId)
        : null),
    priority: priority || null,
    status: tab === "doing" ? "doing" : "todo",
    ...(period === "today" || period === "week"
      ? { deadline: localTodayIso() }
      : {}),
  };

  function setParam(name, value) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(name, value);
      else next.delete(name);
      return next;
    });
  }
  function changeScope(value) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      for (const key of ["when", "priority", "status"]) next.delete(key);
      if (["today", "week", "overdue"].includes(value)) next.set("when", value);
      else if (["high", "low"].includes(value)) next.set("priority", value);
      else if (["todo", "doing", "done"].includes(value))
        next.set("status", value);
      return next;
    });
  }
  async function quickAdd(event) {
    event.preventDefault();
    if (!quickTitle.trim() || quickBusy) return;
    setQuickBusy(true);
    setQuickError("");
    try {
      await createTask({ ...initial, title: quickTitle.trim() });
      setQuickTitle("");
      await Promise.all([latestLoad.current(), refreshProjects()]);
    } catch (error) {
      if (error.status === 401) navigate("/login", { replace: true });
      else setQuickError(error.message);
    } finally {
      setQuickBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 font-display text-[32px] leading-tight font-normal tracking-tight break-words md:text-[44px]">
            {selectedProject && (
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: selectedProject.color }}
              />
            )}
            <span className="min-w-0 break-words">{title}</span>
          </h1>
          <p className="mt-1 text-[12px] text-muted">
            {listStatus === "ready"
              ? `${visibleTasks.length} công việc${projectId ? " trong dự án" : " đang hiển thị"}`
              : "Đang tải công việc..."}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {selectedProject && (
            <>
              <button
                type="button"
                aria-label="Sửa dự án"
                title="Sửa dự án"
                onClick={() => workspace.openEditProject(selectedProject)}
                className="grid size-11 place-items-center rounded-control text-muted hover:bg-surface"
              >
                <Pencil size={17} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Xóa dự án"
                title="Xóa dự án"
                onClick={() => workspace.requestDeleteProject(selectedProject)}
                className="grid size-11 place-items-center rounded-control text-muted hover:bg-high-bg hover:text-danger"
              >
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </>
          )}
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-control bg-primary px-3 text-sm font-medium text-white hover:bg-primary-hover"
            onClick={() => editor.openCreate(initial)}
          >
            <Plus size={17} aria-hidden="true" />
            <span className="hidden sm:inline">Thêm công việc</span>
            <span className="sm:hidden">Thêm việc</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-line overflow-hidden rounded-card bg-surface py-4 sm:grid-cols-4">
        {[
          [
            "Cần làm",
            visibleTasks.filter((task) => task.status === "todo").length,
          ],
          [
            "Đang làm",
            visibleTasks.filter((task) => task.status === "doing").length,
          ],
          [
            "Quá hạn",
            visibleTasks.filter((task) => isOverdue(task.deadline, task.status))
              .length,
          ],
          [
            "Hoàn thành",
            visibleTasks.filter((task) => task.status === "done").length,
          ],
        ].map(([label, count]) => (
          <div key={label} className="flex flex-col items-center gap-1 py-2">
            <span className="text-[26px] leading-8 font-light text-primary tabular-nums">
              {listStatus === "ready" ? count : "—"}
            </span>
            <span className="text-[11px] text-muted">{label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="task-scope">
          Phạm vi công việc
        </label>
        <Select
          id="task-scope"
          className="order-3 h-11 max-w-full flex-1 sm:order-none sm:flex-none"
          value={scope}
          onChange={changeScope}
          options={SCOPES}
        />
        <label className="sr-only" htmlFor="project-filter">
          Lọc dự án
        </label>
        <Select
          id="project-filter"
          className="order-1 h-11 min-w-0 flex-1 basis-[calc(100%_-_3.25rem)] sm:order-none sm:max-w-52 sm:flex-none sm:basis-auto"
          value={projectId || ""}
          onChange={(value) => setParam("projectId", value)}
          options={[["", "Tất cả dự án"], ["none", "Chưa chia dự án"], ...projects.map((project) => [project.id, project.name])]}
        />
        <button
          type="button"
          aria-label="Thêm dự án"
          title="Thêm dự án"
          onClick={workspace.openCreateProject}
          className="order-2 grid size-11 shrink-0 place-items-center rounded-control bg-surface text-muted hover:text-primary sm:order-none"
        >
          <FolderPlus size={18} aria-hidden="true" />
        </button>
        <div className="order-4 ml-auto sm:order-none">
          <SortSelect value={sort} onChange={setSort} />
        </div>
      </div>
      <label className="flex h-11 items-center gap-2 rounded-control bg-surface px-3 lg:hidden">
        <Search size={17} className="text-muted" aria-hidden="true" />
        <input
          aria-label="Tìm công việc"
          value={query}
          onChange={(event) => setParam("q", event.target.value)}
          placeholder="Tìm công việc..."
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
      </label>
      {workspace.projectError && (
        <p role="alert" className="text-sm text-danger lg:hidden">
          {workspace.projectError}{" "}
          <button
            type="button"
            className="min-h-11 underline"
            onClick={refreshProjects}
          >
            Thử lại dự án
          </button>
        </p>
      )}
      {editor.actionError && (
        <p role="alert" className="text-sm text-danger">
          {editor.actionError}
        </p>
      )}
      {editor.banner}
      {listStatus === "ready" && tab !== "done" && period !== "overdue" && (
        <form
          onSubmit={quickAdd}
          className="flex min-h-12 items-center gap-2 rounded-card bg-surface px-3"
        >
          <Plus
            size={18}
            className="shrink-0 text-muted/60"
            aria-hidden="true"
          />
          <input
            aria-label="Thêm việc nhanh"
            maxLength={200}
            disabled={quickBusy}
            value={quickTitle}
            onChange={(event) => setQuickTitle(event.target.value)}
            placeholder={`Thêm việc${selectedProject ? ` vào ${selectedProject.name}` : ""}, nhấn Enter để lưu`}
            className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/70"
          />
          <button
            type="submit"
            disabled={quickBusy || !quickTitle.trim()}
            aria-label="Lưu việc nhanh"
            title="Lưu việc nhanh"
            className="grid size-11 shrink-0 place-items-center rounded-control text-primary hover:bg-doing-bg disabled:text-muted/30"
          >
            <ArrowUpRight size={18} aria-hidden="true" />
          </button>
        </form>
      )}
      {quickError && (
        <p role="alert" className="text-sm text-danger">
          {quickError}
        </p>
      )}
      {listStatus !== "ready" ? (
        <TaskList
          tasks={[]}
          status={listStatus}
          pendingIds={editor.pendingIds}
          onRetry={() => load("skeleton")}
        />
      ) : groups.length === 0 ? (
        <EmptyState
          variant={projectId || scope !== "all" || query ? "filtered" : "empty"}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section
              key={group.id ?? "none"}
              aria-label={`Dự án: ${group.name}`}
            >
              <div className="mb-2 flex min-h-8 items-center gap-2 px-1">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
                <h2 className="min-w-0 truncate text-[13px] font-medium">
                  {group.name}
                </h2>
                <span className="text-[11px] text-muted">
                  · {group.tasks.length} việc
                </span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {group.tasks.map((task) => (
                  <li key={task.id}>
                    <TaskItem
                      task={task}
                      pending={editor.pendingIds.has(task.id)}
                      onEdit={editor.openEdit}
                      onDelete={editor.requestDelete}
                      onStatus={(item, status) =>
                        editor.changeStatus(item, status, setTasks)
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      {editor.ui}
    </div>
  );
}
