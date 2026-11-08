import { Plus, StickyNote } from "lucide-react";
import EmptyState from "../components/EmptyState.jsx";
import NoteBoard from "../components/NoteBoard.jsx";
import { useNotes } from "../components/NotesContext.jsx";

export default function NotesPage() {
  const { notes, status, load, openCreate } = useNotes();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="font-display text-[32px] leading-tight font-normal tracking-tight md:text-[44px]">
          Ghi chú
        </h1>
        <button
          type="button"
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-control bg-primary px-3 text-sm font-medium text-white hover:bg-primary-hover"
          onClick={openCreate}
        >
          <Plus size={17} aria-hidden="true" />
          Ghi chú mới
        </button>
      </div>
      {status === "loading" && (
        <div className="grid gap-5 md:grid-cols-2" aria-busy="true">
          <p className="sr-only">Đang tải ghi chú</p>
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-72 animate-pulse rounded-sm bg-line" />
          ))}
        </div>
      )}
      {(status === "error" || status === "network") && (
        <EmptyState
          variant="error"
          message={
            status === "network"
              ? "Không kết nối được máy chủ."
              : "Không thể tải ghi chú"
          }
          onRetry={load}
        />
      )}
      {status === "ready" && notes.length === 0 && (
        <div
          className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line bg-surface px-6 py-16 text-center"
          role="status"
        >
          <StickyNote
            size={32}
            strokeWidth={1.3}
            className="text-muted"
            aria-hidden="true"
          />
          <p>Chưa có ghi chú nào.</p>
        </div>
      )}
      {status === "ready" && <NoteBoard notes={notes} />}
    </div>
  );
}
