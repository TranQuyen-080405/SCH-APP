export default function EmptyState({ variant, onRetry, message }) {
  if (variant === "error") {
    return (
      <div className="px-4 py-8 text-center" role="status">
        <p>{message || "Không thể tải công việc"}</p>
        <button
          type="button"
          className="mt-4 inline-flex h-11 items-center rounded-control bg-primary px-4 text-white hover:bg-primary-hover"
          onClick={onRetry}
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (variant === "filtered") {
    return (
      <p className="px-4 py-8 text-center text-muted" role="status">
        Không có công việc phù hợp.
      </p>
    );
  }

  return (
    <div className="px-4 py-8 text-center" role="status">
      <p>Chưa có công việc nào.</p>
    </div>
  );
}
