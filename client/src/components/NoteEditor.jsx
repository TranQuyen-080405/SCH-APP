import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { localTodayIso } from "../dates.js";
import ConfirmDialog from "./ConfirmDialog.jsx";
import FormField from "./FormField.jsx";

const emptyError = { form: "", fields: {} };
const COLORS = [
  ["vàng", "#fff7cc"],
  ["xanh lá", "#e4f4de"],
  ["hồng", "#fce5ef"],
  ["xanh dương", "#e1f0fc"],
];

export default function NoteEditor({
  mode,
  initial,
  submitting,
  error,
  onSubmit,
  onClose,
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const initialColor = initial?.color ?? (initial?.id || 0) % 4;
  const [color, setColor] = useState(initialColor);
  const [notedOn, setNotedOn] = useState(
    () => initial?.notedOn || localTodayIso(),
  );
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
    color !== initialColor ||
    notedOn !== (initial?.notedOn || localTodayIso());
  const dirtyRef = useRef(dirty);
  const confirmRef = useRef(false);
  dirtyRef.current = dirty;
  confirmRef.current = confirmDiscard;

  useEffect(() => {
    function onKey(event) {
      if (event.key !== "Escape" || submittingRef.current || confirmRef.current)
        return;
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
      setClientError({
        form: "",
        fields: { title: "Tiêu đề không được dài quá 120 ký tự" },
      });
      return;
    }
    if (content.length > 10000) {
      setClientError({
        form: "",
        fields: { content: "Nội dung không được dài quá 10000 ký tự" },
      });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(notedOn)) {
      setClientError({
        form: "",
        fields: { notedOn: "Ngày ghi chú không hợp lệ" },
      });
      return;
    }
    if (title.trim() === "" && content.trim() === "") {
      setClientError({ form: "Cần có tiêu đề hoặc nội dung", fields: {} });
      return;
    }
    setClientError(null);
    onSubmit({ title: title.trim(), content: content.trim(), notedOn, color });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-canvas md:bg-ink/25">
      <div className="flex min-h-dvh justify-center md:items-center md:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-editor-title"
          className="sticky-note flex min-h-dvh w-full flex-col md:min-h-[520px] md:w-[560px] md:shadow-overlay"
          data-note-color={color}
        >
          <div className="sticky-note-bar flex h-14 items-center gap-2 px-5">
            <div className="min-w-0 flex-1">
              <h2 id="note-editor-title" className="text-sm font-semibold">
                {mode === "create" ? "Ghi chú mới" : "Sửa ghi chú"}
              </h2>
            </div>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center"
              aria-label="Đóng"
              onClick={requestClose}
              disabled={submitting}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 px-5 py-4">
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Màu giấy</legend>
                <div className="flex gap-2">
                  {COLORS.map(([label, paper], value) => (
                    <button
                      key={label}
                      type="button"
                      aria-label={`Màu ${label}`}
                      aria-pressed={color === value}
                      disabled={submitting}
                      onClick={() => setColor(value)}
                      className={`grid size-11 place-items-center rounded-full border-2 ${color === value ? "border-ink" : "border-ink/15"}`}
                      style={{ backgroundColor: paper }}
                    >
                      {color === value && (
                        <Check size={18} aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </div>
                {shown.fields.color && (
                  <p role="alert" className="mt-2 text-sm text-danger">
                    {shown.fields.color}
                  </p>
                )}
              </fieldset>
              {shown.form ? (
                <p role="alert" className="text-sm text-danger">
                  {shown.form}
                </p>
              ) : null}
              <FormField
                label="Tiêu đề, có thể bỏ nếu đã viết nội dung"
                name="title"
                error={shown.fields.title}
              >
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  autoFocus
                  placeholder="Thêm tiêu đề..."
                  className="h-12 !rounded-none !border-0 !bg-transparent !px-0 !text-lg font-semibold"
                />
              </FormField>
              <FormField
                label="Nội dung"
                name="content"
                error={shown.fields.content}
              >
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Viết điều bạn muốn nhớ..."
                  className="min-h-64 resize-y !rounded-none !border-0 !bg-transparent !px-0 py-2 leading-7"
                />
              </FormField>
            </div>
            <div className="mt-auto flex flex-col gap-4 border-t border-ink/10 px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 sm:max-w-[190px]">
                <FormField
                  label="Ngày ghi chú"
                  name="notedOn"
                  error={shown.fields.notedOn}
                >
                  <input
                    type="date"
                    value={notedOn}
                    onChange={(event) => setNotedOn(event.target.value)}
                    className="h-11 !border-ink/15 !bg-transparent"
                  />
                </FormField>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="h-11 flex-1 rounded-control border border-ink/20 px-4 hover:bg-ink/5 sm:flex-none"
                  onClick={requestClose}
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-11 flex-1 rounded-control bg-primary px-3 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60 sm:flex-none"
                  disabled={submitting}
                >
                  {submitting ? "Đang lưu..." : "Lưu ghi chú"}
                </button>
              </div>
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
