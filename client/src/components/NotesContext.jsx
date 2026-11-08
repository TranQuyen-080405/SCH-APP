import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router";
import { X } from "lucide-react";
import {
  createNote,
  deleteNote,
  listNotes,
  updateNote,
} from "../services/noteApi.js";
import { splitError } from "../services/api.js";
import { floatingNoteGeometry } from "../noteLayout.js";
import NoteCard from "./NoteCard.jsx";
import NoteEditor from "./NoteEditor.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import Toast from "./Toast.jsx";

const NotesContext = createContext(null);
export function useNotes() {
  return useContext(NotesContext);
}

export function NotesProvider({ children }) {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [status, setStatus] = useState("loading");
  const [floating, setFloating] = useState([]);
  const [draft, setDraft] = useState(null);
  const [dropSlot, setDropSlot] = useState(null);
  const [positionSaving, setPositionSaving] = useState(false);
  const [front, setFront] = useState(null);
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const [editor, setEditor] = useState(null);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [actionError, setActionError] = useState("");
  const requestId = useRef(0);
  const dragRef = useRef(null);
  const positionPending = useRef(false);
  const boardPositions = useRef(new Map());

  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const data = await listNotes();
      if (id !== requestId.current) return;
      if (!Array.isArray(data?.notes)) throw new Error("Không thể tải ghi chú");
      setNotes(data.notes);
      for (const id of boardPositions.current.keys()) {
        if (!data.notes.some((note) => note.id === id)) boardPositions.current.delete(id);
      }
      setFloating((current) => {
        const retained = current.filter((entry) =>
          data.notes.some((note) => note.id === entry.id),
        );
        return retained.length === current.length ? current : retained;
      });
      setStatus("ready");
    } catch (error) {
      if (id !== requestId.current) return;
      if (error.status === 401) navigate("/login", { replace: true });
      else setStatus(error.network ? "network" : "error");
    }
  }, [navigate]);
  useEffect(() => {
    load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);
  useEffect(() => {
    function resize() {
      dragRef.current = null;
      setDraft(null);
      setDropSlot(null);
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function lift(note, position) {
    const { x, y } = floatingNoteGeometry(position, viewport);
    setFloating((current) => [
      ...current.filter((entry) => entry.id !== note.id),
      { id: note.id, x, y },
    ]);
    setFront(note.id);
  }
  useEffect(() => {
    const entry = floating.at(-1);
    if (!entry) return;
    document
      .querySelector(
        `article[data-floating="true"][data-note-id="${entry.id}"] button`,
      )
      ?.focus({ preventScroll: true });
  }, [floating]);
  function start(event, card) {
    if (event.button !== 0 || dragRef.current || saving || deleting || positionPending.current) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.closest("article").getBoundingClientRect();
    dragRef.current = {
      note: card.note,
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      x: rect.left,
      y: rect.top,
      position: null,
    };
    setFront(card.note.id);
  }
  function move(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.clientX,
      dy = event.clientY - drag.clientY;
    if (!drag.position && Math.hypot(dx, dy) < 4) return;
    const position = floatingNoteGeometry(
      { x: drag.x + dx, y: drag.y + dy },
      viewport,
    );
    drag.position = position;
    setDraft({ id: drag.note.id, ...position });
    const target = document.elementsFromPoint(event.clientX, event.clientY)
      .map((element) => element.closest("[data-note-slot]"))
      .find(Boolean);
    const candidate = target ? {
      index: Number(target.dataset.noteSlot), x: Number(target.dataset.slotX), y: Number(target.dataset.slotY),
      available: !target.dataset.occupied || Number(target.dataset.occupied) === drag.note.id,
    } : null;
    drag.target = candidate;
    setDropSlot(candidate);
  }
  function end(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (drag.position && (!drag.target || drag.target.available)) {
      placeNote(drag.note, drag.target?.available ? drag.target : null, drag.position);
    }
    setDraft(null);
    setDropSlot(null);
  }
  function cancel() {
    dragRef.current = null;
    setDraft(null);
    setDropSlot(null);
  }
  function nudge(card, delta, step, rect) {
    if (dragRef.current || saving || deleting || positionPending.current) return;
    placeNote(card.note, null, {
      x: rect.left + delta[0] * step,
      y: rect.top + delta[1] * step,
    });
  }
  function returnNote(id) {
    if (dragRef.current?.note.id === id) cancel();
    const note = notes.find((item) => item.id === id);
    const slot = document.querySelector('[data-note-slot][data-occupied=""]');
    if (note && slot) {
      placeNote(note, { x: Number(slot.dataset.slotX), y: Number(slot.dataset.slotY) });
    } else setFloating((current) => current.filter((entry) => entry.id !== id));
  }

  async function placeNote(note, slot, floatingPosition) {
    if (positionPending.current) return;
    const previous = notes.find((item) => item.id === note.id);
    if (!previous) return;
    const wasFloating = floating.find((entry) => entry.id === note.id);
    const previousBoardPosition = boardPositions.current.get(note.id);
    const position = slot ? { x: slot.x, y: slot.y } : null;
    if (slot) {
      boardPositions.current.set(note.id, position);
      setFloating((current) => current.filter((entry) => entry.id !== note.id));
    } else lift(note, floatingPosition);
    setNotes((current) => current.map((item) => item.id === note.id ? { ...item, position } : item));
    if (previous.position?.x === position?.x && previous.position?.y === position?.y) return;
    positionPending.current = true;
    setPositionSaving(true);
    try {
      const data = await updateNote(note.id, { position });
      setNotes((current) => current.map((item) => item.id === note.id ? { ...item, position: data.note.position } : item));
      setActionError("");
    } catch (error) {
      if (previousBoardPosition) boardPositions.current.set(note.id, previousBoardPosition);
      else boardPositions.current.delete(note.id);
      setNotes((current) => current.map((item) => item.id === note.id ? { ...item, position: previous.position } : item));
      setFloating((current) => [...current.filter((entry) => entry.id !== note.id), ...(wasFloating ? [wasFloating] : [])]);
      if (error.status === 401) navigate("/login", { replace: true });
      else setActionError("Không lưu được vị trí; ghi chú đã trở về vị trí trước. " + error.message);
    } finally {
      positionPending.current = false;
      setPositionSaving(false);
    }
  }

  function dockFront(slot) {
    const entry = floating.find((item) => item.id === front) || floating.at(-1);
    const note = notes.find((item) => item.id === entry?.id);
    if (note && !saving && !deleting) placeNote(note, slot);
  }
  function openEdit(note) {
    setFormError(null);
    setEditor({ mode: "edit", note });
  }
  async function save(body) {
    if (saving || !editor) return;
    setSaving(true);
    setFormError(null);
    try {
      const data =
        editor.mode === "create"
          ? await createNote(body)
          : await updateNote(editor.note.id, body);
      setNotes((current) =>
        editor.mode === "create"
          ? [data.note, ...current]
          : current.map((note) =>
              note.id === data.note.id ? data.note : note,
            ),
      );
      setToast({
        id: Date.now(),
        message:
          editor.mode === "create" ? "Đã thêm ghi chú" : "Đã lưu ghi chú",
      });
      setEditor(null);
      setActionError("");
      await load();
    } catch (error) {
      if (error.status === 401) navigate("/login", { replace: true });
      else setFormError(splitError(error));
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteNote(pendingDelete.id);
      setNotes((current) =>
        current.filter((note) => note.id !== pendingDelete.id),
      );
      setFloating((current) => current.filter((entry) => entry.id !== pendingDelete.id));
      boardPositions.current.delete(pendingDelete.id);
      setPendingDelete(null);
      setActionError("");
      setToast({ id: Date.now(), message: "Đã xóa ghi chú" });
    } catch (error) {
      if (error.status === 401) navigate("/login", { replace: true });
      else {
        setPendingDelete(null);
        setActionError(error.message);
      }
    } finally {
      setDeleting(false);
    }
  }

  const value = {
    notes,
    status,
    load,
    floatingIds: new Set(floating.map((entry) => entry.id)),
    draft,
    dropSlot,
    boardPositions,
    dockFront,
    front,
    openCreate: () => {
      setFormError(null);
      setEditor({ mode: "create", note: null });
    },
    openEdit,
    requestDelete: setPendingDelete,
    setFront,
    start,
    move,
    end,
    cancel,
    nudge,
    busy: saving || deleting || positionSaving,
  };
  return (
    <NotesContext.Provider value={value}>
      {children}
      <p id="note-move-help" className="sr-only">
        Kéo vào ô trống để xếp ghi chú, kéo ra ngoài các ô để đưa lên lớp nổi.
        Giấy nổi vẫn hiện khi đổi mục. Nhấn X để cất về bảng hoặc chọn một ô trống.
        Có thể di chuyển bằng phím mũi tên; Escape hủy kéo.
      </p>
      {floating.length > 0 && (
        <section
          aria-label="Ghi chú nổi"
          className="pointer-events-none fixed inset-0 z-40"
        >
          {floating.map((entry) => {
            const note = notes.find((item) => item.id === entry.id);
            if (!note) return null;
            const position = floatingNoteGeometry(
              draft?.id === entry.id ? draft : entry,
              viewport,
            );
            return (
              <NoteCard
                key={entry.id}
                card={{ note, ...position }}
                position={position}
                floating
                active={front === entry.id}
                pending={saving || deleting || positionSaving}
                onFront={() => setFront(entry.id)}
                onEdit={openEdit}
                onDelete={setPendingDelete}
                onStart={start}
                onMove={move}
                onEnd={end}
                onCancel={cancel}
                onNudge={nudge}
                onReturn={() => returnNote(entry.id)}
              />
            );
          })}
        </section>
      )}
      {editor && (
        <NoteEditor
          key={editor.note?.id || "new"}
          mode={editor.mode}
          initial={editor.note}
          submitting={saving}
          error={formError}
          onSubmit={save}
          onClose={() => {
            if (!saving) setEditor(null);
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Xóa ghi chú?"
        body="Ghi chú này sẽ bị xóa và không thể khôi phục."
        confirmLabel="Xóa"
        busy={deleting}
        onConfirm={remove}
        onClose={() => {
          if (!deleting) setPendingDelete(null);
        }}
      />
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          onDone={() => setToast(null)}
        />
      )}
      {actionError && (
        <div
          role="alert"
          className="fixed inset-x-4 bottom-20 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-card border border-line bg-surface p-4 text-sm text-danger shadow-overlay"
        >
          <p className="min-w-0 flex-1">{actionError}</p>
          <button
            type="button"
            aria-label="Đóng thông báo"
            className="grid size-11 shrink-0 place-items-center rounded-control"
            onClick={() => setActionError("")}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </NotesContext.Provider>
  );
}
