import {
  CalendarDays,
  ChartNoAxesColumn,
  CheckCircle2,
  Flag,
  Inbox,
  ListTodo,
  NotebookPen,
  Plus,
  Sun,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router";
import { useProjects } from "./ProjectContext.jsx";

export default function TaskSidebar() {
  const { pathname, search } = useLocation();
  const isTaskPage = pathname === "/tasks";
  const params = new URLSearchParams(isTaskPage ? search : "");
  const {
    projects,
    projectStatus,
    projectError,
    refreshProjects,
    openCreateProject,
  } = useProjects();
  const projectId = params.get("projectId");
  const active = isTaskPage
    ? projectId
      ? `project:${projectId}`
      : params.get("when") ||
        params.get("priority") ||
        params.get("status") ||
        "all"
    : null;
  const links = [
    ["all", "/tasks", "Tất cả công việc", ListTodo, "text-primary"],
    ["today", "/tasks?when=today", "Hôm nay", Sun, "text-forest"],
    ["high", "/tasks?priority=high", "Ưu tiên cao", Flag, "text-danger"],
    ["low", "/tasks?priority=low", "Ưu tiên thấp", Flag, "text-forest"],
    ["done", "/tasks?status=done", "Đã hoàn thành", CheckCircle2, "text-muted"],
    [
      "project:none",
      "/tasks?projectId=none",
      "Chưa chia dự án",
      Inbox,
      "text-sky-500",
    ],
  ];
  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 lg:px-3">
        <nav
          aria-label="Bộ lọc công việc"
          className="grid gap-1 lg:grid-cols-3"
        >
          {links.map(([key, href, label, Icon, color]) => (
            <Link
              key={key}
              to={href}
              title={label}
              aria-label={label}
              aria-current={active === key ? "page" : undefined}
              className={`flex min-h-11 items-center justify-center rounded-md px-3 ${active === key ? "bg-canvas text-ink" : "text-muted hover:bg-canvas"}`}
            >
              <Icon
                size={18}
                strokeWidth={1.5}
                className={color}
                aria-hidden="true"
              />
            </Link>
          ))}
        </nav>
        <section
          className="mt-5 hidden border-t border-line pt-4 lg:block"
          aria-label="Dự án của tôi"
        >
          <div className="mb-2 flex items-center justify-between px-3">
            <h2 className="text-[11px] font-medium tracking-wider text-muted uppercase">
              Dự án của tôi
            </h2>
            <button
              type="button"
              aria-label="Thêm dự án"
              onClick={openCreateProject}
              className="grid size-8 place-items-center rounded-md text-primary hover:bg-canvas"
            >
              <Plus size={16} aria-hidden="true" />
            </button>
          </div>
          {projectStatus === "loading" && (
            <p className="px-3 py-3 text-[13px] text-muted">
              Đang tải dự án...
            </p>
          )}
          {projectError && (
            <div className="px-3 py-2 text-[12px] text-danger">
              <p>{projectError}</p>
              <button
                type="button"
                className="min-h-9 font-medium underline"
                onClick={refreshProjects}
              >
                Thử lại dự án
              </button>
            </div>
          )}
          {projectStatus === "ready" && projects.length === 0 && (
            <p className="px-3 py-3 text-[12px] leading-5 text-muted">
              Chưa có dự án.
            </p>
          )}
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/tasks?projectId=${project.id}`}
              aria-current={
                projectId === String(project.id) ? "page" : undefined
              }
              className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-[13px] ${projectId === String(project.id) ? "bg-canvas text-ink" : "text-muted hover:bg-canvas"}`}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <span className="min-w-0 flex-1 truncate" title={project.name}>
                {project.name}
              </span>
              <span className="text-[11px] text-muted tabular-nums">
                {project.taskCount}
              </span>
            </Link>
          ))}
        </section>
        <nav
          className="mt-5 grid gap-1 border-t border-line pt-4 lg:grid-cols-4"
          aria-label="Mục chính"
        >
          {[
            ["/tasks", "Công việc", ListTodo],
            ["/calendar", "Lịch biểu", CalendarDays],
            ["/notes", "Ghi chú", NotebookPen],
            ["/overview", "Tổng quan", ChartNoAxesColumn],
          ].map(([href, label, Icon]) => (
            <NavLink
              key={href}
              to={href}
              end
              title={label}
              aria-label={label}
              className={({ isActive }) =>
                `flex min-h-11 items-center justify-center rounded-md px-3 hover:bg-canvas ${isActive ? "text-primary" : "text-muted"}`
              }
            >
              <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
            </NavLink>
          ))}
        </nav>
      </div>
      <button
        type="button"
        aria-label="Thêm dự án"
        title="Thêm dự án"
        onClick={openCreateProject}
        className="mx-3 mb-3 hidden min-h-11 items-center justify-center rounded-md px-3 text-primary hover:bg-canvas lg:flex"
      >
        <Plus size={18} aria-hidden="true" />
      </button>
    </>
  );
}
