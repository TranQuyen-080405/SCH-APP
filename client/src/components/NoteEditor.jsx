import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { localTodayIso } from "../dates.js";
import ConfirmDialog from "./ConfirmDialog.jsx";
import FormField from "./FormField.jsx";

const emptyError = { form: "", fields: {} };

export default function NoteEditor({ mode, initial, submitting, error, onSubmit, onClose }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [notedOn, setNotedOn] = useState(() => initial?.notedOn || localTodayIso());
  const [clientError, setClientError] = useState(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const onCloseRef = useRef(onClose);
  const submittingRef = useRef(submitting);
  onCloseRef.current = onClose;
  submittingRef.current = submitting;
  const shown = clientError || error || emptyError;
  const dirty =
    title !== (initial?.title ?? "") ||
    content !== (initial?.content ?? "") ||
    notedOn !== (initial?.notedOn || localTodayIso());
  const dirtyRef = useRef(dirty);
  const confirmRef = useRef(false);
  dirtyRef.current = dirty;
  confirmRef.current = confirmDiscard;

  useEffect(() => {
    function onKey(event) {
      if (event.key !== "Escape" || submittingRef.current || confirmRef.current) return;
      if (dirtyRef.current) setConfirmDiscard(true);
      else onCloseRef.current();
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, []);

  function requestClose() {
    if (submittingRef.current) return;
    if (dirtyRef.current) {
      setConfirmDiscard(true);
      return;
    }
    onCloseRef.current();
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    if (title.length > 120) {
      setClientError({ form: "", fields: { title: "Tiêu đề không được dài quá 120 ký tự" } });
      return;
    }
    if (content.length > 10000) {
      setClientError({ form: "", fields: { content: "Nội dung không được dài quá 10000 ký tự" } });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(notedOn)) {
      setClientError({ form: "", fields: { notedOn: "Ngày ghi chú không hợp lệ" } });
      return;
    }
    if (title.trim() === "" && content.trim() === "") {
      setClientError({ form: "Cần có tiêu đề hoặc nội dung", fields: {} });
      return;
    }
    setClientError(null);
    onSubmit({ title: title.trim(), content: content.trim(), notedOn });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-canvas md:bg-ink/40">
      <div className="flex min-h-dvh justify-center md:items-center md:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-editor-title"
          className="flex min-h-dvh w-full flex-col bg-surface md:min-h-0 md:w-[560px] md:rounded-card md:shadow-overlay"
        >
          <div className="flex h-14 items-center gap-2 border-b border-line px-4">
            <div className="min-w-0 flex-1">
              <h2 id="note-editor-title" className="text-base font-semibold">
                {mode === "create" ? "Ghi chú mới" : "Sửa ghi chú"}
              </h2>
              <p className="text-[13px] text-muted">Ghi theo ngày. Không phải việc, không có trạng thái.</p>
            </div>
            <button type="button" className="flex h-11 w-11 items-center justify-center" aria-label="Đóng" onClick={requestClose} disabled={submitting}>
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 px-4 py-4">
              {shown.form ? (
                <p role="alert" className="text-sm text-danger">
                  {shown.form}
                </p>
              ) : null}
              <FormField
                label="Ngày ghi chú"
                name="notedOn"
                type="date"
                value={notedOn}
                onChange={(event) => setNotedOn(event.target.value)}
                error={shown.fields.notedOn}
              />
              <FormField
                label="Tiêu đề, có thể bỏ nếu đã viết nội dung"
                name="title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                error={shown.fields.title}
                autoFocus
              />
              <FormField label="Nội dung" name="content" error={shown.fields.content}>
                <textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-40 py-3" />
              </FormField>
            </div>
            <div className="mt-auto flex flex-col gap-2 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] md:flex-row md:justify-end md:pb-6">
              <button type="button" className="h-11 rounded-control border border-line bg-surface px-4" onClick={requestClose} disabled={submitting}>
                Hủy
              </button>
              <button type="submit" className="h-11 rounded-control bg-primary px-4 font-medium text-white hover:bg-primary-hover disabled:opacity-60" disabled={submitting}>
                {submitting ? "Đang lưu..." : "Lưu ghi chú"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDiscard}
        title="Bỏ thay đổi?"
        body="Nội dung chưa lưu sẽ mất."
        confirmLabel="Bỏ"
        busy={false}
        onConfirm={() => {
          setConfirmDiscard(false);
          onCloseRef.current();
        }}
        onClose={() => setConfirmDiscard(false)}
      />
    </div>
  );
}
