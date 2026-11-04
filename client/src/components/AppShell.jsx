import { useState } from "react";
import { CalendarDays, ChartNoAxesColumn, ListTodo, LogOut, NotebookPen } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { logout } from "../services/authApi.js";

const ITEMS = [
  ["/tasks", "Công việc", ListTodo],
  ["/calendar", "Lịch", CalendarDays],
  ["/notes", "Ghi chú", NotebookPen],
  ["/overview", "Tổng quan", ChartNoAxesColumn],
];

function navClass(active, iconOnly) {
  return `flex items-center rounded-control text-sm font-medium ${
    iconOnly ? "h-11 w-11 justify-center" : "h-11 gap-3 px-3"
  } ${active ? "bg-doing-bg text-primary" : "text-muted hover:bg-todo-bg"}`;
}

export default function AppShell({ user }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const title = ITEMS.find(([path]) => path === pathname)?.[1] || "SCH-APP";
  const email = user?.email || "";
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

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
    <div className="min-h-dvh bg-canvas md:grid md:grid-cols-[4rem_minmax(0,1fr)] lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface md:flex">
        <div className="flex h-14 items-center px-3 lg:px-4">
          <p className="hidden text-base font-semibold text-ink lg:block">SCH-APP</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-2 lg:px-3" aria-label="Mục chính">
          {ITEMS.map(([path, label, Icon]) => (
            <NavLink key={path} to={path} end title={label} aria-label={label} className={({ isActive }) => navClass(isActive, true) + " lg:w-auto lg:justify-start lg:gap-3 lg:px-3"}>
              <Icon size={20} aria-hidden="true" />
              <span className="hidden lg:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line p-2 lg:p-3">
          <p className="hidden truncate px-3 pb-1 text-[13px] text-muted lg:block" title={email}>
            {email}
          </p>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-control text-ink lg:w-full lg:justify-start lg:gap-3 lg:px-3"
            title="Đăng xuất"
            aria-label="Đăng xuất"
            onClick={handleLogout}
          >
            <LogOut size={18} aria-hidden="true" />
            <span className="hidden text-sm font-medium lg:inline">Đăng xuất</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-surface px-4 md:hidden">
          <h1 className="text-[22px] font-semibold text-ink">{title}</h1>
          <div className="relative">
            <button
              type="button"
              className="flex h-11 max-w-36 items-center justify-end"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label="Tài khoản"
              title={email}
              onClick={() => setOpen((value) => !value)}
            >
              <span className="truncate text-sm">{email}</span>
            </button>
            {open ? (
              <div role="menu" className="absolute right-0 z-30 mt-1 min-w-40 rounded-card border border-line bg-surface p-1 shadow-overlay">
                <button
                  type="button"
                  role="menuitem"
                  className="flex h-11 w-full items-center rounded-control px-3 text-left"
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                >
                  Đăng xuất
                </button>
              </div>
            ) : null}
          </div>
        </header>

        {error ? (
          <p role="alert" className="mx-auto w-full max-w-[1120px] px-4 pt-4 text-sm text-danger md:px-8">
            {error}
          </p>
        ) : null}

        <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-4 md:px-8 md:py-8">
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
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 text-[13px] font-medium ${
                  isActive ? "text-primary" : "text-muted"
                }`
              }
            >
              <Icon size={20} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
