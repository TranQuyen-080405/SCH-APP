import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import FormField from "./FormField.jsx";
import Select from "./Select.jsx";

export const RATING_LABELS = {
  good: "Tốt",
  met: "Đạt yêu cầu",
  improve: "Cần cải thiện",
};

const RATINGS = [
  ["", "Không chọn"],
  ["good", "Tốt"],
  ["met", "Đạt yêu cầu"],
  ["improve", "Cần cải thiện"],
];

export function OutcomeFields({
  note,
  rating,
  onNote,
  onRating,
  noteError,
  ratingError,
  heading = true,
}) {
  return (
    <div className="flex flex-col gap-4">
      {heading ? <h3 className="text-base font-medium text-ink">Kết quả công việc</h3> : null}
      <FormField label="Tự đánh giá" name="outcomeRating" error={ratingError}>
        <Select value={rating} onChange={onRating} options={RATINGS} className="h-11" />
      </FormField>
      <FormField label="Ghi chú kết quả" name="outcomeNote" error={noteError}>
        <textarea
          value={note}
          placeholder="Bạn đã làm được gì? Có điều gì cần cải thiện?"
          onChange={(event) => onNote(event.target.value)}
          className="min-h-28 py-3"
        />
      </FormField>
    </div>
  );
}

const emptyError = { form: "", fields: {} };

export default function ReflectionForm({ task, submitting, error, onSubmit, onClose }) {
  const [note, setNote] = useState(task?.outcomeNote ?? "");
  const [rating, setRating] = useState(task?.outcomeRating ?? "");
  const onCloseRef = useRef(onClose);
  const submittingRef = useRef(submitting);
  onCloseRef.current = onClose;
  submittingRef.current = submitting;
  const shown = error || emptyError;

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape" && !submittingRef.current) onCloseRef.current();
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    onSubmit({
      outcomeNote: note,
      outcomeRating: rating || null,
    });
  }

  function requestClose() {
    if (!submitting) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-canvas md:bg-ink/40">
      <div className="flex min-h-dvh justify-center md:items-center md:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reflection-title"
          className="flex min-h-dvh w-full flex-col bg-surface md:min-h-0 md:w-[520px] md:rounded-card md:shadow-overlay"
        >
          <div className="flex h-14 items-center gap-2 border-b border-line px-4 md:h-16 md:px-6">
            <button type="button" className="h-11 px-2 md:hidden" onClick={requestClose} disabled={submitting}>
              Hủy
            </button>
            <h2 id="reflection-title" className="min-w-0 flex-1 text-base font-medium">
              Kết quả công việc
            </h2>
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
          <form className="flex flex-1 flex-col" autoComplete="off" noValidate onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 px-4 py-4 md:px-6">
              {task?.title ? <p className="text-sm break-words text-muted">{task.title}</p> : null}
              {shown.form ? (
                <p role="alert" className="text-sm text-danger">
                  {shown.form}
                </p>
              ) : null}
              <OutcomeFields
                heading={false}
                note={note}
                rating={rating}
                onNote={setNote}
                onRating={setRating}
                noteError={shown.fields?.outcomeNote}
                ratingError={shown.fields?.outcomeRating}
              />
            </div>
            <div className="mt-auto flex flex-col gap-2 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] md:flex-row md:justify-end md:px-6 md:pb-6">
              <button
                type="button"
                className="hidden h-11 items-center justify-center rounded-control border border-line bg-surface px-4 md:inline-flex"
                onClick={requestClose}
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-control bg-primary px-4 text-white hover:bg-primary-hover disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? "Đang lưu..." : "Lưu ghi chú"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
