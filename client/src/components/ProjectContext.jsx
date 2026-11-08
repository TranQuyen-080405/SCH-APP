import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { useNavigate } from "react-router";
import * as api from "../services/projectApi.js";
import ProjectForm from "./ProjectForm.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import Toast from "./Toast.jsx";

const ProjectContext = createContext(null);

export function useProjects() {
  return useContext(ProjectContext);
}

export function ProjectProvider({ children }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [projectStatus, setProjectStatus] = useState("loading");
  const [projectError, setProjectError] = useState("");
  const [projectRevision, setProjectRevision] = useState(0);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState(null);
  const requestId = useRef(0);

  const refreshProjects = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const data = await api.listProjects();
      if (id !== requestId.current) return false;
      if (!Array.isArray(data?.projects))
        throw new Error("Không thể tải dự án.");
      setProjects(data.projects);
      setProjectStatus("ready");
      setProjectError("");
      return true;
    } catch (error) {
      if (id !== requestId.current) return false;
      if (error.status === 401) navigate("/login", { replace: true });
      setProjectStatus("error");
      setProjectError(error.message || "Không thể tải dự án.");
      return false;
    }
  }, [navigate]);
  useEffect(() => {
    refreshProjects();
    return () => { requestId.current += 1; };
  }, [refreshProjects]);

  async function save(body) {
    if (busy || !editing) return;
    setBusy(true);
    setFormError("");
    try {
      const result = editing.project
        ? await api.updateProject(editing.project.id, body)
        : await api.createProject(body);
      const isNew = !editing.project;
      setEditing(null);
      setProjectRevision((value) => value + 1);
      await refreshProjects();
      setToast({
        id: Date.now(),
        message: isNew ? "Đã tạo dự án" : "Đã lưu dự án",
      });
      if (isNew) navigate(`/tasks?projectId=${result.project.id}`);
    } catch (error) {
      if (error.status === 401) navigate("/login", { replace: true });
      else setFormError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy || !pendingDelete) return;
    setBusy(true);
    try {
      await api.deleteProject(pendingDelete.id);
      setPendingDelete(null);
      setProjectRevision((value) => value + 1);
      await refreshProjects();
      setToast({
        id: Date.now(),
        message: "Đã xóa dự án. Công việc đã được giữ lại.",
      });
      navigate("/tasks?projectId=none");
    } catch (error) {
      if (error.status === 401) navigate("/login", { replace: true });
      else setProjectError(error.message);
      setPendingDelete(null);
    } finally {
      setBusy(false);
    }
  }

  const value = {
    projects,
    projectStatus,
    projectError,
    projectRevision,
    refreshProjects,
    openCreateProject: () => {
      setFormError("");
      setEditing({ project: null });
    },
    openEditProject: (project) => {
      setFormError("");
      setEditing({ project });
    },
    requestDeleteProject: setPendingDelete,
  };
  return (
    <ProjectContext.Provider value={value}>
      {children}
      <div className="focus-workspace">
        {editing && (
          <ProjectForm
            key={editing.project?.id || "new"}
            project={editing.project}
            busy={busy}
            error={formError}
            onSubmit={save}
            onClose={() => {
              if (!busy) setEditing(null);
            }}
          />
        )}
        <ConfirmDialog
          open={Boolean(pendingDelete)}
          title="Xóa dự án?"
          body="Công việc trong dự án sẽ được giữ lại và chuyển về Chưa chia dự án."
          confirmLabel="Xóa dự án"
          busy={busy}
          onConfirm={remove}
          onClose={() => {
            if (!busy) setPendingDelete(null);
          }}
        />
        {toast && (
          <Toast
            key={toast.id}
            message={toast.message}
            onDone={() => setToast(null)}
          />
        )}
      </div>
    </ProjectContext.Provider>
  );
}
