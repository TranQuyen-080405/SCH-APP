const TABS = [
  ["all", "Tất cả"],
  ["todo", "Cần làm"],
  ["doing", "Đang làm"],
  ["done", "Hoàn thành"],
];

export default function StatusTabs({ value, onChange }) {
  return (
    <div className="max-w-full overflow-x-auto" role="tablist" aria-label="Lọc theo trạng thái">
      <div className="flex w-max gap-2">
        {TABS.map(([id, label]) => {
          const selected = value === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`h-11 shrink-0 rounded-control px-3 text-sm font-medium ${
                selected ? "bg-doing-bg text-primary" : "text-muted"
              }`}
              onClick={() => onChange(id)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
