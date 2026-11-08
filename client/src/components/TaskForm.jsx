import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import FormField from "./FormField.jsx";
import Select from "./Select.jsx";
import { OutcomeFields } from "./ReflectionForm.jsx";

const PRIORITIES = [
  ["", "Không gắn ưu tiên"],
  ["low", "Thấp"],
  ["high", "Cao"],
];

const STATUSES = [
  ["todo", "Cần làm"],
  ["doing", "Đang làm"],
  ["done", "Hoàn thành"],
];

function toForm(initial) {
  return {
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    deadline: initial?.deadline ?? "",
    priority: initial?.priority ?? "",
    status: initial?.status ?? "todo",
    projectId: initial?.projectId ?? "",
    outcomeNote: initial?.outcomeNote ?? "",
    outcomeRating: initial?.outcomeRating ?? "",
  };
}

function payloadFrom(mode, values, includeOutcome) {
  const body = {
    title: values.title.trim(),
    description: values.description,
    priority: values.priority || null,
    status: values.status,
    projectId: values.projectId === "" ? null : Number(values.projectId),
  };
  if (values.deadline) body.deadline = values.deadline;
  else if (mode === "edit") body.deadline = null;
  if (includeOutcome && values.status === "done") {
    body.outcomeNote = values.outcomeNote;
    body.outcomeRating = values.outcomeRating || null;
  }
  return body;
}

const emptyError = { form: "", fields: {} };

export default function TaskForm({
  mode,
  initial,
  submitting,
  error,
  onSubmit,
  onClose,
  projects = [],
}) {
  const [values, setValues] = useState(() => toForm(initial));
  const [clientError, setClientError] = useState(null);
  const onCloseRef = useRef(onClose);
  const submittingRef = useRef(submitting);
  onCloseRef.current = onClose;
  submittingRef.current = submitting;
  const shown = clientError || error || emptyError;
  const fields = shown.fields || {};
  const title = mode === "create" ? "Thêm công việc" : "Sửa công việc";
  const showOutcome = mode === "edit" && initial?.status === "done";

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape" && !submittingRef.current)
        onCloseRef.current();
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, []);

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    if (!values.title.trim()) {
      setClientError({
        form: "",
        fields: { title: "Tiêu đề không được để trống" },
      });
      return;
    }
    setClientError(null);
    onSubmit(payloadFrom(mode, values, showOutcome));
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
          aria-labelledby="task-form-title"
          className="flex min-h-dvh w-full flex-col bg-surface md:min-h-0 md:w-[520px] md:rounded-card md:shadow-overlay"
        >
          <div className="flex h-14 items-center gap-2 border-b border-line px-4 md:h-16 md:px-6">
            <button
              type="button"
              className="h-11 px-2 md:hidden"
              onClick={requestClose}
              disabled={submitting}
            >
              Hủy
            </button>
            <div className="min-w-0 flex-1">
              <h2 id="task-form-title" className="text-base font-semibold">
                {title}
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

          <form
            className="flex flex-1 flex-col"
            autoComplete="off"
            noValidate
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-3 px-4 py-3 md:px-6">
              {shown.form ? (
                <p role="alert" className="text-sm text-danger">
                  {shown.form}
                </p>
              ) : null}
              <FormField
                label="Tên việc"
                name="title"
                type="text"
                value={values.title}
                placeholder="Ví dụ: Nộp báo cáo thứ sáu"
                onChange={(event) => setField("title", event.target.value)}
                error={fields.title}
                autoFocus
              />
              <FormField
                label="Ghi chú việc, không bắt buộc"
                name="description"
                error={fields.description}
              >
                <textarea
                  value={values.description}
                  placeholder="Chi tiết ngắn, nếu cần"
                  onChange={(event) =>
                    setField("description", event.target.value)
                  }
                  className="min-h-16 py-2"
                />
              </FormField>
              <FormField
                label="Dự án"
                name="projectId"
                error={fields.projectId}
              >
                <Select
                  value={values.projectId}
                  onChange={(value) => setField("projectId", value)}
                  options={[
                    ["", "Chưa chia dự án"],
                    ...(values.projectId !== "" && !projects.some((project) => String(project.id) === String(values.projectId))
                      ? [[values.projectId, "Dự án hiện tại"]] : []),
                    ...projects.map((project) => [project.id, project.name]),
                  ]}
                  disabled={submitting}
                  className="h-11"
                />
              </FormField>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <FormField
                  label="Hạn"
                  name="deadline"
                  type="date"
                  value={values.deadline}
                  onChange={(event) => setField("deadline", event.target.value)}
                  error={fields.deadline}
                />
                <FormField
                  label="Ưu tiên"
                  name="priority"
                  error={fields.priority}
                >
                  <Select
                  value={values.priority}
                  onChange={(value) => setField("priority", value)}
                  options={PRIORITIES}
                  disabled={submitting}
                  className="h-11"
                />
                </FormField>
                <FormField
                  label="Trạng thái"
                  name="status"
                  error={fields.status}
                >
                  <Select
                  value={values.status}
                  onChange={(value) => setField("status", value)}
                  options={STATUSES}
                  disabled={submitting}
                  className="h-11"
                />
                </FormField>
              </div>
              <p className="-mt-1 text-[13px] text-muted">
                Không bắt buộc chọn hạn.
              </p>
              {showOutcome && values.status === "done" ? (
                <OutcomeFields
                  note={values.outcomeNote}
                  rating={values.outcomeRating}
                  onNote={(value) => setField("outcomeNote", value)}
                  onRating={(value) => setField("outcomeRating", value)}
                  noteError={fields.outcomeNote}
                  ratingError={fields.outcomeRating}
                />
              ) : null}
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
                {submitting
                  ? "Đang lưu..."
                  : mode === "create"
                    ? "Thêm công việc"
                    : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
