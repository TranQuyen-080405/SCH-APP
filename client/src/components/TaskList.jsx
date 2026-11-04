import EmptyState from "./EmptyState.jsx";
import TaskItem from "./TaskItem.jsx";

export default function TaskList({
  tasks,
  status,
  emptyVariant,
  pendingIds,
  onEdit,
  onDelete,
  onStatus,
  onRetry,
}) {
  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <p className="sr-only">Đang tải công việc</p>
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-card border border-line bg-line" />
        ))}
      </div>
    );
  }

  if (status === "error" || status === "network") {
    return (
      <EmptyState
        variant="error"
        message={status === "network" ? "Không kết nối được máy chủ." : "Không thể tải công việc"}
        onRetry={onRetry}
      />
    );
  }

  if (tasks.length === 0) return <EmptyState variant={emptyVariant} />;

  return (
    <ul className="flex flex-col gap-4">
      {tasks.map((task) => (
        <li key={task.id}>
          <TaskItem
            task={task}
            pending={pendingIds.has(task.id)}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatus={onStatus}
          />
        </li>
      ))}
    </ul>
  );
}
