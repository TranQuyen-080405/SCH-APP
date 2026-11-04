const LABEL = {
  todo: "Cần làm",
  doing: "Đang làm",
  done: "Hoàn thành",
};

const TONE = {
  todo: "bg-todo-bg text-todo-fg",
  doing: "bg-doing-bg text-doing-fg",
  done: "bg-done-bg text-done-fg",
};

export default function StatusSelect({ value, onChange, disabled, className = "" }) {
  return (
    <select
      aria-label="Trạng thái"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={`h-11 max-w-full rounded-control border border-line px-3 text-sm disabled:opacity-60 ${
        TONE[value] || TONE.todo
      } ${className}`}
    >
      {Object.entries(LABEL).map(([id, label]) => (
        <option key={id} value={id}>
          {label}
        </option>
      ))}
    </select>
  );
}
