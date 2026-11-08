import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import FormField from "./FormField.jsx";

const COLORS = [
  ["#5dcfb8", "xanh ngọc"],
  ["#ef7478", "đỏ"],
  ["#5ebce0", "xanh dương"],
  ["#9bcb62", "xanh lá"],
  ["#fa916c", "cam"],
  ["#8b88ed", "tím"],
];

export default function ProjectForm({
  project,
  busy,
  error,
  onSubmit,
  onClose,
}) {
  const [name, setName] = useState(project?.name || "");
  const [color, setColor] = useState(project?.color || COLORS[0][0]);
  const busyRef = useRef(busy);
  const closeRef = useRef(onClose);
  busyRef.current = busy;
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event) {
      if (event.key === "Escape" && !busyRef.current) closeRef.current();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/30 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-form-title"
        className="w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-overlay"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="project-form-title" className="text-lg font-semibold">
            {project ? "Sửa dự án" : "Thêm dự án"}
          </h2>
          <button
            type="button"
            aria-label="Đóng"
            disabled={busy}
            onClick={onClose}
            className="grid size-11 place-items-center rounded-control hover:bg-canvas"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!busy && name.trim()) onSubmit({ name: name.trim(), color });
          }}
        >
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <FormField
            label="Tên dự án"
            name="projectName"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            required
            autoFocus
            placeholder="Ví dụ: Học tập, Công việc..."
          />
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Màu hiển thị</legend>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`Màu ${label}`}
                  aria-pressed={color === value}
                  className={`grid size-11 place-items-center rounded-full border-2 ${color === value ? "border-ink" : "border-transparent"}`}
                  onClick={() => setColor(value)}
                >
                  <span
                    className="size-7 rounded-full"
                    style={{ backgroundColor: value }}
                  />
                </button>
              ))}
            </div>
          </fieldset>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="h-11 rounded-control border border-line px-4"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="h-11 rounded-control bg-primary px-4 font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {busy ? "Đang lưu..." : project ? "Lưu dự án" : "Tạo dự án"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
