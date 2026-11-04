import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import ReflectionForm from "../components/ReflectionForm.jsx";
import TaskForm from "../components/TaskForm.jsx";
import Toast from "../components/Toast.jsx";
import { splitError } from "../services/api.js";
import { createTask, deleteTask, updateTask } from "../services/taskApi.js";

export function useTaskEditor(reload) {
  const navigate = useNavigate();
  const reloadRef = useRef(reload);
  const savingRef = useRef(false);
  const reflectingRef = useRef(false);
  const pendingRef = useRef(new Set());
  reloadRef.current = reload;

  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [formMode, setFormMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [createInitial, setCreateInitial] = useState(null);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [offer, setOffer] = useState(null);
  const [reflectTask, setReflectTask] = useState(null);
  const [reflectError, setReflectError] = useState(null);
  const [reflecting, setReflecting] = useState(false);
  const [actionError, setActionError] = useState("");

  function leave(error) {
    if (error?.status === 401) {
      navigate("/login", { replace: true });
      return true;
    }
    return false;
  }

  function showToast(message) {
    setToast({ id: Date.now(), message });
  }

  function openCreate(initial) {
    setReflectTask(null);
    setEditing(null);
    setCreateInitial(initial || null);
    setFormError(null);
    setFormMode("create");
  }

  function openEdit(task) {
    setReflectTask(null);
    setEditing(task);
    setFormError(null);
    setFormMode("edit");
  }

  function openReflect(task) {
    if (savingRef.current) return;
    setFormMode(null);
    setEditing(null);
    setFormError(null);
    setReflectError(null);
    setOffer(null);
    setReflectTask(task);
  }

  function closeForm() {
    if (savingRef.current) return;
    setFormMode(null);
    setEditing(null);
    setFormError(null);
  }

  function closeReflect() {
    if (reflectingRef.current) return;
    setReflectTask(null);
    setReflectError(null);
  }

  async function handleSubmit(body) {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setFormError(null);
    try {
      const saved = formMode === "create" ? await createTask(body) : await updateTask(editing.id, body);
      const becameDone = body.status === "done" && (formMode === "create" || editing?.status !== "done");
      showToast(formMode === "create" ? "Đã thêm công việc" : "Đã lưu công việc");
      setFormMode(null);
      setEditing(null);
      setActionError("");
      if (becameDone && saved?.task) setOffer(saved.task);
      await reloadRef.current?.();
    } catch (error) {
      if (!leave(error)) setFormError(splitError(error));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function saveReflection(body) {
    if (!reflectTask || reflectingRef.current) return;
    reflectingRef.current = true;
    setReflecting(true);
    setReflectError(null);
    try {
      await updateTask(reflectTask.id, body);
      showToast("Đã lưu ghi chú");
      setReflectTask(null);
      setOffer(null);
      setActionError("");
      await reloadRef.current?.();
    } catch (error) {
      if (!leave(error)) setReflectError(splitError(error));
    } finally {
      reflectingRef.current = false;
      setReflecting(false);
    }
  }

  async function changeStatus(task, next, setTasks) {
    if (next === task.status || pendingRef.current.has(task.id)) return;
    pendingRef.current.add(task.id);
    setPendingIds(new Set(pendingRef.current));
    setTasks?.((current) =>
      current.map((item) => (item.id === task.id ? { ...item, status: next } : item)),
    );
    try {
      const saved = await updateTask(task.id, { status: next });
      if (next === "done" && saved?.task) setOffer(saved.task);
      else setOffer((current) => (current?.id === task.id ? null : current));
      setActionError("");
      await reloadRef.current?.();
    } catch (error) {
      if (!leave(error)) {
        const reloaded = await reloadRef.current?.();
        if (reloaded) setActionError(error.message);
      }
    } finally {
      pendingRef.current.delete(task.id);
      setPendingIds(new Set(pendingRef.current));
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    const id = pendingDelete.id;
    setDeleting(true);
    try {
      await deleteTask(id);
      setPendingDelete(null);
      setOffer((current) => (current?.id === id ? null : current));
      showToast("Đã xóa công việc");
      setActionError("");
      await reloadRef.current?.();
    } catch (error) {
      if (!leave(error)) {
        setPendingDelete(null);
        setActionError(error.message);
      }
    } finally {
      setDeleting(false);
    }
  }

  const banner = offer ? (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 md:flex-row md:items-center md:justify-between"
    >
      <p>Đã hoàn thành.</p>
      <div className="flex flex-col gap-2 md:flex-row">
        <button
          type="button"
          className="h-11 rounded-control bg-primary px-4 font-medium text-white hover:bg-primary-hover"
          onClick={() => openReflect(offer)}
        >
          Ghi nhận kết quả
        </button>
        <button
          type="button"
          className="h-11 rounded-control border border-line bg-surface px-4"
          onClick={() => setOffer(null)}
        >
          Bỏ qua
        </button>
      </div>
    </div>
  ) : null;

  const ui = (
    <>
      {formMode ? (
        <TaskForm
          mode={formMode}
          initial={formMode === "edit" ? editing : createInitial}
          submitting={saving}
          error={formError}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
      ) : null}
      {reflectTask ? (
        <ReflectionForm
          key={reflectTask.id}
          task={reflectTask}
          submitting={reflecting}
          error={reflectError}
          onSubmit={saveReflection}
          onClose={closeReflect}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Xóa công việc?"
        body="Công việc này sẽ bị xóa và không thể khôi phục."
        confirmLabel="Xóa"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => {
          if (!deleting) setPendingDelete(null);
        }}
      />
      {toast ? <Toast key={toast.id} message={toast.message} onDone={() => setToast(null)} /> : null}
    </>
  );

  return {
    openCreate,
    openEdit,
    changeStatus,
    requestDelete: setPendingDelete,
    pendingIds,
    actionError,
    setActionError,
    banner,
    ui,
  };
}
