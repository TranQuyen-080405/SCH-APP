import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChartNoAxesColumn,
  ChevronDown,
  ListTodo,
  LogOut,
  NotebookPen,
} from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { logout } from "../services/authApi.js";
import { ProjectProvider } from "./ProjectContext.jsx";
import TaskSidebar from "./TaskSidebar.jsx";
import { NotesProvider } from "./NotesContext.jsx";

const ITEMS = [
  ["/tasks", "Công việc", ListTodo],
  ["/calendar", "Lịch biểu", CalendarDays],
  ["/notes", "Ghi chú", NotebookPen],
  ["/overview", "Tổng quan", ChartNoAxesColumn],
];

function WorkspaceShell({ user }) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const email = user?.email || "";
  const initial = email.charAt(0).toUpperCase() || "U";
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname, search]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
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

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      if (err?.status !== 401) {
        setError(err.message || "Không kết nối được máy chủ.");
        return;
      }
    }
    navigate("/login", { replace: true });
  }

  return (
    <div className="focus-workspace min-h-dvh bg-surface md:grid md:grid-cols-[4.5rem_minmax(0,1fr)] lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface md:flex">
        <Link
          to="/tasks"
          className="flex h-20 shrink-0 items-center justify-center px-1 font-display text-[11px] font-semibold tracking-tight text-primary lg:px-4 lg:text-[26px]"
          aria-label="SCHE-APP — Công việc"
          title="Công việc"
        >
          SCHE-APP
        </Link>

        <TaskSidebar />
      </aside>

      <div className="flex min-w-0 flex-col bg-canvas pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <header className="relative z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-2 text-muted">
            <Link
              to="/tasks"
              aria-label="SCHE-APP — Công việc"
              className="font-display text-lg font-semibold tracking-tight text-primary md:hidden"
            >
              SCHE-APP
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <Link
              to="/calendar"
              aria-label="Mở lịch biểu"
              title={new Intl.DateTimeFormat("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }).format(new Date())}
              className="hidden size-11 items-center justify-center rounded-control text-muted hover:bg-stone sm:flex"
            >
              <CalendarDays
                size={18}
                strokeWidth={1.5}
                className="text-primary"
                aria-hidden="true"
              />
            </Link>
            <div ref={menuRef} className="relative">
              <button
                type="button"
                className="flex min-h-11 items-center gap-2 rounded-control px-1"
                aria-label="Tài khoản"
                aria-haspopup="menu"
                aria-expanded={open}
                title={email}
                onClick={() => setOpen((value) => !value)}
              >
                <span className="grid size-9 place-items-center rounded-full border border-line bg-surface text-primary">
                  {initial}
                </span>
                <ChevronDown
                  size={15}
                  className="text-primary"
                  aria-hidden="true"
                />
              </button>
              {open && (
                <div
                  role="menu"
                  className="dropdown-panel absolute right-0 z-30 mt-1.5 w-60"
                >
                  <p className="truncate border-b border-line px-3 py-3 text-sm text-muted">
                    {email}
                  </p>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex h-11 w-full items-center gap-2 rounded-control px-3 text-left hover:bg-doing-bg hover:text-primary"
                    onClick={handleLogout}
                  >
                    <LogOut size={17} aria-hidden="true" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        {error && (
          <p role="alert" className="px-4 pt-4 text-danger md:px-8">
            {error}
          </p>
        )}
        <main className="w-full min-w-0 flex-1 px-4 py-6 md:px-7 md:pt-8 md:pb-8 xl:px-9">
          <Outlet />
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Mục chính"
      >
        <div className="grid h-16 grid-cols-4">
          {ITEMS.map(([path, label, Icon]) => (
            <NavLink
              key={path}
              to={path}
              end
              aria-label={label}
              title={label}
              className={({ isActive }) =>
                `flex items-center justify-center ${isActive ? "text-primary" : "text-muted"}`
              }
            >
              <Icon size={21} strokeWidth={1.6} aria-hidden="true" />
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function AppShell({ user }) {
  return (
    <ProjectProvider>
      <NotesProvider key={user?.id}>
        <WorkspaceShell user={user} />
      </NotesProvider>
    </ProjectProvider>
  );
}
