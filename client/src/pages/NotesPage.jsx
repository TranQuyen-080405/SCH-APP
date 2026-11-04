import { useCallback, useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import EmptyState from "../components/EmptyState.jsx";
import NoteEditor from "../components/NoteEditor.jsx";
import Toast from "../components/Toast.jsx";
import { formatDay } from "../dates.js";
import { splitError } from "../services/api.js";
import { createNote, deleteNote, listNotes, updateNote } from "../services/noteApi.js";

function NoteCard({ note, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <article className="border-b border-line py-3">
      <div className="flex items-start gap-2">
        {note.title ? (
          <h3 className="line-clamp-2 min-w-0 flex-1 text-[15px] font-semibold break-words text-ink">{note.title}</h3>
        ) : (
          <span className="flex-1" />
        )}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center"
            aria-label="Mở menu ghi chú"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <MoreHorizontal size={20} aria-hidden="true" />
          </button>
          {open ? (
            <div role="menu" className="absolute right-0 z-20 mt-1 w-40 rounded-card border border-line bg-surface p-1 shadow-overlay">
              <button
                type="button"
                role="menuitem"
                className="flex h-11 w-full items-center rounded-control px-3 text-left"
                onClick={() => {
                  setOpen(false);
                  onEdit(note);
                }}
              >
                Sửa
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex h-11 w-full items-center rounded-control px-3 text-left text-danger"
                onClick={() => {
                  setOpen(false);
                  onDelete(note);
                }}
              >
                Xóa
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {note.content ? <p className="mt-1 line-clamp-3 text-sm break-words whitespace-pre-wrap text-ink">{note.content}</p> : null}
    </article>
  );
}

export default function NotesPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [status, setStatus] = useState("loading");
  const [editor, setEditor] = useState(null);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await listNotes();
      setNotes(Array.isArray(data?.notes) ? data.notes : []);
      setStatus("ready");
    } catch (error) {
      if (error.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setStatus(error.network ? "network" : "error");
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(body) {
    if (saving || !editor) return;
    setSaving(true);
    setFormError(null);
    try {
      if (editor.mode === "create") await createNote(body);
      else await updateNote(editor.note.id, body);
      setToast({ id: Date.now(), message: editor.mode === "create" ? "Đã thêm ghi chú" : "Đã lưu ghi chú" });
      setEditor(null);
      setActionError("");
      await load();
    } catch (error) {
      if (error.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setFormError(splitError(error));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteNote(pendingDelete.id);
      setPendingDelete(null);
      setToast({ id: Date.now(), message: "Đã xóa ghi chú" });
      setActionError("");
      await load();
    } catch (error) {
      if (error.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setPendingDelete(null);
      setActionError(error.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="hidden text-2xl font-semibold text-ink md:block">Ghi chú</h1>
        <p className="text-sm text-muted">
          Chỗ ghi ý theo ngày. Không phải danh sách việc: không có Cần làm, Đang làm hay Hoàn thành.
        </p>
      </div>
      <button
        type="button"
        className="h-11 border border-line bg-surface px-3 text-left text-ink"
        onClick={() => {
          setFormError(null);
          setEditor({ mode: "create", note: null });
        }}
      >
        Viết ghi chú cho một ngày...
      </button>
      {actionError ? (
        <p role="alert" className="text-sm text-danger">
          {actionError}
        </p>
      ) : null}
      {status === "loading" ? <p className="text-sm text-muted">Đang tải...</p> : null}
      {status === "error" || status === "network" ? (
        <EmptyState
          variant="error"
          message={status === "network" ? "Không kết nối được máy chủ." : "Không thể tải ghi chú"}
          onRetry={load}
        />
      ) : null}
      {status === "ready" && notes.length === 0 ? (
        <p className="py-8 text-center text-muted" role="status">
          Chưa có ghi chú nào.
        </p>
      ) : null}
      {status === "ready" && notes.length > 0
        ? notes.reduce((groups, note) => {
            const date = note.notedOn || "";
            const last = groups[groups.length - 1];
            if (!last || last.date !== date) groups.push({ date, notes: [note] });
            else last.notes.push(note);
            return groups;
          }, []).map((group) => (
            <section key={group.date || "none"}>
              <h2 className="border-b border-ink pb-1 text-sm font-semibold text-ink">
                {group.date ? `Ngày ${formatDay(group.date)}` : "Chưa có ngày"}
              </h2>
              {group.notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={(item) => {
                    setFormError(null);
                    setEditor({ mode: "edit", note: item });
                  }}
                  onDelete={setPendingDelete}
                />
              ))}
            </section>
          ))
        : null}
      {editor ? (
        <NoteEditor
          key={editor.note?.id || "new"}
          mode={editor.mode}
          initial={editor.note}
          submitting={saving}
          error={formError}
          onSubmit={handleSubmit}
          onClose={() => {
            if (!saving) setEditor(null);
          }}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Xóa ghi chú?"
        body="Ghi chú này sẽ bị xóa và không thể khôi phục."
        confirmLabel="Xóa"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => {
          if (!deleting) setPendingDelete(null);
        }}
      />
      {toast ? <Toast key={toast.id} message={toast.message} onDone={() => setToast(null)} /> : null}
    </div>
  );
}
