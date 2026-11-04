import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import SortSelect from "../components/SortSelect.jsx";
import StatusTabs from "../components/StatusTabs.jsx";
import TaskList from "../components/TaskList.jsx";
import { useTaskEditor } from "../hooks/useTaskEditor.jsx";
import { listTasks } from "../services/taskApi.js";

export default function TasksPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialStatus = params.get("status");
  const [tab, setTab] = useState(
    initialStatus === "todo" || initialStatus === "doing" || initialStatus === "done" ? initialStatus : "all",
  );
  const [sort, setSort] = useState("newest");
  const [tasks, setTasks] = useState([]);
  const [listStatus, setListStatus] = useState("loading");
  const requestId = useRef(0);

  const load = useCallback(
    async (mode) => {
      const id = ++requestId.current;
      if (mode === "skeleton") setListStatus("loading");
      try {
        const data = await listTasks(tab, sort);
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
    [navigate, sort, tab],
  );

  const editor = useTaskEditor(load);

  useEffect(() => {
    load("skeleton");
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div className="hidden items-center justify-between gap-3 md:flex">
        <h1 className="text-2xl font-semibold text-ink">Công việc</h1>
        <button
          type="button"
          className="inline-flex h-11 items-center gap-1 rounded-control bg-primary px-4 font-medium text-white hover:bg-primary-hover"
          onClick={() => editor.openCreate()}
        >
          <Plus size={18} aria-hidden="true" />
          Thêm công việc
        </button>
      </div>

      {editor.actionError ? (
        <p role="alert" className="text-sm text-danger">
          {editor.actionError}
        </p>
      ) : null}
      {editor.banner}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <StatusTabs
          value={tab}
          onChange={(next) => {
            editor.setActionError("");
            setTab(next);
          }}
        />
        <div className="flex justify-end">
          <SortSelect
            value={sort}
            onChange={(next) => {
              editor.setActionError("");
              setSort(next);
            }}
          />
        </div>
      </div>

      <TaskList
        tasks={tasks}
        status={listStatus}
        emptyVariant={tab === "all" ? "empty" : "filtered"}
        pendingIds={editor.pendingIds}
        onEdit={editor.openEdit}
        onDelete={editor.requestDelete}
        onStatus={(task, status) => editor.changeStatus(task, status, setTasks)}
        onRetry={() => load("skeleton")}
      />

      <button
        type="button"
        className="fixed right-4 bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] z-40 inline-flex h-12 items-center gap-1 rounded-full bg-primary px-4 font-medium text-white hover:bg-primary-hover md:hidden"
        onClick={() => editor.openCreate()}
      >
        <Plus size={18} aria-hidden="true" />
        Thêm việc
      </button>
      {editor.ui}
    </div>
  );
}
